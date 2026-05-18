import { WEAPONS, CHARACTERS, CONSUMABLE_DEFS } from "../game/constants";
import type { WeaponSlot, ConsumableSlot } from "../game/types";

interface Props {
  hp: number;
  maxHp: number;
  shield: number;
  shieldMax: number;
  xp: number;
  xpToLevel: number;
  level: number;
  coins: number;
  damage: number;
  armor: number;
  weaponSlots: WeaponSlot[];
  wave: number;
  totalWaves: number;
  waveActive: boolean;
  waveCountdown: number;
  enemiesLeft: number;
  dashChargesAvail: number;
  dashCharges: number;
  dashCd: number;
  dashMax: number;
  specialCd: number;
  specialMax: number;
  selectedCharacter: string;
  consumables: (ConsumableSlot | null)[];
  freezeTimer: number;
  roomIndex: number;
  currentRoomType: string;
  doorOpen: boolean;
  killFeed: { name: string; color: string; time: number }[];
  nowSec: number;
}

const PIXEL = "'Press Start 2P', monospace";
const PANEL = {
  background: "rgba(0,0,0,0.82)",
  border: "2px solid #7c4e14",
  borderRadius: 0,
  padding: "6px 8px",
} as const;

function PixelBar({ value, max, color, segs = 18, height = 10 }: {
  value: number; max: number; color: string; segs?: number; height?: number;
}) {
  const filled = Math.max(0, Math.round((Math.max(0, value) / Math.max(1, max)) * segs));
  return (
    <div style={{ display: "flex", gap: 2, height, flex: 1 }}>
      {Array.from({ length: segs }).map((_, i) => (
        <div key={i} style={{
          flex: 1,
          background: i < filled ? color : "rgba(20,10,5,0.8)",
          border: "1px solid rgba(0,0,0,0.5)",
          borderRadius: 0,
        }} />
      ))}
    </div>
  );
}

export default function HUD({
  hp, maxHp, shield, shieldMax, xp, xpToLevel, level, coins, damage, armor,
  weaponSlots, wave, totalWaves, waveActive, waveCountdown, enemiesLeft,
  dashChargesAvail, dashCharges, dashCd, dashMax,
  specialCd, specialMax, selectedCharacter, consumables, freezeTimer,
  roomIndex, currentRoomType, doorOpen, killFeed, nowSec,
}: Props) {
  const char = CHARACTERS[selectedCharacter] || CHARACTERS.spud;
  const specialReady = specialMax > 0 && specialCd <= 0;
  const specialPct = specialMax > 0 ? ((specialMax - Math.min(specialCd, specialMax)) / specialMax) * 100 : 100;

  return (
    <div className="game-hud absolute inset-0 pointer-events-none select-none">

      {/* ── Top-left stat panel ── */}
      <div className="hud-stats absolute top-3 left-3 flex flex-col gap-1.5" style={{ width: 210, ...PANEL }}>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: PIXEL, fontSize: 8, color: "#ff4444", minWidth: 14 }}>HP</span>
          <PixelBar value={hp} max={maxHp} color="#cc2222" segs={16} height={10} />
          <span style={{ fontFamily: PIXEL, fontSize: 7, color: "#ff8888", minWidth: 44, textAlign: "right" }}>
            {Math.ceil(hp)}/{maxHp}
          </span>
        </div>
        {shieldMax > 0 && (
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: PIXEL, fontSize: 8, color: "#4488ff", minWidth: 14 }}>SH</span>
            <PixelBar value={shield} max={shieldMax} color="#3366cc" segs={16} height={8} />
            <span style={{ fontFamily: PIXEL, fontSize: 7, color: "#88aaff", minWidth: 44, textAlign: "right" }}>
              {Math.ceil(shield)}/{shieldMax}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: PIXEL, fontSize: 8, color: "#aa66ff", minWidth: 14 }}>XP</span>
          <PixelBar value={xp} max={xpToLevel} color="#7722cc" segs={16} height={8} />
          <span style={{ fontFamily: PIXEL, fontSize: 7, color: "#cc88ff", minWidth: 44, textAlign: "right" }}>
            LV{level}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5" style={{ borderTop: "1px solid #7c4e1440" }}>
          <span style={{ fontFamily: PIXEL, fontSize: 7, color: "#f0c050" }}>🪙{coins}</span>
          {armor > 0 && <span style={{ fontFamily: PIXEL, fontSize: 7, color: "#88aaff" }}>ARM{armor}</span>}
          {damage > 1.1 && <span style={{ fontFamily: PIXEL, fontSize: 7, color: "#ff8866" }}>DMG×{damage.toFixed(1)}</span>}
        </div>
      </div>

      {/* ── Top-right: wave info + weapons ── */}
      <div className="hud-wave absolute top-3 right-3 flex flex-col items-end gap-2">
        <div style={{ ...PANEL, textAlign: "right" }}>
          {freezeTimer > 0 && (
            <div style={{ fontFamily: PIXEL, fontSize: 7, color: "#88ccff", marginBottom: 4 }}>
              ICE {Math.ceil(freezeTimer)}s
            </div>
          )}
          <div style={{ fontFamily: PIXEL, fontSize: 8, color: "#f0c050" }}>
            {waveActive
              ? `WAVE ${wave}/${totalWaves}`
              : wave === 0
              ? `START ${Math.ceil(waveCountdown)}s`
              : wave > totalWaves
              ? "CLEARED!"
              : `NEXT ${Math.ceil(waveCountdown)}s`}
          </div>
          {waveActive && (
            <div style={{ fontFamily: PIXEL, fontSize: 7, color: "#ff6666", marginTop: 4 }}>
              {enemiesLeft} LEFT
            </div>
          )}
        </div>

        <div style={{ ...PANEL, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          {weaponSlots.map((slot, i) => {
            const w = WEAPONS[slot.type as keyof typeof WEAPONS];
            if (!w) return null;
            const fireInterval = 1 / w.fireRate;
            const cdPct = Math.max(0, Math.min(100, (1 - slot.cd / fireInterval) * 100));
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 6, background: "rgba(0,0,0,0.6)", border: "1px solid #0006" }}>
                  <div style={{ width: `${cdPct}%`, height: "100%", background: w.color }} />
                </div>
                <span style={{ fontFamily: PIXEL, fontSize: 7, color: w.color }}>{w.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pixel crosshair ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ position: "relative", width: 28, height: 28 }}>
          <div style={{ position: "absolute", top: "50%", left: 0, width: 8, height: 2, background: "#fff", transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", right: 0, width: 8, height: 2, background: "#fff", transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, width: 2, height: 8, background: "#fff", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", bottom: 0, width: 2, height: 8, background: "#fff", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 3, height: 3, background: "#f66", transform: "translate(-50%,-50%)" }} />
        </div>
      </div>

      {/* ── Bottom-center: Dash + Special + Consumables ── */}
      <div className="hud-actions absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            {Array.from({ length: dashCharges }).map((_, i) => (
              <div key={i} style={{
                width: 14, height: 14,
                background: i < dashChargesAvail ? "#4488dd" : "rgba(20,20,20,0.8)",
                border: `2px solid ${i < dashChargesAvail ? "#66aaff" : "rgba(60,60,60,0.5)"}`,
                borderRadius: 0,
              }} />
            ))}
          </div>
          <span style={{ fontFamily: PIXEL, color: "rgba(160,160,160,0.45)", fontSize: 6 }}>SPACE</span>
        </div>

        {specialMax > 0 && (
          <div className="flex flex-col items-center gap-1">
            <div style={{
              ...PANEL,
              display: "flex", alignItems: "center", gap: 6,
              border: `2px solid ${specialReady ? "#a060ff" : "#444"}`,
              boxShadow: specialReady ? "0 0 10px #a060ff66" : "none",
            }}>
              <span style={{ fontSize: 14 }}>{char.specialEmoji}</span>
              <div style={{ width: 44 }}>
                <PixelBar value={specialPct} max={100} color={specialReady ? "#9944ff" : "#555"} segs={10} height={6} />
                <div style={{ fontFamily: PIXEL, fontSize: 6, color: specialReady ? "#c080ff" : "#666", marginTop: 2, textAlign: "center" }}>
                  {specialReady ? "READY" : `${Math.ceil(specialCd)}s`}
                </div>
              </div>
            </div>
            <span style={{ fontFamily: PIXEL, color: "rgba(160,96,255,0.4)", fontSize: 6 }}>[Q]</span>
          </div>
        )}

        <div className="flex gap-2">
          {consumables.map((slot, i) => {
            const def = slot ? CONSUMABLE_DEFS[slot.type] : null;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div style={{
                  width: 34, height: 34,
                  background: slot ? "rgba(40,25,8,0.92)" : "rgba(15,10,3,0.7)",
                  border: `2px solid ${slot ? "#c8a03c" : "#4a3810"}`,
                  borderRadius: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <span style={{ fontSize: 16 }}>{def ? def.emoji : "·"}</span>
                  {slot && slot.charges > 1 && (
                    <span style={{
                      position: "absolute", top: 1, right: 2,
                      fontFamily: PIXEL, fontSize: 6, color: "#ff8040",
                    }}>{slot.charges}</span>
                  )}
                </div>
                <span style={{ fontFamily: PIXEL, color: "rgba(140,110,40,0.55)", fontSize: 6 }}>[{i + 1}]</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom-left: Room info ── */}
      <div className="hud-room absolute bottom-4 left-3">
        <div style={{ ...PANEL, padding: "6px 10px", minWidth: 96 }}>
          <div style={{ fontFamily: PIXEL, fontSize: 6, color: "#c8a03c", marginBottom: 4 }}>
            {currentRoomType === "boss" ? "⚠ BOSS" :
             currentRoomType === "heal" ? "✚ HEAL" :
             currentRoomType === "shop" ? "🪙 SHOP" :
             currentRoomType === "maze" ? "★ MAZE" : "⚔ COMBAT"}
          </div>
          <div style={{ fontFamily: PIXEL, fontSize: 9, color: "#e8d0a0" }}>
            ROOM {roomIndex + 1}
          </div>
          <div style={{ fontFamily: PIXEL, fontSize: 6, color: "#a07840", marginTop: 2 }}>
            FLOOR {Math.floor(roomIndex / 6) + 1}
          </div>
          {doorOpen && (
            <div style={{ fontFamily: PIXEL, fontSize: 6, color: "#44ff88", marginTop: 4 }}>
              EXIT OPEN ▶
            </div>
          )}
        </div>
      </div>

      {/* ── Kill feed (top-right) ── */}
      <div className="absolute top-3 right-3 flex flex-col gap-1" style={{ alignItems: "flex-end" }}>
        {killFeed.map((entry, i) => {
          const age = nowSec - entry.time;
          if (age > 4) return null;
          const alpha = Math.max(0, 1 - Math.max(0, age - 2.5) / 1.5);
          return (
            <div key={i} style={{
              fontFamily: PIXEL, fontSize: 8,
              background: "rgba(0,0,0,0.72)", border: "1px solid rgba(120,80,20,0.4)",
              padding: "3px 8px",
              opacity: alpha,
              display: "flex", alignItems: "center", gap: 6,
              transition: "opacity 0.1s",
            }}>
              <span style={{ color: "#ff4444", fontSize: 9 }}>✕</span>
              <span style={{
                color: entry.color.startsWith("#") ? entry.color : "#f0c050",
                textShadow: `0 0 6px ${entry.color}`,
              }}>
                {entry.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Bottom hint ── */}
      <div className="hud-hint absolute bottom-0.5 left-1/2 -translate-x-1/2">
        <span style={{ fontFamily: PIXEL, color: "rgba(180,120,40,0.3)", fontSize: 6 }}>
          Left click to shoot · ESC to pause
        </span>
      </div>
    </div>
  );
}
