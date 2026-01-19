from flask import Blueprint, request, jsonify, Response
from datetime import datetime
import geo_utils
import csv
import io
from db import attendance_collection, mongo  # Import mongo to access office_config

attendance_bp = Blueprint("attendance", __name__)

# -------------------- PUNCH IN (DYNAMIC) --------------------
@attendance_bp.route("/punch-in", methods=["POST"])
def punch_in():
    data = request.get_json()

    employee_id = data.get("employeeId")
    location = data.get("location")
    wifi_bssid = data.get("wifiBSSID")

    print(f"--- New Punch-In Request ---")
    print(f"Employee: {employee_id}")
    print(f"WiFi BSSID: {wifi_bssid}")
    print(f"Location: {location}")

    if not employee_id or not location or not wifi_bssid:
        return jsonify({
            "message": "employeeId, location and wifiBSSID required",
            "status": "INVALID_REQUEST"
        }), 400

    office_config = mongo.db.office_config.find_one({"branch_name": "Main Office"})
    if not office_config:
        print("❌ ERROR: 'Main Office' not found!")
        return jsonify({
            "message": "Office not configured",
            "status": "OFFICE_NOT_CONFIGURED"
        }), 500

    OFFICE_LAT = office_config['location']['latitude']
    OFFICE_LON = office_config['location']['longitude']
    GEOFENCE_RADIUS = office_config['location']['allowed_radius_meters']
    ALLOWED_BSSIDS = [b.lower() for b in office_config['wifi']['allowed_bssids']]

    # 🔒 Already punched in
    existing = attendance_collection.find_one({
        "employeeId": employee_id,
        "punchOutTime": {"$exists": False}
    })

    if existing:
        print(f"❌ REJECTED: {employee_id} already punched in.")
        return jsonify({
            "message": "Already punched in",
            "status": "PUNCHED_IN"
        }), 409   # ✅ Conflict (better than 400)

    user_lat = location.get("latitude")
    user_lon = location.get("longitude")

    # 🌍 Geofence check
    distance = geo_utils.haversine(OFFICE_LAT, OFFICE_LON, user_lat, user_lon)
    if distance > GEOFENCE_RADIUS:
        print(f"❌ GEOFENCE FAILURE: {round(distance, 2)}m")
        return jsonify({
            "message": "Outside office geofence",
            "status": "GEOFENCE_FAILED",
            "distance_meters": round(distance, 2),
            "allowed_radius": GEOFENCE_RADIUS
        }), 403

    # 📶 WiFi check
    if wifi_bssid.lower() not in ALLOWED_BSSIDS:
        print(f"❌ WIFI FAILURE: {wifi_bssid}")
        return jsonify({
            "message": "Invalid office WiFi",
            "status": "WIFI_FAILED",
            "your_bssid": wifi_bssid
        }), 403

    # ✅ Insert record
    record = {
        "employeeId": employee_id,
        "punchInTime": datetime.utcnow(),
        "location": location,
        "wifiBSSID": wifi_bssid,
        "gpsValid": True,
        "wifiValid": True,
        "status": "PUNCHED_IN",
        "distance_from_office": distance
    }

    attendance_collection.insert_one(record)

    print(f"✅ SUCCESS: {employee_id} punched in.")

    return jsonify({
        "message": "Punch-in successful",
        "status": "PUNCHED_IN"
    }), 200


# -------------------- PUNCH OUT (UNCHANGED) --------------------
@attendance_bp.route("/punch-out", methods=["POST"])
def punch_out():
    data = request.get_json()
    employee_id = data.get("employeeId")

    if not employee_id:
        return jsonify({
            "message": "employeeId is required",
            "status": "INVALID_REQUEST"
        }), 400

    record = attendance_collection.find_one({
        "employeeId": employee_id,
        "punchOutTime": {"$exists": False}
    })

    if not record:
        return jsonify({
            "message": "No active punch-in found",
            "status": "ALREADY_PUNCHED_OUT"
        }), 409   # ✅ Correct semantic code

    attendance_collection.update_one(
        {"_id": record["_id"]},
        {
            "$set": {
                "punchOutTime": datetime.utcnow(),
                "status": "PUNCHED_OUT"
            }
        }
    )

    return jsonify({
        "message": "Punch-out successful",
        "status": "PUNCHED_OUT"
    }), 200


# -------------------- SUMMARY (UNCHANGED) --------------------
@attendance_bp.route("/summary", methods=["GET"])
def attendance_summary():
    employee_id = request.args.get("employeeId")

    if not employee_id:
        return jsonify({"error": "employeeId is required"}), 400

    records = list(
        attendance_collection.find(
            {"employeeId": employee_id},
            {"_id": 0}
        ).sort("punchInTime", -1)  # 🔥 FIX HERE
    )

    total_seconds = 0
    summary = []

    for record in records:
        punch_in = record.get("punchInTime")
        punch_out = record.get("punchOutTime")
        working_hours = None

        if punch_in and punch_out:
            diff = punch_out - punch_in
            total_seconds += diff.total_seconds()
            working_hours = round(diff.total_seconds() / 3600, 2)

        summary.append({
            "employeeId": record.get("employeeId"),
            "punchInTime": punch_in,
            "punchOutTime": punch_out,
            "status": record.get("status"),
            "workingHours": working_hours
        })

    total_hours = round(total_seconds / 3600, 2)

    return jsonify({
        "totalWorkingHours": total_hours,
        "records": summary
    }), 200

# -------------------- EXPORT (UNCHANGED) --------------------
@attendance_bp.route("/export/monthly", methods=["GET"])
def export_monthly_attendance():
    employee_id = request.args.get("employeeId", "").strip()
    month = request.args.get("month", "").strip()

    if not employee_id or not month:
        return jsonify({"error": "employeeId and month are required"}), 400

    try:
        year, month_num = map(int, month.split("-"))
    except ValueError:
        return jsonify({"error": "Invalid month format. Use YYYY-MM"}), 400

    if month_num == 12:
        start_date = datetime(year, 12, 1)
        end_date = datetime(year + 1, 1, 1)
    else:
        start_date = datetime(year, month_num, 1)
        end_date = datetime(year, month_num + 1, 1)

    records = list(
        attendance_collection.find({
            "employeeId": employee_id,
            "punchInTime": {"$gte": start_date, "$lt": end_date}
        })
    )

    if not records:
        return jsonify({"error": "No attendance data found"}), 404

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Punch In", "Punch Out", "Working Hours"])

    total_seconds = 0

    for r in records:
        punch_in = r.get("punchInTime")
        punch_out = r.get("punchOutTime")
        
        minutes = 0
        if punch_in and punch_out:
            duration = (punch_out - punch_in).total_seconds()
            minutes = int(duration / 60)
            total_seconds += duration

        writer.writerow([
            punch_in.strftime("%Y-%m-%d") if punch_in else "",
            punch_in.strftime("%H:%M") if punch_in else "",
            punch_out.strftime("%H:%M") if punch_out else "",
            minutes_to_hhmm(minutes)
        ])

    total_minutes = int(total_seconds / 60)
    writer.writerow(["TOTAL", "", "", minutes_to_hhmm(total_minutes)])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=attendance_{employee_id}_{month}.csv"
        }
    )

def minutes_to_hhmm(minutes):
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"

# -------------------- TODAY'S ATTENDANCE (FOR HR PORTAL) --------------------
@attendance_bp.route("/today", methods=["GET"])
def attendance_today():
    """
    Endpoint for HR Portal integration
    Returns today's attendance grouped by status
    """
    from datetime import datetime, time
    
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, time.min)
    today_end = datetime.combine(today, time.max)
    
    # Get all attendance records for today
    records = list(
        attendance_collection.find({
            "punchInTime": {"$gte": today_start, "$lte": today_end}
        })
    )
    
    result = {
        "present": [],
        "absent": [],
        "late": [],
        "not_punched": []
    }
    
    for record in records:
        employee_id = record.get("employeeId")
        punch_in = record.get("punchInTime")
        punch_out = record.get("punchOutTime")
        
        # Determine status
        status = "present"
        if punch_in:
            # Check if late (after 9:00 AM)
            if punch_in.hour >= 9 and punch_in.minute > 0:
                status = "late"
        else:
            status = "not_punched"
        
        # Calculate hours worked
        hours_worked = None
        if punch_in and punch_out:
            duration = (punch_out - punch_in).total_seconds() / 3600
            hours_worked = round(duration, 2)
        
        # Format for HR portal
        attendance_data = {
            "id": str(record.get("_id")),
            "employee_id": employee_id,
            "employeeId": employee_id,  # Keep both for compatibility
            "employeeName": f"Employee {employee_id}",  # Placeholder - should fetch from employee service
            "department": "General",  # Placeholder - should fetch from employee service
            "date": today.isoformat(),
            "status": status,
            "checkIn": punch_in.strftime("%H:%M") if punch_in else None,
            "checkOut": punch_out.strftime("%H:%M") if punch_out else None,
            "check_in_time": punch_in.strftime("%H:%M:%S") if punch_in else None,
            "check_out_time": punch_out.strftime("%H:%M:%S") if punch_out else None,
            "hoursWorked": hours_worked,
            "location": record.get("location"),
            "wifiBSSID": record.get("wifiBSSID")
        }
        
        result[status].append(attendance_data)
    
    return jsonify(result), 200
