import './setup';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FairShiftStore } from '../src/services/store';
import { PayrollRecord, AllowanceItem, DeductionItem } from '../src/types';

/**
 * Decimal-safe currency helper: rounds to 2 decimal places to avoid IEEE-754 precision drift
 */
function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Standard FairShift statutory wage calculation formula
 */
function computePayslip(params: {
  baseHourlyRate: number;
  regularHours: number;
  overtimeHours: number;
  overtimeMultiplier?: number;
  allowances: AllowanceItem[];
  otherDeductions?: DeductionItem[];
}) {
  const multiplier = params.overtimeMultiplier ?? 1.5;
  const regularEarnings = roundCurrency(params.baseHourlyRate * params.regularHours);
  const overtimeEarnings = roundCurrency(params.baseHourlyRate * params.overtimeHours * multiplier);

  const totalAllowances = roundCurrency(
    params.allowances.reduce((acc, curr) => acc + curr.amount, 0)
  );

  const grossEarnings = roundCurrency(regularEarnings + overtimeEarnings + totalAllowances);

  // Statutory deductions:
  // EPF: 12% on basic/regular earnings
  const epfDeduction: DeductionItem = {
    name: 'Statutory Employees Provident Fund (EPF 12%)',
    amount: roundCurrency(regularEarnings * 0.12),
    statutory: true,
    description: 'Statutory retirement fund',
  };

  // ESI: ~1.75% of gross earnings (statutory medical protection)
  const esiDeduction: DeductionItem = {
    name: 'Employees State Insurance (ESI 1.75%)',
    amount: roundCurrency(grossEarnings * 0.0175),
    statutory: true,
    description: 'Statutory medical & health insurance',
  };

  const allDeductions = [epfDeduction, esiDeduction, ...(params.otherDeductions ?? [])];
  const totalDeductions = roundCurrency(
    allDeductions.reduce((acc, curr) => acc + curr.amount, 0)
  );

  const netPayable = roundCurrency(grossEarnings - totalDeductions);

  return {
    regularEarnings,
    overtimeEarnings,
    totalAllowances,
    grossEarnings,
    allDeductions,
    totalDeductions,
    netPayable,
  };
}

describe('Salary & Statutory Arithmetic Tests', () => {
  beforeEach(() => {
    FairShiftStore.resetDemoData();
  });

  it('should load initial seed payslips with correct arithmetic invariants', () => {
    const payslips = FairShiftStore.getPayroll();
    assert.ok(payslips.length >= 2, 'Should have pre-seeded payroll records');

    for (const payslip of payslips) {
      // 1. Regular earnings check
      const expectedRegular = roundCurrency(payslip.baseHourlyRate * payslip.regularHours);
      assert.equal(
        payslip.regularEarnings,
        expectedRegular,
        `Regular earnings should match rate * hours for ${payslip.id}`
      );

      // 2. Overtime earnings check
      const expectedOT = roundCurrency(
        payslip.baseHourlyRate * payslip.overtimeHours * payslip.overtimeMultiplier
      );
      assert.equal(
        payslip.overtimeEarnings,
        expectedOT,
        `Overtime earnings should match rate * hours * multiplier for ${payslip.id}`
      );

      // 3. Allowances sum check
      const allowanceSum = roundCurrency(
        payslip.allowances.reduce((acc, a) => acc + a.amount, 0)
      );

      // 4. Gross earnings check
      const expectedGross = roundCurrency(expectedRegular + expectedOT + allowanceSum);
      assert.equal(
        payslip.grossEarnings,
        expectedGross,
        `Gross earnings must equal regular + overtime + allowances for ${payslip.id}`
      );

      // 5. Total deductions check
      const expectedDeductions = roundCurrency(
        payslip.deductions.reduce((acc, d) => acc + d.amount, 0)
      );
      assert.equal(
        payslip.totalDeductions,
        expectedDeductions,
        `Total deductions must equal sum of line deductions for ${payslip.id}`
      );

      // 6. Net payable formula: Gross - Deductions
      const expectedNet = roundCurrency(expectedGross - expectedDeductions);
      assert.equal(
        payslip.netPayable,
        expectedNet,
        `Net payable must strictly equal Gross minus Deductions for ${payslip.id}`
      );
    }
  });

  it('should compute exact EPF (12%) and ESI statutory deductions without floating point drift', () => {
    const baseHourlyRate = 16.0;
    const regularHours = 40.0; // regular wages = 640.00
    const overtimeHours = 8.5; // OT earnings at 1.5x = 8.5 * 16 * 1.5 = 204.00
    const allowances: AllowanceItem[] = [
      { name: 'Site Hazard', amount: 50.0 },
      { name: 'PPE Gear', amount: 25.0 },
    ];

    const result = computePayslip({
      baseHourlyRate,
      regularHours,
      overtimeHours,
      overtimeMultiplier: 1.5,
      allowances,
      otherDeductions: [
        {
          name: 'Boot Recovery',
          amount: 30.0,
          statutory: false,
          description: 'Steel toe boots',
        },
      ],
    });

    assert.equal(result.regularEarnings, 640.0, 'Regular earnings should be 640.00');
    assert.equal(result.overtimeEarnings, 204.0, 'Overtime earnings should be 204.00');
    assert.equal(result.totalAllowances, 75.0, 'Total allowances should be 75.00');
    assert.equal(result.grossEarnings, 919.0, 'Gross earnings should be 919.00');

    // EPF must be 12% of 640 = 76.80
    const epf = result.allDeductions.find((d) => d.name.includes('EPF'));
    assert.ok(epf, 'EPF deduction should exist');
    assert.equal(epf.amount, 76.8);

    // ESI must be 1.75% of gross (919 * 0.0175 = 16.0825 => 16.08)
    const esi = result.allDeductions.find((d) => d.name.includes('ESI'));
    assert.ok(esi, 'ESI deduction should exist');
    assert.equal(esi.amount, 16.08);

    // Total deductions = 76.80 + 16.08 + 30.00 = 122.88
    assert.equal(result.totalDeductions, 122.88);

    // Net payable = 919.00 - 122.88 = 796.12
    assert.equal(result.netPayable, 796.12);
  });

  it('should handle edge cases: zero overtime, zero allowances, and double-time (2.0x)', () => {
    // Zero OT case
    const zeroOT = computePayslip({
      baseHourlyRate: 20.0,
      regularHours: 35.0,
      overtimeHours: 0,
      allowances: [],
    });
    assert.equal(zeroOT.overtimeEarnings, 0);
    assert.equal(zeroOT.totalAllowances, 0);
    assert.equal(zeroOT.grossEarnings, 700.0);
    assert.ok(zeroOT.netPayable > 0 && zeroOT.netPayable < 700.0);

    // Double time (2.0x holiday rate)
    const holidayOT = computePayslip({
      baseHourlyRate: 15.0,
      regularHours: 40.0,
      overtimeHours: 8.0,
      overtimeMultiplier: 2.0, // Sunday / Public Holiday
      allowances: [{ name: 'Holiday Meal', amount: 20.0 }],
    });
    // 8 * 15 * 2.0 = 240
    assert.equal(holidayOT.overtimeEarnings, 240.0);
    // Gross = 600 + 240 + 20 = 860
    assert.equal(holidayOT.grossEarnings, 860.0);
  });

  it('should correctly filter payslips by workerId', () => {
    const karthikPayslips = FairShiftStore.getPayroll('worker-karthik');
    assert.ok(karthikPayslips.length > 0, 'Karthik should have payslips');
    for (const p of karthikPayslips) {
      assert.equal(p.workerId, 'worker-karthik');
    }

    const nonExistent = FairShiftStore.getPayroll('worker-unknown-999');
    assert.equal(nonExistent.length, 0, 'Unknown worker should have 0 payslips');
  });

  it('should record dispute status change on payslip when wage discrepancy is challenged', () => {
    const payslips = FairShiftStore.getPayroll('worker-karthik');
    const target = payslips[0];
    assert.ok(target, 'Target payslip must exist');

    // Worker flags this payslip as disputed
    target.status = 'disputed';
    const all = FairShiftStore.getPayroll();
    const updatedList = all.map((p) => (p.id === target.id ? target : p));
    FairShiftStore.savePayroll(updatedList);

    const refreshed = FairShiftStore.getPayroll('worker-karthik').find((p) => p.id === target.id);
    assert.ok(refreshed);
    assert.equal(refreshed.status, 'disputed', 'Payslip status should be disputed');
  });
});
