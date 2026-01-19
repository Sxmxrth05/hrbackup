/**
 * Script to create Firebase Authentication users for existing employees
 * Run this once to migrate existing employees to have login credentials
 */

const { admin, db } = require('./firebaseConfig');

const DEFAULT_PASSWORD = 'password123';

async function createAuthForExistingEmployees() {
    try {
        console.log('\n🔄 Creating Firebase Auth users for existing employees...\n');

        // Fetch all employees
        const snapshot = await db.collection('employees').get();
        console.log(`📊 Found ${snapshot.size} employees in Firestore\n`);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const doc of snapshot.docs) {
            const employee = doc.data();
            const docId = doc.id;

            // Skip if no email
            if (!employee.email) {
                console.log(`⚠️  Skipping ${employee.name || docId}: No email address`);
                skipped++;
                continue;
            }

            try {
                // Check if auth user already exists
                let authUID = employee.authUID;

                if (authUID) {
                    console.log(`✓ ${employee.name} (${employee.email}): Already has auth UID`);
                    skipped++;
                    continue;
                }

                // Try to create auth user
                try {
                    const userRecord = await admin.auth().createUser({
                        email: employee.email,
                        password: DEFAULT_PASSWORD,
                        displayName: employee.name,
                        disabled: false
                    });

                    authUID = userRecord.uid;
                    console.log(`✅ ${employee.name} (${employee.email}): Auth user created`);
                    created++;

                } catch (authError) {
                    // If user already exists, try to get UID
                    if (authError.code === 'auth/email-already-exists') {
                        const existingUser = await admin.auth().getUserByEmail(employee.email);
                        authUID = existingUser.uid;
                        console.log(`✓ ${employee.name} (${employee.email}): Using existing auth user`);
                        skipped++;
                    } else {
                        throw authError;
                    }
                }

                // Update Firestore with authUID and default password
                await db.collection('employees').doc(docId).update({
                    authUID: authUID,
                    defaultPassword: DEFAULT_PASSWORD
                });

                console.log(`   └─ Updated Firestore with authUID`);

            } catch (error) {
                console.error(`❌ ${employee.name || docId}: Error - ${error.message}`);
                errors++;
            }

            console.log(''); // Blank line
        }

        console.log('\n📈 Summary:');
        console.log(`   ✅ Created: ${created} auth users`);
        console.log(`   ✓  Skipped: ${skipped} (already had auth or no email)`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`\n🔐 Default credentials for all employees:`);
        console.log(`   Email: {employee_email}`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);
        console.log(`\n✅ Done! Employees can now login to mobile app.`);

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run script
if (require.main === module) {
    createAuthForExistingEmployees().then(() => process.exit(0));
}

module.exports = { createAuthForExistingEmployees };
