package com.example.hrhelpdesk.navigation

sealed class Screen(val route: String, val title: String) {
    object Home : Screen("home", "Home")
    object Leave : Screen("leave", "Leave")
    object Payroll : Screen("payroll", "Payroll")
    object Policy : Screen("policy", "Policy")
    object Profile : Screen("profile", "Profile")
}

