from flask import Blueprint, request, jsonify, send_from_directory
from services.payroll_service import PayrollService
from datetime import datetime
import os

payroll_bp = Blueprint('payroll', __name__)

@payroll_bp.route('/process', methods=['POST'])
def process_payroll():
    """
    Process Payroll for a given month/year
    Body: { "month": 1, "year": 2026, "employeeId": "EMP001" (optional) }
    """
    try:
        data = request.get_json()
        
        # Defaults
        now = datetime.now()
        month = data.get('month', now.month)
        year = data.get('year', now.year)
        employee_id = data.get('employeeId')
        
        # Initialize Service
        # We can hardcode the output dir or make it configurable
        service = PayrollService(output_dir='payslips')
        
        result = service.process_payroll(year, month, employee_id)
        
        status_code = 200 if result['success'] else 500
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@payroll_bp.route('/payslips', methods=['GET'])
def list_payslips():
    """List generated payslips"""
    try:
        service = PayrollService(output_dir='payslips')
        payslips = service.list_generated_payslips()
        return jsonify(payslips), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@payroll_bp.route('/download/<filename>', methods=['GET'])
def download_payslip(filename):
    """Serve generated payslip PDF"""
    # Assuming payslips are in 'payslips' dir relative to backend root
    
    payslip_dir = os.path.join(os.getcwd(), 'payslips')
    return send_from_directory(payslip_dir, filename)
