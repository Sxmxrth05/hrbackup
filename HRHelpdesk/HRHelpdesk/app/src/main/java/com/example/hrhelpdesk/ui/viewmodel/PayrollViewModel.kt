package com.example.hrhelpdesk.ui.viewmodel

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.hrhelpdesk.data.Employee
import com.example.hrhelpdesk.data.Payroll
import com.example.hrhelpdesk.util.PdfGenerator
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

data class DownloadResult(
    val success: Boolean,
    val message: String,
    val fileUri: Uri? = null
)

class PayrollViewModel : ViewModel() {

    private val _payrolls = MutableStateFlow<List<Payroll>>(emptyList())
    val payrolls: Flow<List<Payroll>> = _payrolls

    private val _downloadResult = MutableStateFlow<DownloadResult?>(null)
    val downloadResult = _downloadResult.asStateFlow()

    init {
        _payrolls.value = listOf(
            Payroll("1", 1, "2024", 50000.0, 5000.0, 2000.0, 53000.0, 22, 22),
            Payroll("2", 2, "2024", 50000.0, 5000.0, 2000.0, 53000.0, 20, 20),
            Payroll("3", 3, "2024", 51000.0, 5000.0, 2100.0, 53900.0, 21, 23),
        )
    }

    fun getPayrollById(id: String): Flow<Payroll?> {
        return payrolls.map { payrolls ->
            payrolls.find { it.id == id }
        }
    }

    fun downloadPayslip(context: Context, payrollId: String, employee: Employee) {
        viewModelScope.launch {
            val payroll = _payrolls.value.find { it.id == payrollId }
            if (payroll == null) {
                _downloadResult.value = DownloadResult(false, "Payroll not found", null)
                return@launch
            }

            val file = PdfGenerator.generatePdf(context, payroll, employee)

            if (file != null) {
                val uri = androidx.core.content.FileProvider.getUriForFile(
                    context,
                    context.packageName + ".provider",
                    file
                )
                _downloadResult.value = DownloadResult(true, "Payslip downloaded successfully", uri)
            } else {
                _downloadResult.value = DownloadResult(false, "Failed to download payslip", null)
            }
        }
    }

    fun onDownloadResultConsumed() {
        _downloadResult.value = null
    }
}
