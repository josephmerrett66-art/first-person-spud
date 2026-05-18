import { GRID_SIZE } from "../game/constants";
import type { RoomDef } from "../game/types";

interface Props {
  rooms: RoomDef[][];
  currentRoom: { x: number; y: number };
  lockedAdjacentRooms: { x: number; y: number }[];
  onUnlock: (x: number, y: number) => void;
}

export default function RoomPickerScreen({ rooms, currentRoom, lockedAdjacentRooms, onUnlock }: Props) {
  const totalUnlocked = rooms.flat().filter(r => r.unlocked).length;
  const isPickable = (x: number, y: number) => lockedAdjacentRooms.some(r => r.x === x && r.y === y);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #1a0800 0%, #0a0400 100%)" }}
    >
      <div className="mb-1 text-amber-400/60 text-xs font-bold tracking-widest uppercase">Room Unlocked!</div>
      <h2
        className="mb-1 font-black text-3xl"
        style={{ color: "#f4c47a", textShadow: "0 0 15px rgba(244,196,122,0.6)", fontFamily: "Georgia, serif" }}
      >
        🔓 UNLOCK A ROOM
      </h2>
      <p className="mb-4 text-amber-300/50 text-sm">
        {totalUnlocked}/25 rooms unlocked — Click a locked room adjacent to your area
      </p>

      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(244,196,122,0.3)",
          boxShadow: "0 0 40px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: 6,
          }}
        >
          {rooms.flatMap((row) =>
            row.map((room) => {
              const isCurrent = room.x === currentRoom.x && room.y === currentRoom.y;
              const pickable = isPickable(room.x, room.y);
              const isBoss = room.x === GRID_SIZE - 1 && room.y === GRID_SIZE - 1;

              return (
                <div
                  key={`${room.x}-${room.y}`}
                  onClick={() => pickable && onUnlock(room.x, room.y)}
                  style={{
                    width: 60,
                    height: 60,
                    background: isCurrent
                      ? "rgba(217,119,6,0.25)"
                      : room.unlocked
                      ? "rgba(20,40,20,0.7)"
                      : pickable
                      ? "rgba(244,196,122,0.12)"
                      : "rgba(15,15,15,0.5)",
                    border: `2px solid ${
                      isCurrent
                        ? "#d97706"
                        : room.unlocked
                        ? "rgba(34,197,94,0.5)"
                        : pickable
                        ? "rgba(244,196,122,0.8)"
                        : "rgba(50,30,10,0.3)"
                    }`,
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: pickable ? "pointer" : "default",
                    opacity: !room.unlocked && !pickable ? 0.25 : 1,
                    transition: "transform 0.12s, box-shadow 0.12s",
                    boxShadow: pickable ? "0 0 16px rgba(244,196,122,0.4)" : isCurrent ? "0 0 16px rgba(217,119,6,0.5)" : "none",
                    animation: pickable ? "pulse 1.2s ease-in-out infinite" : "none",
                  }}
                  onMouseEnter={e => { if (pickable) { (e.currentTarget as HTMLElement).style.transform = "scale(1.12)"; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                  <span style={{ fontSize: isCurrent ? 20 : 16 }}>
                    {isCurrent ? "🥔" : room.unlocked ? "✓" : pickable ? "🔓" : "?"}
                  </span>
                  <span style={{ fontSize: 8, color: isCurrent ? "#d97706" : room.unlocked ? "#6ee7b7" : pickable ? "#f4c47a" : "rgba(150,120,80,0.4)", marginTop: 2, fontWeight: "bold" }}>
                    {isCurrent ? "HERE" : room.unlocked ? (room.cleared ? "CLEAR" : "DONE") : pickable ? "OPEN" : "?"}
                  </span>
                  {isBoss && (
                    <span style={{ fontSize: 7, color: "rgba(220,60,60,0.7)" }}>BOSS</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(244,196,122,0.3); }
          50% { box-shadow: 0 0 24px rgba(244,196,122,0.8); }
        }
      `}</style>
    </div>
  );
}
