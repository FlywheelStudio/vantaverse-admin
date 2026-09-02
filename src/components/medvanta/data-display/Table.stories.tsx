import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { Table, type TableColumn } from './Table';

interface MemberRow extends Record<string, unknown> {
  name: string;
  status: string;
  role: string;
}

const columns: TableColumn<MemberRow>[] = [
  { key: 'name', header: 'Name' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge tone={row.status === 'Active' ? 'success' : 'warning'}>{row.status}</Badge>
    ),
  },
  { key: 'role', header: 'Role', align: 'right' },
];

const rows: MemberRow[] = [
  { name: 'Jane Doe', status: 'Active', role: 'Admin' },
  { name: 'Alex Kim', status: 'Pending', role: 'Coach' },
  { name: 'Sam Rivera', status: 'Active', role: 'Member' },
];

const meta = {
  title: 'MedVanta/Data display/Table',
  component: Table,
  args: { columns, rows },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ClickableRows: Story = {
  args: {
    onRowClick: () => undefined,
  },
};
