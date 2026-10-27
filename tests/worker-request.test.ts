import './setup';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FairShiftStore } from '../src/services/store';
import { WorkerRequestItem, RequestCategory } from '../src/types';

describe('Worker Request Flow', () => {
  beforeEach(() => {
    FairShiftStore.resetDemoData();
  });

  it('should initialize with pre-seeded demo requests', () => {
    const requests = FairShiftStore.getRequests();
    assert.ok(requests.length >= 3, 'Should have initial demo requests');
    assert.ok(requests.some((r) => r.refNumber === 'REQ-2026-8491'), 'Should contain REQ-2026-8491');
  });

  it('should create a valid worker request with reference number format REQ-2026-XXXX', () => {
    const nowIso = new Date().toISOString();
    const uniqueRef = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest: WorkerRequestItem = {
      id: `req-test-${Date.now()}`,
      refNumber: uniqueRef,
      workerId: 'worker-karthik',
      workerName: 'Karthik Raja',
      sector: 'construction',
      category: 'missed_clock_in_out',
      title: 'Scanner failure at North Gate Pier 14',
      description: 'The QR scanner froze at 18:30 PM. Foreman was present.',
      originalLanguage: 'en',
      relevantDate: '2026-10-27',
      status: 'submitted',
      urgency: 'normal',
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          timestamp: nowIso,
          actor: 'Karthik Raja (Worker)',
          action: 'Request submitted.',
        },
      ],
    };

    FairShiftStore.addRequest(newRequest);
    const all = FairShiftStore.getRequests();
    const created = all.find((r) => r.id === newRequest.id);

    assert.ok(created, 'Created request should be found in store');
    assert.match(created.refNumber, /^REQ-2026-\d{4}$/, 'Ref number should match REQ-2026-XXXX');
    assert.equal(created.status, 'submitted');
    assert.equal(created.category, 'missed_clock_in_out');
  });

  it('should support all 11 official request categories', () => {
    const categories: RequestCategory[] = [
      'missed_clock_in_out',
      'incorrect_attendance_hours',
      'missing_incorrect_salary',
      'incorrect_overtime',
      'missing_payslip',
      'incorrect_deduction_allowance',
      'leave_shift_correction',
      'profile_info_correction',
      'missing_training_skill',
      'workplace_safety_issue',
      'other_request',
    ];

    assert.equal(categories.length, 11, 'Must support exactly 11 categories');

    categories.forEach((cat, idx) => {
      const req: WorkerRequestItem = {
        id: `req-cat-${idx}`,
        refNumber: `REQ-2026-${1000 + idx}`,
        workerId: 'worker-test',
        workerName: 'Test Worker',
        sector: 'construction',
        category: cat,
        title: `Test request for ${cat}`,
        description: `Details for category ${cat}`,
        originalLanguage: 'ta',
        relevantDate: '2026-10-27',
        status: 'submitted',
        urgency: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [],
      };
      FairShiftStore.addRequest(req);
    });

    const all = FairShiftStore.getRequests();
    categories.forEach((cat) => {
      const exists = all.some((r) => r.category === cat);
      assert.ok(exists, `Category ${cat} must be persisted successfully`);
    });
  });

  it('should support offline queueing when offline and preserve draft state', () => {
    const nowIso = new Date().toISOString();
    const offlineItem = {
      id: 'req-offline-01',
      refNumber: 'REQ-2026-9999',
      workerId: 'worker-karthik',
      workerName: 'Karthik Raja',
      sector: 'construction' as const,
      category: 'incorrect_overtime' as const,
      title: 'Overtime calculation disputed while offline',
      description: 'Logged 4h overtime on concrete pour.',
      originalLanguage: 'en',
      relevantDate: '2026-10-27',
      status: 'waiting_to_send' as const,
      urgency: 'urgent' as const,
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [],
    };

    // Add to offline queue
    FairShiftStore.addToOfflineQueue({
      id: offlineItem.id,
      type: 'request',
      createdAt: nowIso,
      status: 'saved_locally',
      data: offlineItem,
      retryCount: 0,
    });

    const queue = FairShiftStore.getOfflineQueue();
    assert.equal(queue.length, 1, 'Offline queue should contain 1 item');
    assert.equal(queue[0].status, 'saved_locally');
    assert.equal(queue[0].data.title, offlineItem.title);

    // Prevent duplicate queue entries
    FairShiftStore.addToOfflineQueue({
      id: offlineItem.id,
      type: 'request',
      createdAt: nowIso,
      status: 'saved_locally',
      data: offlineItem,
      retryCount: 0,
    });
    assert.equal(FairShiftStore.getOfflineQueue().length, 1, 'Duplicate ID should not be added twice');

    // Remove after simulated sync
    FairShiftStore.removeFromOfflineQueue(offlineItem.id);
    assert.equal(FairShiftStore.getOfflineQueue().length, 0, 'Queue should be empty after sync');
  });
});
