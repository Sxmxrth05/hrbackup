const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "hr-helpdesk-3a332.appspot.com"
});

const db = admin.firestore();

module.exports = { admin, db };
