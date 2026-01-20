import pandas as pd
import os
import sys
import json
import firebase_admin
from firebase_admin import credentials, firestore
from fpdf import FPDF
from datetime import datetime
import calendar
from db import attendance_collection, mongo

class PayrollService:
    """
    Payroll Service Integration
    Hybrid System: Firestore (Employees) + MongoDB (Attendance)
    """

    def __init__(self, output_dir='payslips'):
        # Ensure path is absolute relative to backend
        self.output_dir = os.path.join(os.getcwd(), output_dir)
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
        
        # Initialize Firebase (Check if already initialized to avoid errors)
        if not firebase_admin._apps:
            # Assuming serviceAccountKey.json is in the backend root
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        
        self.db = firestore.client()
        os.makedirs(self.output_dir, exist_ok=True)

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
        except Exception as e:
            print(f"⚠️  Using default policies. Error: {e}", file=sys.stderr)

    def fetch_employees_from_firebase(self, employee_id=None):
        """Fetch Employee data from Firestore"""
        employees_ref = self.db.collection('employees')
        if employee_id:
            query = employees_ref.where('emp_id', '==', employee_id.upper())
        else:
            query = employees_ref
        
        docs = list(query.stream()) # Convert to list to count
        print(f"DEBUG: Found {len(docs)} employees in Firestore", file=sys.stderr)
        emp_list = []
        for doc in docs:
            d = doc.to_dict()
            salary = d.get('salary', {})
            # Normalized structure
            flat_emp = {
                'emp_id': d.get('emp_id') or d.get('employee_id') or doc.id,
                'name': d.get('name'),
                'designation': d.get('designation') or d.get('position'),
                'email': d.get('email'),
                'basic': float(salary.get('basic', 0)),
                'hra': float(salary.get('hra', 0)),
                'other_allow': float(salary.get('other_allow', 0))
            }
            emp_list.append(flat_emp)
            
        self.data['salary'] = pd.DataFrame(emp_list)

    def fetch_attendance_from_mongodb(self, year, month):
        """
        Fetch and Aggregate Attendance from MongoDB
        """
        days_in_month = calendar.monthrange(year, month)[1]
        start_date = datetime(year, month, 1)
        # End date is start of next month for < query
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)

        # Get all records for the month
        records = list(attendance_collection.find({
            "punchInTime": {"$gte": start_date, "$lt": end_date}
        }))

        # Process raw records into summary stats per employee
        attendance_summary = []
        
        # Group by employee
        emp_records = {}
        for r in records:
            eid = r.get('employeeId')
            if eid not in emp_records:
                emp_records[eid] = []
            emp_records[eid].append(r)

        for emp_id, punches in emp_records.items():
            present = 0
            late = 0
            half_day = 0
            total_hours = 0.0

            # Set of unique dates worked
            worked_dates = set()

            for p in punches:
                punch_in = p.get('punchInTime')
                punch_out = p.get('punchOutTime')
                
                if not punch_in:
                    continue
                    
                date_str = punch_in.strftime('%Y-%m-%d')
                if date_str in worked_dates:
                    continue # Already counted this day
                worked_dates.add(date_str)

                # Status check logic
                # Assuming 9:00 AM is late start
                is_late = False
                if punch_in.hour >= 9 and punch_in.minute > 0:
                    late += 1
                    is_late = True
                else:
                    present += 1 # If not late, count as normal present (or late is subset of present)
                
                # Hours calculation
                if punch_out:
                    duration = (punch_out - punch_in).total_seconds() / 3600
                    total_hours += duration
                    if duration < 4: # Arbitrary threshold for half day
                        half_day += 1

            # Adjust counts: 'late' is usually a subset of 'present' in many systems, 
            # but payroll_system.py treats them additively: present + late + half_day
            # Let's align with the original provided script's logic:
            # "payable_days = present_days + late_days + (half_days * 0.5)"
            # So we should be careful not to double count.
            # In my logic above:
            # If late, I incremented late. If not late, I incremented present.
            # So they are mutually exclusive in my loop above.
            
            attendance_summary.append({
                'employeeId': emp_id,
                'present_days': present,
                'late_days': late,
                'half_days': half_day,
                'hoursWorked': total_hours,
                'status': 'ACTIVE' # Placeholder
            })

        self.data['attendance'] = pd.DataFrame(attendance_summary)
        self.data['month'] = calendar.month_name[month]
        self.data['year'] = year
        self.data['days_in_month'] = days_in_month

    def calculate_payroll(self, emp_row):
        """Calculate payroll for a single employee"""
        emp_id = emp_row['emp_id']
        name = emp_row['name']
        designation = emp_row['designation']
        basic_da = emp_row['basic']
        hra = emp_row['hra']
        other_allow = emp_row['other_allow']
        
        gross_salary = basic_da + hra + other_allow
        
        # Calculate attendance
        days_in_month = self.data.get('days_in_month', 30)
        present_days = 0
        late_days = 0
        half_days = 0
        total_hours_worked = 0
        
        if 'attendance' in self.data and not self.data['attendance'].empty:
            # Filter specifically for this employee
            emp_att = self.data['attendance'][self.data['attendance']['employeeId'] == emp_id]
            
            if not emp_att.empty:
                # Summing up if there are multiple rows (shouldn't be with my logic, but safe to sum)
                present_days = emp_att['present_days'].sum()
                late_days = emp_att['late_days'].sum()
                half_days = emp_att['half_days'].sum()
                total_hours_worked = emp_att['hoursWorked'].sum()
        
        # Calculate payable days: PRESENT + LATE + (HALF_DAY * 0.5)
        payable_days = present_days + late_days + (half_days * 0.5)
        lop_days = max(0, days_in_month - payable_days)

        # Prorate salary
        if payable_days == 0 and gross_salary > 0:
            # Fallback for testing/new employees without attendance yet?
            # Or strict no pay? Let's keep it strict but maybe allow override
            # For now, strict:
            prorated_gross = 0
        else:
            prorated_gross = (gross_salary / days_in_month) * payable_days

        # Deductions
        pf = min(basic_da * self.policies['pf_rate'], self.policies['pf_cap'])
        esi = prorated_gross * self.policies['esi_employee_rate'] if prorated_gross <= self.policies['esi_threshold'] else 0
        pt = self.policies['pt_amount'] if prorated_gross > 15000 else 0
        tds = 0
        
        total_deductions = pf + esi + pt + tds

        # Encashment
        encashment = 0
        remaining_leaves = 10 
        if self.policies['leave_encashment'] and remaining_leaves > 0:
            encashment = ((basic_da + hra) / 30) * min(remaining_leaves, self.policies['encash_max_days'])

        net_pay = prorated_gross - total_deductions + encashment

        return {
            'emp_id': str(emp_id),
            'name': str(name),
            'designation': str(designation),
            'month': f"{self.data['month']} {self.data['year']}",
            'present_days': float(present_days),
            'late_days': float(late_days),
            'half_days': float(half_days),
            'total_hours_worked': float(total_hours_worked),
            'lop_days': float(lop_days),
            'payable_days': float(payable_days),
            'basic_da': float(basic_da),
            'hra': float(hra),
            'other_allow': float(other_allow),
            'gross': float(prorated_gross),
            'pf': float(pf),
            'esi': float(esi),
            'pt': float(pt),
            'tds': float(tds),
            'total_deductions': float(total_deductions),
            'encashment': float(encashment),
            'net_pay': float(net_pay)
        }

    def generate_payslip_pdf(self, data):
        """Generate PDF payslip"""
        filename = f"payslip_{data['emp_id']}_{data['month'].replace(' ', '_')}.pdf"
        path = os.path.join(self.output_dir, filename)
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(0, 10, 'SALARY SLIP', ln=1, align='C')
        pdf.ln(10)
        
        pdf.set_font('Arial', '', 11)
        
        # Safely get values with formatting
        def fmt(val): return "{:,.2f}".format(val)
        
        info = [
            f"Name: {data['name']}",
            f"Employee ID: {data['emp_id']}",
            f"Designation: {data['designation']}",
            f"Month: {data['month']}",
            "",
            "ATTENDANCE SUMMARY",
            f"Present: {data['present_days']} | Late: {data['late_days']} | Half: {data['half_days']}",
            f"Payable Days: {data['payable_days']}",
            "",
            "EARNINGS",
            f"Basic + DA: Rs. {fmt(data['basic_da'])}",
            f"HRA: Rs. {fmt(data['hra'])}",
            f"Other Allowances: Rs. {fmt(data['other_allow'])}",
            f"Gross Salary (Prorated): Rs. {fmt(data['gross'])}",
            "",
            "DEDUCTIONS",
            f"PF: Rs. {fmt(data['pf'])}",
            f"ESI: Rs. {fmt(data['esi'])}",
            f"Professional Tax: Rs. {fmt(data['pt'])}",
            f"Total Deductions: Rs. {fmt(data['total_deductions'])}",
            "",
            f"NET PAY: Rs. {fmt(data['net_pay'])}"
        ]
        
        for line in info:
            if line:
                pdf.cell(0, 7, line, ln=1)
        
        pdf.output(path)
        return path

    def process_payroll(self, year, month, employee_id=None):
        """Main processing function"""
        results = []
        errors = []
        
    def list_generated_payslips(self):
        """List all generated payslips from the output directory"""
        payslips = []
        if not os.path.exists(self.output_dir):
            return payslips

        for filename in os.listdir(self.output_dir):
            if filename.endswith(".pdf") and filename.startswith("payslip_"):
                # Parse filename: payslip_EMP001_January_2026.pdf
                try:
                    parts = filename.replace(".pdf", "").split("_")
                    if len(parts) >= 4:
                        emp_id = parts[1]
                        month = parts[2]
                        year = parts[3]
                        
                        # Create a basic record
                        payslips.append({
                            "id": filename, # Use filename as ID
                            "employeeId": emp_id,
                            "employeeName": f"Employee {emp_id}", # Placeholder
                            "month": month,
                            "year": int(year),
                            "netSalary": 0, # Placeholder as we don't parse the PDF
                            "status": "generated",
                            "pdfUrl": f"/api/payroll/download/{filename}",
                            "generatedAt": datetime.fromtimestamp(os.path.getctime(os.path.join(self.output_dir, filename))).isoformat()
                        })
                except Exception:
                    continue
        
        return payslips

    def process_payroll(self, year, month, employee_id=None):
        """Main processing function"""
        results = []
        errors = []
        
        try:
            self.fetch_policies_from_firebase()
            self.fetch_employees_from_firebase(employee_id)
            self.fetch_attendance_from_mongodb(year, month)
            
            if self.data['salary'].empty:
                return {'success': False, 'error': 'No employees found'}

            for _, row in self.data['salary'].iterrows():
                try:
                    payroll = self.calculate_payroll(row)
                    pdf_path = self.generate_payslip_pdf(payroll)
                    
                    payroll['pdf_url'] = f"/api/payroll/download/{os.path.basename(pdf_path)}"
                    payroll['status'] = 'generated'
                    
                    # SYNC TO FIRESTORE (For User App)
                    # The mobile app likely listens to 'payslips' collection
                    try:
                        self.db.collection('payslips').add({
                            'employeeId': row.get('emp_id'),
                            'employeeName': row.get('name'),
                            'month': month,
                            'year': year,
                            'netSalary': payroll['net_pay'],
                            'pdfUrl': payroll['pdf_url'], # In prod, this should be a public URL or cloud storage link
                            'generatedAt': firestore.SERVER_TIMESTAMP,
                            'status': 'available' 
                        })
                        print(f"DEBUG: Synced payslip for {row.get('name')} to Firestore")
                    except Exception as fs_err:
                        print(f"WARNING: Failed to sync to Firestore: {fs_err}")

                    results.append(payroll)
                    
                except Exception as e:
                    errors.append({
                        'emp_id': row.get('emp_id'),
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'processed': len(results),
                'failed': len(errors),
                'results': results,
                'errors': errors
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
