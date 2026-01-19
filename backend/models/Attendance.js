const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  employeeId: String,
  punchInTime: Date,
  punchOutTime: Date,
  location: {
    latitude: Number,
    longitude: Number
  },
  wifiBSSID: String,
  validation: {
    wifi: Boolean,
    geo: Boolean,
    message: String
  },
  status: String
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
