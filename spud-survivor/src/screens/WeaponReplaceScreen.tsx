import { WEAPONS } from "../game/constants";
import type { WeaponSlot, WeaponType } from "../game/types";

interface Props {
  weaponSlots: WeaponSlot[];
  pendingWeapon: WeaponType;
  onReplace: (slotIndex: number) => void;
  onCancel: () => void;
}

export default function WeaponReplaceScreen({ weaponSlots, pendingWeapon, onReplace, onCancel }: Props) {
  const newWeapon = WEAPONS[pendingWeapon];

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="rounded-xl p-6"
        style={{
          background: "rgba(30,10,5,0.98)",
          border: "2px solid rgba(255,128,64,0.6)",
          maxWidth: 560,
          width: "90%",
          boxShadow: "0 0 40px rgba(255,128,64,0.2)",
        }}
      >
        <h2
          className="text-center font-black text-2xl mb-2"
          style={{ color: "#ff8040", textShadow: "0 0 15px rgba(255,128,64,0.6)", fontFamily: "Georgia, serif" }}
        >
          🔫 WEAPON SLOTS FULL
        </h2>
        <p className="text-center text-amber-300/70 text-sm mb-4">
          Choose a weapon to drop and replace with{" "}
          <span className="font-bold" style={{ color: newWeapon.color }}>{newWeapon.name}</span>
        </p>

        {/* New weapon card */}
        <div
          className="mb-5 p-3 rounded-lg text-center"
          style={{ background: "rgba(60,30,5,0.7)", border: `2px solid ${newWeapon.color}80` }}
        >
          <div className="text-sm font-bold mb-1" style={{ color: newWeapon.color }}>NEW: {newWeapon.name}</div>
          <div className="text-xs text-amber-300/60">
            DMG {newWeapon.damage} · Rate {newWeapon.fireRate}/s · Range {newWeapon.range}
            {newWeapon.special && <span className="ml-1 text-purple-400/70">· {newWeapon.special}</span>}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-5">
          {weaponSlots.map((slot, i) => {
            const w = WEAPONS[slot.type];
            return (
              <div
                key={i}
                onClick={() => onReplace(i)}
                className="rounded-xl p-4 cursor-pointer text-center"
                style={{
                  background: "rgba(40,20,5,0.9)",
                  border: `2px solid ${w.color}55`,
                  width: 130,
                  transition: "transform 0.1s, border-color 0.1s, box-shadow 0.1s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${w.color}cc`;
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.06)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${w.color}44`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${w.color}55`;
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="text-2xl mb-1">🔫</div>
                <div className="font-bold text-xs mb-1" style={{ color: w.color }}>{w.name}</div>
                <div className="text-xs text-amber-400/50">
                  DMG {w.damage}
                  <br />Rate {w.fireRate}/s
                </div>
                <div className="mt-2 text-xs px-2 py-1 rounded" style={{ background: "rgba(200,60,60,0.2)", color: "#ff8080" }}>
                  Drop this
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg text-sm font-bold"
            style={{
              background: "rgba(40,20,5,0.8)",
              color: "#d4a050",
              border: "1px solid rgba(180,83,9,0.4)",
              cursor: "pointer",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.transform = "scale(1.03)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
          >
            Cancel (keep current weapons)
          </button>
        </div>
      </div>
    </div>
  );
}
