import type { Meta, StoryObj } from '@storybook/react';
import { Dashboard } from './index';

const meta = {
  title: 'Widgets/Dashboard',
  component: Dashboard,
  args: {
    statusCounts: {
      pending: 5,
      active: 128,
      inProgram: 45,
      invited: 22,
      noProgram: 61,
      programCompleted: 12,
    },
    needingAttention: [],
    compliancePct: 68,
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAttention: Story = {
  args: {
    needingAttention: [
      {
        user_id: 'user-1',
        first_name: 'Nadia',
        last_name: 'Okonjo',
        email: 'nadia@example.com',
        avatar_url: null,
        last_sign_in: null,
        compliance: 18,
        program_name: 'Knee recovery',
        organization_id: null,
      },
      {
        user_id: 'user-2',
        first_name: 'Chuck',
        last_name: 'Bolland',
        email: 'chuck@example.com',
        avatar_url: null,
        last_sign_in: null,
        compliance: 42,
        program_name: 'Shoulder mobility',
        organization_id: null,
      },
    ],
  },
};
