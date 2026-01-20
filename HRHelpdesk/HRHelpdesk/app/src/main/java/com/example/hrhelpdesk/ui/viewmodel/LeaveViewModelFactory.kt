package com.example.hrhelpdesk.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.hrhelpdesk.data.repository.LeaveRepository

class LeaveViewModelFactory(private val leaveRepository: LeaveRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(LeaveViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return LeaveViewModel(leaveRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
