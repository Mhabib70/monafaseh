// In-memory challenge store for "چالش رقابت" (Random Rival Challenge).
// Challenges are ephemeral — they expire after 5 minutes if no one accepts.
// Uses globalThis to survive hot-reloads in development.

export interface ChallengeRequest {
  id: string;
  userId: string;
  fullName: string;
  avatarColor: string;
  avatarUrl: string | null;
  gender: string;
  recitationType: string;
  status: "pending" | "matched";
  sessionId?: string;
  createdAt: number;
  matchedAt?: number;
  matchedByUserId?: string;
  matchedByName?: string;
}

const FIVE_MIN_MS = 5 * 60 * 1000;

const globalForChallenges = globalThis as unknown as {
  __monafasehChallenges?: Map<string, ChallengeRequest>;
};

const challenges: Map<string, ChallengeRequest> =
  globalForChallenges.__monafasehChallenges ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForChallenges.__monafasehChallenges = challenges;
}

/** Remove expired pending challenges (> 5 min old). */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, c] of challenges) {
    if (c.status === "pending" && now - c.createdAt > FIVE_MIN_MS) {
      challenges.delete(id);
    }
    // Also cleanup matched challenges after 30 seconds (enough time for both
    // clients to poll and redirect).
    if (c.status === "matched" && c.matchedAt && now - c.matchedAt > 30_000) {
      challenges.delete(id);
    }
  }
}

export function announceChallenge(req: {
  userId: string;
  fullName: string;
  avatarColor: string;
  avatarUrl: string | null;
  gender: string;
  recitationType: string;
}): ChallengeRequest {
  cleanupExpired();

  // Remove any existing pending challenge from this user (only 1 at a time)
  for (const [id, c] of challenges) {
    if (c.userId === req.userId && c.status === "pending") {
      challenges.delete(id);
    }
  }

  const id = `ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const challenge: ChallengeRequest = {
    ...req,
    id,
    status: "pending",
    createdAt: Date.now(),
  };
  challenges.set(id, challenge);
  return challenge;
}

export function getActiveChallenges(excludeUserId?: string): ChallengeRequest[] {
  cleanupExpired();
  return Array.from(challenges.values()).filter(
    (c) => c.status === "pending" && c.userId !== excludeUserId,
  );
}

export function getMyChallenge(userId: string): ChallengeRequest | null {
  cleanupExpired();
  for (const c of challenges.values()) {
    if (c.userId === userId) return c;
  }
  return null;
}

export function cancelChallenge(challengeId: string, userId: string): boolean {
  const c = challenges.get(challengeId);
  if (!c || c.userId !== userId) return false;
  challenges.delete(challengeId);
  return true;
}

export function acceptChallenge(
  challengeId: string,
  accepter: {
    userId: string;
    fullName: string;
    avatarColor: string;
    avatarUrl: string | null;
    gender: string;
    recitationType: string;
  },
): ChallengeRequest | null {
  cleanupExpired();
  const c = challenges.get(challengeId);
  if (!c || c.status !== "pending") return null;
  // Don't allow accepting your own challenge
  if (c.userId === accepter.userId) return null;
  // Gender check: only same gender can challenge
  if (c.gender && accepter.gender && c.gender !== accepter.gender) return null;

  c.status = "matched";
  c.matchedAt = Date.now();
  c.matchedByUserId = accepter.userId;
  c.matchedByName = accepter.fullName;
  return c;
}
