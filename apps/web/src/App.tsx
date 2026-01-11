import { useEffect, useState } from "react";
import "./App.css";
import Applause from "./components/Applause";

export default function App() {
  const MOVIES = [
    "THE DARK KNIGHT",
    "INCEPTION",
    "PULP FICTION",
    "GLADIATOR",
    "INTERSTELLAR",
    "KPOP DEMON HUNTERS",
    "AVENGERS ENDGAME",
    "FORREST GUMP",
    "THE GOD FATHER",
    "LIFE OF PI",
    "THE SHAWSHANK REDEMPTION",
    "TITANIC",
    "GANGUBAI KATHIAWADI",
    "PUSHPA THE RISE",
    "OPPENHEIMER",
    "SHUTTER ISLAND",
    "THE MATRIX",
    "WHIPLASH",
    "VIOLET EVERGARDEN",
    "FIVE FEET APART",
    "GOOD WILL HUNTING",
    "LA LA LAND",
    "THE SOCIAL NETWORK", 
    "THE WOLF OF WALL STREET",  
    "JOKER",
    "TRUMAN SHOW",
    "PRIDE AND PREJUDICE",  
    "ETERNAL SUNSHINE OF THE SPOTLESS MIND",
    
  ];

  const TIMER_START = 45;
  const MAX_HINTS = 4;
  const STOP_WORDS = ["THE", "OF", "IS", "A", "AN", "AND", "TO", "IN"];

  const [movieIndex, setMovieIndex] = useState(0);
  const [answer, setAnswer] = useState(MOVIES[0]);
  const [revealed, setRevealed] = useState([]);
  const [time, setTime] = useState(TIMER_START);
  const [pulse, setPulse] = useState(false);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [result, setResult] = useState(null);

  /* 🔒 Remove title words from hint (except stop words) */
  const sanitizeHint = (hint, title) => {
    if (!hint) return hint;

    let cleaned = hint;
    title
      .toUpperCase()
      .split(" ")
      .filter(w => w && !STOP_WORDS.includes(w))
      .forEach(word => {
        cleaned = cleaned.replace(
          new RegExp(`\\b${word}\\b`, "gi"),
          "_".repeat(word.length)
        );
      });

    return cleaned;
  };

  /* 🔄 Reset state when movie changes */
  useEffect(() => {
    setRevealed(Array.from(answer).map(c => c === " "));
    setHintsUsed(0);
    setAttempts(0);
    setGuess("");
    setResult(null);
    setTime(TIMER_START);
  }, [answer]);

  /* ⏱ TIMER — auto move on timeout */
  useEffect(() => {
    if (celebrate) return; // pause timer during confetti

    const interval = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(interval);
          moveToNext(); 
          return TIMER_START;
        }
        setPulse(true);
        setTimeout(() => setPulse(false), 200);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [answer, celebrate]);

  /* 💡 Fetch & sanitize hint */
  useEffect(() => {
    const fetchHint = async () => {
      try {
        const q = encodeURIComponent(answer);
        const res = await fetch(`/.netlify/functions/game-api?query=${q}`);
        const data = await res.json();
        const rawHint = data?.hints?.[0] || "No hint available";
        setHintText(sanitizeHint(rawHint, answer));
      } catch {
        setHintText("No hint available");
      }
    };
    fetchHint();
  }, [answer]);

  /* ⏭️ Move to next movie */
  const moveToNext = () => {
    setMovieIndex(i => {
      const next = (i + 1) % MOVIES.length;
      setAnswer(MOVIES[next]);
      return next;
    });
  };

  /* ✅ Submit Guess */
  const submitGuess = () => {
    setAttempts(a => a + 1);

    if (guess.trim().toUpperCase() === answer) {
      setResult({ text: "Correct!", type: "right" });
      setCelebrate(true); 
    } else {
      setResult({ text: "Wrong guess", type: "wrong" });
    }

    setGuess("");
  };

  /* ⏳ Auto-hide result text */
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 2500);
    return () => clearTimeout(t);
  }, [result]);

  const revealLetter = () => {
  if (hintsUsed >= MAX_HINTS) return;

  // collect all unrevealed, non-space indexes
  const unrevealedIndexes = Array.from(answer)
    .map((c, i) => (c !== " " && !revealed[i] ? i : -1))
    .filter(i => i !== -1);

  if (unrevealedIndexes.length === 0) return;

  // pick a random index
  const randomIdx =
    unrevealedIndexes[Math.floor(Math.random() * unrevealedIndexes.length)];

  setRevealed(prev => {
    const copy = [...prev];
    copy[randomIdx] = true;
    return copy;
  });

  setHintsUsed(h => h + 1);
};

  return (
    <div className="app">
      <Applause
        show={celebrate}
        onFinish={() => {
          setCelebrate(false);
          moveToNext(); // ✅ move ONLY after correct guess
        }}
      />

      <div className="card neon">
        <h1 className="title">CINE CIPHER</h1>

        <div className="stats">
          <span>Attempts: {attempts}</span>
          <span>Hints Used: {hintsUsed}</span>
        </div>

        <div className={`timer ${pulse ? "pulse" : ""}`}>
          ⏱ {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
        </div>

        <div className="word">
          {Array.from(answer).map((c, i) => (
            <span
              key={i}
              className={`letter ${c === " " ? "space" : ""} ${
                revealed[i] ? "revealed" : ""
              }`}
            >
              {revealed[i] && c !== " " ? c : ""}
            </span>
          ))}
        </div>

        <div className="hint">
          <strong>💡 Hint:</strong>
          <div className="hint-box">{hintText}</div>
        </div>

        <h3 className="prompt">Guess the movie!</h3>

        <input
          className="guess-input"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess..."
        />

        {result && (
          <div className={`result ${result.type}`}>{result.text}</div>
        )}

        <div className="buttons">
          <button onClick={submitGuess}>Submit Guess</button>
          <button onClick={revealLetter} disabled={hintsUsed >= MAX_HINTS}>
            👁 Reveal Letter ({MAX_HINTS - hintsUsed} left)
          </button>
        </div>
      </div>
    </div>
  );
}
