import sys
import os
from app import app
import json
from datetime import datetime

def test_geofence():
    print("🚀 Starting Geofence Verification")
    
    client = app.test_client()
    
    # 0. Get Office Config to know valid location
    # Ideally should fetch from DB, but for test we'll try a known location
    # If the seed_office.py ran earlier, it set lat/lon to 0.0, 0.0 with 5000m radius
    
    # Test Case 1: Valid Punch In (Using 0,0)
    print("\n🧪 Test Case 1: Valid Punch In (0,0)")
    payload_valid = {
        "employeeId": "TEST_GEO_001",
        "wifiBSSID": "00:13:10:85:fe:01",
        "location": {
            "latitude": 0.0,
            "longitude": 0.0
        }
    }
    
    try:
        resp = client.post('/api/attendance/punch-in',
                         data=json.dumps(payload_valid),
                         content_type='application/json')
        print(f"⬅️  Status: {resp.status_code} - {resp.get_json().get('message')}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test Case 2: Invalid Punch In (Far away)
    print("\n🧪 Test Case 2: Invalid Punch In (Far away)")
    payload_invalid = {
        "employeeId": "TEST_GEO_002",
        "wifiBSSID": "00:13:10:85:fe:01",
        "location": {
            "latitude": 50.0, # Far away
            "longitude": 50.0
        }
    }
    
    try:
        resp = client.post('/api/attendance/punch-in',
                         data=json.dumps(payload_invalid),
                         content_type='application/json')
        print(f"⬅️  Status: {resp.status_code} - {resp.get_json().get('message')}")
        
        if resp.status_code == 403 and "geofence" in resp.get_json().get('message').lower():
            print("✅ Geofencing Rejected correctly")
        else:
            print("⚠️ Unexpected response for invalid geofence")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_geofence()
