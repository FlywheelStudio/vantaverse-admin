import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';

const meta = {
  title: 'MedVanta/Navigation/Tabs',
  component: Tabs,
  args: {
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'details', label: 'Details' },
      { id: 'history', label: 'History' },
    ],
    defaultValue: 'overview',
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoTabs: Story = {
  args: {
    tabs: [
      { id: 'active', label: 'Active' },
      { id: 'archived', label: 'Archived' },
    ],
    defaultValue: 'active',
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      { id: 'general', label: 'General' },
      { id: 'security', label: 'Security' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'billing', label: 'Billing' },
      { id: 'integrations', label: 'Integrations' },
    ],
    defaultValue: 'general',
  },
};
