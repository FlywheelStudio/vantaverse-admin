import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'MedVanta/Feedback/ProgressBar',
  component: ProgressBar,
  args: { value: 45, max: 100, tone: 'accent' },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = { args: { showLabel: true, value: 72 } };

export const Brand: Story = { args: { tone: 'brand', value: 55, showLabel: true } };

export const Success: Story = { args: { tone: 'success', value: 100, showLabel: true } };

export const Warning: Story = { args: { tone: 'warning', value: 30, showLabel: true } };

export const Tall: Story = { args: { height: 12, value: 60, showLabel: true } };

export const Empty: Story = { args: { value: 0, showLabel: true } };
