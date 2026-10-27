import './setup';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FairShiftStore } from '../src/services/store';
import { AnonymousFeedbackItem, Sector } from '../src/types';

describe('Anonymous Feedback & Privacy Protection', () => {
  beforeEach(() => {
    FairShiftStore.resetDemoData();
  });

  it('should ensure all pre-seeded anonymous feedback items contain zero worker identifiers', () => {
    const feedbackList = FairShiftStore.getAnonymousFeedback();
    assert.ok(feedbackList.length >= 3, 'Should have pre-seeded feedback');

    const forbiddenFields = [
      'workerId',
      'userId',
      'authorId',
      'reporterId',
      'name',
      'workerName',
      'email',
      'phone',
      'employeeId',
      'badgeNumber',
    ];

    for (const item of feedbackList) {
      // Direct property check
      for (const field of forbiddenFields) {
        assert.equal(
          (item as unknown as Record<string, unknown>)[field],
          undefined,
          `Anonymous feedback item ${item.id} must NOT have identifying field '${field}'`
        );
      }

      // Allowed fields only
      const keys = Object.keys(item);
      const allowedKeys = ['id', 'sector', 'category', 'feedbackText', 'createdAt', 'sentiment'];
      for (const key of keys) {
        assert.ok(
          allowedKeys.includes(key),
          `Property '${key}' on feedback ${item.id} is not in the approved anonymous schema`
        );
      }
    }
  });

  it('should strip rogue worker identifiers when storing new anonymous feedback', () => {
    const roguePayload = {
      id: `anon-test-${Date.now()}`,
      sector: 'manufacturing' as Sector,
      category: 'Welfare & Rest Facilities',
      feedbackText: 'Water dispenser in Assembly Bay 3 has been empty since morning shift.',
      createdAt: new Date().toISOString(),
      sentiment: 'concern' as const,
      // Rogue identifiers accidentally or maliciously attached:
      workerId: 'worker-priya',
      authorId: 'auth-user-999',
      workerName: 'Priya Sundaram',
      email: 'priya@example.com',
    };

    // Store through FairShiftStore
    FairShiftStore.addAnonymousFeedback(roguePayload as unknown as AnonymousFeedbackItem);

    const stored = FairShiftStore.getAnonymousFeedback().find((f) => f.id === roguePayload.id);
    assert.ok(stored, 'Newly added anonymous feedback should exist');

    const raw = stored as unknown as Record<string, unknown>;
    assert.equal(raw.workerId, undefined, 'workerId must be stripped');
    assert.equal(raw.authorId, undefined, 'authorId must be stripped');
    assert.equal(raw.workerName, undefined, 'workerName must be stripped');
    assert.equal(raw.email, undefined, 'email must be stripped');
    assert.equal(stored.category, 'Welfare & Rest Facilities');
    assert.equal(stored.sentiment, 'concern');
  });

  it('should correctly support sentiment tags and categories across sectors', () => {
    const feedbackItems: AnonymousFeedbackItem[] = [
      {
        id: 'anon-urgent-01',
        sector: 'construction',
        category: 'Scaffolding Safety Culture',
        feedbackText: 'Overnight rain made planks slick; workers felt pressured not to delay start.',
        createdAt: new Date().toISOString(),
        sentiment: 'urgent',
      },
      {
        id: 'anon-pos-02',
        sector: 'manufacturing',
        category: 'Fair Compensation',
        feedbackText: 'Tamil translation of the payslip deductions made EPF calculations crystal clear.',
        createdAt: new Date().toISOString(),
        sentiment: 'positive',
      },
    ];

    for (const f of feedbackItems) {
      FairShiftStore.addAnonymousFeedback(f);
    }

    const all = FairShiftStore.getAnonymousFeedback();
    const urgentItem = all.find((f) => f.id === 'anon-urgent-01');
    assert.ok(urgentItem);
    assert.equal(urgentItem.sentiment, 'urgent');
    assert.equal(urgentItem.sector, 'construction');

    const positiveItem = all.find((f) => f.id === 'anon-pos-02');
    assert.ok(positiveItem);
    assert.equal(positiveItem.sentiment, 'positive');
    assert.equal(positiveItem.sector, 'manufacturing');
  });

  it('should allow sector filtering for managerial pulse analytics without worker re-identification', () => {
    const all = FairShiftStore.getAnonymousFeedback();
    const constructionFeedback = all.filter((f) => f.sector === 'construction');
    const manufacturingFeedback = all.filter((f) => f.sector === 'manufacturing');

    assert.ok(constructionFeedback.length > 0, 'Should have construction feedback');
    assert.ok(manufacturingFeedback.length > 0, 'Should have manufacturing feedback');

    // Confirm neither sector leaks identifying data
    const allFiltered = [...constructionFeedback, ...manufacturingFeedback];
    for (const item of allFiltered) {
      assert.ok(item.feedbackText.length > 0, 'Feedback must have readable body');
      assert.equal((item as unknown as Record<string, unknown>).workerId, undefined);
    }
  });
});
