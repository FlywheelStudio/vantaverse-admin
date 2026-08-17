import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';

const meta = {
  title: 'MedVanta/Actions/IconButton',
  component: IconButton,
  args: { icon: 'X', label: 'Close', variant: 'ghost', size: 'md', shape: 'circle' },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', icon: 'Pencil', label: 'Edit', shape: 'rounded' },
};

export const Primary: Story = { args: { variant: 'primary', icon: 'Plus', label: 'Add' } };

export const Accent: Story = { args: { variant: 'accent', icon: 'Plus', label: 'Add' } };

export const Small: Story = { args: { size: 'sm', icon: 'Settings', label: 'Settings' } };

export const Large: Story = { args: { size: 'lg', icon: 'Settings', label: 'Settings' } };
