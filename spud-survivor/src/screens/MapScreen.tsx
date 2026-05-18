import { GRID_SIZE } from "../game/constants";
import type { RoomDef } from "../game/types";

const ROOM_TYPE_CONFIG = {
  combat: { color: "#3d2410", label: "⚔️", labelColor: "#d4a050" },
  maze: { color: "#3d1010", label: "💀", labelColor: "#ef4444" },
  shop: { color: "#102a10", label: "🛒", labelColor: "#22c55e" },
  boss: { color: "#3d0010", label: "👑", labelColor: "#f59e0b" },
  heal: { color: "#0a2a0a", label: "✚", labelColor: "#22c55e" },
};

interface Props {
  rooms: RoomDef[][];
  currentRoom: { x: number; y: number };
  onTravel: (x: number, y: number) => void;
}

export default function MapScreen({ rooms, currentRoom, onTravel }: Props) {
  const totalCleared = rooms.flat().filter((r) => r.cleared).length;
  const bossUnlocked = totalCleared >= 12;

  function canTravel(room: RoomDef) {
    const { x, y } = room;
    const isCurrent = room.x === currentRoom.x && room.y === currentRoom.y;
    if (isCurrent) return false;
    const isBoss = x === GRID_SIZE - 1 && y === GRID_SIZE - 1;
    if (isBoss && !bossUnlocked) return false;
    // Can only travel to rooms orthogonally adjacent to the current room
    const dx = Math.abs(x - currentRoom.x);
    const dy = Math.abs(y - currentRoom.y);
    const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    return isAdjacent;
  }

  function handleRoomClick(room: RoomDef) {
    if (!canTravel(room) || (room.x === currentRoom.x && room.y === currentRoom.y)) return;
    onTravel(room.x, room.y);
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at center, #1a0800 0%, #0a0400 100%)",
      }}
    >
      <div className="mb-2 text-amber-400/60 text-xs font-bold tracking-widest uppercase">
        Dungeon Map
      </div>
      <h2
        className="mb-1 font-black text-3xl"
        style={{ color: "#d97706", textShadow: "0 0 15px rgba(217,119,6,0.6)", fontFamily: "Georgia, serif" }}
      >
        CHOOSE YOUR PATH
      </h2>
      <p className="mb-4 text-amber-300/50 text-sm">
        {totalCleared}/25 rooms cleared
        {!bossUnlocked && (
          <span className="ml-2 text-red-400/60">
            (Boss unlocks at 12 cleared)
          </span>
        )}
      </p>

      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(180,83,9,0.3)",
          boxShadow: "0 0 40px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: 8,
          }}
        >
          {rooms.flatMap((row) =>
            row.map((room) => {
              const config = ROOM_TYPE_CONFIG[room.type];
              const isCurrent = room.x === currentRoom.x && room.y === currentRoom.y;
              const accessible = canTravel(room) && !isCurrent;
              const isLocked = !canTravel(room);
              const isBoss = room.x === GRID_SIZE - 1 && room.y === GRID_SIZE - 1;

              return (
                <div
                  key={`${room.x}-${room.y}`}
                  onClick={() => handleRoomClick(room)}
                  style={{
                    width: 68,
                    height: 68,
                    background: isCurrent
                      ? "rgba(217,119,6,0.25)"
                      : room.cleared
                      ? "rgba(10,20,10,0.6)"
                      : isLocked
                      ? "rgba(15,15,15,0.6)"
                      : config.color,
                    border: `2px solid ${
                      isCurrent
                        ? "#d97706"
                        : room.cleared
                        ? "rgba(34,197,94,0.4)"
                        : accessible
                        ? "rgba(217,119,6,0.6)"
                        : "rgba(50,30,10,0.4)"
                    }`,
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: accessible ? "pointer" : isCurrent ? "default" : "not-allowed",
                    opacity: isLocked ? 0.35 : 1,
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: isCurrent
                      ? "0 0 16px rgba(217,119,6,0.6)"
                      : accessible
                      ? "0 0 8px rgba(217,119,6,0.2)"
                      : "none",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (accessible) {
                      (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(217,119,6,0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLElement).style.boxShadow = isCurrent
                      ? "0 0 16px rgba(217,119,6,0.6)"
                      : "";
                  }}
                >
                  {room.unlocked || accessible ? (
                    <>
                      <span style={{ fontSize: 22 }}>
                        {isCurrent ? "🥔" : room.cleared ? "✓" : config.label}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: isCurrent
                            ? "#d97706"
                            : room.cleared
                            ? "#6ee7b7"
                            : config.labelColor,
                          marginTop: 2,
                          fontWeight: "bold",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {isBoss && !bossUnlocked
                          ? "LOCKED"
                          : isCurrent
                          ? "HERE"
                          : room.cleared
                          ? "CLEARED"
                          : room.type.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 8, color: "rgba(200,160,80,0.5)", marginTop: 1 }}>
                        {room.x},{room.y}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 20, opacity: 0.3 }}>?</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-5 flex gap-5 text-xs text-amber-300/50">
        {Object.entries(ROOM_TYPE_CONFIG).map(([type, cfg]) => (
          <span key={type}>
            {cfg.label} {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
