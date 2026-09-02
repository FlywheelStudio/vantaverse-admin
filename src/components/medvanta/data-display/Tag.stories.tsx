import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta = {
  title: 'MedVanta/Data display/Tag',
  component: Tag,
  args: { children: 'Physical therapy', tone: 'neutral' },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Accent: Story = { args: { tone: 'accent', children: 'Priority' } };

export const Removable: Story = {
  args: {
    children: 'Filter: Active',
    onRemove: () => undefined,
  },
};
