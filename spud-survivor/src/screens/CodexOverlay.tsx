import { useState } from "react";
import { ENEMIES, WEAPONS, CHARACTERS, UPGRADES, SHOP_ITEMS } from "../game/constants";
import type { EnemyType, WeaponType } from "../game/types";

interface Props {
  codexSeen: Set<string>;
  codexKills: Record<string, number>;
  onClose: () => void;
}

type Tab = "enemies" | "weapons" | "characters" | "items";

export default function CodexOverlay({ codexSeen, codexKills, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("enemies");
  const allEnemyTypes = Object.keys(ENEMIES) as EnemyType[];
  const allWeaponTypes = Object.keys(WEAPONS) as WeaponType[];
  const allCharKeys = Object.keys(CHARACTERS);

  const tabs: { key: Tab; label: string }[] = [
    { key: "enemies", label: "☠ Enemies" },
    { key: "weapons", label: "🔫 Weapons" },
    { key: "characters", label: "🧑 Characters" },
    { key: "items", label: "🛒 Items" },
  ];

  return (
    <div
      className="absolute inset-0 z-50 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <div
        className="max-w-3xl mx-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-black text-2xl"
            style={{ color: "#d97706", fontFamily: "Georgia, serif", textShadow: "0 0 20px rgba(217,119,6,0.8)" }}
          >
            📖 CODEX
          </h2>
          <div className="text-amber-400/60 text-xs">Press Q / Tab or click outside to close</div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-4 border-b border-amber-900/40 pb-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1 rounded text-xs font-bold transition-colors"
              style={{
                background: tab === t.key ? "rgba(180,83,9,0.5)" : "rgba(40,20,5,0.4)",
                color: tab === t.key ? "#fcd34d" : "#92400e",
                border: `1px solid ${tab === t.key ? "rgba(217,119,6,0.6)" : "rgba(92,61,30,0.3)"}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ENEMIES ── */}
        {tab === "enemies" && (
          <div className="grid grid-cols-2 gap-2">
            {allEnemyTypes.map(type => {
              const def = ENEMIES[type];
              const seen = codexSeen.has(type);
              const kills = codexKills[type] ?? 0;
              return (
                <div
                  key={type}
                  className="rounded-lg p-2"
                  style={{
                    background: seen ? "rgba(40,20,5,0.9)" : "rgba(20,20,20,0.8)",
                    border: `1px solid ${seen ? "rgba(180,83,9,0.5)" : "rgba(80,80,80,0.3)"}`,
                    opacity: seen ? 1 : 0.45,
                  }}
                >
                  {seen ? (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-200 text-sm">{def.name}</span>
                        <span className="text-amber-400/60 text-xs">{kills} killed</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 text-xs text-amber-300/70">
                        <span>HP: <b className="text-amber-200">{def.hp}</b></span>
                        <span>DMG: <b className="text-amber-200">{def.damage}</b></span>
                        <span>Speed: <b className="text-amber-200">{def.speed}</b></span>
                        <span>XP: <b className="text-amber-200">{def.xpReward}</b></span>
                      </div>
                      <div className="mt-1 text-xs text-amber-400/50 italic">{def.behavior}</div>
                    </>
                  ) : (
                    <div className="text-center py-1">
                      <div className="text-gray-500 font-bold text-sm">???</div>
                      <div className="text-gray-600 text-xs">Not yet encountered</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── WEAPONS ── */}
        {tab === "weapons" && (
          <div className="grid grid-cols-2 gap-2">
            {allWeaponTypes.map(type => {
              const def = WEAPONS[type];
              return (
                <div
                  key={type}
                  className="rounded-lg p-2"
                  style={{ background: "rgba(40,20,5,0.9)", border: `1px solid ${def.color}40` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: def.color }} />
                    <span className="font-bold text-amber-200 text-sm">{def.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 text-xs text-amber-300/70">
                    <span>DMG: <b className="text-amber-200">{def.damage}</b></span>
                    <span>Rate: <b className="text-amber-200">{def.fireRate}/s</b></span>
                    <span>Range: <b className="text-amber-200">{def.range}</b></span>
                    <span>Cost: <b className="text-amber-200">🪙{def.cost}</b></span>
                  </div>
                  {def.special && (
                    <div className="mt-1 text-xs text-purple-300/70 italic">{def.special}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CHARACTERS ── */}
        {tab === "characters" && (
          <div className="grid grid-cols-2 gap-2">
            {allCharKeys.map(key => {
              const c = CHARACTERS[key];
              return (
                <div
                  key={key}
                  className="rounded-lg p-2"
                  style={{ background: "rgba(30,15,5,0.9)", border: "1px solid rgba(180,83,9,0.4)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="font-bold text-amber-200 text-sm">{c.name}</span>
                  </div>
                  <div className="text-xs text-amber-300/60 mb-1 italic">{c.desc}</div>
                  {c.passive && (
                    <div className="text-xs text-green-300/80">
                      <span className="font-bold text-green-400">Passive:</span> {c.passive}
                    </div>
                  )}
                  {c.specialDesc && (
                    <div className="text-xs text-purple-300/80 mt-0.5">
                      <span className="font-bold text-purple-400">Special:</span> {c.specialDesc}
                      {c.specialCooldown > 0 && <span className="text-amber-400/50"> ({c.specialCooldown}s)</span>}
                    </div>
                  )}
                  <div className="text-xs text-amber-400/50 mt-1">
                    Start: <span className="text-amber-300">{c.startWeapons?.join(", ")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ITEMS (Upgrades + Shop Items) ── */}
        {tab === "items" && (
          <div>
            <h3 className="text-amber-300 font-bold text-xs uppercase tracking-widest mb-2">Level-Up Upgrades</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {UPGRADES.map(u => (
                <div
                  key={u.id}
                  className="rounded-lg p-2"
                  style={{
                    background: "rgba(30,15,5,0.9)",
                    border: `1px solid ${u.rarity === "epic" ? "rgba(168,85,247,0.5)" : u.rarity === "rare" ? "rgba(59,130,246,0.5)" : "rgba(100,100,100,0.3)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-amber-200 text-xs">{u.name}</span>
                    <span
                      className="text-xs font-bold px-1 rounded"
                      style={{
                        color: u.rarity === "epic" ? "#a855f7" : u.rarity === "rare" ? "#3b82f6" : "#9ca3af",
                        background: u.rarity === "epic" ? "rgba(168,85,247,0.15)" : u.rarity === "rare" ? "rgba(59,130,246,0.15)" : "rgba(100,100,100,0.1)",
                      }}
                    >
                      {u.rarity}
                    </span>
                  </div>
                  <div className="text-xs text-amber-300/60">{u.description}</div>
                </div>
              ))}
            </div>
            <h3 className="text-amber-300 font-bold text-xs uppercase tracking-widest mb-2">Shop Items</h3>
            <div className="grid grid-cols-2 gap-2">
              {SHOP_ITEMS.map(item => (
                <div
                  key={item.id}
                  className="rounded-lg p-2"
                  style={{
                    background: "rgba(30,15,5,0.9)",
                    border: `1px solid ${item.rarity === "epic" ? "rgba(168,85,247,0.4)" : item.rarity === "rare" ? "rgba(59,130,246,0.4)" : "rgba(100,100,100,0.2)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-amber-200 text-xs">{item.name}</span>
                    <span className="text-amber-400 text-xs font-bold">🪙{item.cost}</span>
                  </div>
                  <div className="text-xs text-amber-300/60">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
