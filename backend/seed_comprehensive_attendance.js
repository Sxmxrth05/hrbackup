/**
 * Comprehensive Attendance Seed Data
 * Covers all validation scenarios and edge cases
 */

const { db } = require('./firebaseConfig');

const today = new Date().toISOString().split('T')[0];

// Comprehensive test scenarios
const attendanceData = [
    // ✅ PERFECT ATTENDANCE (All validations pass)
    {
        employeeId: 'EMP001',
        employeeName: 'Alice Smith',
        date: today,
        punchInTime: `${today}T09:00:00.000Z`,
        punchOutTime: `${today}T18:00:00.000Z`,
        hoursWorked: 9.0,
        status: 'PRESENT',
        validation: { wifi: true, geo: true },
        notes: 'Perfect attendance - all validations passed'
    },

    // 🟠 LATE ARRIVAL (Present but late)
    {
        employeeId: 'EMP002',
        employeeName: 'Bob Jones',
        date: today,
        punchInTime: `${today}T10:30:00.000Z`,
        punchOutTime: `${today}T19:00:00.000Z`,
        hoursWorked: 8.5,
        status: 'LATE',
        validation: { wifi: true, geo: true },
        notes: 'Arrived 1.5 hours late but completed full day'
    },

    // 🔵 HALF DAY (Less than 6 hours)
    {
        employeeId: 'EMP003',
        employeeName: 'Charlie Brown',
        date: today,
        punchInTime: `${today}T09:00:00.000Z`,
        punchOutTime: `${today}T13:00:00.000Z`,
        hoursWorked: 4.0,
        status: 'HALF_DAY',
        validation: { wifi: true, geo: true },
        notes: 'Only worked 4 hours - marked as half day'
    },

    // 🔴 WIFI VALIDATION FAILED
    {
        employeeId: 'EMP004',
        employeeName: 'Diana Prince',
        date: today,
        punchInTime: `${today}T09:00:00.000Z`,
        punchOutTime: `${today}T18:00:00.000Z`,
        hoursWorked: 9.0,
        status: 'ABSENT',
        validation: { wifi: false, geo: true },
        notes: 'WiFi validation failed - not on office network'
    },

    // 🔴 GEO VALIDATION FAILED
    {
        employeeId: 'EMP005',
        employeeName: 'Edward Norton',
        date: today,
        punchInTime: `${today}T09:00:00.000Z`,
        punchOutTime: `${today}T18:00:00.000Z`,
        hoursWorked: 9.0,
        status: 'ABSENT',
        validation: { wifi: true, geo: false },
        notes: 'Geo validation failed - outside office radius'
    },

    // 🔴 BOTH VALIDATIONS FAILED
    {
        employeeId: 'EMP006',
        employeeName: 'Fiona Apple',
        date: today,
        punchInTime: `${today}T09:00:00.000Z`,
        punchOutTime: `${today}T18:00:00.000Z`,
        hoursWorked: 9.0,
        status: 'ABSENT',
        validation: { wifi: false, geo: false },
        notes: 'Both WiFi and Geo validation failed'
    },

    // 🔴 LOW HOURS (Only punched in, never punched out)
    {
        employeeId: 'EMP007',
        employeeName: 'George Martin',
        date: today,
        punchInTime: `${today}T09:00:00.000Z`,
        punchOutTime: null,
        hoursWorked: 0.5,
        status: 'ABSENT',
        validation: { wifi: true, geo: true },
        notes: 'Forgot to punch out - low hours marked absent'
    },

    // ✅ EARLY ARRIVAL (Before 9 AM)
    {
        employeeId: 'EMP008',
        employeeName: 'Hannah Montana',
        date: today,
        punchInTime: `${today}T07:30:00.000Z`,
        punchOutTime: `${today}T16:30:00.000Z`,
        hoursWorked: 9.0,
        status: 'PRESENT',
        validation: { wifi: true, geo: true },
        notes: 'Early arrival - came before office hours'
    },

    // 🟠 LATE + EARLY LEAVE
    {
        employeeId: 'EMP009',
        employeeName: 'Ian Fleming',
        date: today,
        punchInTime: `${today}T10:00:00.000Z`,
        punchOutTime: `${today}T17:00:00.000Z`,
        hoursWorked: 7.0,
        status: 'LATE',
        validation: { wifi: true, geo: true },
        notes: 'Late arrival + left early, but 7 hours logged'
    },

    // ✅ OVERTIME (More than 9 hours)
    {
        employeeId: 'EMP010',
        employeeName: 'Julia Roberts',
        date: today,
        punchInTime: `${today}T08:00:00.000Z`,
        punchOutTime: `${today}T20:00:00.000Z`,
        hoursWorked: 12.0,
        status: 'PRESENT',
        validation: { wifi: true, geo: true },
        notes: 'Overtime - worked 12 hours'
    }
];

async function seedAttendance() {
    try {
        console.log('\n🌱 Seeding comprehensive attendance data...\n');

        // Clear existing attendance for today
        const existingSnapshot = await db.collection('attendance')
            .where('date', '==', today)
            .get();

        if (!existingSnapshot.empty) {
            console.log(`🗑️  Clearing ${existingSnapshot.size} existing records for today...`);
            const batch = db.batch();
            existingSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        // Insert new data
        console.log(`📊 Inserting ${attendanceData.length} test records...\n`);

        for (const record of attendanceData) {
            await db.collection('attendance').add(record);

            const statusEmoji = {
                'PRESENT': '✅',
                'LATE': '🟠',
                'HALF_DAY': '🔵',
                'ABSENT': '🔴'
            }[record.status];

            console.log(`${statusEmoji} ${record.employeeName} (${record.employeeId})`);
            console.log(`   Status: ${record.status}`);
            console.log(`   Hours: ${record.hoursWorked}h`);
            console.log(`   WiFi: ${record.validation.wifi ? '✓' : '✗'}, Geo: ${record.validation.geo ? '✓' : '✗'}`);
            console.log(`   Note: ${record.notes}\n`);
        }

        console.log('✅ Attendance data seeded successfully!\n');
        console.log('📈 Coverage:');
        console.log(`   ✅ PRESENT: ${attendanceData.filter(r => r.status === 'PRESENT').length} records`);
        console.log(`   🟠 LATE: ${attendanceData.filter(r => r.status === 'LATE').length} records`);
        console.log(`   🔵 HALF_DAY: ${attendanceData.filter(r => r.status === 'HALF_DAY').length} records`);
        console.log(`   🔴 ABSENT: ${attendanceData.filter(r => r.status === 'ABSENT').length} records`);

    } catch (error) {
        console.error('❌ Error seeding attendance:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedAttendance().then(() => process.exit(0));
}

module.exports = { seedAttendance, attendanceData };
