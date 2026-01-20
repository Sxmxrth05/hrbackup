package com.example.hrhelpdesk.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.hrhelpdesk.data.ChatMessage
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Date
import java.util.UUID

class ChatViewModel : ViewModel() {
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    init {
        // Welcome message
        _messages.value = listOf(
            ChatMessage(
                id = UUID.randomUUID().toString(),
                message = "Hello! I'm your HR Policy Assistant. How can I help you today?",
                isUser = false
            )
        )
    }

    fun sendMessage(message: String) {
        if (message.isBlank()) return

        viewModelScope.launch {
            val userMessage = ChatMessage(
                id = UUID.randomUUID().toString(),
                message = message,
                isUser = true
            )
            _messages.value = _messages.value + userMessage

            // Simulate AI response
            delay(1000)
            val aiResponse = generateAIResponse(message)
            val botMessage = ChatMessage(
                id = UUID.randomUUID().toString(),
                message = aiResponse,
                isUser = false
            )
            _messages.value = _messages.value + botMessage
        }
    }

    private fun generateAIResponse(userMessage: String): String {
        val lowerMessage = userMessage.lowercase()
        return when {
            lowerMessage.contains("leave") || lowerMessage.contains("vacation") -> {
                "According to company policy, employees are entitled to:\n" +
                        "• Casual Leave: 12 days per year\n" +
                        "• Paid Leave: 15 days per year\n" +
                        "• Sick Leave: 10 days per year\n\n" +
                        "Leave requests must be submitted at least 3 days in advance for approval."
            }
            lowerMessage.contains("attendance") || lowerMessage.contains("punch") -> {
                "Attendance Policy:\n" +
                        "• Punch In: 9:00 AM - 10:00 AM\n" +
                        "• Punch Out: 6:00 PM - 7:00 PM\n" +
                        "• Location verification is required for both Punch In and Punch Out\n" +
                        "• Late arrivals may result in attendance deductions"
            }
            lowerMessage.contains("salary") || lowerMessage.contains("payroll") -> {
                "Payroll Information:\n" +
                        "• Salary is credited on the 1st of every month\n" +
                        "• Deductions are based on attendance and leave balance\n" +
                        "• Payslips are available in the Payroll section\n" +
                        "• For detailed queries, contact HR department"
            }
            lowerMessage.contains("policy") || lowerMessage.contains("rule") -> {
                "HR Policies:\n" +
                        "• Work Hours: 9 AM - 6 PM (Flexible timing available)\n" +
                        "• Dress Code: Business casual\n" +
                        "• Remote Work: Available with prior approval\n" +
                        "• Overtime: Compensated with extra pay or time off\n\n" +
                        "For specific policy details, please ask about the topic you need."
            }
            else -> {
                "I understand you're asking about: \"$userMessage\"\n\n" +
                        "Based on our HR policies, I can help you with:\n" +
                        "• Leave policies and applications\n" +
                        "• Attendance rules\n" +
                        "• Payroll and salary information\n" +
                        "• General HR policies\n\n" +
                        "Could you please be more specific about what you need?"
            }
        }
    }
}

