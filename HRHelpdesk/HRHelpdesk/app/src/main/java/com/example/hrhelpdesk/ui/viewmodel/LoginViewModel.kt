package com.example.hrhelpdesk.ui.viewmodel

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.hrhelpdesk.data.repository.AuthRepository
import com.example.hrhelpdesk.data.repository.AuthResult
import com.example.hrhelpdesk.util.SessionManager
import kotlinx.coroutines.launch

// Represents the state of the login screen
data class LoginUiState(
    val empId: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isAuthenticated: Boolean = false
)

/**
 * ViewModel for the Login screen with Firebase Authentication
 */
class LoginViewModel(
    application: Application,
    private val authRepository: AuthRepository
) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application)

    var uiState by mutableStateOf(LoginUiState())
        private set

    // Demo credentials hint for UI (Firebase format)
    val demoEmpId = "emp001@company.com"
    val demoPassword = "password123"

    /**
     * Updates the employee ID in the UI state.
     */
    fun onEmpIdChange(empId: String) {
        uiState = uiState.copy(empId = empId)
    }

    /**
     * Updates the password in the UI state.
     */
    fun onPasswordChange(password: String) {
        uiState = uiState.copy(password = password)
    }

    /**
     * Handles the login button press with Firebase Auth
     */
    fun onLoginClick() {
        if (uiState.isLoading) return

        uiState = uiState.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            when (val result = authRepository.login(uiState.empId, uiState.password)) {
                is AuthResult.Success -> {
                    // Convert empId to email (same logic as AuthRepository)
                    val email = if (uiState.empId.contains("@")) {
                        uiState.empId
                    } else {
                        "${uiState.empId}@company.com"
                    }
                    
                    // Save employee ID and email
                    sessionManager.saveEmployeeId(result.employeeId)
                    sessionManager.saveUserEmail(email) // Save actual email, not empId
                    sessionManager.setLoggedIn(true)
                    
                    uiState = uiState.copy(isLoading = false, isAuthenticated = true)
                }
                is AuthResult.Error -> {
                    uiState = uiState.copy(
                        isLoading = false,
                        errorMessage = result.message,
                        isAuthenticated = false
                    )
                }
            }
        }
    }

    /**
     * Resets the authentication state.
     */
    fun onNavigationDone() {
        uiState = uiState.copy(isAuthenticated = false)
    }

    /**
     * Clears an error message once it has been shown.
     */
    fun onErrorMessageShown() {
        uiState = uiState.copy(errorMessage = null)
    }
    
    /**
     * Logs the user out and clears session
     */
    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            sessionManager.clearSession()
            uiState = LoginUiState() // Reset the state
        }
    }
}
