import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDueLabel, getProgramSlaMode } from './program-sla';
describe('getProgramSlaMode', () => {
  const now = new Date('2026-08-18T12:00:00');

  it('returns assigned when hasAssignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '2026-08-01',
        hasAssignment: true,
        now,
      }),
      'assigned',
    );
  });

  it('returns overdue when past due and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '2026-08-01',
        hasAssignment: false,
        now,
      }),
      'overdue',
    );
  });

  it('returns due when future due and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '2026-08-25',
        hasAssignment: false,
        now,
      }),
      'due',
    );
  });

  it('returns none when no due date and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: null,
        hasAssignment: false,
        now,
      }),
      'none',
    );
  });

  it('returns none when due date is empty string and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '',
        hasAssignment: false,
        now,
      }),
      'none',
    );
  });

  it('returns none when due date is invalid and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '2026-13-01',
        hasAssignment: false,
        now,
      }),
      'none',
    );
  });

  it('returns none when due date is whitespace-only and no assignment', () => {
    assert.equal(
      getProgramSlaMode({
        programDueDate: '   ',
        hasAssignment: false,
        now,
      }),
      'none',
    );
  });
});

describe('formatDueLabel', () => {
  it('includes overdue wording when mode overdue', () => {
    const r = formatDueLabel({
      programDueDate: '2026-08-01',
      mode: 'overdue',
      now: new Date('2026-08-18T12:00:00'),
    });
    assert.match(r.label.toLowerCase(), /overdue|past/);
    assert.ok(r.pct > 0);
  });

  it('includes days-left wording when mode due', () => {
    const r = formatDueLabel({
      programDueDate: '2026-08-25',
      mode: 'due',
      now: new Date('2026-08-18T12:00:00'),
    });
    assert.match(r.label.toLowerCase(), /left|today/);
    assert.ok(r.pct >= 0 && r.pct <= 100);
  });
});
