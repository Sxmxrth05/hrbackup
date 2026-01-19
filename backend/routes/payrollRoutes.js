const express = require("express");
const router = express.Router();
const { db } = require("../firebaseConfig");
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// LOCAL STORAGE - No Firebase Storage needed! (Free solution)
const PAYSLIPS_DIR = path.join(__dirname, '../../payslips');

// Ensure payslips directory exists
(async () => {
    try {
        await fs.mkdir(PAYSLIPS_DIR, { recursive: true });
        console.log('✅ Payslips directory ready:', PAYSLIPS_DIR);
    } catch (err) {
        console.error('Error creating payslips directory:', err);
    }
})();

// Helper: Execute Python payroll script
async function runPayrollScript(options = {}) {
    return new Promise((resolve, reject) => {
        const args = ['payroll_system.py', '--json'];

        if (options.month) args.push('--month', options.month.toString());
        if (options.year) args.push('--year', options.year.toString());
        if (options.employeeId) args.push('--employee', options.employeeId);
        if (options.outputDir) args.push('--output', options.outputDir);

        console.log(`🐍 Running Python script: python ${args.join(' ')}`);

        const python = spawn('python', args, {
            cwd: path.join(__dirname, '../../'),
            env: process.env
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log(`[Python]`, data.toString().trim());
        });

        python.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}\n${stderr}`));
            } else {
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse Python output: ${e.message}\n${stdout}`));
                }
            }
        });

        python.on('error', (err) => {
            reject(new Error(`Failed to start Python: ${err.message}`));
        });
    });
}

// Helper: Get PDF URL (local server URL)
function getLocalPdfUrl(pdfFilename) {
    return `http://localhost:5000/payslips/${pdfFilename}`;
}

// POST /api/payroll/process - Process payroll for a month
router.post("/process", async (req, res) => {
    try {
        const { month, year, employeeId } = req.body;
        const now = new Date();
        const processMonth = month || now.getMonth() + 1;
        const processYear = year || now.getFullYear();

        console.log(`💰 Starting payroll processing for ${processMonth}/${processYear}`);

        // Create payroll run record
        const runId = `run_${processYear}_${String(processMonth).padStart(2, '0')}`;
        const runRef = db.collection('payroll_runs').doc(runId);

        await runRef.set({
            month: new Date(processYear, processMonth - 1).toLocaleString('default', { month: 'long' }) + ` ${processYear}`,
            year: processYear,
            monthNumber: processMonth,
            status: 'processing',
            initiatedBy: req.body.initiatedBy || 'system',
            initiatedAt: new Date().toISOString(),
            totalEmployees: 0,
            processedEmployees: 0,
            failedEmployees: 0,
            totalPayroll: 0,
            errors: []
        });

        // Run Python payroll script
        const result = await runPayrollScript({
            month: processMonth,
            year: processYear,
            employeeId: employeeId,
            outputDir: 'payslips'
        });

        if (!result.success) {
            await runRef.update({
                status: 'failed',
                errors: [result.error],
                completedAt: new Date().toISOString()
            });
            return res.status(500).json({ error: result.error });
        }

        // Process each payslip
        const payslipsData = [];
        let totalPayroll = 0;

        for (const payroll of result.results) {
            try {
                // Generate local URL for PDF
                const pdfUrl = getLocalPdfUrl(payroll.pdf_filename);

                // Create payslip record
                const payslipId = `payslip_${payroll.emp_id}_${processYear}_${String(processMonth).padStart(2, '0')}`;
                const payslipData = {
                    employeeId: payroll.emp_id,
                    employeeName: payroll.name,
                    runId: runId,
                    month: result.month,
                    year: processYear,
                    monthNumber: processMonth,
                    status: 'generated',

                    // Attendance data
                    presentDays: payroll.present_days,
                    lateDays: payroll.late_days,
                    halfDays: payroll.half_days,
                    totalHoursWorked: payroll.total_hours_worked,
                    lopDays: payroll.lop_days,
                    payableDays: payroll.payable_days,

                    // Earnings
                    earnings: {
                        basic: payroll.basic_da,
                        hra: payroll.hra,
                        otherAllowances: payroll.other_allow,
                        gross: payroll.gross,
                        leaveEncashment: payroll.encashment
                    },

                    // Deductions
                    deductions: {
                        pf: payroll.pf,
                        esi: payroll.esi,
                        pt: payroll.pt,
                        tds: payroll.tds,
                        total: payroll.total_deductions
                    },

                    netPay: payroll.net_pay,

                    // File storage (LOCAL - no cloud needed!)
                    pdfUrl: pdfUrl,
                    pdfPath: payroll.pdf_path,
                    pdfFilename: payroll.pdf_filename,

                    // Timestamps
                    generatedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                await db.collection('payslips').doc(payslipId).set(payslipData);
                payslipsData.push({ id: payslipId, ...payslipData });
                totalPayroll += payroll.net_pay;

                console.log(`✅ Created payslip for ${payroll.name}`);

            } catch (error) {
                console.error(`❌ Error processing payslip for ${payroll.emp_id}:`, error);
                result.errors.push({
                    emp_id: payroll.emp_id,
                    name: payroll.name,
                    error: error.message
                });
            }
        }

        // Update run record
        await runRef.update({
            status: result.errors.length > 0 && result.errors.length === result.total_employees ? 'failed' : 'completed',
            completedAt: new Date().toISOString(),
            totalEmployees: result.total_employees,
            processedEmployees: result.processed,
            failedEmployees: result.failed,
            totalPayroll: Math.round(totalPayroll),
            errors: result.errors
        });

        console.log(`✅ Payroll processing complete: ${result.processed}/${result.total_employees}`);

        res.json({
            success: true,
            runId: runId,
            processed: result.processed,
            failed: result.failed,
            totalPayroll: totalPayroll,
            payslips: payslipsData
        });

    } catch (error) {
        console.error("Payroll processing error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payroll/status/:runId - Get payroll run status
router.get("/status/:runId", async (req, res) => {
    try {
        const runDoc = await db.collection('payroll_runs').doc(req.params.runId).get();

        if (!runDoc.exists) {
            return res.status(404).json({ error: "Payroll run not found" });
        }

        res.json({ id: runDoc.id, ...runDoc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payroll/runs - Get all payroll runs
router.get("/runs", async (req, res) => {
    try {
        const snapshot = await db.collection('payroll_runs')
            .orderBy('initiatedAt', 'desc')
            .limit(50)
            .get();

        const runs = [];
        snapshot.forEach(doc => {
            runs.push({ id: doc.id, ...doc.data() });
        });

        res.json(runs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payroll/policies - Get current policies
router.get("/policies", async (req, res) => {
    try {
        const doc = await db.collection('payroll_policies').doc('current_policy').get();

        if (!doc.exists) {
            // Return defaults
            return res.json({
                pfRate: 0.12,
                pfCap: 1800,
                esiEmployeeRate: 0.0075,
                esiThreshold: 21000,
                ptAmount: 200,
                leaveEncashment: false,
                encashMaxDays: 10
            });
        }

        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/payroll/policies - Update policies
router.put("/policies", async (req, res) => {
    try {
        const policies = {
            pfRate: parseFloat(req.body.pfRate) || 0.12,
            pfCap: parseFloat(req.body.pfCap) || 1800,
            esiEmployeeRate: parseFloat(req.body.esiEmployeeRate) || 0.0075,
            esiThreshold: parseFloat(req.body.esiThreshold) || 21000,
            ptAmount: parseFloat(req.body.ptAmount) || 200,
            leaveEncashment: req.body.leaveEncashment || false,
            encashMaxDays: parseInt(req.body.encashMaxDays) || 10,
            updatedBy: req.body.updatedBy || 'admin',
            updatedAt: new Date().toISOString()
        };

        await db.collection('payroll_policies').doc('current_policy').set(policies);

        console.log('✅ Payroll policies updated');
        res.json({ message: "Policies updated successfully", policies });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payroll/payslips - Get all payslips (with filters)
router.get("/payslips", async (req, res) => {
    try {
        let query = db.collection('payslips');

        // Apply filters
        if (req.query.month) {
            query = query.where('monthNumber', '==', parseInt(req.query.month));
        }
        if (req.query.year) {
            query = query.where('year', '==', parseInt(req.query.year));
        }
        if (req.query.employeeId) {
            query = query.where('employeeId', '==', req.query.employeeId);
        }
        if (req.query.status) {
            query = query.where('status', '==', req.query.status);
        }

        query = query.orderBy('generatedAt', 'desc').limit(100);

        const snapshot = await query.get();
        const payslips = [];

        snapshot.forEach(doc => {
            payslips.push({ id: doc.id, ...doc.data() });
        });

        res.json(payslips);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/payroll/payslips/:id - Get single payslip
router.get("/payslips/:id", async (req, res) => {
    try {
        const doc = await db.collection('payslips').doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Payslip not found" });
        }

        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/payroll/payslips/:id/mark-sent - Mark payslip as sent
router.post("/payslips/:id/mark-sent", async (req, res) => {
    try {
        await db.collection('payslips').doc(req.params.id).update({
            status: 'sent',
            sentAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        res.json({ message: "Payslip marked as sent" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
