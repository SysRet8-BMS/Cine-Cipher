import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/WinnerPage.css";
import { getLeaderboard, type GameRunScoreboard, type SessionRecord } from "../utils/scoreboard";

type WinnerLocationState = {
  run?: GameRunScoreboard;
  history?: SessionRecord[];
};

export default function WinnerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as WinnerLocationState | null) ?? null;

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
    <div className="winner-container">
      <div className="winner-content">
        <h1 className="winner-title">🎉 WINNER! 🎉</h1>
        <p className="winner-subtitle">You've guessed all the movies! <br/>
Cinema master status unlocked<br/></p>
<h3>Play again to beat your score!</h3>

        {run && (
          <div className="winner-scoreboard-card">
            <h2>Your Run</h2>
            <div className="winner-scoreboard-grid">
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
          <div className="winner-leaderboard-card">
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
        
    

        
        <div className="winner-buttons">
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
