import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './index';

const meta = {
  title: 'Widgets/Avatar',
  component: Avatar,
  args: { name: 'Jane Cooper', size: 36 },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = { args: { name: 'Alex Rivera', size: 72 } };

export const Small: Story = { args: { name: 'Sam Lee', size: 24 } };
