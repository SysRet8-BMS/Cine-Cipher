import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";
import hintIcon from "../assets/hint-icon.png";
import timerIcon from "../assets/timer.png";
import revealIcon from "../assets/reveal.png";
import movieIcon from "../assets/movie.png";

const MOVIE_TARGET_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function StartPage() {
  const navigate = useNavigate();
  const defaultIndex = MOVIE_TARGET_OPTIONS.indexOf(10);
  const [targetIndex, setTargetIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);
  const moviesToWin = MOVIE_TARGET_OPTIONS[targetIndex];

  const handlePlayClick = () => {
    navigate("/game", {
      state: {
        targetMovies: moviesToWin,
      },
    });
  };

  return (
    <div className="start-container">
      <div className="start-card">
        <div className="title-container">
          <h1 className="start-title">CINE CIPHER</h1>
          <img src={movieIcon} alt="movie" className="title-icon" />
        </div>
        
        <div className="start-content">
          <p className="start-subtitle">Guess the Movie ! </p>
          
          <div className="start-features">
            <div className="feature">
              <img src={revealIcon} alt="reveal" className="feature-icon-img" />
              <p>Reveal letters</p>
            </div>
            <div className="feature">
              <img src={hintIcon} alt="hint" className="feature-icon-img" />
              <p>Use the plot hints</p>
            </div>
            <div className="feature">
              <img src={timerIcon} alt="timer" className="feature-icon-img" />
              <p>Beat the 45 second timer</p>
            </div>
          </div>

          <div className="start-rules">
            <h2>How to Play:</h2>
            <ol>
<li>You have 45 seconds per movie.</li>
<li>Enter your answer and hit Enter.</li>
<li>Time’s up? Game over!</li>
<li>Stuck? You get 5 skips to move ahead.</li>
<li>Need help? Reveal letters to uncover the title.</li>   
            </ol>
          </div>

          <div className="start-target-picker">
            <label htmlFor="movieTarget">Movies to win</label>
            <input
              id="movieTarget"
              type="range"
              min={0}
              max={MOVIE_TARGET_OPTIONS.length - 1}
              step={1}
              value={targetIndex}
              onChange={(e) => setTargetIndex(Number(e.target.value))}
            />
            <span className="target-value">{moviesToWin}</span>
          </div>
        </div>

        <button className="start-button" onClick={handlePlayClick}>
          ▶ Let's GO
        </button>
      </div>
    </div>
  );
}
