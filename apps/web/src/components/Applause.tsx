import { useEffect, useMemo } from "react";

type Props = {
  show: boolean;
  duration?: number;
  onFinish?: () => void;
};

const COLORS = [
  "#ff4fc3",
  "#ffd6f3",
  "#f00592",
  "#8ef58e",
  "#fff176",
  "#4fc3ff",
];

export default function Applause({ show, duration = 3500, onFinish }: Props) {
  const pieces = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onFinish && onFinish(), duration + 200);
    return () => clearTimeout(t);
  }, [show, duration, onFinish]);

  if (!show) return null;

  return (
    <div className="applause-overlay" aria-hidden={!show}>
      {pieces.map((i) => {
        const style: any = {
          left: `${Math.random() * 100}%`,
          backgroundColor: COLORS[i % COLORS.length],
          width: `${8 + Math.random() * 12}px`,
          height: `${10 + Math.random() * 20}px`,
          transform: `rotate(${Math.random() * 360}deg)`,
          animationDelay: `${Math.random() * 600}ms`,
          animationDuration: `${1200 + Math.random() * 2000}ms`,
        };
        return <span key={i} className="confetti" style={style} />;
      })}
    </div>
  );
}
