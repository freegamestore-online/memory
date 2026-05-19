import { useState, useEffect, useRef, useCallback } from "react";
import { useGameSounds } from "@freegamestore/games";

const EMOJI_SET = [
  "\u{1F436}","\u{1F431}","\u{1F42D}","\u{1F439}","\u{1F430}","\u{1F98A}","\u{1F43B}","\u{1F43C}",
  "\u{1F428}","\u{1F42F}","\u{1F981}","\u{1F42E}","\u{1F437}","\u{1F438}","\u{1F435}","\u{1F414}",
  "\u{1F427}","\u{1F426}","\u{1F986}","\u{1F985}","\u{1F989}","\u{1F987}","\u{1F43A}","\u{1F417}",
  "\u{1F434}","\u{1F984}","\u{1F41D}","\u{1F41B}","\u{1F98B}","\u{1F40C}","\u{1F41E}","\u{1F41C}",
  "\u{1F997}","\u{1F577}","\u{1F982}","\u{1F422}","\u{1F40D}","\u{1F98E}","\u{1F996}","\u{1F995}",
  "\u{1F419}","\u{1F991}","\u{1F990}","\u{1F980}",
];

type Difficulty = "easy" | "medium" | "hard";

interface DifficultyConfig {
  cols: number;
  rows: number;
  label: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy:   { cols: 4, rows: 4, label: "4\u00D74 (Easy)" },
  medium: { cols: 5, rows: 4, label: "5\u00D74 (Medium)" },
  hard:   { cols: 6, rows: 5, label: "6\u00D75 (Hard)" },
};

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildDeck(cols: number, rows: number): Card[] {
  const pairCount = (cols * rows) / 2;
  const emojis = shuffle(EMOJI_SET).slice(0, pairCount);
  const deck = shuffle([...emojis, ...emojis]);
  return deck.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

interface GameProps {
  difficulty: Difficulty;
  onWin: (moves: number, seconds: number) => void;
}

export type { Difficulty };

export function Game({ difficulty, onWin }: GameProps) {
  const config = DIFFICULTIES[difficulty];
  const [cards, setCards] = useState<Card[]>(() => buildDeck(config.cols, config.rows));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const sounds = useGameSounds();
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  // Reset when difficulty changes
  useEffect(() => {
    setCards(buildDeck(config.cols, config.rows));
    setSelected([]);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    setWon(false);
    lockRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  }, [config.cols, config.rows]);

  // Timer
  useEffect(() => {
    if (started && !won) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [started, won]);

  const handleClick = useCallback(
    (id: number) => {
      if (lockRef.current) return;
      if (won) return;

      const card = cards[id];
      if (!card || card.flipped || card.matched) return;

      if (!started) setStarted(true);

      const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
      setCards(next);
      soundsRef.current.playTick();

      const newSelected = [...selected, id];
      setSelected(newSelected);

      if (newSelected.length === 2) {
        const first = next[newSelected[0]!]!;
        const second = next[newSelected[1]!]!;
        const newMoves = moves + 1;
        setMoves(newMoves);

        if (first.emoji === second.emoji) {
          // Match
          const matched = next.map((c) =>
            c.id === first.id || c.id === second.id ? { ...c, matched: true } : c,
          );
          setCards(matched);
          setSelected([]);
          soundsRef.current.playClear();

          // Check win
          if (matched.every((c) => c.matched)) {
            setWon(true);
            soundsRef.current.playLevelUp();
          }
        } else {
          // No match — flip back after delay
          lockRef.current = true;
          soundsRef.current.playError();
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c,
              ),
            );
            setSelected([]);
            lockRef.current = false;
          }, 800);
        }
      }
    },
    [cards, selected, moves, started, won],
  );

  // Notify parent on win
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;
  useEffect(() => {
    if (won) {
      onWinRef.current(moves, seconds);
    }
  }, [won, moves, seconds]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 h-full">
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm font-semibold" style={{ color: "var(--muted)" }}>
        <span>Moves: {moves}</span>
        <span>Time: {seconds}s</span>
      </div>

      {/* Card grid */}
      <div
        className="grid gap-2 w-full max-w-[520px]"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          perspective: "1000px",
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleClick(card.id)}
            className="relative aspect-square"
            style={{ minWidth: 60, minHeight: 60 }}
            aria-label={card.flipped || card.matched ? card.emoji : "Hidden card"}
          >
            <div
              className="w-full h-full transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: card.flipped || card.matched ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Card back */}
              <div
                className="absolute inset-0 rounded-xl flex items-center justify-center backface-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  background: "var(--accent)",
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 16px)",
                  border: "2px solid var(--line-strong)",
                  cursor: "pointer",
                }}
              />
              {/* Card front */}
              <div
                className="absolute inset-0 rounded-xl flex items-center justify-center backface-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  background: "var(--paper)",
                  border: card.matched ? "2px solid var(--success)" : "2px solid var(--line-strong)",
                  boxShadow: card.matched ? "0 0 12px var(--success)" : "none",
                  animation: card.matched ? "matchBounce 0.4s ease" : "none",
                  fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                  cursor: "default",
                }}
              >
                {card.emoji}
              </div>
            </div>
          </button>
        ))}
      </div>

      {won && (
        <div
          className="text-lg font-bold mt-2"
          style={{ fontFamily: "Fraunces, serif", color: "var(--success)" }}
        >
          All pairs found!
        </div>
      )}

      {/* Match bounce keyframes */}
      <style>{`
        @keyframes matchBounce {
          0% { transform: rotateY(180deg) scale(1); }
          50% { transform: rotateY(180deg) scale(1.1); }
          100% { transform: rotateY(180deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
