/**
 * Seed New Test Employees
 * Creates diverse employee profiles for testing
 */

const { admin, db } = require('./firebaseConfig');

const DEFAULT_PASSWORD = 'password123';

const newEmployees = [
    {
        emp_id: 'EMP011',
        firstName: 'Kevin',
        lastName: 'Hart',
        name: 'Kevin Hart',
        email: 'kevin.hart@company.com',
        phone: '+1-555-0111',
        department: 'Marketing',
        position: 'Marketing Manager',
        designation: 'Marketing Manager',
        salary: { basic: 55000, hra: 22000, other_allow: 8000 },
        status: 'active',
        joinDate: '2026-01-10',
        join_date: '2026-01-10'
    },
    {
        emp_id: 'EMP012',
        firstName: 'Laura',
        lastName: 'Palmer',
        name: 'Laura Palmer',
        email: 'laura.palmer@company.com',
        phone: '+1-555-0112',
        department: 'Engineering',
        position: 'Senior Developer',
        designation: 'Senior Developer',
        salary: { basic: 70000, hra: 28000, other_allow: 12000 },
        status: 'active',
        joinDate: '2026-01-05',
        join_date: '2026-01-05'
    },
    {
        emp_id: 'EMP013',
        firstName: 'Michael',
        lastName: 'Scott',
        name: 'Michael Scott',
        email: 'michael.scott@company.com',
        phone: '+1-555-0113',
        department: 'Operations',
        position: 'Operations Lead',
        designation: 'Operations Lead',
        salary: { basic: 60000, hra: 24000, other_allow: 10000 },
        status: 'active',
        joinDate: '2026-01-15',
        join_date: '2026-01-15'
    },
    {
        emp_id: 'EMP014',
        firstName: 'Nancy',
        lastName: 'Drew',
        name: 'Nancy Drew',
        email: 'nancy.drew@company.com',
        phone: '+1-555-0114',
        department: 'Finance',
        position: 'Financial Analyst',
        designation: 'Financial Analyst',
        salary: { basic: 52000, hra: 21000, other_allow: 7000 },
        status: 'active',
        joinDate: '2026-01-12',
        join_date: '2026-01-12'
    },
    {
        emp_id: 'EMP015',
        firstName: 'Oliver',
        lastName: 'Twist',
        name: 'Oliver Twist',
        email: 'oliver.twist@company.com',
        phone: '+1-555-0115',
        department: 'Engineering',
        position: 'Junior Developer',
        designation: 'Junior Developer',
        salary: { basic: 40000, hra: 16000, other_allow: 4000 },
        status: 'active',
        joinDate: '2026-01-18',
        join_date: '2026-01-18'
    }
];

async function seedNewEmployees() {
    try {
        console.log('\n👥 Seeding new test employees...\n');

        let created = 0;
        let skipped = 0;

        for (const employee of newEmployees) {
            try {
                // Check if employee already exists
                const existing = await db.collection('employees')
                    .where('emp_id', '==', employee.emp_id)
                    .get();

                if (!existing.empty) {
                    console.log(`⚠️  ${employee.name}: Already exists, skipping...`);
                    skipped++;
                    continue;
                }

                // Create Firebase Auth user
                let authUID = null;
                try {
                    const userRecord = await admin.auth().createUser({
                        email: employee.email,
                        password: DEFAULT_PASSWORD,
                        displayName: employee.name,
                        disabled: false
                    });
                    authUID = userRecord.uid;
                    console.log(`✅ ${employee.name}: Auth user created`);
                } catch (authError) {
                    if (authError.code === 'auth/email-already-exists') {
                        const existingUser = await admin.auth().getUserByEmail(employee.email);
                        authUID = existingUser.uid;
                        console.log(`✓  ${employee.name}: Using existing auth user`);
                    } else {
                        throw authError;
                    }
                }

                // Add to Firestore
                const employeeData = {
                    ...employee,
                    authUID,
                    defaultPassword: DEFAULT_PASSWORD,
                    createdAt: new Date().toISOString()
                };

                await db.collection('employees').add(employeeData);

                const totalSalary = employee.salary.basic + employee.salary.hra + employee.salary.other_allow;
                console.log(`   └─ ${employee.position} in ${employee.department}`);
                console.log(`   └─ Salary: ₹${totalSalary.toLocaleString()}/month`);
                console.log(`   └─ Email: ${employee.email}\n`);

                created++;

            } catch (error) {
                console.error(`❌ ${employee.name}: Error - ${error.message}\n`);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Created: ${created} employees`);
        console.log(`   ⚠️  Skipped: ${skipped} (already existed)`);
        console.log(`\n🔐 Default login credentials:`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);
        console.log(`\n✅ New employees added successfully!`);

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedNewEmployees().then(() => process.exit(0));
}

module.exports = { seedNewEmployees, newEmployees };
