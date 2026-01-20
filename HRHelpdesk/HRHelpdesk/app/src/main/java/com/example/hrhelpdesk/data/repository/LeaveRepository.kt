package com.example.hrhelpdesk.data.repository

import com.example.hrhelpdesk.data.LeaveRequest
import com.example.hrhelpdesk.data.LeaveStatus
import com.example.hrhelpdesk.data.LeaveType
import kotlinx.coroutines.delay
import java.util.Date
import java.util.UUID

/**
 * A repository to manage leave requests.
 * This is a simulation of a remote backend.
 */
class LeaveRepository {

    // In-memory database to store leave requests for all users.
    // The key is the user ID.
    private val leaveDatabase = mutableMapOf<String, MutableList<LeaveRequest>>()

    /**
     * Fetches all leave requests for a given user.
     *
     * @param userId The ID of the user whose leave requests are to be fetched.
     * @return A list of [LeaveRequest] objects.
     */
    suspend fun getLeaveRequestsForUser(userId: String): List<LeaveRequest> {
        // Simulate network delay
        delay(1000)
        return leaveDatabase.getOrDefault(userId, mutableListOf())
    }

    /**
     * Creates a new leave request for a given user.
     *
     * @param userId The ID of the user creating the request.
     * @param leaveType The type of leave.
     * @param startDate The start date of the leave.
     * @param endDate The end date of the leave.
     * @param reason The reason for the leave.
     * @return The newly created [LeaveRequest].
     */
    suspend fun createLeaveRequest(
        userId: String,
        leaveType: LeaveType,
        startDate: Date,
        endDate: Date,
        reason: String
    ): LeaveRequest {
        // Simulate network delay
        delay(500)

        val newRequest = LeaveRequest(
            id = UUID.randomUUID().toString(),
            leaveType = leaveType,
            startDate = startDate,
            endDate = endDate,
            reason = reason,
            status = LeaveStatus.PENDING,
            submittedDate = Date()
        )

        if (!leaveDatabase.containsKey(userId)) {
            leaveDatabase[userId] = mutableListOf()
        }
        leaveDatabase[userId]?.add(newRequest)

        return newRequest
    }
}
