package com.example.hrhelpdesk.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.hrhelpdesk.data.repository.AuthRepository
import com.example.hrhelpdesk.data.repository.LeaveRepository
import com.example.hrhelpdesk.ui.screens.*
import com.example.hrhelpdesk.ui.viewmodel.*

sealed class Screen(
    val route: String,
    val title: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    object Login : Screen("login", "Login", Icons.Default.Lock)
    object Home : Screen("home", "Home", Icons.Default.Home)
    object Leave : Screen("leave", "Leave", Icons.Default.CalendarToday)
    object Payroll : Screen("payroll", "Payroll", Icons.Default.AccountBalance)
    object PayrollDetail : Screen("payroll_detail/{payrollId}", "Payroll Detail", Icons.Default.Receipt)
    object Policy : Screen("policy", "Policy", Icons.Default.Chat)
    object Profile : Screen("profile", "Profile", Icons.Default.Person)
}

@Composable
fun MainNavigation(
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    
    val context = androidx.compose.ui.platform.LocalContext.current

    val authRepository = AuthRepository()
    val loginViewModel: LoginViewModel = viewModel(
        factory = ViewModelFactory(context.applicationContext as android.app.Application, authRepository)
    )

    val leaveRepository = LeaveRepository()
    val leaveViewModel: LeaveViewModel = viewModel(factory = LeaveViewModelFactory(leaveRepository))

    // HomeViewModel extends AndroidViewModel, so it needs Application context
    val homeViewModel: HomeViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
    val profileViewModel: ProfileViewModel = androidx.lifecycle.viewmodel.compose.viewModel()

    val showBottomBar = currentDestination?.route != Screen.Login.route
    var showLogoutDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Confirm Logout") },
            text = { Text("Are you sure you want to log out?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        loginViewModel.logout()
                        navController.navigate(Screen.Login.route) {
                            popUpTo(navController.graph.id) { inclusive = true }
                        }
                        showLogoutDialog = false
                    }
                ) { Text("Logout") }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) { Text("Cancel") }
            }
        )
    }

    Scaffold(
        modifier = modifier,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 8.dp
                ) {
                    listOf(
                        Screen.Home,
                        Screen.Leave,
                        Screen.Payroll,
                        Screen.Policy,
                        Screen.Profile
                    ).forEach { screen ->
                        val isSelected =
                            currentDestination?.hierarchy?.any { it.route == screen.route } == true
                        NavigationBarItem(
                            icon = {
                                Icon(
                                    screen.icon,
                                    contentDescription = screen.title,
                                    tint = if (isSelected)
                                        MaterialTheme.colorScheme.primary
                                    else
                                        MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            },
                            label = { Text(screen.title, style = MaterialTheme.typography.labelSmall) },
                            selected = isSelected,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Login.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Login.route) {
                LoginScreen(navController = navController, loginViewModel = loginViewModel)
            }
            composable(Screen.Home.route) { 
                HomeScreen(
                    homeViewModel = homeViewModel, 
                    profileViewModel = profileViewModel, 
                    leaveViewModel = leaveViewModel,
                    navController = navController
                ) 
            }
            composable(Screen.Leave.route) { LeaveScreen(viewModel = leaveViewModel) }
            composable(Screen.Payroll.route) { PayrollScreen(navController = navController) }
            composable(
                route = Screen.PayrollDetail.route,
                arguments = listOf(navArgument("payrollId") { type = NavType.StringType })
            ) { backStackEntry ->
                val payrollId = backStackEntry.arguments?.getString("payrollId")
                if (payrollId != null) {
                    PayrollDetailScreen(payrollId = payrollId)
                }
            }
            composable(Screen.Policy.route) { ChatScreen() }
            composable(Screen.Profile.route) { ProfileScreen(onLogout = { showLogoutDialog = true }, viewModel = profileViewModel) }
        }
    }
}
