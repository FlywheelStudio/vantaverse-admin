import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../actions/Button';
import { Dialog } from './Dialog';

const meta = {
  title: 'MedVanta/Feedback/Dialog',
  component: Dialog,
  args: {
    open: true,
    title: 'Confirm action',
    children: 'Are you sure you want to proceed? This cannot be undone.',
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </>
    ),
    onClose: (): void => undefined,
  },
};

export const Wide: Story = {
  args: {
    width: 640,
    title: 'Patient details',
    children: 'Review the patient information before assigning the program.',
    footer: <Button variant="accent">Assign program</Button>,
  },
};

export const NoClose: Story = {
  args: {
    onClose: undefined,
    title: 'Processing',
    children: 'Please wait while we save your changes…',
  },
};
