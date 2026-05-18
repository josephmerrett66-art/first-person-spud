import type { RoomDef } from "../game/types";
import { DIFFICULTIES } from "../game/constants";

interface Props {
  level: number;
  hp: number;
  coins: number;
  rooms: RoomDef[][];
  totalKills: number;
  damageDealt: number;
  runStartTime: number;
  selectedDifficulty: string;
  wave: number;
  onRestart: () => void;
  onMenu: () => void;
}

export default function VictoryScreen({ level, hp, coins, rooms, totalKills, damageDealt, runStartTime, selectedDifficulty, wave, onRestart, onMenu }: Props) {
  const unlocked = rooms.flat().filter(r => r.unlocked).length;
  const elapsed = runStartTime > 0 ? Math.floor((Date.now() - runStartTime) / 1000) : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const diff = DIFFICULTIES.find(d => d.id === selectedDifficulty);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #2a1a00 0%, #0d0800 100%)" }}
    >
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            borderRadius: "50%",
            background: "#d97706",
            animation: `sparkle ${Math.random() * 2 + 1}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.7,
          }}
        />
      ))}

      <div style={{ fontSize: 90, filter: "drop-shadow(0 0 30px rgba(217,119,6,1))", animation: "float 3s ease-in-out infinite", marginBottom: 8 }}>
        🥔
      </div>
      <div className="text-amber-400 text-sm font-bold tracking-widest uppercase mb-1">The Potato King has fallen!</div>
      <h2
        className="font-black mb-2"
        style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          color: "#d97706",
          textShadow: "0 0 40px rgba(217,119,6,1), 0 4px 0 #7c2d12",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.1em",
        }}
      >
        VICTORY!
      </h2>

      <div className="rounded-xl p-5 mb-6 grid grid-cols-2 gap-x-10 gap-y-2 text-sm" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(180,83,9,0.4)", minWidth: 280 }}>
        {diff && (
          <>
            <div className="text-amber-300/60">Difficulty</div>
            <div className="font-bold" style={{ color: diff.color }}>{diff.name}</div>
          </>
        )}
        <div className="text-amber-300/60">Final Level</div>
        <div className="text-amber-300 font-bold">{level}</div>
        <div className="text-amber-300/60">Remaining HP</div>
        <div className="text-amber-300 font-bold">{Math.ceil(hp)}</div>
        <div className="text-amber-300/60">Rooms Cleared</div>
        <div className="text-amber-300 font-bold">{unlocked}/25</div>
        <div className="text-amber-300/60">Total Kills</div>
        <div className="text-amber-300 font-bold">{totalKills}</div>
        <div className="text-amber-300/60">Damage Dealt</div>
        <div className="text-amber-300 font-bold">{Math.floor(damageDealt)}</div>
        <div className="text-amber-300/60">Coins</div>
        <div className="text-amber-300 font-bold">{coins} 🪙</div>
        <div className="text-amber-300/60">Time Cleared</div>
        <div className="text-amber-300 font-bold">{mm}:{ss}</div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="px-8 py-3 rounded-xl font-black text-lg"
          style={{
            background: "linear-gradient(135deg, #d97706, #b45309)",
            color: "#fff", border: "2px solid #92400e",
            boxShadow: "0 0 25px rgba(217,119,6,0.6), 0 4px 0 #7c2d12",
            cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: "0.08em", transition: "transform 0.1s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          Play Again
        </button>
        <button
          onClick={onMenu}
          className="px-6 py-3 rounded-xl font-bold text-base"
          style={{
            background: "rgba(50,25,5,0.8)", color: "#d4a050",
            border: "2px solid rgba(180,83,9,0.4)", cursor: "pointer", transition: "transform 0.1s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          Main Menu
        </button>
      </div>

      <style>{`
        @keyframes sparkle { 0%, 100% { transform: scale(0.5); opacity: 0.3; } 50% { transform: scale(1.5); opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      `}</style>
    </div>
  );
}
