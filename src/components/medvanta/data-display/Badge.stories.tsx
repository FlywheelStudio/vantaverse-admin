import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'MedVanta/Data display/Badge',
  component: Badge,
  args: { children: 'Active', tone: 'neutral' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Brand: Story = { args: { tone: 'brand', children: 'Member' } };

export const Accent: Story = { args: { tone: 'accent', children: 'New' } };

export const Success: Story = { args: { tone: 'success', children: 'Complete' } };

export const Warning: Story = { args: { tone: 'warning', children: 'Pending' } };

export const Danger: Story = { args: { tone: 'danger', children: 'Overdue' } };

export const WithDot: Story = { args: { dot: true, tone: 'success', children: 'Live' } };
