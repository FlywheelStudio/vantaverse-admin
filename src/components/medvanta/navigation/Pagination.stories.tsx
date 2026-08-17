import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta = {
  title: 'MedVanta/Navigation/Pagination',
  component: Pagination,
  args: { page: 1, pageCount: 10 },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstPage: Story = {};

export const MiddlePage: Story = { args: { page: 5, pageCount: 10 } };

export const LastPage: Story = { args: { page: 10, pageCount: 10 } };

export const SinglePage: Story = { args: { page: 1, pageCount: 1 } };

function InteractivePagination(): React.ReactElement {
  const [page, setPage] = useState(3);
  return <Pagination page={page} pageCount={8} onChange={setPage} />;
}

export const Interactive: Story = {
  render: () => <InteractivePagination />,
};
