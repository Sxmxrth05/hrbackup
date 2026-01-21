import pandas as pd
import os
import sys
import json
import argparse
import firebase_admin
from firebase_admin import credentials, firestore
from fpdf import FPDF
from datetime import datetime
import calendar

class PayrollAgent:
    """
    Production Payroll Agent - Firestore Integration
    Enhanced with CLI support and JSON output
    """

    def __init__(self, payslip_output_dir='payslips'):
        self.payslip_dir = payslip_output_dir
        self.data = {}
        self.policies = {
            'pf_rate': 0.12,
            'pf_cap': 1800,
            'esi_employee_rate': 0.0075,
            'esi_threshold': 21000,
            'pt_amount': 200,
            'leave_encashment': False,
            'encash_max_days': 10
        }
        
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        
        self.db = firestore.client()
        os.makedirs(self.payslip_dir, exist_ok=True)

    def fetch_policies_from_firebase(self):
        """Fetch payroll policies from Firestore"""
        try:
            policy_ref = self.db.collection('payroll_policies').document('current_policy')
            policy_doc = policy_ref.get()
            if policy_doc.exists:
                policy_data = policy_doc.to_dict()
                self.policies.update({
                    'pf_rate': policy_data.get('pfRate', 0.12),
                    'pf_cap': policy_data.get('pfCap', 1800),
                    'esi_employee_rate': policy_data.get('esiEmployeeRate', 0.0075),
                    'esi_threshold': policy_data.get('esiThreshold', 21000),
                    'pt_amount': policy_data.get('ptAmount', 200),
                    'leave_encashment': policy_data.get('leaveEncashment', False),
                    'encash_max_days': policy_data.get('encashMaxDays', 10)
                })
                print(f"✅ Loaded policies from Firebase: {self.policies}", file=sys.stderr)
        except Exception as e:
            print(f"⚠️  Using default policies. Error: {e}", file=sys.stderr)

    def fetch_data_from_firebase(self, year=None, month=None, employee_id=None):
        """
        Fetch Employee and Attendance data from Firestore
        Args:
            year: Year to process (default: current year)
            month: Month to process (1-12, default: current month)
            employee_id: Specific employee ID (optional, for single payslip)
        """
        print(f"📊 Fetching data from Firestore...", file=sys.stderr)
        
        # Default to current month if not specified
        now = datetime.now()
        year = year or now.year
        month = month or now.month
        
        # 1. Fetch Employees
        employees_ref = self.db.collection('employees')
        if employee_id:
            # Fetch specific employee
            query = employees_ref.where('emp_id', '==', employee_id.upper())
        else:
            # Fetch all employees (don't filter by status since it may not exist)
            query = employees_ref
        
        docs = query.stream()
        
        emp_list = []
        for doc in docs:
            d = doc.to_dict()
            salary = d.get('salary', {})
            flat_emp = {
                'emp_id': d.get('emp_id') or d.get('employee_id') or d.get('employeeId') or doc.id,
                'name': d.get('name'),
                'designation': d.get('designation') or d.get('position'),
                'basic': salary.get('basic', 0),
                'hra': salary.get('hra', 0),
                'other_allow': salary.get('other_allow', 0),
                'email': d.get('email')
            }
            emp_list.append(flat_emp)
            
        self.data['salary'] = pd.DataFrame(emp_list)
        
        # 2. Fetch Attendance for specified month
        days_in_month = calendar.monthrange(year, month)[1]
        start_date = datetime(year, month, 1).strftime('%Y-%m-%d')
        end_date = datetime(year, month, days_in_month).strftime('%Y-%m-%d')
        
        attendance_ref = self.db.collection('attendance') \
            .where('date', '>=', start_date) \
            .where('date', '<=', end_date)
        
        att_docs = attendance_ref.stream()
        
        att_list = []
        for doc in att_docs:
            d = doc.to_dict()
            att_list.append(d)
            
        self.data['attendance'] = pd.DataFrame(att_list)
        self.data['month'] = calendar.month_name[month]
        self.data['year'] = year
        self.data['days_in_month'] = days_in_month
        
        print(f"✅ Loaded {len(emp_list)} employees and {len(att_list)} attendance records for {calendar.month_name[month]} {year}", file=sys.stderr)

    def calculate_payroll(self, emp_row):
        """Calculate payroll for a single employee"""
        def get_val(row, col_keywords, default=0):
            for col in row.index:
                if any(k.lower() in str(col).lower() for k in col_keywords):
                    return row[col]
            return default

        def get(col_keywords, default=0):
            return get_val(emp_row, col_keywords, default)

        name = get(['name'])
        emp_id = get(['code', 'emp_id', 'id'], 'Unknown')
        designation = get(['designation', 'role'])
        basic_da = float(get(['basic'], 0))
        hra = float(get(['hra'], 0))
        other_allow = float(get(['other_allow', 'allowance'], 0))
        
        gross_salary = basic_da + hra + other_allow
        
        # Calculate attendance using NEW status system
        days_in_month = self.data.get('days_in_month', 30)
        present_days = 0
        late_days = 0
        half_days = 0
        total_hours_worked = 0
        
        if not self.data['attendance'].empty:
            emp_att = self.data['attendance'][self.data['attendance']['employeeId'] == emp_id]
            
            # Count by status
            present_days = len(emp_att[emp_att['status'] == 'PRESENT'])
            late_days = len(emp_att[emp_att['status'] == 'LATE'])
            half_days = len(emp_att[emp_att['status'] == 'HALF_DAY'])
            
            # Calculate total hours worked
            total_hours_worked = emp_att['hoursWorked'].fillna(0).sum()
        
        # Calculate payable days: PRESENT + LATE + (HALF_DAY * 0.5)
        payable_days = present_days + late_days + (half_days * 0.5)
        lop_days = days_in_month - payable_days

        # Prorate salary based on payable days
        if payable_days == 0 and gross_salary > 0:
            # Fallback for testing if no attendance
            payable_days = days_in_month
            lop_days = 0
        
        prorated_gross = (gross_salary / days_in_month) * payable_days

        # Deductions
        pf = min(basic_da * self.policies['pf_rate'], self.policies['pf_cap'])
        esi = prorated_gross * self.policies['esi_employee_rate'] if prorated_gross <= self.policies['esi_threshold'] else 0
        pt = self.policies['pt_amount'] if prorated_gross > 15000 else 0
        tds = 0  # Placeholder for TDS calculation
        
        total_deductions = pf + esi + pt + tds

        # Leave encashment
        encashment = 0
        remaining_leaves = 10  # TODO: Fetch from leaves collection
        if self.policies['leave_encashment'] and remaining_leaves > 0:
            encashment = ((basic_da + hra) / 30) * min(remaining_leaves, self.policies['encash_max_days'])

        net_pay = prorated_gross - total_deductions + encashment

        return {
            'emp_id': str(emp_id),
            'name': str(name),
            'designation': str(designation),
            'month': f"{self.data['month']} {self.data['year']}",
            'present_days': round(present_days, 1),
            'late_days': round(late_days, 1),
            'half_days': round(half_days, 1),
            'total_hours_worked': round(total_hours_worked, 2),
            'approved_paid_leaves': 0,
            'lop_days': round(lop_days, 1),
            'payable_days': round(payable_days, 1),
            'remaining_leaves': round(remaining_leaves, 1),
            'basic_da': round(basic_da, 2),
            'hra': round(hra, 2),
            'other_allow': round(other_allow, 2),
            'gross': round(prorated_gross, 2),
            'pf': round(pf, 2),
            'esi': round(esi, 2),
            'pt': round(pt, 2),
            'tds': round(tds, 2),
            'total_deductions': round(total_deductions, 2),
            'encashment': round(encashment, 2),
            'net_pay': round(net_pay, 2)
        }

    def generate_payslip_pdf(self, data):
        """Generate PDF payslip"""
        filename = f"payslip_{data['emp_id']}_{data['month'].replace(' ', '_')}.pdf"
        path = os.path.join(self.payslip_dir, filename)
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'SALARY SLIP', ln=1, align='C')
        pdf.ln(10)
        
        pdf.set_font('Arial', '', 11)
        info = [
            f"Name: {data['name']}",
            f"Employee ID: {data['emp_id']}",
            f"Designation: {data['designation']}",
            f"Month: {data['month']}",
            "",
            "ATTENDANCE SUMMARY",
            f"Present Days: {data['present_days']} | Late Days: {data['late_days']} | Half Days: {data['half_days']}",
            f"Total Hours Worked: {data['total_hours_worked']} hrs",
            f"Loss of Pay Days: {data['lop_days']}",
            f"Payable Days: {data['payable_days']} / 30",
            "",
            "EARNINGS",
            f"Basic + DA: Rs. {data['basic_da']:,.2f}",
            f"HRA: Rs. {data['hra']:,.2f}",
            f"Other Allowances: Rs. {data['other_allow']:,.2f}",
            f"Gross Salary (Prorated): Rs. {data['gross']:,.2f}",
            f"Leave Encashment: Rs. {data['encashment']:,.2f}" if data['encashment'] > 0 else "",
            "",
            "DEDUCTIONS",
            f"PF: Rs. {data['pf']:,.2f}",
            f"ESI: Rs. {data['esi']:,.2f}",
            f"Professional Tax: Rs. {data['pt']:,.2f}",
            f"TDS: Rs. {data['tds']:,.2f}",
            f"Total Deductions: Rs. {data['total_deductions']:,.2f}",
            "",
            f"NET PAY: Rs. {data['net_pay']:,.2f}"
        ]
        
        for line in info:
            if line:
                pdf.cell(0, 7, line, ln=1)
        
        pdf.output(path)
        return path

    def process_payroll(self, year=None, month=None, employee_id=None):
        """
        Process payroll and return results as JSON
        Returns: List of payroll records
        """
        results = []
        errors = []
        
        try:
            # Fetch policies and data
            self.fetch_policies_from_firebase()
            self.fetch_data_from_firebase(year, month, employee_id)
            
            if self.data['salary'].empty:
                return {
                    'success': False,
                    'error': 'No employee data found',
                    'results': [],
                    'errors': []
                }
            
            # Process each employee
            for _, row in self.data['salary'].iterrows():
                try:
                    payroll = self.calculate_payroll(row)
                    pdf_path = self.generate_payslip_pdf(payroll)
                    
                    payroll['pdf_path'] = pdf_path
                    payroll['pdf_filename'] = os.path.basename(pdf_path)
                    payroll['status'] = 'success'
                    
                    results.append(payroll)
                    print(f"✅ Generated payslip for {row['name']}", file=sys.stderr)
                    
                except Exception as e:
                    error = {
                        'emp_id': row.get('emp_id', 'Unknown'),
                        'name': row.get('name', 'Unknown'),
                        'error': str(e)
                    }
                    errors.append(error)
                    print(f"❌ Error processing {row.get('name')}: {e}", file=sys.stderr)
            
            return {
                'success': True,
                'month': self.data['month'],
                'year': self.data['year'],
                'total_employees': len(self.data['salary']),
                'processed': len(results),
                'failed': len(errors),
                'results': results,
                'errors': errors
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'results': [],
                'errors': []
            }


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(description='Payroll Processing System')
    parser.add_argument('--month', type=int, help='Month (1-12)')
    parser.add_argument('--year', type=int, help='Year (e.g., 2026)')
    parser.add_argument('--employee', type=str, help='Specific employee ID')
    parser.add_argument('--output', type=str, default='payslips', help='Output directory for PDFs')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')
    
    args = parser.parse_args()
    
    agent = PayrollAgent(payslip_output_dir=args.output)
    result = agent.process_payroll(
        year=args.year,
        month=args.month,
        employee_id=args.employee
    )
    
    if args.json:
        # Output JSON for Node.js consumption
        print(json.dumps(result, indent=2))
    else:
        # Human-readable output
        if result['success']:
            print(f"\n✅ Payroll processing complete!")
            print(f"   Month: {result.get('month')} {result.get('year')}")
            print(f"   Processed: {result['processed']}/{result['total_employees']}")
            if result['failed'] > 0:
                print(f"   Failed: {result['failed']}")
        else:
            print(f"\n❌ Payroll processing failed: {result.get('error')}")
            sys.exit(1)


if __name__ == '__main__':
    main()
