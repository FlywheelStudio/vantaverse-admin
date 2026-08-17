import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'MedVanta/Forms/Checkbox',
  component: Checkbox,
  args: { label: 'Accept terms and conditions' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true, label: 'Disabled (checked)' },
};

export const WithoutLabel: Story = { args: { label: undefined } };
