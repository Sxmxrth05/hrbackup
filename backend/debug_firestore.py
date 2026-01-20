import firebase_admin
from firebase_admin import credentials, firestore
import sys

def check_fs():
    print("🔥 DEBUG: Checking Firestore Payslips...")
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        docs = list(db.collection('payslips').stream())
        print(f"✅ Found {len(docs)} payslips in Firestore.")
        for d in docs[-3:]: # Show last 3
            data = d.to_dict()
            print(f"   - {data.get('employeeId')} ({data.get('month')}/{data.get('year')}): Rs. {data.get('netSalary')}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_fs()
