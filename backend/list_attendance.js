const { db } = require('./firebaseConfig');

async function listAllAttendance() {
    console.log('📋 Fetching all attendance records...\n');

    const snapshot = await db.collection('attendance').get();

    console.log(`Found ${snapshot.size} records:\n`);

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📄 Document ID: ${doc.id}`);
        console.log(`📅 Date: ${data.date}`);
        console.log(`👤 Employee: ${data.employeeId}`);
        console.log(`⏰ Punch In: ${data.punchInTime}`);
        console.log(`⏰ Punch Out: ${data.punchOutTime || 'Not punched out'}`);
        console.log(`📍 Location: ${data.location.latitude}, ${data.location.longitude}`);
        console.log(`📶 WiFi: ${data.wifiBSSID}`);
        console.log(`✅ Status: ${data.status}`);
        console.log(`🔍 Validation: ${data.validation.message}`);
        console.log(`   - WiFi Valid: ${data.validation.wifi}`);
        console.log(`   - Geo Valid: ${data.validation.geo}`);
        console.log(`   - Distance: ${data.validation.distance_meters}m`);
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Total: ${snapshot.size} attendance records`);
}

listAllAttendance().catch(console.error);
