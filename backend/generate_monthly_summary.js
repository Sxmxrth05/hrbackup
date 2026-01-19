/**
 * Monthly Attendance Summary Generator
 * Aggregates daily attendance into monthly summary for salary calculation
 */

const { db } = require('./firebaseConfig');

async function generateMonthlyAttendanceSummary(employeeId, month, year, allAttendanceData = null) {
    try {
        console.log(`\n📊 Generating monthly summary for ${employeeId} - ${month}/${year}\n`);

        let attendanceRecords = [];

        if (allAttendanceData) {
            // Use pre-fetched data (more efficient for bulk processing)
            attendanceRecords = allAttendanceData.filter(record => record.employeeId === employeeId);
        } else {
            // Fetch all attendance for the month, then filter in-memory
            // This avoids compound index requirement
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

            const snapshot = await db.collection('attendance')
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .get();

            // Filter by employeeId in memory
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.employeeId === employeeId) {
                    attendanceRecords.push(data);
                }
            });
        }

        // Initialize counters
        let totalDays = 0;
        let presentDays = 0;
        let lateDays = 0;
        let halfDays = 0;
        let absentDays = 0;
        let totalHoursWorked = 0;

        const details = [];

        attendanceRecords.forEach(data => {
            totalDays++;

            const status = data.status?.toUpperCase();
            const hours = data.hoursWorked || 0;
            totalHoursWorked += hours;

            if (status === 'PRESENT') {
                presentDays++;
            } else if (status === 'LATE') {
                lateDays++;
                presentDays++; // Late is still counted as present for salary
            } else if (status === 'HALF_DAY') {
                halfDays++;
            } else if (status === 'ABSENT') {
                absentDays++;
            }

            details.push({
                date: data.date,
                status,
                hours,
                validation: data.validation
            });
        });

        // Calculate attendance percentage
        const attendancePercentage = totalDays > 0
            ? Math.round((presentDays / totalDays) * 100)
            : 0;

        // Calculate salary multiplier
        // Full month (>= 90%) = 100%, Partial deductions for absences
        const salaryMultiplier = attendancePercentage >= 90 ? 1.0 :
            attendancePercentage >= 75 ? 0.95 :
                attendancePercentage >= 60 ? 0.85 :
                    attendancePercentage / 100;

        const summary = {
            employeeId,
            month,
            year,
            monthYear: `${year}-${String(month).padStart(2, '0')}`,
            totalDays,
            presentDays,
            lateDays,
            halfDays,
            absentDays,
            totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
            attendancePercentage,
            salaryMultiplier: Math.round(salaryMultiplier * 100) / 100,
            generatedAt: new Date().toISOString(),
            details
        };

        // Save to monthly_attendance_summary collection
        await db.collection('monthly_attendance_summary').doc(`${employeeId}_${year}_${month}`).set(summary);

        console.log('✅ Summary generated:');
        console.log(`   Total Days: ${totalDays}`);
        console.log(`   Present: ${presentDays} (including ${lateDays} late)`);
        console.log(`   Half Day: ${halfDays}`);
        console.log(`   Absent: ${absentDays}`);
        console.log(`   Total Hours: ${summary.totalHoursWorked}`);
        console.log(`   Attendance %: ${attendancePercentage}%`);
        console.log(`   Salary Multiplier: ${summary.salaryMultiplier} (${summary.salaryMultiplier * 100}%)`);

        return summary;

    } catch (error) {
        console.error('❌ Error generating monthly summary:', error);
        throw error;
    }
}

// Generate summary for all employees for a specific month
async function generateMonthlySummaryForAll(month, year) {
    try {
        console.log(`\n🔄 Generating monthly summaries for all employees - ${month}/${year}\n`);

        // Fetch ALL attendance data for the month ONCE (more efficient)
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        console.log(`📥 Fetching all attendance records for ${month}/${year}...`);

        const snapshot = await db.collection('attendance')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

        console.log(`✅ Fetched ${snapshot.size} attendance records\n`);

        // Convert to array for reuse
        const allAttendanceData = [];
        snapshot.forEach(doc => allAttendanceData.push(doc.data()));

        // Get unique employee IDs from the data
        const employeeIds = new Set();
        allAttendanceData.forEach(record => {
            if (record.employeeId) employeeIds.add(record.employeeId);
        });

        console.log(`Found ${employeeIds.size} employees with attendance records\n`);

        // Generate summary for each employee using the pre-fetched data
        for (const empId of employeeIds) {
            await generateMonthlyAttendanceSummary(empId, month, year, allAttendanceData);
        }

        console.log(`\n✅ Generated summaries for ${employeeIds.size} employees`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Default: current month
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        generateMonthlySummaryForAll(month, year).then(() => process.exit(0));
    } else if (args.length === 2) {
        const month = parseInt(args[0]);
        const year = parseInt(args[1]);
        generateMonthlySummaryForAll(month, year).then(() => process.exit(0));
    } else if (args.length === 3) {
        const empId = args[0];
        const month = parseInt(args[1]);
        const year = parseInt(args[2]);
        generateMonthlyAttendanceSummary(empId, month, year).then(() => process.exit(0));
    } else {
        console.log('Usage:');
        console.log('  node generate_monthly_summary.js                    # Current month for all');
        console.log('  node generate_monthly_summary.js 1 2026              # January 2026 for all');
        console.log('  node generate_monthly_summary.js EMP001 1 2026       # Specific employee');
        process.exit(1);
    }
}

module.exports = { generateMonthlyAttendanceSummary, generateMonthlySummaryForAll };
