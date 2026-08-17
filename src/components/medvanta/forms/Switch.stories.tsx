import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta = {
  title: 'MedVanta/Forms/Switch',
  component: Switch,
  args: { label: 'Enable notifications' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = { args: { defaultChecked: true } };

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true, label: 'Disabled (on)' },
};

export const WithoutLabel: Story = { args: { label: undefined } };
