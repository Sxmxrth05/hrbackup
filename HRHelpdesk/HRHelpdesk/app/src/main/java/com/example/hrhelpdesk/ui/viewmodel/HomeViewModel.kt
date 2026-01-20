package com.example.hrhelpdesk.ui.viewmodel

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.hrhelpdesk.data.AttendanceStatus
import com.example.hrhelpdesk.data.PunchInRequest
import com.example.hrhelpdesk.data.PunchOutRequest
import com.example.hrhelpdesk.data.RetrofitClient
import com.example.hrhelpdesk.util.LocationHelper
import com.example.hrhelpdesk.util.WifiHelper
import com.example.hrhelpdesk.util.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

class HomeViewModel(application: Application) : AndroidViewModel(application) {
    
    private val locationHelper = LocationHelper(application)
    private val wifiHelper = WifiHelper(application)
    private val sessionManager = SessionManager(application)
    private val apiService = RetrofitClient.apiService
    
    private val _attendanceStatus = MutableStateFlow(
        AttendanceStatus(
            isActive = false,
            gpsVerified = false,
            wifiVerified = false,
            isWithinGeofence = true
        )
    )
    val attendanceStatus: StateFlow<AttendanceStatus> = _attendanceStatus.asStateFlow()
    
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        checkLocationAndWifi()
    }

    /**
     * Check location and WiFi permissions/status
     */
    fun checkLocationAndWifi() {
        viewModelScope.launch {
            val hasLocation = locationHelper.hasLocationPermission()
            val hasWifi = wifiHelper.isConnectedToWifi()
            
            _attendanceStatus.value = _attendanceStatus.value.copy(
                gpsVerified = hasLocation,
                wifiVerified = hasWifi
            )
        }
    }

    /**
     * Punch In - Call backend API with location and WiFi data
     */
    fun punchIn() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _errorMessage.value = null
                
                Log.d("HomeViewModel", "🔄 Starting punch-in process...")
                
                // Get current location
                val location = locationHelper.getCurrentLocation()
                if (location == null) {
                    _errorMessage.value = "Unable to get GPS location. Please enable location services."
                    Log.e("HomeViewModel", "❌ GPS location unavailable")
                    _isLoading.value = false
                    return@launch
                }
                
                Log.d("HomeViewModel", "📍 Location: ${location.latitude}, ${location.longitude}")
                
                // Get WiFi BSSID
                val wifiBssid = wifiHelper.getConnectedBSSID()
                if (wifiBssid == null) {
                    _errorMessage.value = "Not connected to WiFi. Please connect to office WiFi."
                    Log.e("HomeViewModel", "❌ WiFi BSSID unavailable")
                    _isLoading.value = false
                    return@launch
                }
                
                Log.d("HomeViewModel", "📶 WiFi BSSID: $wifiBssid")
                
                // Get employee ID from session
                val employeeId = sessionManager.getEmployeeId()
                if (employeeId == null) {
                    _errorMessage.value = "Employee ID not found. Please login again."
                    Log.e("HomeViewModel", "❌ Employee ID not found in session")
                    _isLoading.value = false
                    return@launch
                }
                
                Log.d("HomeViewModel", "👤 Employee ID: $employeeId")
                
                // Create request
                val request = PunchInRequest(
                    employeeId = employeeId,
                    location = com.example.hrhelpdesk.data.Location(
                        latitude = location.latitude,
                        longitude = location.longitude
                    ),
                    wifiBSSID = wifiBssid
                )
                
                Log.d("HomeViewModel", "📤 Sending punch-in request to backend...")
                
                // Call API
                val response = apiService.punchIn(request)
                
                if (response.isSuccessful) {
                    val body = response.body()
                    Log.d("HomeViewModel", "✅ Punch-in successful: ${body?.message}")
                    
                    // Update UI state
                    _attendanceStatus.value = AttendanceStatus(
                        isActive = true,
                        punchInTime = Date(),
                        gpsVerified = body?.validation?.geo ?: true,
                        wifiVerified = body?.validation?.wifi ?: true,
                        isWithinGeofence = body?.validation?.geo ?: true
                    )
                    
                    _errorMessage.value = body?.message
                } else {
                    val errorBody = response.errorBody()?.string()
                    Log.e("HomeViewModel", "❌ Punch-in failed: $errorBody")
                    _errorMessage.value = "Punch-in failed: ${response.message()}"
                }
                
            } catch (e: Exception) {
                Log.e("HomeViewModel", "❌ Exception during punch-in", e)
                _errorMessage.value = "Error: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Punch Out - Call backend API
     */
    fun punchOut() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _errorMessage.value = null
                
                Log.d("HomeViewModel", "🔄 Starting punch-out process...")
                
                // Get employee ID from session
                val employeeId = sessionManager.getEmployeeId()
                if (employeeId == null) {
                    _errorMessage.value = "Employee ID not found. Please login again."
                    Log.e("HomeViewModel", "❌ Employee ID not found in session")
                    _isLoading.value = false
                    return@launch
                }
                
                val request = PunchOutRequest(employeeId = employeeId)
                
                Log.d("HomeViewModel", "📤 Sending punch-out request to backend...")
                
                // Call API
                val response = apiService.punchOut(request)
                
                if (response.isSuccessful) {
                    val body = response.body()
                    Log.d("HomeViewModel", "✅ Punch-out successful: ${body?.message}")
                    
                    // Update UI state
                    val currentInTime = _attendanceStatus.value.punchInTime
                    _attendanceStatus.value = AttendanceStatus(
                        isActive = false,
                        punchInTime = currentInTime,
                        punchOutTime = Date(),
                        gpsVerified = true,
                        wifiVerified = true,
                        isWithinGeofence = true
                    )
                    
                    _errorMessage.value = body?.message
                } else {
                    val errorBody = response.errorBody()?.string()
                    Log.e("HomeViewModel", "❌ Punch-out failed: $errorBody")
                    _errorMessage.value = "Punch-out failed: ${response.message()}"
                }
                
            } catch (e: Exception) {
                Log.e("HomeViewModel", "❌ Exception during punch-out", e)
                _errorMessage.value = "Error: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
