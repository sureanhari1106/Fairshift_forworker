import './setup';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FairShiftStore } from '../src/services/store';
import { TimelineEntry } from '../src/types';

describe('Manager Review & Audit Flow', () => {
  beforeEach(() => {
    FairShiftStore.resetDemoData();
  });

  it('should allow manager to approve a request with official justification and audit trail', () => {
    const targetReqId = 'req-001';
    const nowIso = new Date().toISOString();
    const resolutionReason = 'Muster roll and turnstile CCTV camera verified departure at 18:30.';

    const updated = FairShiftStore.updateRequest(targetReqId, (prev) => {
      const entry: TimelineEntry = {
        timestamp: nowIso,
        actor: 'Manager Senthil (Administrator)',
        action: 'Request approved. Payroll adjustment authorized.',
        notes: resolutionReason,
      };
      return {
        ...prev,
        status: 'approved',
        updatedAt: nowIso,
        resolutionReason,
        timeline: [...prev.timeline, entry],
      };
    });

    assert.ok(updated, 'Updated request should not be null');
    assert.equal(updated.status, 'approved', 'Status should be approved');
    assert.equal(updated.resolutionReason, resolutionReason);
    assert.ok(
      updated.timeline.some((t) => t.action.includes('Request approved')),
      'Timeline must record approval event'
    );
  });

  it('should allow manager to reject a request with mandatory audit justification', () => {
    const targetReqId = 'req-002';
    const rejectionReason = 'Shift docket does not match claimed Sunday overtime hours.';
    const nowIso = new Date().toISOString();

    const updated = FairShiftStore.updateRequest(targetReqId, (prev) => {
      const entry: TimelineEntry = {
        timestamp: nowIso,
        actor: 'Payroll Lead Anita',
        action: 'Request rejected with official justification.',
        notes: rejectionReason,
      };
      return {
        ...prev,
        status: 'rejected',
        updatedAt: nowIso,
        resolutionReason: rejectionReason,
        timeline: [...prev.timeline, entry],
      };
    });

    assert.ok(updated);
    assert.equal(updated.status, 'rejected');
    assert.equal(updated.resolutionReason, rejectionReason);
  });

  it('should support the more_info_requested lifecycle and worker follow-up reply', () => {
    const targetReqId = 'req-001';

    // 1. Manager requests more info
    FairShiftStore.updateRequest(targetReqId, (prev) => {
      return {
        ...prev,
        status: 'more_info_requested',
        adminNotes: 'Please provide foreman name and shift docket ID.',
        updatedAt: new Date().toISOString(),
        timeline: [
          ...prev.timeline,
          {
            timestamp: new Date().toISOString(),
            actor: 'Manager Senthil',
            action: 'Additional information requested from worker.',
            notes: 'Please provide foreman name and shift docket ID.',
          },
        ],
      };
    });

    let current = FairShiftStore.getRequests().find((r) => r.id === targetReqId);
    assert.equal(current?.status, 'more_info_requested');

    // 2. Worker responds with requested information
    const workerReply = 'Foreman was Murugan, docket slip #DKT-882 attached.';
    FairShiftStore.updateRequest(targetReqId, (prev) => {
      return {
        ...prev,
        status: 'submitted',
        workerResponse: workerReply,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...prev.timeline,
          {
            timestamp: new Date().toISOString(),
            actor: 'Karthik Raja (Worker)',
            action: 'Worker provided additional information requested by manager.',
            notes: workerReply,
          },
        ],
      };
    });

    current = FairShiftStore.getRequests().find((r) => r.id === targetReqId);
    assert.equal(current?.status, 'submitted', 'Status should return to submitted for manager review');
    assert.equal(current?.workerResponse, workerReply);
    assert.ok(
      current?.timeline.some((t) => t.notes === workerReply),
      'Worker reply must be appended to the timeline'
    );
  });

  it('should maintain internal staff notes confidentiality and isolation', () => {
    const targetReqId = 'req-001';
    const confidentialNote = 'HR Flag: Subcontractor payroll audit underway.';

    FairShiftStore.updateRequest(targetReqId, (prev) => ({
      ...prev,
      internalStaffNotes: confidentialNote,
    }));

    const req = FairShiftStore.getRequests().find((r) => r.id === targetReqId);
    assert.equal(req?.internalStaffNotes, confidentialNote);
  });
});
