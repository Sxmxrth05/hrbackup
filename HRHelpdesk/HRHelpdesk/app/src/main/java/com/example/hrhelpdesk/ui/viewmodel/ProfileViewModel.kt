package com.example.hrhelpdesk.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.hrhelpdesk.data.RetrofitClient
import com.example.hrhelpdesk.data.Employee
import com.example.hrhelpdesk.util.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ProfileViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application)

    /**
     * Fallback: Create employee from session data
     */
    private fun getEmployeeFromSession(): Employee {
        val email = sessionManager.getUserEmail() ?: "user@company.com"
        val employeeId = sessionManager.getEmployeeId() ?: "N/A"

        // Extract name from email (e.g., oliver.twist@company.com -> Oliver Twist)
        val nameParts = email.substringBefore("@").split(".", "-", "_")
        val name = nameParts.joinToString(" ") { 
            it.replaceFirstChar { char -> char.uppercase() } 
        }

        return Employee(
            id = "1",
            employeeId = employeeId,
            name = name,
            email = email,
            department = "N/A",
            profileImageUrl = null
        )
    }

    private val _employee = MutableStateFlow(getEmployeeFromSession())
    val employee: StateFlow<Employee> = _employee.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadEmployeeData()
    }

    /**
     * Load employee data from backend API based on logged-in user's email
     */
    private fun loadEmployeeData() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                
                // Get logged-in user's email from session
                val email = sessionManager.getUserEmail()
                
                if (email.isNullOrEmpty()) {
                    // Fallback to session data if no email
                    _employee.value = getEmployeeFromSession()
                    return@launch
                }
                
                // Fetch all employees from API
                val response = RetrofitClient.apiService.getEmployees()
                
                if (response.isSuccessful && response.body() != null) {
                    val employees = response.body()!!
                    
                    // Find employee matching logged-in email
                    val matchedEmployee = employees.find { it.email == email }
                    
                    if (matchedEmployee != null) {
                        _employee.value = matchedEmployee
                    } else {
                        // Fallback if not found in API
                        _employee.value = getEmployeeFromSession()
                    }
                } else {
                    // API failed, use session data
                    _employee.value = getEmployeeFromSession()
                }
                
            } catch (e: Exception) {
                e.printStackTrace()
                // On error, fallback to session data
                _employee.value = getEmployeeFromSession()
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Refresh employee data (call after login)
     */
    fun refreshEmployeeData() {
        loadEmployeeData()
    }

    /**
     * Update employee profile (for edit mode)
     */
    fun updateEmployee(name: String, email: String, department: String) {
        viewModelScope.launch {
            _employee.value = _employee.value.copy(
                name = name.trim(),
                email = email.trim(),
                department = department.trim()
            )
            // In production, you would save to backend/database here
        }
    }

    /**
     * Update profile image
     */
    fun updateProfileImage(imageUrl: String) {
        viewModelScope.launch {
            _employee.value = _employee.value.copy(profileImageUrl = imageUrl)
            // In production, you would upload and save the URL to the backend here
        }
    }
}
