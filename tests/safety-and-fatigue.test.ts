import './setup';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FairShiftStore } from '../src/services/store';
import { SafetyReportItem } from '../src/types';

describe('Safety, Fatigue & Emergency Support', () => {
  beforeEach(() => {
    FairShiftStore.resetDemoData();
  });

  it('should create and persist a fatigue report when shift exceeds 10 hours', () => {
    const shiftHours = 12.5;
    const restHours = 6.0;
    const nowIso = new Date().toISOString();

    const fatigueReport: SafetyReportItem = {
      id: `safe-fatigue-${Date.now()}`,
      refNumber: 'FATIGUE-9921',
      reporterId: 'worker-karthik',
      reporterName: 'Karthik Raja',
      sector: 'construction',
      worksiteName: 'Metro Viaduct Pier 14',
      reportType: 'fatigue',
      category: 'Shift Fatigue & Rest Interval Violation',
      description: `Continuous shift of ${shiftHours}h with only ${restHours}h rest interval.`,
      urgency: 'high',
      immediateHelpNeeded: true,
      status: 'reported',
      createdAt: nowIso,
      hoursWorked: shiftHours,
      restHours,
      immediateGuidance: 'Step down from height immediately. Report to rest station.',
    };

    FairShiftStore.addSafetyReport(fatigueReport);
    const reports = FairShiftStore.getSafetyReports();
    const stored = reports.find((r) => r.id === fatigueReport.id);

    assert.ok(stored, 'Fatigue report should be stored');
    assert.equal(stored.reportType, 'fatigue');
    assert.ok((stored.hoursWorked || 0) > 10, 'Hours worked should trigger overwork warning');
    assert.equal(stored.immediateHelpNeeded, true);
  });

  it('should support construction-specific hazards like scaffolding & work-at-height', () => {
    const constructionHazard: SafetyReportItem = {
      id: `safe-con-${Date.now()}`,
      refNumber: 'SAFE-2026-CON1',
      reporterId: 'worker-karthik',
      reporterName: 'Karthik Raja',
      sector: 'construction',
      worksiteName: 'Metro Viaduct Pier 14 (Level 3 Scaffolding)',
      reportType: 'hazard',
      category: 'Scaffolding & Work-at-Height',
      description: 'Missing toe-board on level 3 access platform.',
      urgency: 'high',
      immediateHelpNeeded: false,
      status: 'reported',
      createdAt: new Date().toISOString(),
    };

    FairShiftStore.addSafetyReport(constructionHazard);
    const reports = FairShiftStore.getSafetyReports();
    const stored = reports.find((r) => r.id === constructionHazard.id);

    assert.ok(stored);
    assert.equal(stored.sector, 'construction');
    assert.equal(stored.category, 'Scaffolding & Work-at-Height');
  });

  it('should support factory-specific hazards like machine guarding and pinch points', () => {
    const factoryHazard: SafetyReportItem = {
      id: `safe-fac-${Date.now()}`,
      refNumber: 'SAFE-2026-FAC1',
      reporterId: 'worker-priya',
      reporterName: 'Priya Sundaram',
      sector: 'manufacturing',
      worksiteName: 'Unit 3 Stamping Floor (Hydraulic Press 4)',
      reportType: 'hazard',
      category: 'Machine Guarding & Optical Curtain Failure',
      description: 'Optical safety light curtain flickers intermittently.',
      urgency: 'immediate_danger',
      immediateHelpNeeded: true,
      status: 'investigating',
      createdAt: new Date().toISOString(),
    };

    FairShiftStore.addSafetyReport(factoryHazard);
    const reports = FairShiftStore.getSafetyReports();
    const stored = reports.find((r) => r.id === factoryHazard.id);

    assert.ok(stored);
    assert.equal(stored.sector, 'manufacturing');
    assert.equal(stored.urgency, 'immediate_danger');
  });

  it('should record injury reports with affected body area and first aid flags', () => {
    const injuryReport: SafetyReportItem = {
      id: `safe-inj-${Date.now()}`,
      refNumber: 'INJ-2026-001',
      reporterId: 'worker-karthik',
      reporterName: 'Karthik Raja',
      sector: 'construction',
      worksiteName: 'Apex Tower Foundation Pit B',
      reportType: 'injury',
      category: 'Falling Objects & Debris Protection',
      description: 'Falling concrete fragment struck shoulder.',
      urgency: 'high',
      affectedBodyArea: 'Back / Spine',
      immediateHelpNeeded: true,
      status: 'reported',
      createdAt: new Date().toISOString(),
    };

    FairShiftStore.addSafetyReport(injuryReport);
    const stored = FairShiftStore.getSafetyReports().find((r) => r.id === injuryReport.id);

    assert.ok(stored);
    assert.equal(stored.reportType, 'injury');
    assert.equal(stored.affectedBodyArea, 'Back / Spine');
    assert.equal(stored.immediateHelpNeeded, true);
  });

  it('should provide cached emergency contacts directory with verification timestamp and safe simulated data', () => {
    const contacts = FairShiftStore.getEmergencyContacts();
    assert.ok(contacts.length >= 4, 'Must have at least 4 emergency contacts configured');

    contacts.forEach((contact) => {
      assert.ok(contact.name.length > 0, 'Contact name required');
      assert.ok(contact.phone.length > 0, 'Contact phone required');
      assert.ok(contact.role.length > 0, 'Contact role required');
      assert.ok(contact.lastVerified.length > 0, 'Last verified timestamp required');
      assert.match(contact.lastVerified, /^\d{4}-\d{2}-\d{2}/, 'Verification timestamp format check');
    });

    const hasHospital = contacts.some((c) => c.role.includes('Hospital') || c.role.includes('Trauma'));
    assert.ok(hasHospital, 'Must include hospital trauma hotline');
  });
});
