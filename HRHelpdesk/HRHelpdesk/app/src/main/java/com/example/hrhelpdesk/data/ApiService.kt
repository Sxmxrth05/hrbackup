package com.example.hrhelpdesk.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * Retrofit API Service for Attendance Backend
 */
interface ApiService {
    
    @POST("/api/attendance/punch-in")
    suspend fun punchIn(@Body request: PunchInRequest): Response<PunchResponse>
    
    @POST("/api/attendance/punch-out")
    suspend fun punchOut(@Body request: PunchOutRequest): Response<PunchResponse>
    
    @GET("/api/config/office")
    suspend fun getOfficeConfig(): Response<OfficeConfig>
    
    @GET("/api/employees")
    suspend fun getEmployees(): Response<List<Employee>>
}

// Request/Response Data Classes

data class PunchInRequest(
    val employeeId: String,
    val location: Location,
    val wifiBSSID: String
)

data class PunchOutRequest(
    val employeeId: String
)

data class Location(
    val latitude: Double,
    val longitude: Double
)

data class PunchResponse(
    val id: String? = null,
    val message: String,
    val validation: Validation? = null,
    val error: String? = null,
    val recordId: String? = null
)

data class Validation(
    val wifi: Boolean,
    val geo: Boolean,
    val distance_meters: Int,
    val message: String
)

data class OfficeConfig(
    val lat: Double,
    val lng: Double,
    val radius: Int,
    val bssid: String,
    val officeName: String? = null
)
