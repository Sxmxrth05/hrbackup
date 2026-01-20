package com.example.hrhelpdesk.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.hrhelpdesk.data.LeaveRequest
import com.example.hrhelpdesk.data.LeaveStatus
import com.example.hrhelpdesk.data.LeaveType
import com.example.hrhelpdesk.ui.viewmodel.LeaveViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveScreen(
    viewModel: LeaveViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var showForm by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = androidx.compose.ui.graphics.Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.1f),
                        MaterialTheme.colorScheme.surface
                    )
                )
            )
    ) {
        // Header with gradient
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = androidx.compose.ui.graphics.Brush.horizontalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.primary,
                            MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                )
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Leave Requests",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Text(
                        text = "Manage your time off",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                    )
                }
                FloatingActionButton(
                    onClick = { showForm = true },
                    containerColor = MaterialTheme.colorScheme.onPrimary,
                    contentColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "New Request"
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (showForm) {
            LeaveRequestForm(
                onSubmit = { leaveType, startDate, endDate, reason ->
                    viewModel.createLeaveRequest(leaveType, startDate, endDate, reason)
                    showForm = false
                },
                onCancel = { showForm = false }
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(uiState.leaveRequests) { request ->
                    LeaveRequestCard(request)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveRequestForm(
    onSubmit: (LeaveType, Date, Date, String) -> Unit,
    onCancel: () -> Unit
) {
    var selectedLeaveType by remember { mutableStateOf(LeaveType.CASUAL) }
    var startDate by remember { mutableStateOf<Date?>(null) }
    var endDate by remember { mutableStateOf<Date?>(null) }
    var reason by remember { mutableStateOf("") }
    var showStartDatePicker by remember { mutableStateOf(false) }
    var showEndDatePicker by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "New Leave Request",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            // Leave Type Dropdown
            var expanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = selectedLeaveType.name,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Leave Type") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    LeaveType.values().forEach { type ->
                        DropdownMenuItem(
                            text = { Text(type.name) },
                            onClick = {
                                selectedLeaveType = type
                                expanded = false
                            }
                        )
                    }
                }
            }

            // Date Pickers
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Start Date Field with overlay to ensure clickability
                Box(modifier = Modifier.weight(1f)) {
                    OutlinedTextField(
                        value = startDate?.let { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(it) } ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Start Date") },
                        leadingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    // Transparent overlay to catch clicks
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable { showStartDatePicker = true }
                    )
                }

                // End Date Field with overlay
                Box(modifier = Modifier.weight(1f)) {
                    OutlinedTextField(
                        value = endDate?.let { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(it) } ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("End Date") },
                        leadingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .clickable { showEndDatePicker = true }
                    )
                }
            }

            // Reason Input
            OutlinedTextField(
                value = reason,
                onValueChange = { reason = it },
                label = { Text("Reason") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5
            )

            // Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onCancel,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Cancel")
                }
                Button(
                    onClick = {
                        if (startDate != null && endDate != null && reason.isNotBlank()) {
                            onSubmit(selectedLeaveType, startDate!!, endDate!!, reason)
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = startDate != null && endDate != null && reason.isNotBlank()
                ) {
                    Text("Submit")
                }
            }
        }
    }

    // Date Pickers
    if (showStartDatePicker) {
        CalendarDatePickerDialog(
            title = "Select Start Date",
            minDate = getTodayDate(),
            onDateSelected = { date ->
                startDate = date
                if (endDate != null && endDate!!.before(date)) {
                    endDate = null
                }
                showStartDatePicker = false
            },
            onDismiss = { showStartDatePicker = false }
        )
    }

    if (showEndDatePicker) {
        CalendarDatePickerDialog(
            title = "Select End Date",
            minDate = startDate ?: getTodayDate(),
            onDateSelected = { date ->
                endDate = date
                showEndDatePicker = false
            },
            onDismiss = { showEndDatePicker = false }
        )
    }
}

@Composable
fun CalendarDatePickerDialog(
    title: String,
    minDate: Date,
    onDateSelected: (Date) -> Unit,
    onDismiss: () -> Unit
) {
    val today = Calendar.getInstance()
    val minCalendar = Calendar.getInstance().apply { time = minDate }

    var selectedYear by remember { mutableStateOf(minCalendar.get(Calendar.YEAR)) }
    var selectedMonth by remember { mutableStateOf(minCalendar.get(Calendar.MONTH)) }
    var selectedDay by remember { mutableStateOf(minCalendar.get(Calendar.DAY_OF_MONTH)) }

    val calendar = remember(selectedYear, selectedMonth) {
        Calendar.getInstance().apply {
            set(selectedYear, selectedMonth, 1)
        }
    }
    val maxDaysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)

    // Calculate valid day range based on minDate
    val minDay = remember(selectedYear, selectedMonth, minCalendar) {
        if (selectedYear == minCalendar.get(Calendar.YEAR) &&
            selectedMonth == minCalendar.get(Calendar.MONTH)) {
            minCalendar.get(Calendar.DAY_OF_MONTH)
        } else {
            1
        }
    }

    LaunchedEffect(selectedYear, selectedMonth) {
        if (selectedDay < minDay) {
            selectedDay = minDay
        } else if (selectedDay > maxDaysInMonth) {
            selectedDay = maxDaysInMonth
        }
    }

    val selectedDate = remember(selectedYear, selectedMonth, selectedDay) {
        Calendar.getInstance().apply {
            set(selectedYear, selectedMonth, selectedDay)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.time
    }

    val isDateValid = remember(selectedDate, minDate) {
        !selectedDate.before(minDate)
    }

    val weekDays = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(title, style = MaterialTheme.typography.titleLarge)
                Text(
                    SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(selectedDate),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Month/Year Navigation
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = {
                        if (selectedMonth > 0) {
                            selectedMonth--
                        } else {
                            selectedMonth = 11
                            selectedYear--
                        }
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Previous Month")
                    }

                    Text(
                        "${SimpleDateFormat("MMM", Locale.getDefault()).format(selectedDate)} $selectedYear",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    IconButton(onClick = {
                        if (selectedMonth < 11) {
                            selectedMonth++
                        } else {
                            selectedMonth = 0
                            selectedYear++
                        }
                    }) {
                        Icon(Icons.Default.ArrowForward, contentDescription = "Next Month")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Week day headers
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    weekDays.forEach { day ->
                        Text(
                            text = day,
                            style = MaterialTheme.typography.labelSmall,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Calendar days grid
                val firstDayOfMonth = Calendar.getInstance().apply {
                    set(selectedYear, selectedMonth, 1)
                }.get(Calendar.DAY_OF_WEEK)

                val firstDayOffset = (firstDayOfMonth - Calendar.SUNDAY + 7) % 7
                val weeks = mutableListOf<List<Int>>()
                var currentWeek = mutableListOf<Int>()

                repeat(firstDayOffset) { currentWeek.add(0) }

                for (day in 1..maxDaysInMonth) {
                    currentWeek.add(day)
                    if (currentWeek.size == 7) {
                        weeks.add(currentWeek.toList())
                        currentWeek = mutableListOf()
                    }
                }

                if (currentWeek.isNotEmpty()) {
                    while (currentWeek.size < 7) {
                        currentWeek.add(0)
                    }
                    weeks.add(currentWeek)
                }

                weeks.forEach { week ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        week.forEach { day ->
                            val isDayInPast = if (day == 0) true else {
                                val cal = Calendar.getInstance().apply {
                                    set(selectedYear, selectedMonth, day)
                                    set(Calendar.HOUR_OF_DAY, 0)
                                    set(Calendar.MINUTE, 0)
                                    set(Calendar.SECOND, 0)
                                    set(Calendar.MILLISECOND, 0)
                                }
                                cal.time.before(minDate)
                            }

                            val isSelected = day == selectedDay && day != 0

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .aspectRatio(1f)
                                    .padding(2.dp)
                                    .then(
                                        if (day != 0 && !isDayInPast) {
                                            Modifier.clickable { selectedDay = day }
                                        } else Modifier
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                if (day != 0) {
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = when {
                                            isSelected -> MaterialTheme.colorScheme.primary
                                            isDayInPast -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                                            else -> Color.Transparent
                                        },
                                        modifier = Modifier.fillMaxSize()
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                text = "$day",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = when {
                                                    isSelected -> MaterialTheme.colorScheme.onPrimary
                                                    isDayInPast -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                                                    else -> MaterialTheme.colorScheme.onSurface
                                                },
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onDateSelected(selectedDate) },
                enabled = isDateValid
            ) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

fun getTodayDate(): Date {
    val calendar = Calendar.getInstance()
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    return calendar.time
}

@Composable
fun LeaveRequestCard(request: LeaveRequest) {
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
    val statusColor = when (request.status) {
        LeaveStatus.PENDING -> Color(0xFFFF9800)
        LeaveStatus.APPROVED -> Color(0xFF4CAF50)
        LeaveStatus.REJECTED -> Color(0xFFF44336)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = statusColor.copy(alpha = 0.15f),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.CalendarToday,
                                contentDescription = null,
                                tint = statusColor,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    Column {
                        Text(
                            text = request.leaveType.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${dateFormat.format(request.startDate)} - ${dateFormat.format(request.endDate)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Surface(
                    color = statusColor.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = request.status.name,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                        color = statusColor,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Divider(color = MaterialTheme.colorScheme.surfaceVariant)

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = request.reason,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
