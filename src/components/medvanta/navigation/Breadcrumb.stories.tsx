import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

const meta = {
  title: 'MedVanta/Navigation/Breadcrumb',
  component: Breadcrumb,
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Members', href: '/users' },
      { label: 'Jane Doe' },
    ],
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = {
  args: {
    items: [{ label: 'Dashboard', href: '/' }, { label: 'Settings' }],
  },
};

export const Deep: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Groups', href: '/groups' },
      { label: 'North Clinic', href: '/groups/abc' },
      { label: 'Members' },
    ],
  },
};
