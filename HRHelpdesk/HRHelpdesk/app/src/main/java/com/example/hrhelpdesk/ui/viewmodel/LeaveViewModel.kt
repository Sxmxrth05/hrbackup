package com.example.hrhelpdesk.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.hrhelpdesk.data.LeaveRequest
import com.example.hrhelpdesk.data.LeaveType
import com.example.hrhelpdesk.data.repository.LeaveRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Date

data class LeaveUiState(
    val leaveRequests: List<LeaveRequest> = emptyList(),
    val isLoading: Boolean = false
)

class LeaveViewModel(private val leaveRepository: LeaveRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(LeaveUiState())
    val uiState: StateFlow<LeaveUiState> = _uiState.asStateFlow()

    // Hardcoded user ID for demonstration purposes
    private val userId = "test_user"

    // Total leaves
    val casualTotal = 12
    val paidTotal = 20

    val casualLeavesUsed: StateFlow<Int> = uiState.map { state ->
        state.leaveRequests.count { it.leaveType == LeaveType.CASUAL }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 0
    )

    val paidLeavesUsed: StateFlow<Int> = uiState.map { state ->
        state.leaveRequests.count { it.leaveType == LeaveType.PAID }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 0
    )

    init {
        loadLeaveRequests()
    }

    private fun loadLeaveRequests() {
        _uiState.value = _uiState.value.copy(isLoading = true)
        viewModelScope.launch {
            val requests = leaveRepository.getLeaveRequestsForUser(userId)
            _uiState.value = _uiState.value.copy(leaveRequests = requests, isLoading = false)
        }
    }

    fun createLeaveRequest(leaveType: LeaveType, startDate: Date, endDate: Date, reason: String) {
        viewModelScope.launch {
            leaveRepository.createLeaveRequest(userId, leaveType, startDate, endDate, reason)
            // Refresh the list after creating a new request
            loadLeaveRequests()
        }
    }
}
