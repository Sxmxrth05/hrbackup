import sys
import os
from app import app
import json
import firebase_admin
from firebase_admin import credentials, firestore

def test_payroll():
    print("🚀 Starting Payroll Verification")
    
    # 1. Direct Firestore Check
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        docs = list(db.collection('employees').stream())
        print(f"🔥 Direct Firestore Check: Found {len(docs)} employees.")
        for d in docs[:3]:
            print(f"   - {d.id} => {d.to_dict().get('name')}")
            
    except Exception as e:
        print(f"❌ Direct Firestore Check Failed: {e}")

    # 2. API Check
    client = app.test_client()
    
    payload = {
        "month": 1,
        "year": 2026
    }
    
    print(f"📡 Sending POST /api/payroll/process with {payload}")
    
    try:
        response = client.post('/api/payroll/process', 
                             data=json.dumps(payload),
                             content_type='application/json')
        
        print(f"⬅️  Status Code: {response.status_code}")
        
        data = response.get_json()
        # print(f"📦 Response Data: {json.dumps(data, indent=2)}") 
        
        if response.status_code == 200 and data.get('success'):
            print("✅ Payroll Processing Successful")
            first = data['results'][0]
            print(f"   Generated: {first['pdf_filename']}")
        else:
            print(f"❌ Payroll Processing Failed: {data.get('error')}")
            
    except Exception as e:
        print(f"❌ Exception during test: {e}")

if __name__ == "__main__":
    test_payroll()
