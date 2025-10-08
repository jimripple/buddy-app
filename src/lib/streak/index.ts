import { differenceInCalendarDays } from "date-fns";

export type DailyStat = {
  date: string;
  words_written: number;
  streak: number;
};

type StreakInput = {
  todayDate: string;
  todayWords: number;
  goal?: number | null;
  previousStat?: DailyStat | null;
};

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

export function hasMetGoal(words: number, goal?: number | null) {
  if (!goal || goal <= 0) {
    return words > 0;
  }
  return words >= goal;
}

export function computeNextStreak({
  todayDate,
  todayWords,
  goal,
  previousStat,
}: StreakInput) {
  if (!hasMetGoal(todayWords, goal)) {
    return 0;
  }

  if (!previousStat || !hasMetGoal(previousStat.words_written, goal)) {
    return 1;
  }

  const today = new Date(todayDate);
  const previous = new Date(previousStat.date);
  const diff = differenceInCalendarDays(today, previous);

  if (diff === 1) {
    return previousStat.streak + 1;
  }

  return 1;
}

type DailyUpdateInput = {
  currentWords: number;
  delta: number;
  todayDate: string;
  goal?: number | null;
  previousStat?: DailyStat | null;
};

export function calculateDailyUpdate({
  currentWords,
  delta,
  todayDate,
  goal,
  previousStat,
}: DailyUpdateInput) {
  const nextWords = Math.max(0, currentWords + delta);
  const streak = computeNextStreak({
    todayDate,
    todayWords: nextWords,
    goal,
    previousStat,
  });

  return {
    words: nextWords,
    streak,
    metGoal: hasMetGoal(nextWords, goal),
  };
}
