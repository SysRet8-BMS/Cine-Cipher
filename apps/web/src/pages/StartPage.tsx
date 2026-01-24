import { useNavigate } from "react-router-dom";
import "../styles/StartPage.css";
import hintIcon from "../assets/hint-icon.png";
import timerIcon from "../assets/timer.png";
import revealIcon from "../assets/reveal.png";
import movieIcon from "../assets/movie.png";

export default function StartPage() {
  const navigate = useNavigate();

  const handlePlayClick = () => {
    navigate("/game");
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
        </div>

        <button className="start-button" onClick={handlePlayClick}>
          ▶ Let's GO
        </button>
      </div>
    </div>
  );
}
