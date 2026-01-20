package com.example.hrhelpdesk.data

data class Payroll(
    val id: String,
    val month: Int, // Changed to Int
    val year: String,
    val basicSalary: Double,
    val allowances: Double,
    val deductions: Double,
    val netSalary: Double,
    val attendanceDays: Int, // Added
    val totalDays: Int // Added
)
