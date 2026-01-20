package com.example.hrhelpdesk.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.hrhelpdesk.data.AttendanceStatus
import com.example.hrhelpdesk.data.ChatMessage
import com.example.hrhelpdesk.data.Employee
import com.example.hrhelpdesk.data.LeaveRequest
import com.example.hrhelpdesk.data.LeaveStatus
import com.example.hrhelpdesk.data.LeaveType
import com.example.hrhelpdesk.data.Payroll
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.Date
import java.util.UUID

class AppViewModel : ViewModel() {

    // Sample employee data
    private val _employee = MutableStateFlow(
        Employee(
            id = "1",
            name = "John Doe",
            email = "john.doe@company.com",
            department = "Engineering",
            employeeId = "EMP001"
        )
    )
    val employee: StateFlow<Employee> = _employee.asStateFlow()

    // Attendance status
    private val _attendanceStatus = MutableStateFlow(
        AttendanceStatus(
            isActive = false,
            gpsVerified = true,
            wifiVerified = true,
            isWithinGeofence = true
        )
    )
    val attendanceStatus: StateFlow<AttendanceStatus> = _attendanceStatus.asStateFlow()

    // Leave requests
    private val _leaveRequests = MutableStateFlow<List<LeaveRequest>>(emptyList())
    val leaveRequests: StateFlow<List<LeaveRequest>> = _leaveRequests.asStateFlow()

    // Payroll data
    private val _payrolls = MutableStateFlow<List<Payroll>>(
        listOf(
            Payroll(
                id = "1",
                month = Calendar.getInstance().get(Calendar.MONTH) + 1,
                year = Calendar.getInstance().get(Calendar.YEAR).toString(),
                basicSalary = 60000.0,
                allowances = 15000.0,
                netSalary = 75000.0,
                deductions = 2500.0,
                attendanceDays = 22,
                totalDays = 23
            ),
            Payroll(
                id = "2",
                month = {
                    val cal = Calendar.getInstance()
                    cal.add(Calendar.MONTH, -1)
                    cal.get(Calendar.MONTH) + 1
                }(),
                year = {
                    val cal = Calendar.getInstance()
                    cal.add(Calendar.MONTH, -1)
                    cal.get(Calendar.YEAR).toString()
                }(),
                basicSalary = 62500.0,
                allowances = 15000.0,
                netSalary = 77500.0,
                deductions = 0.0,
                attendanceDays = 20,
                totalDays = 22
            )
        )
    )
    val payrolls: StateFlow<List<Payroll>> = _payrolls.asStateFlow()

    // Chat messages
    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    fun punchIn() {
        viewModelScope.launch {
            _attendanceStatus.value = AttendanceStatus(
                isActive = true,
                punchInTime = Date(),
                gpsVerified = true,
                wifiVerified = true,
                isWithinGeofence = true
            )
        }
    }

    fun punchOut() {
        viewModelScope.launch {
            _attendanceStatus.value = AttendanceStatus(
                isActive = false,
                punchInTime = _attendanceStatus.value.punchInTime,
                punchOutTime = Date(),
                gpsVerified = true,
                wifiVerified = true,
                isWithinGeofence = true
            )
        }
    }

    fun submitLeaveRequest(leaveType: LeaveType, startDate: Date, endDate: Date, reason: String) {
        viewModelScope.launch {
            val newRequest = LeaveRequest(
                id = UUID.randomUUID().toString(),
                leaveType = leaveType,
                startDate = startDate,
                endDate = endDate,
                reason = reason,
                status = LeaveStatus.PENDING,
                submittedDate = Date()
            )
            _leaveRequests.value = _leaveRequests.value + newRequest
        }
    }

    fun sendChatMessage(message: String) {
        viewModelScope.launch {
            val userMessage = ChatMessage(
                id = UUID.randomUUID().toString(),
                message = message,
                isUser = true
            )
            _chatMessages.value = _chatMessages.value + userMessage

            // Simulate AI response
            val aiResponse = generateAIResponse(message)
            val aiMessage = ChatMessage(
                id = UUID.randomUUID().toString(),
                message = aiResponse,
                isUser = false
            )
            _chatMessages.value = _chatMessages.value + aiMessage
        }
    }

    private fun generateAIResponse(userMessage: String): String {
        val lowerMessage = userMessage.lowercase()
        return when {
            lowerMessage.contains("leave") && lowerMessage.contains("casual") -> {
                "Casual leave allows employees to take up to 12 days per year. " +
                "It requires prior approval from your manager. You can apply through the Leave screen."
            }
            lowerMessage.contains("leave") && lowerMessage.contains("paid") -> {
                "Paid leave includes your annual vacation days. " +
                "You have 20 paid leave days per year. Unused days can be carried forward up to 5 days."
            }
            lowerMessage.contains("attendance") -> {
                "Attendance is tracked through punch in/out system. " +
                "You must be within the office geofence and have GPS/Wi-Fi verification enabled. " +
                "Late arrivals after 10:00 AM are marked as half-day."
            }
            lowerMessage.contains("salary") || lowerMessage.contains("payroll") -> {
                "Your salary is processed on the 1st of every month. " +
                "Deductions may apply for late arrivals or absences. " +
                "You can view your payslip in the Payroll section."
            }
            else -> {
                "I'm here to help with HR policies. You can ask me about leave policies, " +
                "attendance rules, payroll, or any other HR-related questions."
            }
        }
    }

    init {
        // Initialize leave requests
        _leaveRequests.value = listOf(
            LeaveRequest(
                id = "1",
                leaveType = LeaveType.CASUAL,
                startDate = getDateDaysAgo(5),
                endDate = getDateDaysAgo(3),
                reason = "Family event",
                status = LeaveStatus.APPROVED,
                submittedDate = getDateDaysAgo(7)
            ),
            LeaveRequest(
                id = "2",
                leaveType = LeaveType.PAID,
                startDate = getDateDaysFromNow(10),
                endDate = getDateDaysFromNow(12),
                reason = "Vacation",
                status = LeaveStatus.PENDING,
                submittedDate = getDateDaysAgo(1)
            ),
            LeaveRequest(
                id = "3",
                leaveType = LeaveType.SICK,
                startDate = getDateDaysAgo(15),
                endDate = getDateDaysAgo(15),
                reason = "Medical appointment",
                status = LeaveStatus.REJECTED,
                submittedDate = getDateDaysAgo(16)
            )
        )
    }

    // Helper functions for date manipulation
    private fun getDateDaysAgo(days: Int): Date {
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_MONTH, -days)
        return calendar.time
    }

    private fun getDateDaysFromNow(days: Int): Date {
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_MONTH, days)
        return calendar.time
    }
}
