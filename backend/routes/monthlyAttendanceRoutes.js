const express = require('express');
const router = express.Router();
const { db } = require('../firebaseConfig');
const { generateMonthlyAttendanceSummary, generateMonthlySummaryForAll } = require('../generate_monthly_summary');

// GET monthly summary for a specific employee
router.get('/monthly-summary/:employeeId/:year/:month', async (req, res) => {
    try {
        const { employeeId, year, month } = req.params;

        const docId = `${employeeId}_${year}_${month}`;
        const doc = await db.collection('monthly_attendance_summary').doc(docId).get();

        if (!doc.exists) {
            // Generate if doesn't exist
            const summary = await generateMonthlyAttendanceSummary(employeeId, parseInt(month), parseInt(year));
            return res.json(summary);
        }

        res.json(doc.data());
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST generate monthly summary for all employees
router.post('/generate-monthly-summary', async (req, res) => {
    try {
        const { month, year } = req.body;

        await generateMonthlySummaryForAll(month || new Date().getMonth() + 1, year || new Date().getFullYear());

        res.json({ message: 'Monthly summaries generated successfully' });
    } catch (error) {
        console.error('Error generating summaries:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET all monthly summaries for an employee
router.get('/monthly-summaries/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;

        const snapshot = await db.collection('monthly_attendance_summary')
            .where('employeeId', '==', employeeId)
            .orderBy('year', 'desc')
            .orderBy('month', 'desc')
            .get();

        const summaries = [];
        snapshot.forEach(doc => summaries.push(doc.data()));

        res.json(summaries);
    } catch (error) {
        console.error('Error fetching summaries:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
