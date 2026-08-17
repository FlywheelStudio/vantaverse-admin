import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';

const meta = {
  title: 'MedVanta/Actions/Icon',
  component: Icon,
  args: { name: 'Heart', size: 24 },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: 16 } };

export const Unknown: Story = { args: { name: 'NotARealIcon' } };
