import type { Meta, StoryObj } from '@storybook/react';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';
import { DashboardUi } from './ui';

const noop = (): void => undefined;

const sparks = {
  active: [44, 47, 46, 51, 54, 53, 57, 61],
  inProgram: [36, 38, 39, 41, 40, 43, 44, 45],
  completion: [19, 18, 17, 17, 15, 15, 14, 13],
  overdue: [2, 3, 3, 4, 4, 5, 5, 6],
};

const funnel = [
  { label: 'Intake survey signed', count: 88, total: 129, share: 68 },
  { label: 'Screening attended', count: 74, total: 129, share: 57 },
  { label: 'Consultation attended', count: 61, total: 129, share: 47 },
  { label: 'Program assigned', count: 45, total: 129, share: 35 },
] as const;

const activity = [
  { name: 'Nadia Okonjo', text: 'completed Week 3 Day 2', when: '2h ago' },
  { name: 'Chuck Bolland', text: 'logged a check-in — pain 2/10', when: '5h ago' },
] as const;

const statusCounts = {
  pending: 5,
  active: 128,
  inProgram: 45,
  invited: 22,
  noProgram: 61,
  programCompleted: 12,
};

const legend = [
  { label: 'In a program', value: 45, color: 'var(--cyan-500)' },
  { label: 'Program completed', value: 12, color: 'var(--navy-700)' },
  { label: 'No program yet', value: 61, color: 'var(--slate-300)' },
  { label: 'Invited, not started', value: 22, color: 'var(--slate-200)' },
];

const attentionUser: UserNeedingAttention = {
  user_id: 'user-1',
  first_name: 'Nadia',
  last_name: 'Okonjo',
  email: 'nadia@example.com',
  avatar_url: null,
  last_sign_in: null,
  compliance: 18,
  program_name: 'Knee recovery',
  organization_id: null,
};

const meta = {
  title: 'Widgets/Dashboard',
  component: DashboardUi,
  args: {
    statusCounts,
    compliancePct: 68,
    attentionCount: 0,
    rows: [],
    overdueCount: 0,
    legend,
    sparks,
    funnel,
    activity,
    assignProgramUser: null,
    onAssignOpen: noop,
    onAssignClose: noop,
    onAssignSuccess: noop,
    onViewAllUsers: noop,
    onMessageUser: noop,
  },
} satisfies Meta<typeof DashboardUi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAttention: Story = {
  args: {
    attentionCount: 1,
    overdueCount: 1,
    rows: [
      {
        item: attentionUser,
        name: 'Nadia Okonjo',
        isOverdue: true,
        reason: 'Very low compliance (18%) · Knee recovery',
      },
    ],
  },
};
