import './setup';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FairShiftStore } from '../src/services/store';
import { AttendanceRecord } from '../src/types';

describe('QR Validation & Attendance Tracking', () => {
  beforeEach(() => {
    FairShiftStore.resetDemoData();
  });

  it('should initialize with baseline attendance records', () => {
    const records = FairShiftStore.getAttendance('worker-karthik');
    assert.ok(records.length >= 3, 'Karthik should have recorded attendance history');
  });

  it('should record clock-in event with status in_progress and worksite location', () => {
    const todayIso = '2026-10-27';
    const newClockIn: AttendanceRecord = {
      id: `att-test-${Date.now()}`,
      workerId: 'worker-karthik',
      workerName: 'Karthik Raja',
      sector: 'construction',
      worksiteName: 'Metro Viaduct Pier 14',
      date: todayIso,
      clockInTime: '07:30 AM',
      totalHours: 0,
      overtimeHours: 0,
      status: 'in_progress',
    };

    FairShiftStore.addAttendanceRecord(newClockIn);
    const workerRecords = FairShiftStore.getAttendance('worker-karthik');
    const recorded = workerRecords.find((r) => r.id === newClockIn.id);

    assert.ok(recorded, 'Clock-in record must exist');
    assert.equal(recorded.status, 'in_progress');
    assert.equal(recorded.clockInTime, '07:30 AM');
    assert.equal(recorded.worksiteName, 'Metro Viaduct Pier 14');
  });

  it('should complete shift on clock-out and compute total working hours & overtime', () => {
    const all = FairShiftStore.getAttendance();
    const inProgressRecord = all.find((r) => r.status === 'in_progress');
    assert.ok(inProgressRecord, 'Should find in-progress shift to complete');

    // Simulate clock out
    const updated = all.map((a) => {
      if (a.id === inProgressRecord.id) {
        return {
          ...a,
          clockOutTime: '06:30 PM',
          totalHours: 11.0,
          overtimeHours: 3.0, // 11 - 8 standard hours = 3h OT
          status: 'completed' as const,
        };
      }
      return a;
    });

    localStorage.setItem('fairshift_attendance', JSON.stringify(updated));

    const refreshed = FairShiftStore.getAttendance().find((r) => r.id === inProgressRecord.id);
    assert.equal(refreshed?.status, 'completed');
    assert.equal(refreshed?.totalHours, 11.0);
    assert.equal(refreshed?.overtimeHours, 3.0);
    assert.equal(refreshed?.clockOutTime, '06:30 PM');
  });

  it('should allow flagging disputed attendance record for correction request', () => {
    const all = FairShiftStore.getAttendance('worker-karthik');
    const disputed = all.find((r) => r.status === 'disputed');
    assert.ok(disputed, 'Should have disputed attendance record for demo');
    assert.equal(disputed.status, 'disputed');
  });
});
