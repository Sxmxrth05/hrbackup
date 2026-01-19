import pandas as pd
import os

def create_dummy_data():
    # Salary Data
    data = {
        'Emp ID': ['EMP001', 'EMP002', 'EMP003'],
        'Name': ['Alice Smith', 'Bob Jones', 'Charlie Brown'],
        'Designation': ['Manager', 'Developer', 'Designer'],
        'Basic + DA': [50000, 30000, 25000],
        'HRA': [20000, 12000, 10000],
        'Other Allowances': [10000, 5000, 5000],
        'TDS': [5000, 2000, 1000],
        'Days in Month': [31, 31, 31]
    }
    salary_df = pd.DataFrame(data)
    salary_df['Gross'] = salary_df['Basic + DA'] + salary_df['HRA'] + salary_df['Other Allowances']

    # Attendance Data
    attendance_data = {
        'Emp ID': ['EMP001', 'EMP002', 'EMP003'],
        'Total Present': [29, 28, 30],
        'Paid Leave': [2, 1, 0],
        'LOP': [0, 2, 1],
        'Leave Balance': [15, 8, 12]
    }
    attendance_df = pd.DataFrame(attendance_data)

    file_path = 'hr_upload_oct2025.xlsx'
    
    with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
        salary_df.to_excel(writer, sheet_name='Salary Data', index=False)
        attendance_df.to_excel(writer, sheet_name='Attendance', index=False)
    
    print(f"Created dummy Excel file at: {os.path.abspath(file_path)}")

if __name__ == "__main__":
    create_dummy_data()
