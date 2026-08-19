import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import {
  parseCompletion,
  getCurrentWeekIndex,
  buildWeekStrip,
  buildDayPlan,
  buildAdherencePeriods,
  type CompletionDay,
} from './program-week';

const exercise = (id: string) =>
  ({ id, type: 'exercise_template' as const });

const group = (id: string) => ({ id, type: 'group' as const });

describe('parseCompletion', () => {
  it('returns empty array for null/undefined/non-array', () => {
    assert.deepEqual(parseCompletion(null), []);
    assert.deepEqual(parseCompletion(undefined), []);
    assert.deepEqual(parseCompletion('bad' as unknown as Array<Array<unknown>>), []);
  });

  it('parses valid completion weeks and days', () => {
    const raw = [
      [
        {
          status: 'complete',
          started_at: '2026-08-04T10:00:00Z',
          total_sets: 3,
          current_set: 3,
          completed_at: '2026-08-04T11:00:00Z',
        },
        { status: 'incomplete', total_sets: 2, current_set: 1 },
        null,
        'invalid',
      ],
    ];

    const parsed = parseCompletion(raw);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]?.length, 4);
    assert.deepEqual(parsed[0]?.[0], {
      status: 'complete',
      started_at: '2026-08-04T10:00:00Z',
      total_sets: 3,
      current_set: 3,
      completed_at: '2026-08-04T11:00:00Z',
    });
    assert.deepEqual(parsed[0]?.[1], {
      status: 'incomplete',
      started_at: '',
      total_sets: 2,
      current_set: 1,
      completed_at: null,
    });
    assert.equal(parsed[0]?.[2], null);
    assert.equal(parsed[0]?.[3], null);
  });
});

describe('getCurrentWeekIndex', () => {
  const weekCount = 8;

  it('returns week 0 when start date is in the future', () => {
    assert.equal(
      getCurrentWeekIndex({
        startDate: '2026-09-01',
        weekCount,
        now: new Date('2026-08-18T12:00:00'),
      }),
      0,
    );
  });

  it('returns correct week index from Monday-aligned start date', () => {
    assert.equal(
      getCurrentWeekIndex({
        startDate: '2026-08-03',
        weekCount,
        now: new Date('2026-08-18T12:00:00'),
      }),
      2,
    );
  });

  it('clamps to last week when now is past program length', () => {
    assert.equal(
      getCurrentWeekIndex({
        startDate: '2026-01-05',
        weekCount: 4,
        now: new Date('2026-12-01T12:00:00'),
      }),
      3,
    );
  });

  it('returns 0 when start date is missing', () => {
    assert.equal(
      getCurrentWeekIndex({
        startDate: null,
        weekCount,
        now: new Date('2026-08-18T12:00:00'),
      }),
      0,
    );
  });
});

describe('buildWeekStrip', () => {
  const startDate = '2026-08-03';
  const now = new Date('2026-08-05T12:00:00');

  const schedule: DatabaseSchedule = [
    [
      { exercises: [exercise('a'), exercise('b'), exercise('c')] },
      { exercises: [exercise('d'), exercise('e')] },
      { exercises: [exercise('f')] },
      { exercises: [] },
      { exercises: [exercise('g'), exercise('h')] },
      { exercises: [] },
      { exercises: [] },
    ],
  ];

  const completion: Array<Array<CompletionDay>> = [
    [
      {
        status: 'complete',
        started_at: '',
        total_sets: 3,
        current_set: 3,
        completed_at: null,
      },
      {
        status: 'incomplete',
        started_at: '',
        total_sets: 2,
        current_set: 2,
        completed_at: null,
      },
      {
        status: 'incomplete',
        started_at: '',
        total_sets: 3,
        current_set: 1,
        completed_at: null,
      },
      null,
      null,
      null,
      null,
    ],
  ];

  it('marks rest days and done/today/todo session days', () => {
    const strip = buildWeekStrip({
      schedule,
      completion,
      startDate,
      weekIndex: 0,
      now,
    });

    assert.equal(strip.length, 7);
    assert.deepEqual(
      strip.map((d) => d.label),
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    );
    assert.equal(strip[0]?.state, 'done');
    assert.equal(strip[1]?.state, 'done');
    assert.equal(strip[2]?.state, 'today');
    assert.equal(strip[3]?.state, 'rest');
    assert.equal(strip[4]?.state, 'todo');
    assert.equal(strip[5]?.state, 'rest');
    assert.equal(strip[6]?.state, 'rest');
  });

  it('uses completion total_sets for set counts when present', () => {
    const strip = buildWeekStrip({
      schedule,
      completion,
      startDate,
      weekIndex: 0,
      now,
    });

    assert.equal(strip[0]?.currentSets, 3);
    assert.equal(strip[0]?.totalSets, 3);
    assert.equal(strip[2]?.currentSets, 1);
    assert.equal(strip[2]?.totalSets, 3);
    assert.equal(strip[5]?.currentSets, 0);
    assert.equal(strip[5]?.totalSets, 0);
  });
});

describe('buildDayPlan', () => {
  const schedule: DatabaseSchedule = [
    [
      { exercises: [] },
      {
        exercises: [
          exercise('tpl-1'),
          group('grp-1'),
          exercise('tpl-2'),
        ],
      },
    ],
  ];

  const exerciseNamesMap = new Map([
    ['tpl-1', 'Dead bug'],
    ['tpl-2', 'Side plank'],
    ['tpl-a', 'Cat-cow'],
    ['tpl-b', 'Thoracic opener'],
  ]);

  const groupsMap = new Map([
    ['grp-1', { exercise_template_ids: ['tpl-a', 'tpl-b'] }],
  ]);

  it('returns empty array for rest day', () => {
    assert.deepEqual(
      buildDayPlan({
        schedule,
        weekIndex: 0,
        dayIndex: 0,
        exerciseNamesMap,
        groupsMap,
      }),
      [],
    );
  });

  it('resolves exercise and group names like legacy day cards', () => {
    const blocks = buildDayPlan({
      schedule,
      weekIndex: 0,
      dayIndex: 1,
      exerciseNamesMap,
      groupsMap,
    });

    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.title, 'Exercises');
    assert.deepEqual(blocks[0]?.items, [
      'Dead bug',
      'Cat-cow, Thoracic opener',
      'Side plank',
    ]);
  });
});

describe('buildAdherencePeriods', () => {
  const schedule: DatabaseSchedule = [
    [
      { exercises: [exercise('a')] },
      { exercises: [exercise('b')] },
      { exercises: [exercise('c')] },
      { exercises: [] },
      { exercises: [exercise('d')] },
      { exercises: [] },
      { exercises: [] },
    ],
    [
      { exercises: [exercise('e')] },
      { exercises: [exercise('f')] },
      { exercises: [] },
      { exercises: [exercise('g')] },
      { exercises: [] },
      { exercises: [] },
      { exercises: [] },
    ],
  ];

  const completion: Array<Array<CompletionDay>> = [
    [
      {
        status: 'complete',
        started_at: '',
        total_sets: 1,
        current_set: 1,
        completed_at: null,
      },
      {
        status: 'incomplete',
        started_at: '',
        total_sets: 1,
        current_set: 1,
        completed_at: null,
      },
      {
        status: 'complete',
        started_at: '',
        total_sets: 1,
        current_set: 1,
        completed_at: null,
      },
      null,
      null,
      null,
      null,
    ],
    [
      {
        status: 'complete',
        started_at: '',
        total_sets: 1,
        current_set: 1,
        completed_at: null,
      },
      {
        status: 'complete',
        started_at: '',
        total_sets: 1,
        current_set: 1,
        completed_at: null,
      },
      null,
      {
        status: 'incomplete',
        started_at: '',
        total_sets: 2,
        current_set: 1,
        completed_at: null,
      },
      null,
      null,
      null,
    ],
  ];

  it('computes this week adherence from session days', () => {
    const periods = buildAdherencePeriods({
      schedule,
      completion,
      weekIndex: 0,
    });

    const thisWeek = periods.find((p) => p.label === 'This week');
    assert.ok(thisWeek);
    assert.equal(thisWeek.doneSessions, 3);
    assert.equal(thisWeek.expectedSessions, 4);
    assert.equal(thisWeek.pct, 75);
  });

  it('returns last week and 4-week average labels', () => {
    const periods = buildAdherencePeriods({
      schedule,
      completion,
      weekIndex: 1,
    });

    assert.equal(periods.length, 3);
    assert.equal(periods[0]?.label, 'This week');
    assert.equal(periods[1]?.label, 'Last week');
    assert.equal(periods[2]?.label, '4-week average');
    assert.equal(periods[1]?.doneSessions, 3);
    assert.equal(periods[1]?.expectedSessions, 4);
    assert.equal(periods[1]?.pct, 75);
    assert.equal(periods[2]?.pct, 71);
  });
});
