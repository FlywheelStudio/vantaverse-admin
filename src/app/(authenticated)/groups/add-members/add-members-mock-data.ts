/** Mock pending invite row for add-members modal (no backend). */
export interface PendingInviteRow {
  id: string;
  email: string;
}

/**
 * Build a local pending-invite row after a mock email invite.
 */
export function createPendingInviteRow(email: string): PendingInviteRow {
  return {
    id: `pending-${email.toLowerCase()}`,
    email: email.trim(),
  };
}
