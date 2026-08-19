import type { Meta, StoryObj } from '@storybook/react';
import { DashboardAppBarActions } from './index';

const meta = {
  title: 'Widgets/AppBarActions',
  component: DashboardAppBarActions,
} satisfies Meta<typeof DashboardAppBarActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
