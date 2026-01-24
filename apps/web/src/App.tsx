import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage";
import GamePage from "./pages/GamePage";
import Endpage from "./pages/Endpage";
import WinnerPage from "./pages/WinnerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/end" element={<Endpage />} />
        <Route path="/winner" element={<WinnerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
