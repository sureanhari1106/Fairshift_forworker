import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { translations, Translations } from '../src/i18n/translations';

describe('Tamil & English Language Parity', () => {
  const en = translations.en;
  const ta = translations.ta;

  it('should have identical top-level keys in English and Tamil dictionaries', () => {
    const enKeys = Object.keys(en) as (keyof Translations)[];
    const taKeys = Object.keys(ta) as (keyof Translations)[];

    assert.equal(
      enKeys.length,
      taKeys.length,
      `Key count mismatch: EN has ${enKeys.length}, TA has ${taKeys.length}`
    );

    enKeys.forEach((key) => {
      assert.ok(
        key in ta,
        `Missing Tamil translation key for: "${String(key)}"`
      );
      assert.ok(
        typeof ta[key] === 'string' && (ta[key] as string).trim().length > 0,
        `Tamil translation for "${String(key)}" cannot be empty`
      );
    });

    taKeys.forEach((key) => {
      assert.ok(
        key in en,
        `Missing English translation key for: "${String(key)}"`
      );
      assert.ok(
        typeof en[key] === 'string' && (en[key] as string).trim().length > 0,
        `English translation for "${String(key)}" cannot be empty`
      );
    });
  });

  it('should verify genuine Tamil Unicode characters in Tamil dictionary values', () => {
    const tamilRegex = /[\u0B80-\u0BFF]/; // Tamil Unicode Block

    const sampleTamilKeys: (keyof Translations)[] = [
      'appName',
      'tagline',
      'sectorConstruction',
      'sectorFactory',
      'navHome',
      'navRequests',
      'navPayslip',
      'navSafety',
      'catMissedClock',
      'catMissingSalary',
      'catIncorrectOT',
      'statusApproved',
      'statusRejected',
      'statusUnderReview',
      'formulaLabel',
      'emergencyTitle',
    ];

    sampleTamilKeys.forEach((key) => {
      const val = ta[key];
      assert.ok(
        tamilRegex.test(val),
        `Key "${String(key)}" in Tamil dictionary must contain Tamil script characters. Found: "${val}"`
      );
    });
  });

  it('should translate all 11 request categories in both languages', () => {
    const categoryKeys: (keyof Translations)[] = [
      'catMissedClock',
      'catIncorrectHours',
      'catMissingSalary',
      'catIncorrectOT',
      'catMissingPayslip',
      'catIncorrectDeduction',
      'catLeaveShiftCorrection',
      'catProfileCorrection',
      'catMissingTraining',
      'catWorkplaceSafety',
      'catOtherRequest',
    ];

    assert.equal(categoryKeys.length, 11);

    categoryKeys.forEach((key) => {
      assert.ok(en[key].length > 5, `EN ${key} is too short`);
      assert.ok(ta[key].length > 5, `TA ${key} is too short`);
    });
  });

  it('should translate all request statuses in both languages', () => {
    const statusKeys: (keyof Translations)[] = [
      'statusDraft',
      'statusWaiting',
      'statusSubmitted',
      'statusUnderReview',
      'statusMoreInfo',
      'statusApproved',
      'statusRejected',
      'statusResolved',
    ];

    assert.equal(statusKeys.length, 8);

    statusKeys.forEach((key) => {
      assert.ok(en[key].length > 0);
      assert.ok(ta[key].length > 0);
    });
  });
});
