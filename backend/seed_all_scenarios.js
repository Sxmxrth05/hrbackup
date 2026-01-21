/**
 * ENHANCED Attendance Seed Generator
 * Fetches actual employees from Firebase and generates ALL test scenarios
 * Run: node backend/seed_all_scenarios.js
 */

const { db } = require('./firebaseConfig');

const today = new Date().toISOString().split('T')[0];

// Define all test scenarios
const scenarios = [
    {
        name: 'Perfect Attendance',
        status: 'PRESENT',
        punchIn: '09:00',
        punchOut: '18:00',
        wifi: true,
        geo: true,
        hours: 9.0,
        notes: 'On time, all validations passed'
    },
    {
        name: 'Late Arrival (15 min)',
        status: 'LATE',
        punchIn: '09:15',
        punchOut: '18:00',
        wifi: true,
        geo: true,
        hours: 8.75,
        notes: 'Late by 15 minutes but worked full hours'
    },
    {
        name: 'Late Arrival (1.5 hours)',
        status: 'LATE',
        punchIn: '10:30',
        punchOut: '19:00',
        wifi: true,
        geo: true,
        hours: 8.5,
        notes: 'Significantly late but compensated with overtime'
    },
    {
        name: 'Half Day (Morning)',
        status: 'HALF_DAY',
        punchIn: '09:00',
        punchOut: '13:00',
        wifi: true,
        geo: true,
        hours: 4.0,
        notes: 'Worked only morning shift'
    },
    {
        name: 'Half Day (Afternoon)',
        status: 'HALF_DAY',
        punchIn: '14:00',
        punchOut: '18:00',
        wifi: true,
        geo: true,
        hours: 4.0,
        notes: 'Worked only afternoon shift'
    },
    {
        name: 'WiFi Validation Failed',
        status: 'ABSENT',
        punchIn: '09:00',
        punchOut: '18:00',
        wifi: false,
        geo: true,
        hours: 9.0,
        notes: 'Not connected to office WiFi - marked absent'
    },
    {
        name: 'GPS Validation Failed',
        status: 'ABSENT',
        punchIn: '09:00',
        punchOut: '18:00',
        wifi: true,
        geo: false,
        hours: 9.0,
        notes: 'Outside office geofence radius - marked absent'
    },
    {
        name: 'Both Validations Failed',
        status: 'ABSENT',
        punchIn: '09:00',
        punchOut: '18:00',
        wifi: false,
        geo: false,
        hours: 9.0,
        notes: 'Both WiFi and GPS validation failed'
    },
    {
        name: 'Forgot to Punch Out',
        status: 'ABSENT',
        punchIn: '09:00',
        punchOut: null,
        wifi: true,
        geo: true,
        hours: 0.5,
        notes: 'Punched in but never punched out - low hours'
    },
    {
        name: 'Early Bird (early arrival)',
        status: 'PRESENT',
        punchIn: '07:30',
        punchOut: '16:30',
        wifi: true,
        geo: true,
        hours: 9.0,
        notes: 'Arrived early and finished early'
    },
    {
        name: 'Overtime Worker',
        status: 'PRESENT',
        punchIn: '08:00',
        punchOut: '20:00',
        wifi: true,
        geo: true,
        hours: 12.0,
        notes: 'Worked extra hours (12 hours total)'
    },
    {
        name: 'Short Hours (Fraud)',
        status: 'ABSENT',
        punchIn: '09:00',
        punchOut: '10:00',
        wifi: true,
        geo: true,
        hours: 1.0,
        notes: 'Too few hours despite valid punch - marked absent'
    },
    {
        name: 'No Attendance',
        status: 'ABSENT',
        punchIn: null,
        punchOut: null,
        wifi: false,
        geo: false,
        hours: 0,
        notes: 'Did not punch in at all - completely absent'
    }
];

function createTimestamp(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.toISOString();
}

function calculateDistance(isValid) {
    if (isValid) {
        return Math.floor(Math.random() * 80) + 10; // 10-90m
    }
    return Math.floor(Math.random() * 10000) + 5000; // 5-15km
}

async function seedAllScenarios() {
    try {
        console.log('\n🌱 COMPREHENSIVE ATTENDANCE SEED GENERATOR\n');
        console.log('='.repeat(60));

        // Step 1: Fetch ALL employees from Firebase
        console.log('\n📊 Step 1: Fetching employees from Firebase...');
        const employeesSnapshot = await db.collection('employees').get();

        if (employeesSnapshot.empty) {
            console.error('❌ No employees found in database!');
            console.log('💡 Run seed_firebase.py first to create employees');
            process.exit(1);
        }

        const employees = [];
        employeesSnapshot.forEach(doc => {
            const data = doc.data();
            employees.push({
                id: data.emp_id || data.employee_id || data.employeeId || doc.id,
                name: data.name,
                email: data.email,
                designation: data.designation || data.position,
                department: data.department || 'General'
            });
        });

        console.log(`✅ Found ${employees.length} employees`);

        // Step 2: Clear existing attendance for today
        console.log('\n🗑️  Step 2: Clearing existing attendance for today...');
        const existingSnapshot = await db.collection('attendance')
            .where('date', '==', today)
            .get();

        if (!existingSnapshot.empty) {
            console.log(`   Deleting ${existingSnapshot.size} existing records...`);
            const batch = db.batch();
            existingSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log('   ✅ Cleared!');
        } else {
            console.log('   No existing records to clear.');
        }

        // Step 3: Assign scenarios to employees
        console.log('\n📝 Step 3: Generating attendance records...\n');

        let recordCount = 0;
        const statusCounts = { PRESENT: 0, LATE: 0, HALF_DAY: 0, ABSENT: 0 };

        for (let i = 0; i < employees.length; i++) {
            const employee = employees[i];
            const scenario = scenarios[i % scenarios.length]; // Cycle through scenarios

            // Skip if scenario is "No Attendance"
            if (!scenario.punchIn && !scenario.punchOut) {
                console.log(`⏭️  ${employee.name.padEnd(20)} - ${scenario.name} (no record created)`);
                statusCounts.ABSENT++;
                continue;
            }

            const punchInTime = createTimestamp(scenario.punchIn);
            const punchOutTime = createTimestamp(scenario.punchOut);
            const distance = calculateDistance(scenario.geo);

            // Build validation message
            let message = '';
            if (!scenario.wifi && !scenario.geo) {
                message = `Both WiFi and GPS validation failed (${distance}m away)`;
            } else if (!scenario.wifi) {
                message = 'WiFi validation failed - not on office network';
            } else if (!scenario.geo) {
                message = `GPS validation failed - outside office radius (${distance}m away)`;
            } else if (scenario.status === 'LATE') {
                message = `Punch-in successful - Late arrival (${distance}m from office)`;
            } else {
                message = `Punch-in successful - On time (${distance}m from office)`;
            }

            // Create attendance record
            const record = {
                employeeId: employee.id,
                employeeName: employee.name,
                department: employee.department,
                designation: employee.designation,
                date: today,
                punchInTime,
                punchOutTime,
                hoursWorked: scenario.hours,
                status: scenario.status,
                isLate: scenario.status === 'LATE',
                location: {
                    latitude: scenario.geo ? 12.9716 : 13.5,
                    longitude: scenario.geo ? 77.5946 : 80.2
                },
                wifiBSSID: scenario.wifi ? '02:00:00:00:00:00' : 'aa:bb:cc:dd:ee:ff',
                validation: {
                    wifi: scenario.wifi,
                    geo: scenario.geo,
                    distance_meters: distance,
                    message
                },
                notes: scenario.notes,
                createdAt: new Date().toISOString()
            };

            await db.collection('attendance').add(record);

            const statusEmoji = {
                'PRESENT': '✅',
                'LATE': '🟠',
                'HALF_DAY': '🔵',
                'ABSENT': '🔴'
            }[scenario.status];

            console.log(`${statusEmoji} ${employee.name.padEnd(20)} - ${scenario.name.padEnd(30)} [${scenario.status}]`);
            console.log(`   └─ ${scenario.notes}`);

            statusCounts[scenario.status]++;
            recordCount++;
        }

        // Step 4: Display summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ SEED COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));

        console.log(`\n📊 Summary:`);
        console.log(`   📅 Date: ${today}`);
        console.log(`   👥 Total Employees: ${employees.length}`);
        console.log(`   📝 Attendance Records Created: ${recordCount}`);
        console.log(`\n📈 Status Breakdown:`);
        console.log(`   ✅ PRESENT:  ${statusCounts.PRESENT} employees`);
        console.log(`   🟠 LATE:     ${statusCounts.LATE} employees`);
        console.log(`   🔵 HALF_DAY: ${statusCounts.HALF_DAY} employees`);
        console.log(`   🔴 ABSENT:   ${statusCounts.ABSENT} employees`);

        const attendanceRate = ((statusCounts.PRESENT + statusCounts.LATE) / employees.length * 100).toFixed(1);
        console.log(`\n📊 Attendance Rate: ${attendanceRate}%`);

        console.log(`\n🌐 View in HR Portal:`);
        console.log(`   Frontend: http://localhost:5173/attendance`);
        console.log(`   Backend:  http://localhost:5000/api/attendance/today`);
        console.log(`\n💡 Tip: Refresh your HR portal to see the data!`);

    } catch (error) {
        console.error('\n❌ Error seeding attendance:', error);
        process.exit(1);
    }
}

// Run
if (require.main === module) {
    seedAllScenarios().then(() => {
        console.log('\n🎉 Done!\n');
        process.exit(0);
    });
}

module.exports = { seedAllScenarios };
