import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Endpage.css";
import { getLeaderboard, type GameRunScoreboard, type SessionRecord } from "../utils/scoreboard";

type EndLocationState = {
  run?: GameRunScoreboard;
  history?: SessionRecord[];
};

export default function Endpage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as EndLocationState | null) ?? null;

  const history = useMemo(
    () => state?.history ?? getLeaderboard(),
    [state?.history]
  );

  const run = state?.run;

  const handlePlayAgain = () => {
    navigate("/game");
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="endpage-container">
      <div className="endpage-content">
        <h1 className="endpage-title">Game Over!</h1>
        <p className="endpage-message">Time's up!</p>

        {run && (
          <div className="scoreboard-card">
            <h2>Scoreboard</h2>
            <div className="scoreboard-grid">
              <span>Score</span><strong>{run.score}</strong>
              <span>Correct</span><strong>{run.correctGuesses}</strong>
              <span>Target</span><strong>{run.targetMovies}</strong>
              <span>Wrong</span><strong>{run.wrongGuesses}</strong>
              <span>Best Streak</span><strong>{run.bestStreak}</strong>
              <span>New Title</span><strong>{run.badgeTitle}</strong>
              <span>Movies Completed</span><strong>{run.moviesCompleted}</strong>
              <span>Hints / Skips</span><strong>{run.totalHintsUsed} / {run.totalSkipsUsed}</strong>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="leaderboard-card">
            <h2>Your Recent Sessions (30 days)</h2>
            <ol>
              {history.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.score} pts · {entry.correctGuesses}/{entry.targetMovies} · {entry.badgeTitle}</span>
                  <span>{new Date(entry.playedAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        
        <div className="endpage-buttons">
          <button onClick={handlePlayAgain} className="play-again-btn">
            Play Again
          </button>
          <button onClick={handleHome} className="home-btn">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
