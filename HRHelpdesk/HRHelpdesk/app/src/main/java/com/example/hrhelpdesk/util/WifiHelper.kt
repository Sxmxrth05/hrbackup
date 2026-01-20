package com.example.hrhelpdesk.util

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import androidx.core.app.ActivityCompat

/**
 * Helper class to get WiFi BSSID (MAC address) of connected network
 */
class WifiHelper(private val context: Context) {
    
    private val wifiManager: WifiManager =
        context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    
    /**
     * Get BSSID (MAC address) of currently connected WiFi network
     * Returns null if not connected to WiFi or permission not granted
     * 
     * Note: On Android 9+ (API 28+), location permission is required to access WiFi info
     */
    fun getConnectedBSSID(): String? {
        // Check WiFi state permission
        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_WIFI_STATE
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return null
        }
        
        // On Android 9+, we also need location permission to get WiFi info
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return null
            }
        }
        
        val wifiInfo = wifiManager.connectionInfo
        
        // BSSID is null when not connected to WiFi
        val bssid = wifiInfo?.bssid
        
        // Filter out dummy BSSID values
        return if (bssid != null && bssid != "02:00:00:00:00:00") {
            bssid
        } else {
            null
        }
    }
    
    /**
     * Check if device is connected to WiFi
     */
    fun isConnectedToWifi(): Boolean {
        val wifiInfo = wifiManager.connectionInfo
        return wifiInfo != null && wifiInfo.bssid != null && wifiInfo.bssid != "02:00:00:00:00:00"
    }
    
    /**
     * Get WiFi network SSID (name)
     */
    fun getConnectedSSID(): String? {
        val wifiInfo = wifiManager.connectionInfo
        return wifiInfo?.ssid?.replace("\"", "") // Remove quotes from SSID
    }
}
