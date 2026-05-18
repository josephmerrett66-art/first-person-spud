import { DIFFICULTIES } from "../game/constants";

interface Props {
  level: number;
  coins: number;
  roomIndex: number;
  totalKills: number;
  damageDealt: number;
  runStartTime: number;
  wave: number;
  selectedDifficulty: string;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({ level, coins, roomIndex, totalKills, damageDealt, runStartTime, wave, selectedDifficulty, onRestart, onMenu }: Props) {
  const floor = Math.floor(roomIndex / 6) + 1;
  const elapsed = runStartTime > 0 ? Math.floor((Date.now() - runStartTime) / 1000) : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const diff = DIFFICULTIES.find(d => d.id === selectedDifficulty);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #200000 0%, #0a0000 100%)" }}
    >
      <div style={{ fontSize: 70, filter: "grayscale(1) brightness(0.4)", marginBottom: 12 }}>🥔</div>
      <h2
        className="font-black text-5xl mb-2"
        style={{ color: "#ef4444", textShadow: "0 0 30px rgba(239,68,68,0.8), 0 4px 0 #7f1d1d", fontFamily: "Georgia, serif" }}
      >
        MASHED
      </h2>
      <p className="text-red-300/60 mb-6 text-base">Wave {wave} — survived {mm}:{ss}</p>

      <div
        className="rounded-xl p-5 mb-6 grid grid-cols-2 gap-x-10 gap-y-2 text-sm"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(127,29,29,0.4)", minWidth: 280 }}
      >
        {diff && (
          <>
            <div className="text-red-300/60">Difficulty</div>
            <div className="font-bold" style={{ color: diff.color }}>{diff.name}</div>
          </>
        )}
        <div className="text-red-300/60">Level Reached</div>
        <div className="text-amber-300 font-bold">{level}</div>
        <div className="text-red-300/60">Rooms Cleared</div>
        <div className="text-amber-300 font-bold">{roomIndex}</div>
        <div className="text-red-300/60">Floor Reached</div>
        <div className="text-amber-300 font-bold">{floor}</div>
        <div className="text-red-300/60">Total Kills</div>
        <div className="text-amber-300 font-bold">{totalKills}</div>
        <div className="text-red-300/60">Damage Dealt</div>
        <div className="text-amber-300 font-bold">{Math.floor(damageDealt)}</div>
        <div className="text-red-300/60">Coins Earned</div>
        <div className="text-amber-300 font-bold">{coins} 🪙</div>
        <div className="text-red-300/60">Time Survived</div>
        <div className="text-amber-300 font-bold">{mm}:{ss}</div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onRestart}
          className="px-8 py-3 rounded-xl font-black text-lg"
          style={{
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            color: "#fff", border: "2px solid #7f1d1d",
            boxShadow: "0 0 20px rgba(239,68,68,0.4), 0 4px 0 #450a0a",
            cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: "0.08em", transition: "transform 0.1s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          Try Again
        </button>
        <button
          onClick={onMenu}
          className="px-6 py-3 rounded-xl font-bold text-base"
          style={{
            background: "rgba(50,20,5,0.8)", color: "#d4a050",
            border: "2px solid rgba(180,83,9,0.4)", cursor: "pointer", transition: "transform 0.1s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
