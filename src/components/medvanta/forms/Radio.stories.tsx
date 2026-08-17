import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';

const meta = {
  title: 'MedVanta/Forms/Radio',
  component: Radio,
  args: { label: 'Option A', name: 'demo', value: 'a' },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = { args: { defaultChecked: true } };

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true, label: 'Disabled (selected)' },
};

export const WithoutLabel: Story = { args: { label: undefined } };
