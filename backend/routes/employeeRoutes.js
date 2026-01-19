const express = require("express");
const router = express.Router();
const { db } = require("../firebaseConfig");

// GET all employees
router.get("/", async (req, res) => {
    try {
        const snapshot = await db.collection('employees').get();
        const employees = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            employees.push({
                id: doc.id,
                employeeId: data.emp_id || data.employee_id || data.employeeId,
                firstName: data.firstName || data.name?.split(' ')[0] || '',
                lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
                name: data.name,
                email: data.email,
                phone: data.phone || '',
                department: data.department || data.designation || 'General',
                position: data.designation || data.position || '',
                status: data.status || 'active',
                joinDate: data.joinDate || data.join_date || '',
                salary: data.salary
            });
        });

        console.log(`📋 Fetched ${employees.length} employees from Firestore`);
        res.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET single employee by ID
router.get("/:id", async (req, res) => {
    try {
        const doc = await db.collection('employees').doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const data = doc.data();
        res.json({
            id: doc.id,
            employeeId: data.emp_id || data.employee_id || data.employeeId,
            firstName: data.firstName || data.name?.split(' ')[0] || '',
            lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            department: data.department || data.designation || 'General',
            position: data.designation || data.position || '',
            status: data.status || 'active',
            joinDate: data.joinDate || data.join_date || '',
            salary: data.salary
        });
    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE new employee (with automatic Firebase Auth user creation)
router.post("/", async (req, res) => {
    try {
        const { employeeId, firstName, lastName, email, phone, department, position, joinDate, salary } = req.body;

        console.log('👤 Creating new employee:', employeeId);

        // Step 1: Create Firebase Authentication user
        let authUID = null;
        const defaultPassword = 'password123'; // Default password for new employees

        try {
            const userRecord = await admin.auth().createUser({
                email: email,
                password: defaultPassword,
                displayName: `${firstName} ${lastName}`,
                disabled: false
            });
            authUID = userRecord.uid;
            console.log('✅ Firebase Auth user created:', authUID);
        } catch (authError) {
            // If user already exists in Auth, continue with Firestore creation
            if (authError.code === 'auth/email-already-exists') {
                console.log('⚠️ Auth user already exists, continuing...');
                // Try to get existing user
                try {
                    const existingUser = await admin.auth().getUserByEmail(email);
                    authUID = existingUser.uid;
                } catch (e) {
                    console.error('Error fetching existing auth user:', e);
                }
            } else {
                throw new Error(`Auth creation failed: ${authError.message}`);
            }
        }

        // Step 2: Create employee in Firestore
        const newEmployee = {
            emp_id: employeeId.toUpperCase(),
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            email,
            phone: phone || '',
            department,
            designation: position,
            position,
            status: 'active',
            joinDate: joinDate || new Date().toISOString().split('T')[0],
            join_date: joinDate || new Date().toISOString().split('T')[0],
            salary: salary || { basic: 0, hra: 0, other_allow: 0 },
            authUID: authUID, // Link to Firebase Auth user
            defaultPassword: defaultPassword, // Store for HR reference (should be changed)
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('employees').add(newEmployee);

        console.log('✅ Employee created with ID:', docRef.id);
        console.log('🔐 Default login credentials:');
        console.log('   Email:', email);
        console.log('   Password:', defaultPassword);

        res.json({
            id: docRef.id,
            message: "Employee created successfully (Auth user created)",
            employee: { id: docRef.id, ...newEmployee },
            credentials: {
                email: email,
                password: defaultPassword,
                note: "Employee should change password on first login"
            }
        });
    } catch (error) {
        console.error("Error creating employee:", error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE employee
router.put("/:id", async (req, res) => {
    try {
        const { firstName, lastName, email, phone, department, position, status, joinDate, salary } = req.body;

        const updates = {
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            email,
            phone: phone || '',
            department,
            designation: position,
            position,
            status: status || 'active',
            joinDate: joinDate || '',
            join_date: joinDate || '',
            salary: salary || { basic: 0, hra: 0, other_allow: 0 },
            updatedAt: new Date().toISOString()
        };

        console.log('✏️ Updating employee:', req.params.id);
        await db.collection('employees').doc(req.params.id).update(updates);

        console.log('✅ Employee updated successfully');
        res.json({ message: "Employee updated successfully" });
    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
    try {
        console.log('🗑️ Deleting employee:', req.params.id);
        await db.collection('employees').doc(req.params.id).delete();

        console.log('✅ Employee deleted successfully');
        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
