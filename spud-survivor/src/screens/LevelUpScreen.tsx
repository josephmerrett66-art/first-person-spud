import type { Upgrade } from "../game/types";

interface Props {
  level: number;
  choices: Upgrade[];
  onChoose: (id: string) => void;
}

export default function LevelUpScreen({ level, choices, onChoose }: Props) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="mb-2 text-purple-400 text-sm font-bold tracking-widest uppercase">
        Level Up!
      </div>
      <h2
        className="mb-1 font-black text-4xl"
        style={{
          color: "#d97706",
          textShadow: "0 0 20px rgba(217,119,6,0.8)",
          fontFamily: "Georgia, serif",
        }}
      >
        Level {level}
      </h2>
      <p className="mb-8 text-amber-300/60 text-sm">Choose an upgrade</p>

      <div className="flex flex-wrap justify-center gap-5">
        {choices.map((upgrade) => (
          <button
            key={upgrade.id}
            onClick={() => onChoose(upgrade.id)}
            className="relative flex flex-col items-center gap-3 rounded-2xl p-6 cursor-pointer"
            style={{
              background: "linear-gradient(145deg, rgba(60,30,5,0.95), rgba(30,15,3,0.95))",
              border: "2px solid rgba(180,83,9,0.5)",
              width: 190,
              boxShadow: "0 0 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,100,0.1)",
              transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = "scale(1.07) translateY(-4px)";
              el.style.boxShadow = "0 0 40px rgba(217,119,6,0.5), 0 8px 24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,100,0.15)";
              el.style.borderColor = "rgba(217,119,6,0.9)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = "scale(1) translateY(0)";
              el.style.boxShadow = "0 0 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,100,0.1)";
              el.style.borderColor = "rgba(180,83,9,0.5)";
            }}
          >
            <span style={{ fontSize: 48 }}>{upgrade.icon}</span>
            <div className="text-amber-200 font-bold text-lg text-center">{upgrade.name}</div>
            <div className="text-amber-400/70 text-sm text-center">{upgrade.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
