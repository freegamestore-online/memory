import { useState, useCallback } from "react";
import { Shell } from "./components/Shell";
import { Game } from "./components/Game";
import { Leaderboard } from "./components/Leaderboard";
import { useLeaderboard } from "./hooks/useLeaderboard";
import type { Difficulty } from "./components/Game";

type Phase = "menu" | "playing" | "over";

const BEST_SCORE_KEY = "freememory-best";

function getBestScore(): number {
  const v = localStorage.getItem(BEST_SCORE_KEY);
  return v ? parseInt(v, 10) : 0;
}

function computeScore(moves: number, seconds: number): number {
  return Math.max(0, 10000 - moves * 50 - seconds);
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(getBestScore);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameKey, setGameKey] = useState(0);
  const { topScores, recentScores, submitScore, loading } = useLeaderboard("memory");

  const handleWin = useCallback(
    (moves: number, seconds: number) => {
      const final = computeScore(moves, seconds);
      setScore(final);
      const best = getBestScore();
      if (final > best) {
        localStorage.setItem(BEST_SCORE_KEY, String(final));
        setBestScore(final);
      }
      submitScore(final);
      setPhase("over");
    },
    [submitScore],
  );

  const start = useCallback(() => {
    setScore(0);
    setGameKey((k) => k + 1);
    setPhase("playing");
  }, []);

  const changeDifficulty = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      if (phase !== "playing") return;
      // Restart with new difficulty
      setScore(0);
      setGameKey((k) => k + 1);
    },
    [phase],
  );

  return (
    <Shell
      sidebar={
        <nav className="flex-1 px-4 flex flex-col gap-3 py-4">
          <div className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            Score
          </div>
          <div
            className="text-3xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {score}
          </div>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Best: {bestScore}
          </div>

          {/* Difficulty selector */}
          <div className="mt-2">
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
              Difficulty
            </div>
            <div className="flex flex-col gap-1">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => changeDifficulty(d)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-left"
                  style={{
                    background: difficulty === d ? "var(--accent)" : "transparent",
                    color: difficulty === d ? "#fff" : "var(--muted)",
                  }}
                >
                  {d === "easy" ? "4\u00D74 (Easy)" : d === "medium" ? "5\u00D74 (Medium)" : "6\u00D75 (Hard)"}
                </button>
              ))}
            </div>
          </div>

          {phase !== "playing" && (
            <button
              onClick={start}
              className="mt-4 px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {phase === "menu" ? "Start" : "Play Again"}
            </button>
          )}
          <div
            className="mt-2 border-t"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="text-xs font-semibold px-4 pt-3" style={{ color: "var(--muted)" }}>
              Leaderboard
            </div>
            <Leaderboard topScores={topScores} recentScores={recentScores} loading={loading} />
          </div>
        </nav>
      }
      dock={
        <>
          <div className="text-sm font-semibold">
            Score: {score}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Best: {bestScore}
          </div>
        </>
      }
    >
      <div className="relative w-full h-full min-h-[400px]">
        {phase === "playing" ? (
          <Game key={gameKey} difficulty={difficulty} onWin={handleWin} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Memory
            </h1>
            {phase === "over" && (
              <p
                className="text-xl font-bold"
                style={{ color: "var(--success)", fontFamily: "Fraunces, serif" }}
              >
                You won! Score: {score}
              </p>
            )}
            <p style={{ color: "var(--muted)" }}>
              Flip cards and find matching pairs.
            </p>

            {/* Mobile difficulty selector */}
            <div className="flex gap-2 md:hidden">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg"
                  style={{
                    background: difficulty === d ? "var(--accent)" : "transparent",
                    color: difficulty === d ? "#fff" : "var(--muted)",
                    border: `1px solid ${difficulty === d ? "var(--accent)" : "var(--line)"}`,
                  }}
                >
                  {d === "easy" ? "4\u00D74" : d === "medium" ? "5\u00D74" : "6\u00D75"}
                </button>
              ))}
            </div>

            <button
              onClick={start}
              className="px-6 py-3 rounded-xl font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {phase === "menu" ? "Start Game" : "Play Again"}
            </button>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Press Space or Enter to start
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
