import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'MedVanta/Actions/Button',
  component: Button,
  args: { children: 'Continue', variant: 'primary', size: 'md' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Accent: Story = { args: { variant: 'accent' } };

export const Secondary: Story = { args: { variant: 'secondary' } };

export const Ghost: Story = { args: { variant: 'ghost' } };

export const Danger: Story = { args: { variant: 'danger' } };

export const Loading: Story = { args: { loading: true } };

export const WithIcons: Story = {
  args: { iconLeft: 'ArrowLeft', iconRight: 'ArrowRight', children: 'Navigate' },
};

export const Small: Story = { args: { size: 'sm', children: 'Small' } };

export const Large: Story = { args: { size: 'lg', children: 'Large' } };
