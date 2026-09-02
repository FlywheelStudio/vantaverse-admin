import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'MedVanta/Data display/Avatar',
  component: Avatar,
  args: { name: 'Jane Doe', size: 'md' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    name: 'Jane Doe',
    src: 'https://i.pravatar.cc/80?u=medvanta',
  },
};

export const Online: Story = { args: { status: 'online' } };

export const Away: Story = { args: { status: 'away' } };

export const Small: Story = { args: { size: 'sm', name: 'Alex Kim' } };

export const Large: Story = { args: { size: 'lg', name: 'Alex Kim' } };
