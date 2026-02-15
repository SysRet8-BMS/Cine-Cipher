import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import {
  buildRunScoreboard,
  getCurrentUserKey,
  getBadgeProgress,
  saveUserSessionRun,
  type GameRunScoreboard,
} from "../utils/scoreboard";

const TARGET_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const normalizeTargetMovies = (input?: number) =>
  TARGET_OPTIONS.includes(input ?? 10) ? (input as number) : 10;

type GameLocationState = {
  targetMovies?: number;
};

export default function GamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const targetMovies = normalizeTargetMovies(
    (location.state as GameLocationState | null)?.targetMovies
  );
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
  const ROUND_BASE_SCORE = 120;
  const ROUND_MIN_SCORE = 25;

  const [shownMovies, setShownMovies] = useState<number[]>([]);
  const shownMoviesRef = useRef<number[]>([]);
  const endTriggeredRef = useRef(false);

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
  const [result, setResult] = useState<{ text: string; type: "right" | "wrong" | "info" } | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [moviesCompleted, setMoviesCompleted] = useState(0);
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  const [totalSkipsUsed, setTotalSkipsUsed] = useState(0);
  const guessInputRef = useRef<HTMLInputElement | null>(null);
  const metadataRetryRef = useRef(0);
  const [gameScale, setGameScale] = useState(1);

  useEffect(() => {
    shownMoviesRef.current = shownMovies;
  }, [shownMovies]);

  useEffect(() => {
    if (hasGuessed || isTransitioning) return;
    guessInputRef.current?.focus();
  }, [answer, hasGuessed, isTransitioning]);

  useEffect(() => {
    const updateScale = () => {
      const horizontalScale = (window.innerWidth - 24) / 1040;
      const verticalScale = (window.innerHeight - 24) / 900;
      const next = Math.min(1, horizontalScale, verticalScale);
      setGameScale(Math.max(0.68, next));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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
      setIsTransitioning(false);
  }, [answer]);

  const finalizeRun = (route: "/end" | "/winner", playOutroSound = false) => {
    if (endTriggeredRef.current) return;
    endTriggeredRef.current = true;
    setIsTransitioning(true);

    if (playOutroSound) {
      const audio = new Audio(endOfGameSound);
      audio.play().catch(err => console.log("Audio playback failed:", err));
    }

    const userKey = getCurrentUserKey();
    const badgeProgress = getBadgeProgress(correctGuesses, userKey);

    const run: GameRunScoreboard = buildRunScoreboard({
      score,
      correctGuesses,
      wrongGuesses,
      moviesCompleted,
      targetMovies,
      bestStreak,
      totalHintsUsed,
      totalSkipsUsed,
      ...badgeProgress,
    });
    const history = saveUserSessionRun(run, userKey);

    navigate(route, {
      replace: true,
      state: {
        run,
        history,
      },
    });
  };

  /* ⏱ TIMER — auto move on timeout */
  useEffect(() => {
    if (celebrate) return; // pause timer during confetti

    const interval = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(interval);
          finalizeRun("/end", true);
          return 0;
        }
        setPulse(true);
        setTimeout(() => setPulse(false), 200);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [answer, celebrate]);

  /* ⏭Move to next movie (random, no repeats) */
  const moveToNext = () => {
    if (isTransitioning) return;
    setMovieIndex(i => {
      const next = getRandomMovieIndex(i, shownMoviesRef.current);
      setShownMovies(prev => [...prev, next]);
      setAnswer(MOVIES[next]);
      return next;
    });
  };

  /* 💡Fetch & sanitize hint and genre */
  useEffect(() => {
    let cancelled = false;

    const fetchHint = async () => {
      try {
        const q = encodeURIComponent(answer);
        const res = await fetch(`/.netlify/functions/game-api?query=${q}`);
        if (!res.ok) {
          throw new Error("metadata fetch failed");
        }

        const data = await res.json();
        const rawHint = String(data?.hints?.[0] ?? "").trim();
        const movieGenre = String(data?.details?.Genre ?? "").trim();
        const hasValidHint = rawHint.length > 0 && rawHint !== "N/A";
        const hasValidGenre = movieGenre.length > 0 && movieGenre !== "N/A";

        if (!hasValidHint || !hasValidGenre) {
          if (metadataRetryRef.current < 6) {
            metadataRetryRef.current += 1;
            moveToNext();
            return;
          }

          if (!cancelled) {
            setHintText("No hint available");
            setGenre("Unknown");
          }
          return;
        }

        metadataRetryRef.current = 0;
        if (!cancelled) {
          setHintText(sanitizeHint(rawHint, answer));
          setGenre(movieGenre);
        }
      } catch {
        if (metadataRetryRef.current < 6) {
          metadataRetryRef.current += 1;
          moveToNext();
          return;
        }

        if (!cancelled) {
          setHintText("No hint available");
          setGenre("Unknown");
        }
      }
    };

    fetchHint();
    return () => {
      cancelled = true;
    };
  }, [answer]);

  
  const skip = () => {
    if (skipsUsed >= MAX_SKIPS || isTransitioning) return;
    setSkipsUsed(s => s + 1);
    setTotalSkipsUsed(s => s + 1);
    setTotalHintsUsed(h => h + hintsUsed);
    setMoviesCompleted(m => m + 1);
    setCurrentStreak(0);
    moveToNext();

    setGuess("");
  };

  /* Submit Guess */
  const submitGuess = () => {
    if (isTransitioning) return;
    const normalizedGuess = guess.trim().toUpperCase();
    if (!normalizedGuess) {
      setResult({ text: "Type your guess first", type: "info" });
      guessInputRef.current?.focus();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (normalizedGuess === answer) {
      const roundScore = Math.max(
        ROUND_MIN_SCORE,
        ROUND_BASE_SCORE - hintsUsed * 12 - nextAttempts * 8 - (TIMER_START - time)
      );

      setHasGuessed(true);
      setResult({ text: "Correct!", type: "right" });
      setCelebrate(true);
      setScore(prev => prev + roundScore);
      const nextCorrect = correctGuesses + 1;
      setCorrectGuesses(nextCorrect);
      setMoviesCompleted(prev => prev + 1);
      setTotalHintsUsed(prev => prev + hintsUsed);
      setCurrentStreak(prev => {
        const next = prev + 1;
        setBestStreak(best => Math.max(best, next));
        return next;
      });
      
      // Check if target has been reached
      if (nextCorrect >= targetMovies) {
        setTimeout(() => finalizeRun("/winner"), 700);
      }
    } else {
      setResult({ text: "Wrong guess", type: "wrong" });
      setWrongGuesses(prev => prev + 1);
      setCurrentStreak(0);
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
    <div className="app" style={{ "--game-scale": gameScale } as React.CSSProperties}>
      <Applause
        show={celebrate}
        duration={1200}
        onFinish={() => {
          setCelebrate(false);
          if (!isTransitioning) {
            moveToNext(); // move ONLY after correct guess
          }
        }}
      />

      <div className="game-shell">
      <div className="card neon">
        <div className="game-title-container">
          <h1 className="title">CINE CIPHER</h1>
          <img src={movieIcon} alt="movie" className="game-title-icon" />
        </div>

        <div className="stats">
          <span>Score: {score}</span>
          <span>Goal: {correctGuesses}/{targetMovies}</span>
          <span>Streak: {currentStreak}</span>
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
          ref={guessInputRef}
          className="guess-input"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your guess and Enter..."
          disabled={hasGuessed}
          autoFocus
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
    </div>
  );
}
