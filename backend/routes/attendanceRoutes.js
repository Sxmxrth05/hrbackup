const express = require("express");
const router = express.Router();
const { db } = require("../firebaseConfig");

// Constants for Geofencing - In a real app, fetch these from DB
// Default location (e.g., Office HQ)
const DEFAULT_OFFICE = {
  lat: 12.9716,
  lng: 77.5946,
  radius: 100, // meters
  bssid: "AA:BB:CC:DD:EE:FF"
};

// Helper: Haversine Formula for distance
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// 1. PUNCH IN (Firestore)
router.post("/punch-in", async (req, res) => {
  try {
    const { employeeId, location, wifiBSSID } = req.body;

    // Fetch valid office config from DB (or use default)
    let office = DEFAULT_OFFICE;
    const configSnap = await db.collection('office_config').limit(1).get();
    if (!configSnap.empty) {
      office = configSnap.docs[0].data();
    }

    // Validation
    const isWifiValid = wifiBSSID === office.bssid;
    let isGeoValid = false;
    let distance = 0;

    if (location && location.latitude && location.longitude) {
      distance = getDistanceInMeters(
        location.latitude,
        location.longitude,
        office.lat || office.latitude, // handle both keys if inconsistent
        office.lng || office.longitude
      );
      isGeoValid = distance <= (office.radius || 100);
    }

    // NEW: Check if employee is late
    const now = new Date();
    const punchInTime = now.toISOString();

    // Parse office start time (e.g., "09:00")
    const officeStartTime = office.officeStartTime || "09:00";
    const [startHour, startMinute] = officeStartTime.split(':').map(Number);

    // Create today's start time
    const todayStart = new Date(now);
    todayStart.setHours(startHour, startMinute, 0, 0);

    const isLate = now > todayStart;

    // Determine Status - REQUIRE BOTH WiFi AND Geo validation
    let status = "PRESENT";
    let message = "Punch-in successful";

    if (!isWifiValid || !isGeoValid) {
      // If EITHER validation fails, mark as INVALID
      status = "INVALID_ATTENDANCE";
      if (!isWifiValid && !isGeoValid) {
        message = `Invalid WiFi and Location (${Math.round(distance)}m away)`;
      } else if (!isWifiValid) {
        message = "Invalid WiFi - Punch-in denied";
      } else {
        message = `Outside office radius (${Math.round(distance)}m away)`;
      }
    } else if (isLate) {
      // Both validations pass but late
      status = "LATE";
      message = `Punch-in successful - Late arrival (${Math.round(distance)}m from office)`;
    } else {
      // Both validations pass and on time
      status = "PRESENT";
      message = `Punch-in successful - On time (${Math.round(distance)}m from office)`;
    }

    // Create Record
    const newRecord = {
      date: now.toISOString().split('T')[0], // YYYY-MM-DD format
      employeeId,
      punchInTime,
      punchOutTime: null,
      location,
      wifiBSSID,
      status: (status === "INVALID_ATTENDANCE") ? "ABSENT" : status, // Show ABSENT immediately
      isLate, // Track if they were late
      validation: {
        wifi: isWifiValid,
        geo: isGeoValid,
        distance_meters: Math.round(distance),
        message
      }
    };

    console.log('📝 Creating attendance record for:', employeeId);
    const docRef = await db.collection('attendance').add(newRecord);
    console.log('✅ Attendance record created with ID:', docRef.id);
    console.log('   Status:', status, '| Late:', isLate, '| Message:', message);

    res.json({
      id: docRef.id,
      message,
      validation: newRecord.validation
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. PUNCH OUT (Firestore) - Updated to use employeeId
router.post("/punch-out", async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        error: "employeeId is required",
        message: "Please provide employeeId in request body"
      });
    }

    // Find the active attendance record (no punchOutTime yet)
    // Simplified query to avoid needing a composite index
    const snapshot = await db.collection('attendance')
      .where('employeeId', '==', employeeId)
      .where('punchOutTime', '==', null)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: "No active session found",
        message: "You need to punch in first"
      });
    }

    // Sort in memory and get the most recent
    const docs = snapshot.docs.sort((a, b) => {
      const aTime = new Date(a.data().punchInTime);
      const bTime = new Date(b.data().punchInTime);
      return bTime - aTime; // desc order
    });
    const recordDoc = docs[0];
    const recordData = recordDoc.data();

    console.log('📝 Updating attendance record:', recordDoc.id, 'for employee:', employeeId);

    // Calculate hours worked
    const punchInTime = new Date(recordData.punchInTime);
    const punchOutTime = new Date();
    const hoursWorked = (punchOutTime - punchInTime) / (1000 * 60 * 60); // in hours

    // Fetch office config to get working hours
    const configSnap = await db.collection('office_config').limit(1).get();
    const office = !configSnap.empty ? configSnap.docs[0].data() : {};
    const workingHours = office.workingHours || 8;

    // Determine final status based on hours worked and initial status
    let finalStatus = recordData.status;
    let statusMessage = "";

    // CRITICAL: Check validation - if either WiFi or Geo failed, ALWAYS ABSENT
    const isValidationFailed = !recordData.validation?.wifi || !recordData.validation?.geo;

    if (isValidationFailed) {
      // Validation failed - mark as ABSENT regardless of hours worked
      finalStatus = "ABSENT";
      const failedValidations = [];
      if (!recordData.validation?.wifi) failedValidations.push("WiFi");
      if (!recordData.validation?.geo) failedValidations.push("Location");
      statusMessage = `Absent - Invalid ${failedValidations.join(" and ")} (worked ${hoursWorked.toFixed(1)}h but validation failed)`;
    } else if (recordData.status === "ABSENT") {
      // Already marked absent during punch-in, keep it
      finalStatus = "ABSENT";
      statusMessage = `Absent - ${recordData.validation?.message || "Validation failed"}`;
    } else if (hoursWorked < (workingHours * 0.5)) {
      // Worked less than 50% of working hours
      finalStatus = "ABSENT";
      statusMessage = `Absent - Only worked ${hoursWorked.toFixed(1)} hours (required ${workingHours * 0.5})`;
    } else if (Math.abs(hoursWorked - (workingHours * 0.5)) <= 0.5) {
      // Worked approximately 50% (±30 min buffer)
      finalStatus = "HALF_DAY";
      statusMessage = `Half Day - Worked ${hoursWorked.toFixed(1)} hours`;
    } else if (hoursWorked >= workingHours && recordData.isLate) {
      // Worked full hours but was late
      finalStatus = "LATE";
      statusMessage = `Present (Late) - Worked ${hoursWorked.toFixed(1)} hours`;
    } else if (hoursWorked >= workingHours) {
      // Worked full hours and on time
      finalStatus = "PRESENT";
      statusMessage = `Present - Worked ${hoursWorked.toFixed(1)} hours`;
    } else {
      // Edge case: between 50% and full hours
      finalStatus = "HALF_DAY";
      statusMessage = `Half Day - Worked ${hoursWorked.toFixed(1)} hours (required ${workingHours})`;
    }

    await recordDoc.ref.update({
      punchOutTime: punchOutTime.toISOString(),
      status: finalStatus,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      statusMessage
    });

    console.log('✅ Punch-out recorded for:', employeeId);
    console.log('   Hours Worked:', hoursWorked.toFixed(2), '| Final Status:', finalStatus);

    res.json({
      message: statusMessage,
      status: finalStatus,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      recordId: recordDoc.id
    });
  } catch (error) {
    console.error("Punch-out error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. GET TODAY'S ATTENDANCE (Firestore)
router.get("/today", async (req, res) => {
  try {
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Query Firestore for today's date
    const snapshot = await db.collection('attendance')
      .where('date', '==', todayDate)
      .get();

    // Fetch all employees to get names
    const employeesSnapshot = await db.collection('employees').get();
    const employeesMap = {};
    employeesSnapshot.forEach(doc => {
      const empData = doc.data();
      // Handle both emp_id and employeeId field names
      const empId = empData.employeeId || empData.employee_id || empData.emp_id;
      if (empId) {
        employeesMap[empId.toUpperCase()] = {
          name: empData.name || `${empData.firstName || ''} ${empData.lastName || ''}`.trim(),
          department: empData.department || empData.designation || 'General'
        };
      }
    });

    const records = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const empInfo = employeesMap[data.employeeId] || { name: `Employee ${data.employeeId}`, department: 'General' };

      records.push({
        id: doc.id,
        employeeId: data.employeeId,
        employeeName: empInfo.name,
        department: empInfo.department,
        date: data.date,
        punchInTime: data.punchInTime,
        punchOutTime: data.punchOutTime,
        location: data.location,
        wifiBSSID: data.wifiBSSID,
        status: data.status,
        validation: data.validation
      });
    });

    console.log(`📊 Fetched ${records.length} attendance records for ${todayDate}`);
    res.json(records);
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. CLEAR ATTENDANCE RECORDS (Admin only)
router.delete("/clear", async (req, res) => {
  try {
    const { scope } = req.query; // 'today' or 'all'

    let snapshot;
    if (scope === 'today') {
      const todayDate = new Date().toISOString().split('T')[0];
      snapshot = await db.collection('attendance')
        .where('date', '==', todayDate)
        .get();
      console.log(`🗑️  Clearing ${snapshot.size} attendance records for today (${todayDate})`);
    } else {
      snapshot = await db.collection('attendance').get();
      console.log(`🗑️  Clearing ALL ${snapshot.size} attendance records`);
    }

    // Delete all matching documents
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`✅ Successfully deleted ${snapshot.size} records`);
    res.json({
      message: `Deleted ${snapshot.size} attendance records`,
      count: snapshot.size
    });
  } catch (error) {
    console.error("Error clearing attendance records:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
