import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';

const meta = {
  title: 'MedVanta/Data display/StatCard',
  component: StatCard,
  args: {
    label: 'Active members',
    value: '1,248',
    delta: '+12%',
    trend: 'up',
    icon: 'Users',
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DownTrend: Story = {
  args: { delta: '-4%', trend: 'down', label: 'Drop-off rate', value: '8.2%' },
};

export const FlatTrend: Story = {
  args: { delta: '0%', trend: 'flat', label: 'Avg. sessions', value: '3.1' },
};

export const WithSparkline: Story = {
  args: {
    spark: [12, 18, 14, 22, 19, 26, 24],
    sparkId: 'stat-spark-demo',
    label: 'Weekly engagement',
    value: '86%',
  },
};

export const AccentBrand: Story = {
  args: {
    accent: 'var(--primary)',
    icon: 'Activity',
    label: 'Compliance score',
    value: '92%',
  },
};
