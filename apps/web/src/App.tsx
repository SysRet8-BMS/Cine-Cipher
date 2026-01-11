import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const answer = "THE DARK KNIGHT";
  const MAX_HINTS = 2;

  // revealed array auto-sized to the answer; spaces are considered already "revealed"
  const [revealed, setRevealed] = useState(() =>
    Array.from(answer).map((c) => c === " ")
  );
  const [time, setTime] = useState(30); // example starting time (adjust as needed)
  const [pulse, setPulse] = useState(false);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState("");

  // Countdown timer with a small pulse animation on each tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => {
        const next = t > 0 ? t - 1 : 0;
        setPulse(true);
        // remove pulse quickly so it can re-trigger on next tick
        setTimeout(() => setPulse(false), 260);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch hint from backend (Netlify function) when component mounts
  useEffect(() => {
    const fetchHint = async () => {
      try {
        const q = encodeURIComponent(answer);
        const res = await fetch(`/.netlify/functions/game-api?query=${q}`);
        if (!res.ok) {
          console.warn("Hint fetch failed", res.status);
          setHintText("No hint available");
          return;
        }
        const data = await res.json();
        const text = data?.hints?.[0] || "";
        console.log("HINT FROM API:", data?.hints, data);
        setHintText(text || "No hint available");
      } catch (e) {
        console.error("Hint fetch error:", e);
        setHintText("No hint available");
      }
    };

    fetchHint();
  }, [answer]);

  const submitGuess = () => {
    setAttempts((a) => a + 1);
    if (guess.trim().toUpperCase() === answer) {
      alert("Correct!");
    } else {
      alert("Wrong guess");
    }
    setGuess("");
  };

  const revealLetter = () => {
    if (hintsUsed >= MAX_HINTS) return;
    const idx = Array.from(answer).findIndex(
      (ch, i) => ch !== " " && !revealed[i]
    );
    if (idx !== -1) {
      setRevealed((prev) => {
        const copy = [...prev];
        copy[idx] = true;
        return copy;
      });
      setHintsUsed((h) => h + 1);
    }
  };

  return (
    <div className="app">
      <div className="card neon">

        <h1 className="title">CINE CIPHER</h1>

        <div className="tabs">
          <button className="tab active">📽 Movies</button>
          <button className="tab">𝄞 Songs</button>
        </div>

        <div className="stats">
          <span>Attempts: {attempts}</span>
          <span>Hints Used: {hintsUsed}</span>
          <span>Total: 0</span>
        </div>

        <div className={`timer ${pulse ? "pulse" : ""}`}>
          <div className="stopwatch">⏱</div>
          <div className="time-text">
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
          </div>
        </div>

        {/* Word: each character gets its own span */}
        <div className="word" aria-label="puzzle word">
          {Array.from(answer).map((c, i) => {
            const isSpace = c === " ";
            const showChar = revealed[i] && !isSpace ? c : "";
            return (
              <span
                key={i}
                className={`letter ${isSpace ? "space" : ""} ${
                  revealed[i] && !isSpace ? "revealed" : ""
                }`}
                aria-hidden={isSpace ? true : false}
              >
                {showChar}
              </span>
            );
          })}
        </div>

        <div className="hint">
  <strong>💡 Hint:</strong>
  <div className="hint-box">
    <span className="hint-text">{hintText}</span>
  </div>
</div>

        <h3 className="prompt">Guess the movie!</h3>

        <input
          className="guess-input"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess..."
        />

        <div className="buttons">
          <button className="btn submit" onClick={submitGuess}>
            Submit Guess
          </button>
          <button
            className="btn reveal"
            onClick={revealLetter}
            disabled={hintsUsed >= MAX_HINTS}
            aria-disabled={hintsUsed >= MAX_HINTS}
            title={
              hintsUsed >= MAX_HINTS
                ? "No hints left"
                : `Reveal Letter (${MAX_HINTS - hintsUsed} left)`
            }
          >
            👁 Reveal Letter ({MAX_HINTS - hintsUsed} left)
          </button>
        </div>
      </div>
    </div>
  );
}