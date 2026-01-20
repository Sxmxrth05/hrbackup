import { supabase } from '../lib/supabase';
import { geoClient } from '../lib/httpClient';

// Fetch from geofencing service (mobile backend), sync to Supabase
async function getToday() {
  try {
    // Get today's attendance from mobile backend (Flask API)
    const geoData = await geoClient.get<any>('/api/attendance/today');

    // The mobile backend returns data already grouped by status
    const normalized = {
      present: geoData.present || [],
      absent: geoData.absent || [],
      late: geoData.late || [],
      not_punched: geoData.not_punched || [],
    };

    // Flatten all records for Supabase sync
    const allRecords = [
      ...normalized.present,
      ...normalized.absent,
      ...normalized.late,
      ...normalized.not_punched
    ];

    // Sync to Supabase for record-keeping (optional if Supabase is configured)
    if (allRecords.length > 0) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('attendance').upsert(
          allRecords.map(record => ({
            id: record.id,
            employee_id: record.employee_id || record.employeeId,
            date: today,
            status: record.status,
            check_in_time: record.check_in_time || record.checkIn,
            check_out_time: record.check_out_time || record.checkOut,
          }))
        );
      } catch (supabaseErr) {
        console.warn('Supabase sync failed (may not be configured):', supabaseErr);
        // Continue even if Supabase sync fails - mobile backend is the source of truth
      }
    }

    return normalized;
  } catch (err) {
    console.error('Error fetching from mobile backend API:', err);
    // Fallback: get today's attendance from Supabase if available
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('attendance').select('*').eq('date', today);
      if (error) throw error;

      const attendance = data || [];
      return {
        present: attendance.filter((a) => a.status === 'present'),
        absent: attendance.filter((a) => a.status === 'absent'),
        late: attendance.filter((a) => a.status === 'late'),
        not_punched: attendance.filter((a) => a.status === 'not_punched'),
      };
    } catch (fallbackErr) {
      console.error('Fallback to Supabase also failed:', fallbackErr);
      return { present: [], absent: [], late: [], not_punched: [] };
    }
  }
}

export const attendanceAdapter = {
  getToday,
};

