"use client";

import { create } from "zustand";
import type {
  CompetitionParticipant,
  CompetitionState,
  CompetitionStatus,
  RecitationEntry,
  TahmeedRecord,
} from "@/lib/noorcraft/types";
import { getSurahVerseCount } from "@/lib/noorcraft/constants";

interface RecitationStore extends CompetitionState {
  // Live tahmeed during current reciter's turn
  liveTahmeeds: TahmeedRecord[];

  // Actions
  startCompetition: (config: {
    participants: CompetitionParticipant[];
    maqam: string;
    surah: string;
    startVerse: number;
  }) => void;
  selectEndVerse: (verse: number) => void;
  markRecited: () => void;
  passTurn: () => void;
  pauseCompetition: () => void;
  resumeCompetition: () => void;
  endCompetition: () => void;
  resetCompetition: () => void;
  changeMaqam: (maqam: string) => void;
  rateLastEntry: (rating: number) => void;
  rateLastEntryDetailed: (ratings: Record<string, number>) => void;
  sendTahmeed: (phraseId: string, phraseText: string, senderName: string, senderAvatarColor: string) => void;
  clearLiveTahmeeds: () => void;
  /**
   * Apply a state snapshot received from the host via WebRTC data channel.
   * This lets guests automatically join the active competition (rotation)
   * without having to click "شروع منافسه" themselves.
   */
  syncFromHost: (snapshot: Partial<CompetitionState>) => void;
  /** Returns a snapshot of the competition state for broadcasting to guests. */
  getSnapshot: () => Partial<CompetitionState>;
}

const initialState: CompetitionState = {
  participants: [],
  currentIndex: 0,
  currentRound: 1,
  currentMaqam: "",
  currentSurah: "",
  currentVerse: 1,
  selectedEndVerse: null,
  startedAt: 0,
  currentEntryStartedAt: null,
  status: "setup",
  history: [],
};

export const useRecitationStore = create<RecitationStore>((set, get) => ({
  ...initialState,
  liveTahmeeds: [],

  startCompetition: (config) => {
    const now = Date.now();
    set({
      participants: config.participants,
      currentIndex: 0,
      currentRound: 1,
      currentMaqam: config.maqam,
      currentSurah: config.surah,
      currentVerse: config.startVerse,
      selectedEndVerse: null,
      startedAt: now,
      currentEntryStartedAt: now,
      status: "active",
      history: [],
    });
  },

  selectEndVerse: (verse) => {
    const state = get();
    // Only allow selecting verses >= currentVerse (can't go backwards)
    if (verse < state.currentVerse) return;
    set({ selectedEndVerse: verse });
  },

  markRecited: () => {
    const state = get();
    if (state.status !== "active" || state.participants.length === 0) return;

    const currentParticipant = state.participants[state.currentIndex];
    if (!currentParticipant) return;

    const now = Date.now();
    const durationSec = state.currentEntryStartedAt
      ? Math.round((now - state.currentEntryStartedAt) / 1000)
      : 0;

    // Use selected end verse, or default to current verse if none selected
    const endVerse = state.selectedEndVerse ?? state.currentVerse;

    // Save to history with verse range and live tahmeeds
    const entry: RecitationEntry = {
      id: `re_${now}_${Math.random().toString(36).slice(2, 6)}`,
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      avatarColor: currentParticipant.avatarColor,
      surah: state.currentSurah,
      startVerse: state.currentVerse,
      endVerse: endVerse,
      maqam: state.currentMaqam,
      round: state.currentRound,
      orderInRound: state.currentIndex + 1,
      startedAt: state.currentEntryStartedAt ?? now,
      endedAt: now,
      durationSec,
      passed: false,
      tahmeedCount: state.liveTahmeeds.length,
      tahmeeds: [...state.liveTahmeeds],
    };

    // Next participant starts at endVerse + 1
    const nextIndex = (state.currentIndex + 1) % state.participants.length;
    const isNewRound = nextIndex === 0;
    const nextRound = isNewRound ? state.currentRound + 1 : state.currentRound;
    const nextVerse = endVerse + 1;
    const maxVerses = getSurahVerseCount(state.currentSurah);

    set({
      history: [...state.history, entry],
      currentIndex: nextIndex,
      currentRound: nextRound,
      currentVerse: nextVerse > maxVerses ? maxVerses : nextVerse,
      selectedEndVerse: null,
      currentEntryStartedAt: now,
      liveTahmeeds: [], // Clear live tahmeeds for next reciter
    });
  },

  passTurn: () => {
    const state = get();
    if (state.status !== "active" || state.participants.length === 0) return;

    const currentParticipant = state.participants[state.currentIndex];
    if (!currentParticipant) return;

    const now = Date.now();
    const durationSec = state.currentEntryStartedAt
      ? Math.round((now - state.currentEntryStartedAt) / 1000)
      : 0;

    // Save as passed — verse stays the same for next person
    const entry: RecitationEntry = {
      id: `re_${now}_pass_${Math.random().toString(36).slice(2, 6)}`,
      participantId: currentParticipant.id,
      participantName: currentParticipant.name,
      avatarColor: currentParticipant.avatarColor,
      surah: state.currentSurah,
      startVerse: state.currentVerse,
      endVerse: state.currentVerse, // Didn't recite, so start = end
      maqam: state.currentMaqam,
      round: state.currentRound,
      orderInRound: state.currentIndex + 1,
      startedAt: state.currentEntryStartedAt ?? now,
      endedAt: now,
      durationSec,
      passed: true,
    };

    // Move to next — verse stays the same (they didn't recite)
    const nextIndex = (state.currentIndex + 1) % state.participants.length;
    const isNewRound = nextIndex === 0;
    const nextRound = isNewRound ? state.currentRound + 1 : state.currentRound;

    set({
      history: [...state.history, entry],
      currentIndex: nextIndex,
      currentRound: nextRound,
      selectedEndVerse: null,
      currentEntryStartedAt: now,
      liveTahmeeds: [],
    });
  },

  pauseCompetition: () => set({ status: "paused" }),
  resumeCompetition: () => set({ status: "active", currentEntryStartedAt: Date.now() }),
  endCompetition: () => set({ status: "ended" }),

  resetCompetition: () => set({ ...initialState, liveTahmeeds: [] }),

  changeMaqam: (maqam) => set({ currentMaqam: maqam }),

  rateLastEntry: (rating) => {
    const state = get();
    if (state.history.length === 0) return;
    const lastEntry = state.history[state.history.length - 1];
    const updatedHistory = [...state.history];
    updatedHistory[updatedHistory.length - 1] = {
      ...lastEntry,
      rating: Math.max(0, Math.min(5, rating)),
    };
    set({ history: updatedHistory });
  },

  rateLastEntryDetailed: (ratings) => {
    const state = get();
    if (state.history.length === 0) return;
    const lastEntry = state.history[state.history.length - 1];
    const updatedHistory = [...state.history];
    updatedHistory[updatedHistory.length - 1] = {
      ...lastEntry,
      ratings,
      // Calculate overall rating as average
      rating:
        Object.values(ratings).reduce((sum, r) => sum + r, 0) /
        Math.max(1, Object.values(ratings).length),
    };
    set({ history: updatedHistory });
  },

  sendTahmeed: (phraseId, phraseText, senderName, senderAvatarColor) => {
    const tahmeed: TahmeedRecord = {
      id: `th_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      phraseId,
      phraseText,
      senderName,
      senderAvatarColor,
      timestamp: Date.now(),
    };
    set((s) => ({
      liveTahmeeds: [...s.liveTahmeeds, tahmeed].slice(-30), // Keep last 30
    }));
  },

  clearLiveTahmeeds: () => set({ liveTahmeeds: [] }),

  syncFromHost: (snapshot) => {
    // Apply only the fields the host broadcasts. Avoid overwriting local
    // history/tahmeeds because those are user-generated; the host's history
    // may also not be fully in sync.
    set((state) => ({
      participants: snapshot.participants ?? state.participants,
      currentIndex: snapshot.currentIndex ?? state.currentIndex,
      currentRound: snapshot.currentRound ?? state.currentRound,
      currentMaqam: snapshot.currentMaqam ?? state.currentMaqam,
      currentSurah: snapshot.currentSurah ?? state.currentSurah,
      currentVerse: snapshot.currentVerse ?? state.currentVerse,
      selectedEndVerse:
        snapshot.selectedEndVerse !== undefined
          ? snapshot.selectedEndVerse
          : state.selectedEndVerse,
      startedAt: snapshot.startedAt ?? state.startedAt,
      currentEntryStartedAt:
        snapshot.currentEntryStartedAt !== undefined
          ? snapshot.currentEntryStartedAt
          : state.currentEntryStartedAt,
      status: snapshot.status ?? state.status,
    }));
  },

  getSnapshot: () => {
    const s = get();
    return {
      participants: s.participants,
      currentIndex: s.currentIndex,
      currentRound: s.currentRound,
      currentMaqam: s.currentMaqam,
      currentSurah: s.currentSurah,
      currentVerse: s.currentVerse,
      selectedEndVerse: s.selectedEndVerse,
      startedAt: s.startedAt,
      currentEntryStartedAt: s.currentEntryStartedAt,
      status: s.status,
    };
  },
}));

// Selector helpers
export function getCurrentParticipant(state: CompetitionState): CompetitionParticipant | null {
  return state.participants[state.currentIndex] ?? null;
}

export function getNextParticipants(
  state: CompetitionState,
  count: number = 3,
): CompetitionParticipant[] {
  const result: CompetitionParticipant[] = [];
  // If only 1 participant (or none), there is no "next" — return empty.
  // Showing the same participant multiple times is misleading.
  if (state.participants.length <= 1) {
    return result;
  }

  // Limit the requested count to (participants.length - 1) so we never include
  // the current participant in the "next" list.
  const effectiveCount = Math.min(count, state.participants.length - 1);

  const seenIds = new Set<string>();
  for (let i = 1; i <= effectiveCount; i++) {
    const idx = (state.currentIndex + i) % state.participants.length;
    const p = state.participants[idx];
    if (p && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      result.push(p);
    }
    if (result.length >= effectiveCount) break;
  }
  return result;
}

export function getHistoryByRound(
  history: RecitationEntry[],
  round: number,
): RecitationEntry[] {
  return history.filter((h) => h.round === round);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} ثانیه`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper: format verse range for display
export function formatVerseRange(start: number, end: number): string {
  if (start === end) return `آیه ${start.toLocaleString("fa-IR")}`;
  return `آیات ${start.toLocaleString("fa-IR")}-${end.toLocaleString("fa-IR")}`;
}
