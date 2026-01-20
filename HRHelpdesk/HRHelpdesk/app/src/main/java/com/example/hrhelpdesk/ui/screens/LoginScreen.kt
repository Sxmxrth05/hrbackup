package com.example.hrhelpdesk.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.hrhelpdesk.ui.navigation.Screen
import com.example.hrhelpdesk.ui.viewmodel.LoginViewModel

/**
 * A composable screen for user login.
 *
 * @param navController The NavController for navigation.
 * @param loginViewModel The ViewModel for the login screen.
 */
@Composable
fun LoginScreen(
    navController: NavController,
    loginViewModel: LoginViewModel
) {
    val uiState = loginViewModel.uiState

    // Navigate to the home screen if authentication is successful
    if (uiState.isAuthenticated) {
        LaunchedEffect(Unit) {
            navController.navigate(Screen.Home.route) {
                // Prevent going back to the login screen
                popUpTo(Screen.Login.route) { inclusive = true }
            }
            loginViewModel.onNavigationDone()
        }
    }

    // Show an error popup if there's an error message
    uiState.errorMessage?.let {
        AlertDialog(onDismissRequest = { loginViewModel.onErrorMessageShown() },
            title = { Text("Login Failed") },
            text = { Text(it) },
            confirmButton = { TextButton(onClick = { loginViewModel.onErrorMessageShown() }) { Text("OK") } })
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "HR Helpdesk Login",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Sign in to continue",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Employee ID input field
                OutlinedTextField(value = uiState.empId,
                    onValueChange = { loginViewModel.onEmpIdChange(it) },
                    label = { Text("Employee ID") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true)

                Spacer(modifier = Modifier.height(16.dp))

                // Password input field
                OutlinedTextField(value = uiState.password,
                    onValueChange = { loginViewModel.onPasswordChange(it) },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password))

                Spacer(modifier = Modifier.height(24.dp))

                // Login button
                Button(
                    onClick = { loginViewModel.onLoginClick() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    enabled = !uiState.isLoading
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text("Login", fontSize = 16.sp)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

//                // Demo credentials
//                Text(
//                    text = "For testing:",
//                    style = MaterialTheme.typography.bodySmall,
//                    color = Color.Gray
//                )
//                Text(
//                    text = "Emp ID: ${loginViewModel.demoEmpId}",
//                    style = MaterialTheme.typography.bodySmall,
//                    color = Color.Gray
//                )
//                Text(
//                    text = "Password: ${loginViewModel.demoPassword}",
//                    style = MaterialTheme.typography.bodySmall,
//                    color = Color.Gray
//                )
            }
        }
    }
}
