export type GameRunScoreboard = {
  score: number;
  correctGuesses: number;
  wrongGuesses: number;
  moviesCompleted: number;
  targetMovies: number;
  bestStreak: number;
  totalHintsUsed: number;
  totalSkipsUsed: number;
  badgeTitle: string;
  unlockedBadges: string[];
  playedAt: string;
};

export type SessionRecord = GameRunScoreboard & {
  id: string;
  userKey: string;
};

declare global {
  interface Window {
    netlifyIdentity?: {
      currentUser?: () => { id?: string; email?: string } | null;
    };
  }
}

const SESSION_STORAGE_KEY = "cine-cipher-user-sessions-v1";
const USER_FALLBACK_KEY = "cine-cipher-fallback-user-key";
const USER_TITLES_STORAGE_KEY = "cine-cipher-user-title-awards-v1";
const MAX_SESSION_ENTRIES = 25;
const SESSION_RETENTION_DAYS = 30;

const BADGE_MAP = [
  { threshold: 3, title: "Novice" },
  { threshold: 5, title: "Plot Decoder" },
  { threshold: 10, title: "Cipher Star" },
  { threshold: 50, title: "Cinema Legend" },
  { threshold: 100, title: "Cine Cipher Master" },
] as const;

type UserTitleMap = Record<string, string[]>;

const getUserTitleMap = (): UserTitleMap => {
  if (typeof window === "undefined") return {};

  const raw = window.localStorage.getItem(USER_TITLES_STORAGE_KEY);
  if (!raw) return {};

  const parsed = safeJsonParse(raw);
  return parsed && typeof parsed === "object" ? (parsed as UserTitleMap) : {};
};

const saveUserTitleMap = (map: UserTitleMap) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_TITLES_STORAGE_KEY, JSON.stringify(map));
};

export const getBadgeProgress = (correctGuesses: number, userKey: string) => {
  const achieved = BADGE_MAP
    .filter((badge) => correctGuesses >= badge.threshold)
    .map((badge) => `${badge.threshold} Movies · ${badge.title}`);

  const titleMap = getUserTitleMap();
  const alreadyAwarded = new Set(titleMap[userKey] ?? []);
  const newlyAwarded = achieved.filter((title) => !alreadyAwarded.has(title));

  if (newlyAwarded.length > 0) {
    titleMap[userKey] = [...alreadyAwarded, ...newlyAwarded];
    saveUserTitleMap(titleMap);
  }

  return {
    badgeTitle: newlyAwarded.at(-1) ?? "No new title",
    unlockedBadges: newlyAwarded,
  };
};

export const buildRunScoreboard = (
  run: Omit<GameRunScoreboard, "playedAt">
): GameRunScoreboard => ({
  ...run,
  playedAt: new Date().toISOString(),
});

const getExpiryCutoff = () => Date.now() - SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const normalizeRecords = (records: SessionRecord[]): SessionRecord[] => {
  const cutoff = getExpiryCutoff();

  return records
    .filter((record) => {
      const timestamp = new Date(record.playedAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
};

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getAllSessionRecords = (): SessionRecord[] => {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return [];

  const parsed = safeJsonParse(raw);
  if (!Array.isArray(parsed)) return [];

  return normalizeRecords(parsed as SessionRecord[]);
};

const persistAllSessionRecords = (records: SessionRecord[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizeRecords(records)));
};

const getOAuthUserKey = (): string | null => {
  if (typeof window === "undefined") return null;

  const netlifyUser = window.netlifyIdentity?.currentUser?.();
  if (netlifyUser?.id) return `oauth:${netlifyUser.id}`;

  const authToken = window.localStorage.getItem("auth_user_id")
    || window.localStorage.getItem("oauth_user_id")
    || window.localStorage.getItem("user_id");

  return authToken ? `oauth:${authToken}` : null;
};

export const getCurrentUserKey = (): string => {
  if (typeof window === "undefined") return "anon:server";

  const oauthKey = getOAuthUserKey();
  if (oauthKey) return oauthKey;

  const existing = window.localStorage.getItem(USER_FALLBACK_KEY);
  if (existing) return `anon:${existing}`;

  const created = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(USER_FALLBACK_KEY, created);
  return `anon:${created}`;
};

export const getUserSessionHistory = (userKey: string): SessionRecord[] => {
  return getAllSessionRecords()
    .filter((record) => record.userKey === userKey)
    .slice(0, MAX_SESSION_ENTRIES);
};

export const saveUserSessionRun = (
  run: GameRunScoreboard,
  userKey: string
): SessionRecord[] => {
  if (typeof window === "undefined") return [];

  const next: SessionRecord = {
    ...run,
    userKey,
    id: (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  const updated = normalizeRecords([...getAllSessionRecords(), next]);
  persistAllSessionRecords(updated);

  return updated.filter((record) => record.userKey === userKey).slice(0, MAX_SESSION_ENTRIES);
};

export const getLeaderboard = (): SessionRecord[] => {
  const userKey = getCurrentUserKey();
  return getUserSessionHistory(userKey);
};

export const saveLeaderboardRun = (run: GameRunScoreboard): SessionRecord[] => {
  const userKey = getCurrentUserKey();
  return saveUserSessionRun(run, userKey);
};