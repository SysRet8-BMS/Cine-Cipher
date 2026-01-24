import { useNavigate } from "react-router-dom";
import "../styles/WinnerPage.css";

export default function WinnerPage() {
  const navigate = useNavigate();

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
