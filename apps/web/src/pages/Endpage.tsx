import { useNavigate } from "react-router-dom";
import "../styles/Endpage.css";

export default function Endpage() {
  const navigate = useNavigate();

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
