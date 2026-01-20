package com.example.hrhelpdesk

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import com.example.hrhelpdesk.ui.navigation.MainNavigation
import com.example.hrhelpdesk.ui.theme.HRHelpdeskTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HRHelpdeskTheme {
                // Request location permissions for attendance tracking
                val permissionRequester = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestMultiplePermissions(),
                    onResult = { permissions ->
                        val fineLocationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
                        val coarseLocationGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
                        
                        if (fineLocationGranted || coarseLocationGranted) {
                            // Location permission granted - attendance can work
                        } else {
                            // Handle permission denial - inform user attendance won't work
                        }
                    }
                )

                LaunchedEffect(Unit) {
                    // Request location permissions for geofencing and WiFi BSSID access
                    permissionRequester.launch(arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    ))
                }

                MainNavigation(modifier = Modifier.fillMaxSize())
            }
        }
    }
}