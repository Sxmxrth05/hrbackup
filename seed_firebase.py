import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

def seed_firebase():
    """Seed Firebase with employee and office config data"""
    
    # Initialize Firebase
    if not firebase_admin._apps:
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    
    print("🔥 Seeding Firebase with test data...")
    
    # 1. Seed Employees
    employees = [
        {
            'emp_id': 'EMP001',
            'name': 'Alice Smith',
            'designation': 'Manager',
            'email': 'alice@company.com',
            'salary': {
                'basic': 50000,
                'hra': 20000,
                'other_allow': 10000
            }
        },
        {
            'emp_id': 'EMP002',
            'name': 'Bob Jones',
            'designation': 'Developer',
            'email': 'bob@company.com',
            'salary': {
                'basic': 30000,
                'hra': 12000,
                'other_allow': 5000
            }
        },
        {
            'emp_id': 'EMP003',
            'name': 'Charlie Brown',
            'designation': 'Designer',
            'email': 'charlie@company.com',
            'salary': {
                'basic': 25000,
                'hra': 10000,
                'other_allow': 5000
            }
        }
    ]
    
    print("📝 Adding employees...")
    for emp in employees:
        db.collection('employees').document(emp['emp_id']).set(emp)
        print(f"   ✓ Added {emp['name']} ({emp['emp_id']})")
    
    # 2. Seed Office Config
    office_config = {
        'lat': 12.9716,
        'lng': 77.5946,
        'radius': 5000,  # 5km for testing
        'bssid': 'AA:BB:CC:DD:EE:FF',
        'updatedAt': datetime.now().isoformat()
    }
    
    print("\n🏢 Setting office configuration...")
    db.collection('office_config').document('main_office').set(office_config)
    print("   ✓ Office config saved")
    
    print("\n✅ Seeding complete!")
    print("\nYou can now:")
    print("  1. Test punch-in from the mobile app")
    print("  2. Run 'python payroll_system.py' to generate payslips")
    print("  3. View data at: https://console.firebase.google.com/project/hrhelpdesk-611cb/firestore")

if __name__ == '__main__':
    seed_firebase()
