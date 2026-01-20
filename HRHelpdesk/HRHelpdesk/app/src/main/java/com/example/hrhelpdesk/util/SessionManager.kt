package com.example.hrhelpdesk.util

import android.content.Context
import android.content.SharedPreferences

/**
 * Helper class to manage user session data using SharedPreferences
 */
class SessionManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREF_NAME,
        Context.MODE_PRIVATE
    )
    
    companion object {
        private const val PREF_NAME = "HRHelpdeskSession"
        private const val KEY_EMPLOYEE_ID = "employee_id"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
    }
    
    /**
     * Save employee ID after successful login
     */
    fun saveEmployeeId(employeeId: String) {
        prefs.edit().putString(KEY_EMPLOYEE_ID, employeeId).apply()
    }
    
    /**
     * Get saved employee ID
     */
    fun getEmployeeId(): String? {
        return prefs.getString(KEY_EMPLOYEE_ID, null)
    }
    
    /**
     * Save user email
     */
    fun saveUserEmail(email: String) {
        prefs.edit().putString(KEY_USER_EMAIL, email).apply()
    }
    
    /**
     * Get saved user email
     */
    fun getUserEmail(): String? {
        return prefs.getString(KEY_USER_EMAIL, null)
    }
    
    /**
     * Mark user as logged in
     */
    fun setLoggedIn(isLoggedIn: Boolean) {
        prefs.edit().putBoolean(KEY_IS_LOGGED_IN, isLoggedIn).apply()
    }
    
    /**
     * Check if user is logged in
     */
    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }
    
    /**
     * Clear all session data (logout)
     */
    fun clearSession() {
        prefs.edit().clear().apply()
    }
    
    /**
     * Extract employee ID from email
     * Format: emp001@company.com → EMP001
     */
    fun extractEmployeeIdFromEmail(email: String): String? {
        val regex = Regex("emp(\\d+)@", RegexOption.IGNORE_CASE)
        val matchResult = regex.find(email)
        return matchResult?.groups?.get(1)?.value?.let { "EMP$it".uppercase() }
    }
}
