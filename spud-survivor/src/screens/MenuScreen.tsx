import { useState } from "react";
import { DIFFICULTIES, CHARACTERS } from "../game/constants";

interface Props {
  onStart: () => void;
  onChangeChar: () => void;
  selectedCharacter: string;
  selectedDifficulty: string;
  onSelectDifficulty: (id: string) => void;
}

export default function MenuScreen({ onStart, onChangeChar, selectedCharacter, selectedDifficulty, onSelectDifficulty }: Props) {
  const char = CHARACTERS[selectedCharacter] || CHARACTERS.spud;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-4"
      style={{ background: "radial-gradient(ellipse at center, #3d1a08 0%, #1a0804 60%, #0a0402 100%)" }}
    >
      <button
        onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}
        style={{
          position: "absolute", top: 14, right: 14,
          background: "rgba(0,0,0,0.6)", border: "1px solid rgba(180,83,9,0.55)",
          color: "#d97706", borderRadius: 6, padding: "7px 13px",
          cursor: "pointer", fontFamily: "'Press Start 2P', monospace", fontSize: 8,
          letterSpacing: "0.05em", zIndex: 10,
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(30,15,0,0.85)"; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(0,0,0,0.6)"; }}
      >
        [  ] FULLSCREEN
      </button>
      <div
        style={{ fontSize: 70, filter: "drop-shadow(0 0 25px rgba(217,119,6,0.8))", animation: "float 3s ease-in-out infinite" }}
      >
        🥔
      </div>

      <h1
        className="text-center font-black mb-1"
        style={{
          fontSize: "clamp(1.4rem, 5vw, 2.8rem)",
          color: "#d97706",
          textShadow: "0 0 40px rgba(217,119,6,0.9), 4px 4px 0 #7c2d12, -2px -2px 0 #3d1208",
          letterSpacing: "0.08em",
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        SPUDVIVOR
      </h1>
      <p className="mb-4 text-amber-300/60 text-xs tracking-widest">A POTATO'S DESPERATE STAND</p>

      {/* Selected character display */}
      <div
        className="mb-4 px-4 py-2 rounded-lg text-sm text-center"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(180,83,9,0.4)", maxWidth: 400, width: "90%" }}
      >
        <span style={{ color: char.color, fontWeight: "bold" }}>{char.emoji} {char.name}</span>
        <span className="text-amber-300/60 text-xs ml-2">— {char.passive.slice(0, 60)}{char.passive.length > 60 ? "…" : ""}</span>
      </div>

      {/* Controls reminder */}
      <div
        className="mb-4 rounded-lg p-3 text-amber-100/60 text-xs grid grid-cols-2 gap-x-6 gap-y-1"
        style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(180,83,9,0.3)", maxWidth: 360, width: "90%" }}
      >
        <div><span className="text-amber-400 font-bold">WASD</span> Move</div>
        <div><span className="text-amber-400 font-bold">Mouse</span> Look</div>
        <div><span className="text-amber-400 font-bold">SPACE</span> Dash</div>
        <div><span className="text-amber-400 font-bold">Q</span> Special</div>
        <div><span className="text-amber-400 font-bold">1/2/3</span> Consumables</div>
        <div><span className="text-amber-400 font-bold">L-Click</span> Shoot</div>
      </div>

      {/* Difficulty picker */}
      <div
        className="mb-5 rounded-xl p-4"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(180,83,9,0.4)", maxWidth: 420, width: "90%" }}
      >
        <div className="text-amber-400/70 text-xs font-bold text-center mb-3 tracking-widest">CHOOSE YOUR RUN</div>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map(diff => (
            <button
              key={diff.id}
              onClick={() => onSelectDifficulty(diff.id)}
              style={{
                background: selectedDifficulty === diff.id ? `${diff.color}22` : "rgba(20,10,5,0.7)",
                border: `2px solid ${selectedDifficulty === diff.id ? diff.color : "rgba(100,60,20,0.3)"}`,
                borderRadius: 6,
                padding: "8px 12px",
                cursor: "pointer",
                transition: "all 0.12s",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
                animation: diff.id === "spudgod" && selectedDifficulty === diff.id ? "spudgodpulse 1s ease-in-out infinite alternate" : "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${diff.color}18`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedDifficulty === diff.id ? `${diff.color}22` : "rgba(20,10,5,0.7)"; }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: diff.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontWeight: "bold", color: diff.color, minWidth: 90, fontSize: 13 }}>{diff.name}</span>
              <span style={{ color: "rgba(200,160,100,0.7)", fontSize: 11 }}>{diff.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={onChangeChar}
          className="px-5 py-2 rounded-lg text-sm font-bold"
          style={{
            background: "rgba(40,20,5,0.8)",
            color: "#d4a050",
            border: "1px solid rgba(180,83,9,0.4)",
            cursor: "pointer",
            transition: "transform 0.1s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          ← Change Character
        </button>

        <button
          onClick={onStart}
          className="px-10 py-3 font-black text-xl rounded-xl"
          style={{
            background: "linear-gradient(135deg, #d97706, #b45309)",
            color: "#fff",
            border: "2px solid #92400e",
            boxShadow: "0 0 30px rgba(217,119,6,0.6), 0 4px 0 #7c2d12",
            letterSpacing: "0.1em",
            cursor: "pointer",
            transition: "transform 0.1s, box-shadow 0.1s",
            fontFamily: "Georgia, serif",
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.transform = "scale(1.05)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 0 50px rgba(217,119,6,0.9), 0 4px 0 #7c2d12";
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.transform = "scale(1)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(217,119,6,0.6), 0 4px 0 #7c2d12";
          }}
        >
          ENTER THE DUNGEON
        </button>
      </div>

      <p className="text-amber-400/30 text-xs">Click to lock mouse · ESC to release</p>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spudgodpulse {
          from { box-shadow: 0 0 12px #ff8800; transform: scale(1); }
          to   { box-shadow: 0 0 28px #ffcc00; transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}
