import { useState } from "react";
import { CHARACTERS } from "../game/constants";
import type { CharacterDef } from "../game/types";

interface Props {
  onSelect: (charId: string) => void;
  selectedCharacter: string;
}

export default function CharacterSelectScreen({ onSelect, selectedCharacter }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const chars = Object.values(CHARACTERS);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-6"
      style={{ background: "radial-gradient(ellipse at center, #2a1208 0%, #0d0602 100%)" }}
    >
      <div style={{ fontSize: 60, filter: "drop-shadow(0 0 20px rgba(217,119,6,0.8))" }}>🥔</div>
      <h1
        className="font-black text-center mt-2 mb-1"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
          color: "#f4c47a",
          textShadow: "0 0 30px rgba(217,119,6,0.9)",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.1em",
        }}
      >
        CHOOSE YOUR POTATO
      </h1>
      <p className="text-amber-300/50 text-sm mb-5">Pick your character — each has unique passives and specials</p>

      <div
        className="grid gap-3 px-4 mb-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", maxWidth: 720, width: "100%" }}
      >
        {chars.map((char: CharacterDef) => {
          const isSelected = selectedCharacter === char.id;
          const isHov = hovered === char.id;
          return (
            <div
              key={char.id}
              onClick={() => onSelect(char.id)}
              onMouseEnter={() => setHovered(char.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isSelected
                  ? "rgba(100,50,10,0.95)"
                  : isHov
                  ? "rgba(70,35,8,0.9)"
                  : "rgba(42,20,8,0.85)",
                border: `2px solid ${isSelected ? char.color : isHov ? "rgba(200,150,60,0.6)" : "rgba(139,90,60,0.4)"}`,
                borderRadius: 8,
                padding: "12px 14px",
                cursor: "pointer",
                transition: "transform 0.1s, border-color 0.1s, background 0.1s",
                transform: isHov && !isSelected ? "translateY(-2px)" : "none",
                boxShadow: isSelected ? `0 0 20px ${char.color}55` : "none",
                position: "relative",
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute", top: 4, right: 6,
                  fontSize: 10, fontWeight: "bold", color: char.color,
                  letterSpacing: "0.05em",
                }}>✓ SELECTED</div>
              )}
              <div className="text-center mb-2" style={{ fontSize: 36 }}>{char.emoji}</div>
              <div
                className="font-black text-sm text-center mb-1"
                style={{ color: char.color, letterSpacing: "0.05em" }}
              >
                {char.name}
              </div>
              <div className="text-xs text-center mb-2" style={{ color: "rgba(200,180,140,0.7)", lineHeight: 1.4 }}>
                {char.desc}
              </div>
              <div className="text-xs" style={{ color: "rgba(200,200,120,0.8)", borderTop: "1px solid rgba(139,90,60,0.3)", paddingTop: 6, marginTop: 4 }}>
                <div><span style={{ color: "rgba(180,150,80,0.7)" }}>Passive: </span>{char.passive.length > 50 ? char.passive.slice(0, 50) + "…" : char.passive}</div>
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(180,140,220,0.8)" }}>
                <span style={{ color: "rgba(150,100,200,0.7)" }}>Special: </span>
                {char.specialDesc.length > 55 ? char.specialDesc.slice(0, 55) + "…" : char.specialDesc}
                {char.specialCooldown > 0 && (
                  <span style={{ color: "rgba(150,150,150,0.6)" }}> ({char.specialCooldown}s)</span>
                )}
              </div>
              <div className="mt-2 text-xs" style={{ color: "rgba(150,180,150,0.7)" }}>
                Start: {char.startWeapons.join(", ")}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => selectedCharacter && onSelect(selectedCharacter)}
        className="px-10 py-3 rounded-xl font-black text-lg"
        style={{
          background: "linear-gradient(135deg, #d97706, #b45309)",
          color: "#fff",
          border: "2px solid #92400e",
          boxShadow: "0 0 25px rgba(217,119,6,0.6)",
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.08em",
          transition: "transform 0.1s",
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
      >
        Choose Difficulty ▶
      </button>
    </div>
  );
}
