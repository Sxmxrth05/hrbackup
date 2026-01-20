import firebase_admin
from firebase_admin import credentials, firestore
import sys

def seed_employees():
    print("🌱 Seeding Firestore with Python...")
    try:
        # Initialize
        if not firebase_admin._apps:
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        
        # Data
        employees = [
            {
                'emp_id': 'EMP001',
                'name': 'Python Seeded 1',
                'email': 'python1@test.com',
                'designation': 'Manager',
                'salary': {'basic': 50000, 'hra': 20000, 'other_allow': 5000}
            },
            {
                'emp_id': 'EMP002',
                'name': 'Python Seeded 2',
                'email': 'python2@test.com',
                'designation': 'Developer',
                'salary': {'basic': 40000, 'hra': 15000, 'other_allow': 5000}
            }
        ]
        
        col = db.collection('employees')
        
        for emp in employees:
            # Check existing
            q = col.where('emp_id', '==', emp['emp_id']).stream()
            existing = list(q)
            if existing:
                print(f"⚠️  {emp['name']} already exists.")
            else:
                col.add(emp)
                print(f"✅ Created {emp['name']}")
                
    except Exception as e:
        print(f"❌ Error seeding: {e}")

if __name__ == "__main__":
    seed_employees()
