// In-memory invitation store for session invitations.
// Uses globalThis to survive hot-reloads in development.

export interface Invitation {
  id: string;
  sessionId: string;
  sessionTitle: string;
  jitsiRoom: string;
  // Inviter info
  inviterId: string;
  inviterName: string;
  inviterAvatarColor: string;
  // Invitee info
  inviteeId: string;
  inviteeName: string;
  // Status
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  respondedAt?: number;
}

const FIVE_MIN_MS = 5 * 60 * 1000;

const globalForInvitations = globalThis as unknown as {
  __monafasehInvitations?: Map<string, Invitation>;
};

const invitations: Map<string, Invitation> =
  globalForInvitations.__monafasehInvitations ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForInvitations.__monafasehInvitations = invitations;
}

function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, inv] of invitations) {
    if (inv.status === "pending" && now - inv.createdAt > FIVE_MIN_MS) {
      invitations.delete(id);
    }
    // Cleanup responded invitations after 60 seconds
    if (inv.status !== "pending" && inv.respondedAt && now - inv.respondedAt > 60_000) {
      invitations.delete(id);
    }
  }
}

export function createInvitation(req: {
  sessionId: string;
  sessionTitle: string;
  jitsiRoom: string;
  inviterId: string;
  inviterName: string;
  inviterAvatarColor: string;
  inviteeId: string;
  inviteeName: string;
}): Invitation {
  cleanupExpired();

  // Don't allow duplicate pending invitations to the same user for the same session
  for (const [id, inv] of invitations) {
    if (
      inv.inviteeId === req.inviteeId &&
      inv.sessionId === req.sessionId &&
      inv.status === "pending"
    ) {
      return inv; // Return existing
    }
  }

  const id = `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const invitation: Invitation = {
    ...req,
    id,
    status: "pending",
    createdAt: Date.now(),
  };
  invitations.set(id, invitation);
  return invitation;
}

export function getPendingInvitations(userId: string): Invitation[] {
  cleanupExpired();
  return Array.from(invitations.values()).filter(
    (inv) => inv.inviteeId === userId && inv.status === "pending",
  );
}

/** Get invitations sent by a user that have been responded to (for notification). */
export function getRespondedInvitations(userId: string): Invitation[] {
  cleanupExpired();
  return Array.from(invitations.values()).filter(
    (inv) => inv.inviterId === userId && inv.status !== "pending" && inv.respondedAt,
  );
}

/** Mark an invitation as responded so the inviter's poll can pick it up. */
export function markInvitationSeen(invitationId: string): void {
  const inv = invitations.get(invitationId);
  if (inv) {
    invitations.delete(invitationId);
  }
}

export function acceptInvitation(
  invitationId: string,
  userId: string,
): Invitation | null {
  cleanupExpired();
  const inv = invitations.get(invitationId);
  if (!inv || inv.inviteeId !== userId || inv.status !== "pending") return null;
  inv.status = "accepted";
  inv.respondedAt = Date.now();
  return inv;
}

export function declineInvitation(
  invitationId: string,
  userId: string,
): Invitation | null {
  cleanupExpired();
  const inv = invitations.get(invitationId);
  if (!inv || inv.inviteeId !== userId || inv.status !== "pending") return null;
  inv.status = "declined";
  inv.respondedAt = Date.now();
  return inv;
}
