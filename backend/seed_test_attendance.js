/**
 * Seed Complete Attendance Test Data
 * Generates ALL test scenarios using real + demo employees
 */

const { db } = require('./firebaseConfig');

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

console.log(`🎯 Generating complete test data for ${todayStr}...`);

// All test scenarios  
const scenarios = [
    { type: 'PRESENT', punchIn: '08:55', punchOut: '18:00', wifi: true, geo: true, hours: 9.0 },
    { type: 'LATE', punchIn: '09:30', punchOut: '18:30', wifi: true, geo: true, hours: 9.0 },
    { type: 'HALF_DAY', punchIn: '09:00', punchOut: '13:00', wifi: true, geo: true, hours: 4.0 },
    { type: 'ABSENT_WIFI', punchIn: '09:00', punchOut: '17:00', wifi: false, geo: true, hours: 8.0 },
    { type: 'ABSENT_GEO', punchIn: '09:00', punchOut: '17:00', wifi: true, geo: false, hours: 8.0 },
    { type: 'ABSENT_BOTH', punchIn: '09:00', punchOut: '17:00', wifi: false, geo: false, hours: 8.0 },
    { type: 'ABSENT_LOW', punchIn: '09:00', punchOut: '10:30', wifi: true, geo: true, hours: 1.5 },
    { type: 'PRESENT', punchIn: '08:45', punchOut: '17:30', wifi: true, geo: true, hours: 8.75 },
    { type: 'LATE', punchIn: '09:15', punchOut: '17:45', wifi: true, geo: true, hours: 8.5 },
    { type: 'PRESENT', punchIn: '08:50', punchOut: '18:10', wifi: true, geo: true, hours: 9.3 }
];

const demoEmployees = [
    { employeeId: 'EMP001', name: 'John Smith', department: 'Engineering' },
    { employeeId: 'EMP002', name: 'Sarah Johnson', department: 'Marketing' },
    { employeeId: 'EMP003', name: 'Michael Brown', department: 'Finance' },
    { employeeId: 'EMP004', name: 'Emily Davis', department: 'HR' },
    { employeeId: 'EMP005', name: 'David Wilson', department: 'Engineering' },
    { employeeId: 'EMP006', name: 'Jessica Martinez', department: 'Sales' },
    { employeeId: 'EMP007', name: 'Robert Taylor', department: 'Operations' },
    { employeeId: 'EMP008', name: 'Amanda White', department: 'IT' },
    { employeeId: 'EMP009', name: 'Christopher Lee', department: 'Design' },
    { employeeId: 'EMP010', name: 'Michelle Garcia', department: 'Support' }
];

function createTimestamp(timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number);
    const dt = new Date(today);
    dt.setHours(hour, minute, 0, 0);
    return dt.toISOString();
}

function determineStatus(scenario) {
    if (!scenario.wifi || !scenario.geo) return 'ABSENT';
    if (scenario.hours < 4) return 'ABSENT';
    if (scenario.hours >= 3.5 && scenario.hours <= 4.5) return 'HALF_DAY';
    if (scenario.hours >= 8) {
        return scenario.punchIn > '09:00' ? 'LATE' : 'PRESENT';
    }
    return 'HALF_DAY';
}

function getDistance(isValid) {
    return isValid ? Math.floor(Math.random() * 70) + 10 : Math.floor(Math.random() * 10000) + 5000;
}

async function seed() {
    try {
        console.log('🗑️  Clearing old records...');
        const existing = await db.collection('attendance').where('date', '==', todayStr).get();
        for (const doc of existing.docs) {
            await doc.ref.delete();
        }
        console.log(`✅ Cleared ${existing.size} records\n`);

        console.log('📝 Creating test records...\n');

        // Fetch real employees
        const empSnap = await db.collection('employees').get();
        const realEmployees = [];
        empSnap.forEach(doc => {
            const d = doc.data();
            realEmployees.push({
                employeeId: d.emp_id || d.employeeId || doc.id,
                name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Employee',
                department: d.department || 'General'
            });
        });

        // Combine real + demo
        const allEmployees = [...realEmployees, ...demoEmployees.slice(realEmployees.length)];

        const records = [];
        for (let i = 0; i < Math.min(allEmployees.length, scenarios.length); i++) {
            const emp = allEmployees[i];
            const sc = scenarios[i];
            const status = determineStatus(sc);
            const dist = getDistance(sc.geo);
            const isLate = sc.punchIn > '09:00';

            let msg;
            if (!sc.wifi && !sc.geo) msg = `Invalid WiFi and Location (${dist}m away)`;
            else if (!sc.wifi) msg = "Invalid WiFi";
            else if (!sc.geo) msg = `Outside radius (${dist}m away)`;
            else if (isLate) msg = `Late arrival (${dist}m from office)`;
            else msg = `On time (${dist}m from office)`;

            const data = {
                date: todayStr,
                employeeId: emp.employeeId,
                employeeName: emp.name,
                department: emp.department,
                punchInTime: createTimestamp(sc.punchIn),
                punchOutTime: createTimestamp(sc.punchOut),
                location: { latitude: sc.geo ? 12.9716 : 13.5, longitude: sc.geo ? 77.5946 : 80.2 },
                wifiBSSID: sc.wifi ? '02:00:00:00:00:00' : 'aa:bb:cc:dd:ee:ff',
                status,
                isLate,
                hoursWorked: sc.hours,
                validation: { wifi: sc.wifi, geo: sc.geo, distance_meters: dist, message: msg }
            };

            await db.collection('attendance').add(data);
            const emoji = { PRESENT: '✅', LATE: '🟠', HALF_DAY: '🔵', ABSENT: '🔴' }[status];
            console.log(`${emoji} ${emp.name.padEnd(22)} ${status.padEnd(10)} ${sc.hours}h  WiFi:${sc.wifi} Geo:${sc.geo}`);
            records.push({ status });
        }

        const present = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const late = records.filter(r => r.status === 'LATE').length;
        const halfDay = records.filter(r => r.status === 'HALF_DAY').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Test data complete!');
        console.log('='.repeat(60));
        console.log(`\n📊 Total: ${records.length}`);
        console.log(`   ✅ Present: ${present - late}`);
        console.log(`   🟠 Late: ${late}`);
        console.log(`   🔵 Half Day: ${halfDay}`);
        console.log(`   🔴 Absent: ${absent}`);
        console.log(`   📈 Rate: ${Math.round((present / records.length) * 100)}%`);
        console.log(`\n🌐 http://localhost:8080/attendance\n`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seed().then(() => process.exit(0));
