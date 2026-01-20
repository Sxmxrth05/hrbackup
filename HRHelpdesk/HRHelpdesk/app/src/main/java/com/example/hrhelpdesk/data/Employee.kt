package com.example.hrhelpdesk.data

data class Employee(
    val id: String,
    val employeeId: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val name: String,
    val email: String,
    val phone: String? = null,
    val department: String,
    val position: String? = null,
    val status: String? = "active",
    val joinDate: String? = null,
    val profileImageUrl: String? = null
)
