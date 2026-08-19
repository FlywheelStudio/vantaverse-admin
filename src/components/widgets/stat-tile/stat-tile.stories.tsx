import type { Meta, StoryObj } from '@storybook/react';
import { StatTile } from './index';

const meta = {
  title: 'Widgets/StatTile',
  component: StatTile,
  args: {
    label: 'Active members',
    value: 128,
    delta: '+4 WoW',
    trend: 'up',
    icon: 'UsersRound',
    spark: [12, 18, 14, 22, 19, 26, 24, 30],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFooter: Story = {
  args: {
    label: 'Programs overdue',
    value: 3,
    delta: '+2 WoW',
    trend: 'up',
    icon: 'Hourglass',
    footer: 'Past the 5 working day deadline',
    spark: [2, 1, 3, 2, 4, 3, 5, 3],
  },
};

export const DownTrend: Story = {
  args: {
    label: 'Avg. completion',
    value: '68%',
    delta: '-2 pts WoW',
    trend: 'down',
    icon: 'Percent',
    spark: [72, 70, 69, 68, 67, 68, 66, 68],
  },
};
