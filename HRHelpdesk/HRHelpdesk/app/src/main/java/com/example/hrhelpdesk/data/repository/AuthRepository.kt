package com.example.hrhelpdesk.data.repository

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

// A simple data class to represent the result of an authentication attempt
sealed class AuthResult {
    data class Success(val token: String, val employeeId: String) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

/**
 * Repository for Firebase Authentication
 * Handles user login/logout using Firebase Auth
 */
class AuthRepository {

    private val firebaseAuth = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()

    /**
     * Login with email and password using Firebase Authentication
     *
     * @param email The user's email (format: emp001@company.com)
     * @param password The password
     * @return AuthResult indicating success or failure
     */
    suspend fun login(empId: String, password: String): AuthResult {
        return try {
            // Treat empId as email for Firebase Auth
            // User should enter: emp001@company.com
            val email = if (empId.contains("@")) empId else "$empId@company.com"
            
            // Sign in with Firebase
            val authResult = firebaseAuth.signInWithEmailAndPassword(email, password).await()
            
            // Get UID token
            val user = authResult.user
            if (user != null) {
                val token = user.uid
                
                // Fetch employee ID from Firestore
                val employeeId = fetchEmployeeIdFromFirestore(email)
                
                Log.d("AuthRepository", "Logged in as $email with employee ID: $employeeId")
                AuthResult.Success(token, employeeId)
            } else {
                AuthResult.Error("Authentication failed")
            }
        } catch (e: FirebaseAuthException) {
            AuthResult.Error(e.localizedMessage ?: "Invalid email or password")
        } catch (e: Exception) {
            AuthResult.Error(e.localizedMessage ?: "Login failed")
        }
    }

    /**
     * Logout from Firebase
     */
    suspend fun logout() {
        firebaseAuth.signOut()
    }
    
    /**
     * Get current user's UID if logged in
     */
    fun getCurrentUserId(): String? {
        return firebaseAuth.currentUser?.uid
    }
    
    /**
     * Check if user is currently logged in
     */
    fun isUserLoggedIn(): Boolean {
        return firebaseAuth.currentUser != null
    }
    
    /**
     * Fetch employee ID from Firestore employees collection using email
     */
    private suspend fun fetchEmployeeIdFromFirestore(email: String): String {
        return try {
            val snapshot = firestore.collection("employees")
                .whereEqualTo("email", email)
                .limit(1)
                .get()
                .await()
            
            if (!snapshot.isEmpty) {
                val doc = snapshot.documents[0]
                // Try different field names: emp_id, employee_id, employeeId
                val empId = doc.getString("emp_id") 
                    ?: doc.getString("employee_id")
                    ?: doc.getString("employeeId")
                
                empId?.uppercase() ?: extractEmployeeIdFromEmail(email)
            } else {
                // Fallback to email extraction if not found in Firestore
                Log.w("AuthRepository", "Employee not found in Firestore for $email, using email extraction")
                extractEmployeeIdFromEmail(email)
            }
        } catch (e: Exception) {
            Log.e("AuthRepository", "Error fetching employee from Firestore", e)
            extractEmployeeIdFromEmail(email)
        }
    }
    
    /**
     * Extract employee ID from email (fallback method)
     * Format: emp001@company.com → EMP001
     */
    private fun extractEmployeeIdFromEmail(email: String): String {
        val regex = Regex("emp(\\d+)@", RegexOption.IGNORE_CASE)
        val matchResult = regex.find(email)
        return matchResult?.groups?.get(1)?.value?.let { "EMP$it".uppercase() } 
            ?: "EMP001" // fallback
    }
}
