require("dotenv").config();
const express = require("express");
const cors = require("cors");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");

const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Serve payslip PDFs as static files (local storage - FREE!)
app.use('/payslips', express.static(path.join(__dirname, '../payslips')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/config", require("./routes/configRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/monthly-attendance", require("./routes/monthlyAttendanceRoutes"));

app.get("/", (req, res) => {
  res.send("Attendance Backend (Firebase) Running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Firebase Backend running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
});
