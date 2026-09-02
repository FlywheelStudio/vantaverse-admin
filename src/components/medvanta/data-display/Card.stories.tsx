import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../actions/Button';
import { Card, CardHeader } from './Card';

const meta = {
  title: 'MedVanta/Data display/Card',
  component: Card,
  args: { padding: 20 },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader title="Weekly compliance" subtitle="Last 7 days" />
      <p className="text-[length:var(--text-md)] text-[var(--text-body)]">
        Card body content goes here.
      </p>
    </Card>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader
        title="Members"
        subtitle="Active cohort"
        action={<Button size="sm" variant="secondary">View all</Button>}
      />
      <p className="text-[length:var(--text-md)] text-[var(--text-body)]">248 enrolled</p>
    </Card>
  ),
};

export const Interactive: Story = {
  args: { interactive: true },
  render: (args) => (
    <Card {...args}>
      <CardHeader title="Clickable card" subtitle="Hover to lift" />
      <p className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
        Interactive surface for navigation tiles.
      </p>
    </Card>
  ),
};
