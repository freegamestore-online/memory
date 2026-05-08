import { useState, useCallback } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { Game } from "./components/Game";
import type { Difficulty } from "./components/Game";

const BEST_SCORE_KEY = "freememory-best";

function getBestScore(): number {
  const v = localStorage.getItem(BEST_SCORE_KEY);
  return v ? parseInt(v, 10) : 0;
}

function computeScore(moves: number, seconds: number): number {
  return Math.max(0, 10000 - moves * 50 - seconds);
}

export default function App() {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(getBestScore);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameKey, setGameKey] = useState(0);

  const handleWin = useCallback(
    (moves: number, seconds: number) => {
      const final = computeScore(moves, seconds);
      setScore(final);
      const best = getBestScore();
      if (final > best) {
        localStorage.setItem(BEST_SCORE_KEY, String(final));
        setBestScore(final);
      }
      setPhase("over");
    },
    [],
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
    <GameShell
      topbar={
        <GameTopbar
          title="Memory"
          stats={[
            { label: "Score", value: score, accent: true },
            { label: "Best", value: bestScore },
          ]}
          rules={
            <div>
              <h3 style={{marginBottom:'0.5rem',fontWeight:700}}>Memory</h3>
              <p>Flip cards and find all matching pairs.</p>
              <h4 style={{marginTop:'0.75rem',fontWeight:600}}>Controls</h4>
              <ul style={{paddingLeft:'1.2rem',marginTop:'0.25rem'}}>
                <li>Tap or click to flip a card</li>
              </ul>
              <h4 style={{marginTop:'0.75rem',fontWeight:600}}>Rules</h4>
              <ul style={{paddingLeft:'1.2rem',marginTop:'0.25rem'}}>
                <li>Flip two cards at a time</li>
                <li>Match all pairs to win</li>
                <li>Fewer moves = better score</li>
                <li>Three grid sizes to choose from</li>
              </ul>
            </div>
          }
          actions={<GameAuth />}
        />
      }
    >
      <div className="relative w-full h-full">
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

            {/* Difficulty selector */}
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => changeDifficulty(d)}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg"
                  style={{
                    background: difficulty === d ? "var(--accent)" : "var(--panel)",
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
    </GameShell>
  );
}
