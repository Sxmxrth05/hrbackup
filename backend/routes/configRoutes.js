const express = require("express");
const router = express.Router();
const { db } = require("../firebaseConfig");

// GET Office Config
router.get("/office", async (req, res) => {
    try {
        const snapshot = await db.collection('office_config').limit(1).get();
        if (snapshot.empty) {
            // Return defaults if not found
            return res.json({
                lat: 12.9716,
                lng: 77.5946,
                radius: 100,
                bssid: "AA:BB:CC:DD:EE:FF",
                workingHours: 8,
                officeStartTime: "09:00"
            });
        }
        const data = snapshot.docs[0].data();
        // Ensure working hours and start time have defaults
        res.json({
            ...data,
            workingHours: data.workingHours || 8,
            officeStartTime: data.officeStartTime || "09:00"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE Office Config
router.post("/office", async (req, res) => {
    try {
        const { lat, lng, radius, bssid, workingHours, officeStartTime } = req.body;

        console.log('🏢 Updating office configuration:', { lat, lng, radius, bssid, workingHours, officeStartTime });

        // We only want 1 config doc, so we check if it exists or use a fixed ID
        const configRef = db.collection('office_config').doc('main_office');

        await configRef.set({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius: parseInt(radius),
            bssid,
            workingHours: parseInt(workingHours) || 8,
            officeStartTime: officeStartTime || "09:00",
            updatedAt: new Date().toISOString()
        });

        console.log('✅ Office configuration updated successfully');
        res.json({ message: "Office configuration updated" });
    } catch (error) {
        console.error('❌ Error updating office config:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
