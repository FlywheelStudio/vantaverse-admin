import type { Meta, StoryObj } from '@storybook/react';
import { Donut } from './index';

const meta = {
  title: 'Widgets/Donut',
  component: Donut,
  args: { pct: 72, label: '72%', sub: 'aggregate' },
} satisfies Meta<typeof Donut>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: 96, pct: 40, label: '40%' } };
