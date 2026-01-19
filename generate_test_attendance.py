"""
Generate test attendance data for all scenarios (PRESENT, LATE, HALF_DAY, ABSENT)
This creates realistic test data for presentation/demo purposes
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random

# Initialize Firebase
cred = credentials.Certificate('serviceAccountKey.json')
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Get today's date
today = datetime.now()
today_str = today.strftime('%Y-%m-%d')

print(f"🎯 Generating test attendance data for {today_str}...")

# Test scenarios with different employees
test_scenarios = [
    {
        'employeeId': 'EMP001',
        'name': 'John Smith',
        'department': 'Engineering',
        'scenario': 'PRESENT',
        'punchIn': '08:55',
        'punchOut': '18:00',
        'wifi': True,
        'geo': True,
        'hours': 9.0
    },
    {
        'employeeId': 'EMP002',
        'name': 'Sarah Johnson',
        'department': 'Marketing',
        'scenario': 'LATE',
        'punchIn': '09:15',
        'punchOut': '17:45',
        'wifi': True,
        'geo': True,
        'hours': 8.5
    },
    {
        'employeeId': 'EMP003',
        'name': 'Michael Brown',
        'department': 'Finance',
        'scenario': 'PRESENT',
        'punchIn': '08:55',
        'punchOut': '18:10',
        'wifi': True,
        'geo': True,
        'hours': 9.25
    },
    {
        'employeeId': 'EMP004',
        'name': 'Emily Davis',
        'department': 'Human Resources',
        'scenario': 'ABSENT_NO_PUNCH',
        'punchIn': None,
        'punchOut': None,
        'wifi': False,
        'geo': False,
        'hours': 0
    },
    {
        'employeeId': 'EMP005',
        'name': 'David Wilson',
        'department': 'Engineering',
        'scenario': 'HALF_DAY',
        'punchIn': '09:00',
        'punchOut': '13:00',
        'wifi': True,
        'geo': True,
        'hours': 4.0
    },
    {
        'employeeId': 'EMP006',
        'name': 'Jessica Martinez',
        'department': 'Sales',
        'scenario': 'PRESENT',
        'punchIn': '08:45',
        'punchOut': '17:30',
        'wifi': True,
        'geo': True,
        'hours': 8.75
    },
    {
        'employeeId': 'EMP007',
        'name': 'Robert Taylor',
        'department': 'Operations',
        'scenario': 'LATE',
        'punchIn': '09:30',
        'punchOut': '18:30',
        'wifi': True,
        'geo': True,
        'hours': 9.0
    },
    {
        'employeeId': 'EMP008',
        'name': 'Amanda White',
        'department': 'IT',
        'scenario': 'ABSENT_WIFI_FAILED',
        'punchIn': '09:00',
        'punchOut': '17:00',
        'wifi': False,  # WiFi validation failed
        'geo': True,
        'hours': 8.0
    },
    {
        'employeeId': 'EMP009',
        'name': 'Christopher Lee',
        'department': 'Design',
        'scenario': 'ABSENT_GEO_FAILED',
        'punchIn': '09:00',
        'punchOut': '17:00',
        'wifi': True,
        'geo': False,  # Geo validation failed
        'hours': 8.0
    },
    {
        'employeeId': 'EMP010',
        'name': 'Michelle Garcia',
        'department': 'Customer Support',
        'scenario': 'ABSENT_BOTH_FAILED',
        'punchIn': '09:00',
        'punchOut': '17:00',
        'wifi': False,  # Both failed
        'geo': False,
        'hours': 8.0
    },
    {
        'employeeId': 'EMP011',
        'name': 'Daniel Martinez',
        'department': 'Engineering',
        'scenario': 'ABSENT_LOW_HOURS',
        'punchIn': '09:00',
        'punchOut': '10:30',
        'wifi': True,  # Validation passed
        'geo': True,
        'hours': 1.5  # But too few hours (fraud prevention)
    }
]

def create_timestamp(time_str):
    """Convert time string '09:00' to ISO timestamp for today"""
    if not time_str:
        return None
    hour, minute = map(int, time_str.split(':'))
    dt = today.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return dt.isoformat()

def determine_status(scenario_data):
    """Determine status based on scenario"""
    scenario = scenario_data['scenario']
    wifi = scenario_data['wifi']
    geo = scenario_data['geo']
    hours = scenario_data['hours']
    punch_in = scenario_data['punchIn']
    
    # If no punch-in, it's absent
    if not punch_in:
        return 'ABSENT'
    
    # If validation failed (WiFi OR Geo), always ABSENT
    if not wifi or not geo:
        return 'ABSENT'
    
    # Based on hours and timing
    if hours < 4:  # Less than 50% of 8 hours
        return 'ABSENT'
    elif 3.5 <= hours <= 4.5:  # Around 4 hours
        return 'HALF_DAY'
    elif hours >= 8:
        # Check if late (after 09:00)
        if punch_in and punch_in > '09:00':
            return 'LATE'
        else:
            return 'PRESENT'
    else:
        return 'HALF_DAY'

def calculate_distance(is_valid):
    """Generate realistic distance based on validation"""
    if is_valid:
        return random.randint(10, 80)  # Within radius
    else:
        return random.randint(5000, 15000)  # Outside radius

# Clear existing today's attendance
print("🗑️  Clearing existing records...")
existing = db.collection('attendance').where('date', '==', today_str).stream()
for doc in existing:
    doc.reference.delete()
print("✅ Cleared old records")

# Generate test data
print("\n📝 Creating test scenarios...")
for employee in test_scenarios:
    if not employee['punchIn']:
        # Employee didn't punch in at all - skip creating record
        print(f"⏭️  {employee['name']} - No attendance (marked absent)")
        continue
    
    status = determine_status(employee)
    punch_in_time = create_timestamp(employee['punchIn'])
    punch_out_time = create_timestamp(employee['punchOut']) if employee['punchOut'] else None
    
    is_late = employee['punchIn'] > '09:00' if employee['punchIn'] else False
    distance = calculate_distance(employee['geo'])
    
    # Determine validation message
    if not employee['wifi'] and not employee['geo']:
        message = f"Invalid WiFi and Location ({distance}m away)"
    elif not employee['wifi']:
        message = "Invalid WiFi - Punch-in denied"
    elif not employee['geo']:
        message = f"Outside office radius ({distance}m away)"
    elif is_late:
        message = f"Punch-in successful - Late arrival ({distance}m from office)"
    else:
        message = f"Punch-in successful - On time ({distance}m from office)"
    
    # Create attendance record
    attendance_data = {
        'date': today_str,
        'employeeId': employee['employeeId'],
        'employeeName': employee['name'],
        'department': employee['department'],
        'punchInTime': punch_in_time,
        'punchOutTime': punch_out_time,
        'location': {
            'latitude': 12.9716 if employee['geo'] else 13.5,
            'longitude': 77.5946 if employee['geo'] else 80.2,
        },
        'wifiBSSID': '02:00:00:00:00:00' if employee['wifi'] else 'aa:bb:cc:dd:ee:ff',
        'status': status,
        'isLate': is_late,
        'hoursWorked': employee['hours'],
        'validation': {
            'wifi': employee['wifi'],
            'geo': employee['geo'],
            'distance_meters': distance,
            'message': message
        }
    }
    
    # Add to Firestore
    db.collection('attendance').add(attendance_data)
    
    # Print status
    status_emoji = {
        'PRESENT': '✅',
        'LATE': '🟠',
        'HALF_DAY': '🔵',
        'ABSENT': '🔴'
    }
    print(f"{status_emoji.get(status, '❓')} {employee['name']:20} - {status:10} ({employee['hours']}h) - WiFi:{employee['wifi']} Geo:{employee['geo']}")

print("\n" + "="*60)
print("🎉 Test data generated successfully!")
print("="*60)

# Print summary
total = len([e for e in test_scenarios if e['punchIn']])
present_count = len([e for e in test_scenarios if determine_status(e) in ['PRESENT', 'LATE']])
absent_count = len([e for e in test_scenarios if determine_status(e) == 'ABSENT'])
half_day_count = len([e for e in test_scenarios if determine_status(e) == 'HALF_DAY'])
late_count = len([e for e in test_scenarios if determine_status(e) == 'LATE'])

print(f"\n📊 Summary:")
print(f"   Total Records: {total}")
print(f"   ✅ Present: {present_count - late_count}")
print(f"   🟠 Late: {late_count}")
print(f"   🔵 Half Day: {half_day_count}")
print(f"   🔴 Absent: {absent_count}")
print(f"   📈 Attendance Rate: {(present_count / total * 100):.0f}%")
print(f"\n🌐 Open HR Portal: http://localhost:8080/attendance")
print("📱 Refresh to see the data!")
