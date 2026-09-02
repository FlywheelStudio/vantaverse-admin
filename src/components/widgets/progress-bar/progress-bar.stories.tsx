import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './index';

const meta = {
  title: 'Widgets/ProgressBar',
  component: ProgressBar,
  args: { pct: 72, height: 6, tone: 'navy', showLabel: true },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = { args: { pct: 35, tone: 'danger' } };
