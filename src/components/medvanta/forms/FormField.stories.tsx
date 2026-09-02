import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { Input } from './Input';

const meta = {
  title: 'MedVanta/Forms/FormField',
  component: FormField,
  args: {
    label: 'Email address',
    htmlFor: 'email',
    hint: 'We will never share your email.',
    required: true,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHint: Story = {
  render: (args) => (
    <FormField {...args}>
      <Input id="email" placeholder="you@example.com" />
    </FormField>
  ),
};

export const WithError: Story = {
  args: { hint: undefined, error: 'Email is required.' },
  render: (args) => (
    <FormField {...args}>
      <Input id="email" placeholder="you@example.com" invalid />
    </FormField>
  ),
};

export const WithoutLabel: Story = {
  args: { label: undefined, required: false },
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="Anonymous input" />
    </FormField>
  ),
};
