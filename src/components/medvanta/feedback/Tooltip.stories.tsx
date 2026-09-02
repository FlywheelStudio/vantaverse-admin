import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../actions/Button';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'MedVanta/Feedback/Tooltip',
  component: Tooltip,
  args: {
    label: 'Helpful tip',
    children: <Button variant="secondary">Hover me</Button>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {};

export const Bottom: Story = { args: { placement: 'bottom' } };

export const Left: Story = { args: { placement: 'left' } };

export const Right: Story = { args: { placement: 'right' } };

export const LongLabel: Story = {
  args: {
    label: 'Export patient data as CSV',
    children: <Button variant="ghost" iconLeft="Download">Export</Button>,
  },
};
