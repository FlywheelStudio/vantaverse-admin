import type { Meta, StoryObj } from '@storybook/react';
import { SidebarNavItem } from './SidebarNavItem';

const meta = {
  title: 'MedVanta/Navigation/SidebarNavItem',
  component: SidebarNavItem,
  args: {
    icon: 'LayoutDashboard',
    label: 'Dashboard',
  },
  decorators: [
    (Story) => (
      <div className="w-56 rounded-[var(--radius-lg)] bg-[var(--surface-card)] p-2 shadow-[var(--shadow-sm)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SidebarNavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = { args: { active: true } };

export const WithBadge: Story = {
  args: { icon: 'MessageSquare', label: 'Messages', badge: true },
};

export const ActiveWithBadge: Story = {
  args: { icon: 'MessageSquare', label: 'Messages', active: true, badge: true },
};

export const Collapsed: Story = {
  args: { collapsed: true, active: true },
};

export const NavGroup: Story = {
  render: () => (
    <div className="flex w-56 flex-col gap-1 rounded-[var(--radius-lg)] bg-[var(--surface-card)] p-2 shadow-[var(--shadow-sm)]">
      <SidebarNavItem icon="LayoutDashboard" label="Dashboard" active />
      <SidebarNavItem icon="Users" label="Members" />
      <SidebarNavItem icon="Building2" label="Groups" />
      <SidebarNavItem icon="MessageSquare" label="Messages" badge />
    </div>
  ),
};
