import type { WaveStats } from "../game/types";

interface Props {
  waveStats: WaveStats;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
  armor: number;
  critChance: number;
  hpRegen: number;
  coins: number;
  onContinue: () => void;
}

export default function WaveStatsCard({
  waveStats, level, hp, maxHp, damage, attackSpeed, moveSpeed, armor, critChance, hpRegen, coins, onContinue,
}: Props) {
  const elapsed = 0;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-xl p-6"
        style={{
          background: "rgba(20,10,16,0.95)",
          border: "2px solid rgba(80,160,240,0.6)",
          maxWidth: 520,
          width: "90%",
          boxShadow: "0 0 40px rgba(80,160,240,0.2)",
        }}
      >
        <h2
          className="text-center font-black text-2xl mb-4"
          style={{ color: "#70c0ff", textShadow: "0 0 15px rgba(80,160,240,0.6)", fontFamily: "Georgia, serif" }}
        >
          📊 WAVE {waveStats.wave} COMPLETE
        </h2>

        <div className="flex justify-center gap-8 mb-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-300">{waveStats.kills}</div>
            <div className="text-amber-400/50 text-xs">KILLS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-yellow-300">{waveStats.coinsEarned}</div>
            <div className="text-amber-400/50 text-xs">COINS EARNED</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-red-400">{Math.floor(waveStats.damageDealt)}</div>
            <div className="text-amber-400/50 text-xs">DAMAGE DEALT</div>
          </div>
        </div>

        <div
          className="rounded-lg p-3 mb-4"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(180,83,9,0.3)" }}
        >
          <div className="text-amber-400 text-xs font-bold mb-2">CURRENT STATS</div>
          <div
            className="grid gap-x-6 gap-y-1 text-xs"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            {[
              ["Level", level],
              ["HP", `${Math.ceil(hp)}/${maxHp}`],
              ["Damage", `×${damage.toFixed(2)}`],
              ["Atk Speed", `×${attackSpeed.toFixed(2)}`],
              ["Move Speed", `×${moveSpeed.toFixed(2)}`],
              ["Armor", armor],
              ["Crit", `${Math.round(critChance * 100)}%`],
              ["HP Regen", `${hpRegen.toFixed(1)}/s`],
              ["Coins", coins],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between">
                <span style={{ color: "rgba(200,160,90,0.7)" }}>{label}</span>
                <span className="font-bold text-amber-200">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-xl font-black text-lg"
            style={{
              background: "linear-gradient(135deg, #d97706, #b45309)",
              color: "#fff",
              border: "2px solid #92400e",
              boxShadow: "0 0 20px rgba(217,119,6,0.4)",
              cursor: "pointer",
              fontFamily: "Georgia, serif",
              letterSpacing: "0.08em",
              transition: "transform 0.1s",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
          >
            Continue ▶
          </button>
        </div>
      </div>
    </div>
  );
}
