import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'MedVanta/Forms/Input',
  component: Input,
  args: { placeholder: 'Enter text…', size: 'md' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: 'sm', placeholder: 'Small input' } };

export const Large: Story = { args: { size: 'lg', placeholder: 'Large input' } };

export const WithIcons: Story = {
  args: {
    iconLeft: 'Search',
    iconRight: 'X',
    placeholder: 'Search patients…',
  },
};

export const Invalid: Story = {
  args: { invalid: true, placeholder: 'Invalid value' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Disabled field' },
};
