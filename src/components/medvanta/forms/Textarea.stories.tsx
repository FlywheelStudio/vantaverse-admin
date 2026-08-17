import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta = {
  title: 'MedVanta/Forms/Textarea',
  component: Textarea,
  args: { placeholder: 'Enter notes…', rows: 4 },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ThreeRows: Story = { args: { rows: 3 } };

export const Invalid: Story = {
  args: { invalid: true, placeholder: 'Required field' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Read-only notes' },
};
