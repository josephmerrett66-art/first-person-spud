import type { RoomType } from "./types";

export const DOOR_W = 2.4;

export interface RoomShape {
  name: string;
  floorW: number;
  floorD: number;
  blockers: Array<[number, number, number, number]>;
  spawnX: number;
  spawnZ: number;
  exitX: number;
  exitZ: number;
  exitFacing: "N" | "S" | "E" | "W";
  obstTemplate: number;
}

export const ROOM_SHAPES: RoomShape[] = [
  // 0: Classic square
  { name: "Dungeon Chamber", floorW: 28, floorD: 28, blockers: [],
    spawnX: 0, spawnZ: 11, exitX: 0, exitZ: -11, exitFacing: "N", obstTemplate: 0 },
  // 1: Tall narrow corridor
  { name: "Long Passage", floorW: 12, floorD: 50, blockers: [],
    spawnX: 0, spawnZ: 22, exitX: 0, exitZ: -22, exitFacing: "N", obstTemplate: 1 },
  // 2: Wide horizontal corridor (exit east)
  { name: "Grand Hall", floorW: 50, floorD: 12, blockers: [],
    spawnX: -22, spawnZ: 0, exitX: 22, exitZ: 0, exitFacing: "E", obstTemplate: 2 },
  // 3: Large arena (boss rooms)
  { name: "Grand Arena", floorW: 42, floorD: 42, blockers: [],
    spawnX: 0, spawnZ: 18, exitX: 0, exitZ: -18, exitFacing: "N", obstTemplate: 3 },
  // 4: L-shape — square with top-right corner blocked
  { name: "L-Chamber", floorW: 30, floorD: 30, blockers: [[8, -8, 14, 14]],
    spawnX: -6, spawnZ: 11, exitX: -6, exitZ: -11, exitFacing: "N", obstTemplate: 4 },
  // 5: Reverse-L — square with bottom-right corner blocked
  { name: "Twisted Hall", floorW: 30, floorD: 30, blockers: [[8, 8, 14, 14]],
    spawnX: 0, spawnZ: 5, exitX: -6, exitZ: -11, exitFacing: "N", obstTemplate: 5 },
  // 6: T-shape — wide room with two bottom corners blocked
  { name: "T-Junction", floorW: 38, floorD: 26, blockers: [[-13, 8, 12, 10], [13, 8, 12, 10]],
    spawnX: 0, spawnZ: 4, exitX: 0, exitZ: -10, exitFacing: "N", obstTemplate: 6 },
  // 7: Cross/plus — square with 4 corners blocked
  { name: "Crossroads", floorW: 30, floorD: 30,
    blockers: [[-9, -9, 10, 10], [9, -9, 10, 10], [-9, 9, 10, 10], [9, 9, 10, 10]],
    spawnX: 0, spawnZ: 12, exitX: 0, exitZ: -12, exitFacing: "N", obstTemplate: 7 },
  // 8: Z-corridor — wide with top-right and bottom-left blocked
  { name: "Winding Path", floorW: 44, floorD: 28, blockers: [[11, -7, 22, 14], [-11, 7, 22, 14]],
    spawnX: -15, spawnZ: 10, exitX: 15, exitZ: -10, exitFacing: "N", obstTemplate: 0 },
];

export function getRoomType(roomIndex: number): RoomType {
  if (roomIndex === 0) return "combat";
  const pos = roomIndex % 6;
  if (pos === 5) return "boss";
  if (pos === 2) return "heal";
  if (pos === 4) return "shop";
  if (pos === 1 && roomIndex > 6) return "maze";
  return "combat";
}

export function getRoomShape(roomIndex: number): number {
  const type = getRoomType(roomIndex);
  if (type === "boss") return 3;
  if (type === "shop" || type === "heal") return 0;
  if (type === "maze") return 7;
  const combatShapes = [0, 1, 2, 4, 5, 6, 7, 8];
  return combatShapes[roomIndex % combatShapes.length];
}

export function getBossNumber(roomIndex: number): number {
  return Math.floor(roomIndex / 6) + 1;
}

export function getDifficultyScale(roomIndex: number): number {
  const boss = Math.floor(roomIndex / 6);
  return 1.0 + boss * 0.35 + (roomIndex % 6) * 0.04;
}

export function getRandomSpawnPos(shape: RoomShape): [number, number] {
  const hw = shape.floorW / 2 - 2.0;
  const hd = shape.floorD / 2 - 2.0;
  const margin = 3.0;
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = (Math.random() * 2 - 1) * hw;
    const z = (Math.random() * 2 - 1) * hd;
    if (Math.abs(x - shape.spawnX) < 4 && Math.abs(z - shape.spawnZ) < 5) continue;
    if (Math.abs(x - shape.exitX) < 4 && Math.abs(z - shape.exitZ) < 5) continue;
    const inBlocker = shape.blockers.some(([bx, bz, bw, bd]) =>
      Math.abs(x - bx) < bw / 2 + margin && Math.abs(z - bz) < bd / 2 + margin
    );
    if (!inBlocker) return [x, z];
  }
  return [0, 0];
}
