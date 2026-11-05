import { useState, useCallback } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { DIFFICULTIES, Game } from "./components/Game";
import type { Difficulty } from "./components/Game";

// Easy keeps the original key: it was the only size playable before the selector returned.
function bestScoreKey(difficulty: Difficulty): string {
  return difficulty === "easy" ? "freememory-best" : `freememory-best-${difficulty}`;
}

function getBestScore(difficulty: Difficulty): number {
  const v = localStorage.getItem(bestScoreKey(difficulty));
  return v ? parseInt(v, 10) : 0;
}

function computeScore(moves: number, seconds: number): number {
  return Math.max(0, 10000 - moves * 50 - seconds);
}

export default function App() {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("playing");
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [bestScore, setBestScore] = useState(() => getBestScore("easy"));
  const [gameKey, setGameKey] = useState(0);

  const handleWin = useCallback(
    (moves: number, seconds: number) => {
      const final = computeScore(moves, seconds);
      setScore(final);
      if (final > getBestScore(difficulty)) {
        localStorage.setItem(bestScoreKey(difficulty), String(final));
        setBestScore(final);
      }
      setPhase("over");
    },
    [difficulty],
  );

  const start = useCallback(() => {
    setScore(0);
    setGameKey((k) => k + 1);
    setPhase("playing");
  }, []);

  const changeDifficulty = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      setBestScore(getBestScore(d));
      start();
    },
    [start],
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
          onRestart={start}
          actions={<GameAuth />}
        />
      }
    >
      <div className="relative w-full h-full flex flex-col">
        <div className="flex justify-center gap-2 pt-4 shrink-0" role="group" aria-label="Grid size">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => changeDifficulty(d)}
              aria-pressed={difficulty === d}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg min-h-[2.75rem]"
              style={{
                background: difficulty === d ? "var(--accent)" : "var(--panel)",
                color: difficulty === d ? "#fff" : "var(--muted)",
                border: `1px solid ${difficulty === d ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              {DIFFICULTIES[d].label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          <Game key={gameKey} difficulty={difficulty} onWin={handleWin} />
        </div>
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.55)" }}>
            <p
              className="text-xl font-bold"
              style={{ color: "var(--success)", fontFamily: "Fraunces, serif" }}
            >
              You won! Score: {score}
            </p>
            <button
              onClick={start}
              className="px-6 py-3 rounded-xl font-semibold min-h-[2.75rem]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
