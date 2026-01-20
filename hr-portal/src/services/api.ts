// Mock API Service Layer
// This layer simulates backend API responses and can be easily replaced with real API calls

import {
  Employee,
  AttendanceRecord,
  LeaveApplication,
  Payslip,
  Notification,
  HRAdmin,
  ApiResponse,
} from '@/types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fixed HR Admin credentials (would be in backend in production)
const HR_ADMIN_CREDENTIALS = {
  email: 'admin@company.com',
  password: 'admin123',
};

const HR_ADMIN_USER: HRAdmin = {
  id: '1',
  email: 'admin@company.com',
  name: 'HR Administrator',
  role: 'admin',
};

// ============ CLIENT APP NOTIFICATION API ============
// This is a placeholder for notifying the client mobile app
// In production, this would call an external push notification service or API

interface ClientNotificationPayload {
  type: 'leave_status' | 'payslip_status';
  employeeId: string;
  status: 'approved' | 'rejected';
  reason?: string;
  referenceId: string;
  timestamp: string;
}

export const clientAppApi = {
  /**
   * Notify the client mobile app about status changes
   * This is a placeholder that will be replaced with actual push notification service
   */
  async notifyClientApp(payload: ClientNotificationPayload): Promise<ApiResponse<null>> {
    await delay(200);

    // Log the notification for debugging purposes
    console.log('[CLIENT APP NOTIFICATION]', {
      ...payload,
      sentAt: new Date().toISOString(),
    });

    // In production, this would:
    // 1. Call a push notification service (Firebase, OneSignal, etc.)
    // 2. Or call an external API endpoint that the mobile app polls
    // 3. Or publish to a message queue that the mobile app subscribes to

    return {
      success: true,
      message: `Notification sent to client app for ${payload.type}`
    };
  },
};

// ============ AUTH API ============

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<HRAdmin>> {
    await delay(800);

    if (email === HR_ADMIN_CREDENTIALS.email && password === HR_ADMIN_CREDENTIALS.password) {
      return { success: true, data: HR_ADMIN_USER };
    }

    return { success: false, error: 'Invalid email or password' };
  },

  async logout(): Promise<ApiResponse<null>> {
    await delay(300);
    return { success: true };
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    await delay(800);

    if (email === HR_ADMIN_CREDENTIALS.email) {
      return { success: true, message: 'Password reset link sent to your email' };
    }

    return { success: false, error: 'Email not found in our system' };
  },
};

// ============ EMPLOYEES API ============

const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    phone: '+1 234 567 8901',
    department: 'Engineering',
    position: 'Senior Developer',
    status: 'active',
    joinDate: '2022-03-15',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 234 567 8902',
    department: 'Marketing',
    position: 'Marketing Manager',
    status: 'active',
    joinDate: '2021-08-20',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@company.com',
    phone: '+1 234 567 8903',
    department: 'Finance',
    position: 'Financial Analyst',
    status: 'active',
    joinDate: '2023-01-10',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@company.com',
    phone: '+1 234 567 8904',
    department: 'Human Resources',
    position: 'HR Specialist',
    status: 'active',
    joinDate: '2022-06-01',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@company.com',
    phone: '+1 234 567 8905',
    department: 'Engineering',
    position: 'Junior Developer',
    status: 'inactive',
    joinDate: '2023-04-15',
  },
  {
    id: '6',
    employeeId: 'EMP006',
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.martinez@company.com',
    phone: '+1 234 567 8906',
    department: 'Sales',
    position: 'Sales Representative',
    status: 'active',
    joinDate: '2023-02-01',
  },
  {
    id: '7',
    employeeId: 'EMP007',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@company.com',
    phone: '+1 234 567 8907',
    department: 'Operations',
    position: 'Operations Manager',
    status: 'active',
    joinDate: '2021-11-15',
  },
  {
    id: '8',
    employeeId: 'EMP008',
    firstName: 'Amanda',
    lastName: 'Anderson',
    email: 'amanda.anderson@company.com',
    phone: '+1 234 567 8908',
    department: 'Finance',
    position: 'Accountant',
    status: 'inactive',
    joinDate: '2022-09-01',
  },
];

export const employeesApi = {
  async getAll(): Promise<ApiResponse<Employee[]>> {
    try {
      const response = await fetch('http://localhost:5000/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return { success: false, error: 'Failed to load employees' };
    }
  },

  async create(employee: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });

      if (!response.ok) {
        throw new Error('Failed to create employee');
      }

      const result = await response.json();
      return { success: true, data: result.employee };
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: 'Failed to create employee' };
    }
  },

  async update(id: string, employee: Partial<Employee>): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });

      if (!response.ok) {
        throw new Error('Failed to update employee');
      }

      return { success: true, data: employee as Employee };
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, error: 'Failed to update employee' };
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting employee:', error);
      return { success: false, error: 'Failed to delete employee' };
    }
  },

  async deactivate(id: string): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' })
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate employee');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error deactivating employee:', error);
      return { success: false, error: 'Failed to deactivate employee' };
    }
  },

  getDepartments(): string[] {
    return ['Engineering', 'Marketing', 'Finance', 'Human Resources', 'Operations', 'Sales', 'Design'];
  },
};

// ============ ATTENDANCE API ============

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'present',
    department: 'Engineering',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Sarah Johnson',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:15',
    checkOut: '17:45',
    status: 'late',
    department: 'Marketing',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Michael Brown',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:55',
    checkOut: '18:10',
    status: 'present',
    department: 'Finance',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    employeeName: 'Emily Davis',
    date: new Date().toISOString().split('T')[0],
    status: 'absent',
    department: 'Human Resources',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    employeeName: 'David Wilson',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '13:00',
    status: 'half-day',
    department: 'Engineering',
  },
  {
    id: '6',
    employeeId: 'EMP006',
    employeeName: 'Jessica Martinez',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:45',
    checkOut: '17:30',
    status: 'present',
    department: 'Sales',
  },
  {
    id: '7',
    employeeId: 'EMP007',
    employeeName: 'Robert Taylor',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:30',
    checkOut: '18:30',
    status: 'late',
    department: 'Operations',
  },
];

export const attendanceApi = {
  async getToday(): Promise<ApiResponse<AttendanceRecord[]>> {
    try {
      // Fetch from Firebase backend
      const response = await fetch('http://localhost:5000/api/attendance/today', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform Firebase format to frontend format
      const formattedRecords: AttendanceRecord[] = data.map((record: any) => {
        // Convert UTC timestamp to local time (e.g., IST)
        const formatTime = (isoString: string | null) => {
          if (!isoString) return undefined;
          const date = new Date(isoString);
          // Use toLocaleTimeString to get local time in HH:MM format
          return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24-hour format
          });
        };

        // Map Firebase status to frontend status - PROPERLY HANDLE ALL CASES
        let status: AttendanceRecord['status'] = record.status; // Keep original by default

        // Normalize to lowercase for frontend compatibility
        const upperStatus = String(record.status).toUpperCase();
        if (upperStatus === 'PRESENT' || upperStatus === 'PUNCHED_OUT') {
          status = 'PRESENT';
        } else if (upperStatus === 'ABSENT' || upperStatus === 'INVALID_ATTENDANCE') {
          status = 'ABSENT';
        } else if (upperStatus === 'LATE') {
          status = 'LATE';
        } else if (upperStatus === 'HALF_DAY' || upperStatus === 'HALF-DAY') {
          status = 'HALF_DAY';
        }

        return {
          id: record.id,
          employeeId: record.employeeId,
          employeeName: record.employeeName || `Employee ${record.employeeId}`,
          date: record.date,
          checkIn: formatTime(record.punchInTime),
          checkOut: formatTime(record.punchOutTime),
          status: status,
          department: record.department || 'General',
          validation: record.validation, // Include validation data
        };
      });

      return { success: true, data: formattedRecords };
    } catch (error) {
      console.error('Error fetching attendance from Firebase:', error);
      // Fallback to mock data if backend is unavailable
      await delay(500);
      return { success: true, data: mockAttendance };
    }
  },
};



// ============ LEAVE APPLICATIONS API ============

const mockLeaves: LeaveApplication[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    department: 'Engineering',
    leaveType: 'annual',
    startDate: '2024-02-01',
    endDate: '2024-02-05',
    reason: 'Family vacation',
    status: 'pending',
    appliedAt: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Sarah Johnson',
    department: 'Marketing',
    leaveType: 'sick',
    startDate: '2024-01-25',
    endDate: '2024-01-26',
    reason: 'Not feeling well',
    status: 'approved',
    appliedAt: '2024-01-24T08:00:00Z',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Michael Brown',
    department: 'Finance',
    leaveType: 'personal',
    startDate: '2024-02-10',
    endDate: '2024-02-10',
    reason: 'Personal appointment',
    status: 'pending',
    appliedAt: '2024-01-22T14:15:00Z',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    employeeName: 'Emily Davis',
    department: 'Human Resources',
    leaveType: 'annual',
    startDate: '2024-03-01',
    endDate: '2024-03-07',
    reason: 'Planned vacation',
    status: 'rejected',
    appliedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: '5',
    employeeId: 'EMP006',
    employeeName: 'Jessica Martinez',
    department: 'Sales',
    leaveType: 'sick',
    startDate: '2024-02-15',
    endDate: '2024-02-16',
    reason: 'Medical appointment',
    status: 'pending',
    appliedAt: '2024-01-25T11:00:00Z',
  },
];

export const leavesApi = {
  async getAll(): Promise<ApiResponse<LeaveApplication[]>> {
    await delay(500);
    return { success: true, data: mockLeaves };
  },

  async approve(id: string, reason?: string): Promise<ApiResponse<LeaveApplication>> {
    await delay(600);
    const leave = mockLeaves.find(l => l.id === id);
    if (leave) {
      // Notify client mobile app about the approval
      await clientAppApi.notifyClientApp({
        type: 'leave_status',
        employeeId: leave.employeeId,
        status: 'approved',
        reason: reason,
        referenceId: id,
        timestamp: new Date().toISOString(),
      });

      return { success: true, data: { ...leave, status: 'approved' } };
    }
    return { success: false, error: 'Leave application not found' };
  },

  async reject(id: string, reason?: string): Promise<ApiResponse<LeaveApplication>> {
    await delay(600);
    const leave = mockLeaves.find(l => l.id === id);
    if (leave) {
      // Notify client mobile app about the rejection
      await clientAppApi.notifyClientApp({
        type: 'leave_status',
        employeeId: leave.employeeId,
        status: 'rejected',
        reason: reason || 'Request rejected by HR',
        referenceId: id,
        timestamp: new Date().toISOString(),
      });

      return { success: true, data: { ...leave, status: 'rejected' } };
    }
    return { success: false, error: 'Leave application not found' };
  },
};

// ============ PAYSLIPS API ============

const mockPayslips: Payslip[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    department: 'Engineering',
    month: 'January',
    year: 2024,
    basicSalary: 8500,
    allowances: 1500,
    deductions: 850,
    netSalary: 9150,
    status: 'pending',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Sarah Johnson',
    department: 'Marketing',
    month: 'January',
    year: 2024,
    basicSalary: 7500,
    allowances: 1200,
    deductions: 720,
    netSalary: 7980,
    status: 'approved',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Michael Brown',
    department: 'Finance',
    month: 'January',
    year: 2024,
    basicSalary: 7000,
    allowances: 1000,
    deductions: 680,
    netSalary: 7320,
    status: 'pending',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    employeeName: 'Emily Davis',
    department: 'Human Resources',
    month: 'January',
    year: 2024,
    basicSalary: 6500,
    allowances: 900,
    deductions: 620,
    netSalary: 6780,
    status: 'approved',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '5',
    employeeId: 'EMP006',
    employeeName: 'Jessica Martinez',
    department: 'Sales',
    month: 'January',
    year: 2024,
    basicSalary: 6000,
    allowances: 1100,
    deductions: 590,
    netSalary: 6510,
    status: 'pending',
    generatedAt: '2024-01-28T10:00:00Z',
  },
];

// ============ PAYROLL & PAYSLIPS API ============

export const payrollApi = {
  // Process monthly payroll
  async processPayroll(month?: number, year?: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('http://localhost:5000/api/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, initiatedBy: 'admin@company.com' })
      });

      if (!response.ok) throw new Error('Failed to process payroll');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Payroll processing error:', error);
      return { success: false, error: 'Failed to process payroll' };
    }
  },

  // Get payroll run status
  async getRunStatus(runId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll/status/${runId}`);
      if (!response.ok) throw new Error('Failed to fetch run status');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch status' };
    }
  },

  // Get all payroll runs
  async getRuns(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch('http://localhost:5000/api/payroll/runs');
      if (!response.ok) throw new Error('Failed to fetch runs');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch payroll runs' };
    }
  },

  // Get/Update payroll policies
  async getPolicies(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('http://localhost:5000/api/payroll/policies');
      if (!response.ok) throw new Error('Failed to fetch policies');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch policies' };
    }
  },

  async updatePolicies(policies: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('http://localhost:5000/api/payroll/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...policies, updatedBy: 'admin@company.com' })
      });

      if (!response.ok) throw new Error('Failed to update policies');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update policies' };
    }
  }
};

export const payslipsApi = {
  // Get all payslips with optional filters
  async getAll(filters?: { month?: number; year?: number; employeeId?: string; status?: string }): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.month) params.append('month', filters.month.toString());
      if (filters?.year) params.append('year', filters.year.toString());
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`http://localhost:5000/api/payroll/payslips?${params}`);
      if (!response.ok) throw new Error('Failed to fetch payslips');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Fetch payslips error:', error);
      return { success: false, error: 'Failed to load payslips' };
    }
  },

  // Get single payslip
  async getById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll/payslips/${id}`);
      if (!response.ok) throw new Error('Failed to fetch payslip');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch payslip' };
    }
  },

  // Download payslip PDF
  async downloadPdf(id: string, payslipData: any): Promise<void> {
    try {
      // Use the pdfUrl from the payslip data
      if (payslipData.pdfUrl) {
        const url = payslipData.pdfUrl.startsWith('http')
          ? payslipData.pdfUrl
          : `http://localhost:5000${payslipData.pdfUrl}`;
        window.open(url, '_blank');
      } else {
        throw new Error('PDF URL not available');
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Mark payslip as sent (after notification)
  async markAsSent(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`http://localhost:5000/api/payroll/payslips/${id}/mark-sent`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to mark as sent');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update status' };
    }
  },

  // Legacy methods for compatibility (can be removed later)
  async approve(id: string, reason?: string): Promise<ApiResponse<any>> {
    // For now, just mark as sent
    return this.markAsSent(id);
  },

  async reject(id: string, reason?: string): Promise<ApiResponse<any>> {
    // This would need backend support for rejection workflow
    return { success: true, message: 'Rejection feature coming soon' };
  }
};

// ============ NOTIFICATIONS API ============

// Track read notification IDs in memory (persists during session)
let readNotificationIds: Set<string> = new Set();

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'leave',
    title: 'New Leave Application',
    message: 'John Smith has applied for annual leave (Feb 1-5)',
    redirectPath: '/leave-applications',
    isRead: false,
    createdAt: '2024-01-28T10:30:00Z',
  },
  {
    id: '2',
    type: 'attendance',
    title: 'Missed Attendance',
    message: 'Emily Davis was marked absent today',
    redirectPath: '/attendance',
    isRead: false,
    createdAt: '2024-01-28T09:00:00Z',
  },
  {
    id: '3',
    type: 'payslip',
    title: 'Payslips Generated',
    message: 'January 2024 payslips are ready for approval',
    redirectPath: '/payslips',
    isRead: false,
    createdAt: '2024-01-28T08:00:00Z',
  },
  {
    id: '4',
    type: 'leave',
    title: 'Leave Application Updated',
    message: 'Michael Brown has applied for personal leave',
    redirectPath: '/leave-applications',
    isRead: false,
    createdAt: '2024-01-27T14:15:00Z',
  },
  {
    id: '5',
    type: 'employee',
    title: 'New Employee Onboarded',
    message: 'David Wilson has joined the Engineering team',
    redirectPath: '/employees',
    isRead: false,
    createdAt: '2024-01-26T11:00:00Z',
  },
];

export const notificationsApi = {
  async getAll(): Promise<ApiResponse<Notification[]>> {
    await delay(400);
    // Filter out read notifications and mark status based on readNotificationIds
    const unreadNotifications = mockNotifications
      .filter(n => !readNotificationIds.has(n.id))
      .map(n => ({ ...n, isRead: false }));
    return { success: true, data: unreadNotifications };
  },

  async getUnreadCount(): Promise<ApiResponse<number>> {
    await delay(200);
    const count = mockNotifications.filter(n => !readNotificationIds.has(n.id)).length;
    return { success: true, data: count };
  },

  async markAsRead(ids: string[]): Promise<ApiResponse<null>> {
    await delay(300);
    // Add to read set - these will no longer appear
    ids.forEach(id => readNotificationIds.add(id));
    return { success: true };
  },

  async markAllAsRead(): Promise<ApiResponse<null>> {
    await delay(300);
    // Mark all as read
    mockNotifications.forEach(n => readNotificationIds.add(n.id));
    return { success: true };
  },
};
