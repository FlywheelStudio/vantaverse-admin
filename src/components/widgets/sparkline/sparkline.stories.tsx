import type { Meta, StoryObj } from '@storybook/react';
import { Sparkline } from './index';

const meta = {
  title: 'Widgets/Sparkline',
  component: Sparkline,
  args: {
    values: [12, 18, 14, 22, 19, 26, 24, 30],
    color: 'var(--navy-600)',
    height: 28,
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Cyan: Story = {
  args: { color: 'var(--cyan-500)', values: [5, 10, 8, 15, 12, 20, 18, 25] },
};
