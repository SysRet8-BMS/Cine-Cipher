import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import Applause from "../components/Applause";
import movieIcon from "../assets/movie.png";
import timerIcon from "../assets/timer.png";
import hintIcon from "../assets/hint-icon.png";
import skipIcon from "../assets/skip.png";
import revealIcon from "../assets/reveal.png";
import triumphSound from "../assets/triumph.mp3";
import wrongSound from "../assets/wrong.mp3";
import endOfGameSound from "../assets/endofgame.mp3";

export default function GamePage() {
  const navigate = useNavigate();
  const MOVIES = [
    "THE DARK KNIGHT",
    "INCEPTION",
    "PULP FICTION",
    "GLADIATOR",
    "INTERSTELLAR",
    "KPOP DEMON HUNTERS",
    "AVENGERS ENDGAME",
    "FORREST GUMP",
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
    "STRANGER THINGS",
    
  ];

  const TIMER_START = 45;
  const MAX_HINTS = 4;
  const MAX_SKIPS = 5;
  const STOP_WORDS = ["THE", "OF", "IS", "A", "AN", "AND", "TO", "IN"];

  const [shownMovies, setShownMovies] = useState<number[]>([]);

  /*  Get random movie index (excluding current one and previously shown ones) */
  const getRandomMovieIndex = (currentIndex?: number, shown: number[] = []) => {
    const availableIndexes = Array.from({ length: MOVIES.length }, (_, i) => i)
      .filter(i => i !== currentIndex && !shown.includes(i));
    
    // If all movies have been shown, reset the session and start fresh
    if (availableIndexes.length === 0) {
      setShownMovies([]);
      return Math.floor(Math.random() * MOVIES.length);
    }
    
    return availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
  };

  const initialMovieIndex = getRandomMovieIndex();
  const [movieIndex, setMovieIndex] = useState(initialMovieIndex);
  const [answer, setAnswer] = useState(MOVIES[initialMovieIndex]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [time, setTime] = useState(TIMER_START);
  const [pulse, setPulse] = useState(false);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [hintText, setHintText] = useState("");
  const [genre, setGenre] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [result, setResult] = useState<{ text: string; type: string } | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);

  /* Remove title words from hint (except stop words) */
  const sanitizeHint = (hint: string, title: string): string => {
    if (!hint) return hint;

    let cleaned = hint;
    title
      .toUpperCase()
      .split(" ")
      .filter((w: string) => w && !STOP_WORDS.includes(w))
      .forEach((word: string) => {
        cleaned = cleaned.replace(
          new RegExp(`\\b${word}\\b`, "gi"),
          "_".repeat(word.length)
        );
      });

    return cleaned;
  };

  /*  Play triumph sound when correct guess */
  useEffect(() => {
    if (celebrate) {
      const audio = new Audio(triumphSound);
      audio.play().catch(err => console.log("Audio playback failed:", err));
    }
  }, [celebrate]);

  /* � Play wrong sound for incorrect guess */
  useEffect(() => {
    if (result && result.type === "wrong") {
      const audio = new Audio(wrongSound);
      audio.play().catch(err => console.log("Audio playback failed:", err));
    }
  }, [result]);

  /*  Reset state when movie changes and track shown movies */
  useEffect(() => {
    setRevealed(Array.from(answer).map((c: string) => c === " "));
    setHintsUsed(0);
    setAttempts(0);
    setGuess("");
    setResult(null);
    setHasGuessed(false);
    setTime(TIMER_START);
    setGenre("");
    // Track this movie as shown (only on initial load if not already tracked)
    setShownMovies(prev => prev.includes(movieIndex) ? prev : [...prev, movieIndex]);
  }, [answer]);

  /* ⏱ TIMER — auto move on timeout */
  useEffect(() => {
    if (celebrate) return; // pause timer during confetti

    const interval = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(interval);
          // Play end of game sound and navigate to end page
          const audio = new Audio(endOfGameSound);
          audio.play().catch(err => console.log("Audio playback failed:", err));
          setTimeout(() => navigate("/end"), 500);
          return 0;
        }
        setPulse(true);
        setTimeout(() => setPulse(false), 200);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [answer, celebrate, navigate]);

  /* 💡Fetch & sanitize hint and genre */
  useEffect(() => {
    const fetchHint = async () => {
      try {
        const q = encodeURIComponent(answer);
        const res = await fetch(`/.netlify/functions/game-api?query=${q}`);
        const data = await res.json();
        const rawHint = data?.hints?.[0] || "No hint available";
        setHintText(sanitizeHint(rawHint, answer));
        setGenre(data?.details?.Genre || "Unknown");
      } catch {
        setHintText("No hint available");
        setGenre("Unknown");
      }
    };
    fetchHint();
  }, [answer]);

  /* ⏭Move to next movie (random, no repeats) */
  const moveToNext = () => {
    setMovieIndex(i => {
      const next = getRandomMovieIndex(i, shownMovies);
      setShownMovies(prev => [...prev, next]);
      setAnswer(MOVIES[next]);
      return next;
    });
  };

  
  const skip = () => {
    if (skipsUsed >= MAX_SKIPS) return;
    setSkipsUsed(s => s + 1);
    moveToNext();

    setGuess("");
  };

  /* Submit Guess */
  const submitGuess = () => {
    setAttempts(a => a + 1);

    if (guess.trim().toUpperCase() === answer) {
      setHasGuessed(true);
      setResult({ text: "Correct!", type: "right" });
      setCelebrate(true);
      
      // Check if all movies have been shown
      if (shownMovies.length >= MOVIES.length) {
        setTimeout(() => navigate("/winner"), 3000);
      }
    } else {
      setResult({ text: "Wrong guess", type: "wrong" });
    }

    setGuess("");
  };

  /*  Auto-hide result text */
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 2500);
    return () => clearTimeout(t);
  }, [result]);

  /* ⌨️ Handle Enter key */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (hasGuessed) {
        moveToNext();
      } else {
        submitGuess();
      }
    }
  };

  const revealLetter = () => {
  if (hasGuessed) return;
  if (hintsUsed >= MAX_HINTS) return;

  // collect all unrevealed, non-space indexes
  const unrevealedIndexes = Array.from(answer)
    .map((c: string, i: number) => (c !== " " && !revealed[i] ? i : -1))
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
          moveToNext(); // move ONLY after correct guess
        }}
      />

      <div className="card neon">
        <div className="game-title-container">
          <h1 className="title">CINE CIPHER</h1>
          <img src={movieIcon} alt="movie" className="game-title-icon" />
        </div>

        <div className="stats">
          <span>Attempts: {attempts}</span>
          <span>Hints Used: {hintsUsed}</span>
          <span>Skips Used: {skipsUsed}</span>
        </div>

        <div className={`timer ${pulse ? "pulse" : ""} ${time <= 5 ? "urgent" : ""}`}>
          <img src={timerIcon} alt="timer" className="timer-icon" />
          {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
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
          <strong>
            <img src={hintIcon} alt="hint" className="hint-icon" /> Hint:
          </strong>
          <div className="hint-box">{hintText}</div>
          <div className="genre"><strong>Genre:</strong> {genre}</div>
        </div>

        <h3 className="prompt">Guess the movie!</h3>

        <input
          className="guess-input"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your guess and Enter..."
          disabled={hasGuessed}
        />

        {result && (
          <div className={`result ${result.type}`}>{result.text}</div>
        )}

        <div className="buttons">
          <button onClick={skip} disabled={skipsUsed >= MAX_SKIPS}>
            <img src={skipIcon} alt="skip" className="button-icon" /> Skip ({MAX_SKIPS - skipsUsed} left)
          </button>
          <button onClick={revealLetter} disabled={hintsUsed >= MAX_HINTS}>
            <img src={revealIcon} alt="reveal" className="button-icon" /> Reveal Letter ({MAX_HINTS - hintsUsed} left)
          </button>
        </div>
      </div>
    </div>
  );
}
