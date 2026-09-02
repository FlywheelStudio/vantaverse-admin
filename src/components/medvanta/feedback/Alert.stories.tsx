import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta = {
  title: 'MedVanta/Feedback/Alert',
  component: Alert,
  args: {
    kind: 'info',
    title: 'Information',
    children: 'This is an informational message for the user.',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Success: Story = {
  args: {
    kind: 'success',
    title: 'Saved successfully',
    children: 'Your changes have been saved.',
  },
};

export const Warning: Story = {
  args: {
    kind: 'warning',
    title: 'Review required',
    children: 'Some fields need attention before submitting.',
  },
};

export const Danger: Story = {
  args: {
    kind: 'danger',
    title: 'Action failed',
    children: 'Unable to complete the request. Please try again.',
  },
};

export const WithClose: Story = {
  args: { onClose: (): void => undefined },
};

export const TitleOnly: Story = {
  args: { children: undefined, title: 'Session expiring soon' },
};
