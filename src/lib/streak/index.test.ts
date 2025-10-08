import { calculateDailyUpdate, computeNextStreak, countWords, hasMetGoal } from "./index";

describe("countWords", () => {
  it("returns zero for empty content", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("counts words separated by spaces and newlines", () => {
    const value = "Hello world\nthis is a test";
    expect(countWords(value)).toBe(6);
  });
});

describe("hasMetGoal", () => {
  it("treats any writing as progress when no goal", () => {
    expect(hasMetGoal(0, null)).toBe(false);
    expect(hasMetGoal(10, null)).toBe(true);
  });

  it("requires reaching the goal when provided", () => {
    expect(hasMetGoal(400, 500)).toBe(false);
    expect(hasMetGoal(500, 500)).toBe(true);
  });
});

describe("computeNextStreak", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);

  it("resets when goal is not met", () => {
    expect(
      computeNextStreak({
        todayDate: todayStr,
        todayWords: 0,
        goal: 500,
        previousStat: {
          date: yesterdayStr,
          words_written: 600,
          streak: 5,
        },
      })
    ).toBe(0);
  });

  it("starts a new streak when no previous day", () => {
    expect(
      computeNextStreak({ todayDate: todayStr, todayWords: 600, goal: 500 })
    ).toBe(1);
  });

  it("increments streak when yesterday met the goal", () => {
    expect(
      computeNextStreak({
        todayDate: todayStr,
        todayWords: 600,
        goal: 500,
        previousStat: {
          date: yesterdayStr,
          words_written: 700,
          streak: 2,
        },
      })
    ).toBe(3);
  });

  it("resets to 1 if there was a gap day", () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(
      computeNextStreak({
        todayDate: todayStr,
        todayWords: 600,
        goal: 500,
        previousStat: {
          date: twoDaysAgo.toISOString().slice(0, 10),
          words_written: 700,
          streak: 5,
        },
      })
    ).toBe(1);
  });
});

describe("calculateDailyUpdate", () => {
  const todayStr = new Date().toISOString().slice(0, 10);

  it("adds delta and clamps to zero", () => {
    expect(
      calculateDailyUpdate({
        currentWords: 200,
        delta: -500,
        todayDate: todayStr,
        goal: 500,
      }).words
    ).toBe(0);
  });

  it("computes streak with provided previous stat", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = calculateDailyUpdate({
      currentWords: 400,
      delta: 200,
      todayDate: todayStr,
      goal: 500,
      previousStat: {
        date: yesterday.toISOString().slice(0, 10),
        words_written: 500,
        streak: 2,
      },
    });
    expect(result.words).toBe(600);
    expect(result.streak).toBe(3);
  });
});
