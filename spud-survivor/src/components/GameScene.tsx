import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gameState } from "../game/gameState";
import { spawnEnemies, updateEnemyAI, createEnemy } from "../game/enemies";
import { createExplosion, createHitSpark, createMuzzleFlash } from "../game/particles";
import { WEAPONS, ROOM_SIZE, WALL_HEIGHT, PLAYER_HEIGHT, GRID_SIZE, DIFFICULTIES, ENEMIES, PLAYER_RADIUS } from "../game/constants";
import * as roomShapes from "../game/roomShapes";
import type { Enemy, Projectile, ConsumableType } from "../game/types";
import { playShoot, playHit, playEnemyDie, playPlayerHurt, playPickup, playLevelUp, playWaveClear, playDash, playExplosion, playXpCollect, playBossHit, playCharge } from "../game/sounds";

const HALF_ROOM = ROOM_SIZE / 2 - 0.5;
const MOVE_SPEED = 5.5;

let projId = 0;

function addBox(scene: THREE.Scene, mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
}

// ─── Pixel-art texture generators ────────────────────────────────────────────
function makePixelTex(draw: (ctx: CanvasRenderingContext2D) => void, size = 64): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function stoneBrickTex(): THREE.CanvasTexture {
  return makePixelTex(ctx => {
    ctx.fillStyle = "#2e2418"; ctx.fillRect(0, 0, 64, 64);
    const bricks: [number,number,number,number][] = [
      [1,1,29,13],[33,1,30,13],
      [0,15,13,13],[15,15,30,13],[47,15,16,13],
      [1,29,29,13],[33,29,30,13],
      [0,43,13,13],[15,43,30,13],[47,43,16,13],
    ];
    for (const [x,y,w,h] of bricks) {
      ctx.fillStyle = "#9b7d5a"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#c8a870"; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y, 3, h);
      ctx.fillStyle = "#6b4e30"; ctx.fillRect(x, y+h-3, w, 3); ctx.fillRect(x+w-3, y, 3, h);
      ctx.fillStyle = "#7a5c38"; ctx.fillRect(x+6, y+5, 3, 3); ctx.fillRect(x+16, y+8, 2, 2);
    }
  });
}

function stoneTileTex(): THREE.CanvasTexture {
  return makePixelTex(ctx => {
    ctx.fillStyle = "#1e1810"; ctx.fillRect(0, 0, 64, 64);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const x = c*33+1, y = r*33+1, w = 31, h = 31;
      ctx.fillStyle = "#3d3020"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#524030"; ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y, 4, h);
      ctx.fillStyle = "#2a2015"; ctx.fillRect(x, y+h-3, w, 3); ctx.fillRect(x+w-3, y, 3, h);
      ctx.fillStyle = "#332818"; ctx.fillRect(x+8, y+12, 3, 3); ctx.fillRect(x+20, y+22, 2, 2);
    }
  });
}

function woodPlankTex(): THREE.CanvasTexture {
  return makePixelTex(ctx => {
    ctx.fillStyle = "#120c06"; ctx.fillRect(0, 0, 64, 64);
    const cols = ["#4a3018","#3d2810","#452e16","#382208"];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i]; ctx.fillRect(0, i*16, 64, 15);
      ctx.fillStyle = "#5c3c20"; ctx.fillRect(0, i*16, 64, 2);
      ctx.fillStyle = "#281806"; ctx.fillRect(0, i*16+13, 64, 2);
      for (let g = 0; g < 5; g++) {
        ctx.fillStyle = "#301a0a"; ctx.fillRect(g*13, i*16+2, 1, 11);
      }
    }
  });
}

function roughStoneTex(): THREE.CanvasTexture {
  return makePixelTex(ctx => {
    ctx.fillStyle = "#2a2018"; ctx.fillRect(0, 0, 64, 64);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const v = Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${88+v},${70+v},${52+v})`; ctx.fillRect(c*16+1, r*16+1, 14, 14);
      ctx.fillStyle = `rgb(${108+v},${88+v},${68+v})`; ctx.fillRect(c*16+1, r*16+1, 14, 3);
    }
  });
}

function woodCrateTex(): THREE.CanvasTexture {
  return makePixelTex(ctx => {
    ctx.fillStyle = "#7c5230"; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#5a3820";
    for (let i = 0; i < 5; i++) { ctx.fillRect(0, i*13, 64, 2); ctx.fillRect(i*13, 0, 2, 64); }
    ctx.strokeStyle = "#4a2c18"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(60, 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, 4); ctx.lineTo(4, 60); ctx.stroke();
    ctx.fillStyle = "#9c7248"; ctx.fillRect(0, 0, 64, 2); ctx.fillRect(0, 0, 2, 64);
  });
}
// ─────────────────────────────────────────────────────────────────────────────

function buildScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c0804, 15, 55);
  scene.background = new THREE.Color(0x0c0804);
  const ambient = new THREE.AmbientLight(0xffd090, 0.6);
  scene.add(ambient);
  return { scene };
}

function addGroupBox(group: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  group.add(mesh);
}

function buildRoomObstacles(template: number): THREE.Group {
  const group = new THREE.Group();
  group.name = "obstacles";
  const coverMat = new THREE.MeshLambertMaterial({ map: roughStoneTex() });
  const crateMat = new THREE.MeshLambertMaterial({ map: woodCrateTex() });
  const h = WALL_HEIGHT * 0.65;
  const cy = h / 2;
  const cH = 1.2;

  const t = ((template ?? 0) % 8);
  if (t === 0) {
    // Cross + L-shaped cover (original layout)
    addGroupBox(group, coverMat, -8, cy, 0, 0.7, h, 7);
    addGroupBox(group, coverMat,  8, cy, 0, 0.7, h, 7);
    addGroupBox(group, coverMat,  0, cy, -8, 7, h, 0.7);
    addGroupBox(group, coverMat,  0, cy,  8, 7, h, 0.7);
    addGroupBox(group, coverMat, -13, cy, -11, 5, h, 0.7);
    addGroupBox(group, coverMat, -15, cy, -13, 0.7, h, 4);
    addGroupBox(group, coverMat,  13, cy, -11, 5, h, 0.7);
    addGroupBox(group, coverMat,  15, cy, -13, 0.7, h, 4);
    addGroupBox(group, coverMat, -13, cy,  11, 5, h, 0.7);
    addGroupBox(group, coverMat, -15, cy,  13, 0.7, h, 4);
    addGroupBox(group, coverMat,  13, cy,  11, 5, h, 0.7);
    addGroupBox(group, coverMat,  15, cy,  13, 0.7, h, 4);
    for (const [cx, cz] of [[-6,-4],[6,-4],[-6,4],[6,4]]) addGroupBox(group, crateMat, cx, cH/2, cz, 1.2, cH, 1.2);
  } else if (t === 1) {
    // Open arena with scattered crates
    for (const [cx, cz] of [[-10,0],[10,0],[0,-10],[0,10],[-14,-7],[14,7]]) {
      addGroupBox(group, crateMat, cx, cH/2, cz, 1.2, cH, 1.2);
    }
    addGroupBox(group, coverMat, -4, cy, 0, 0.7, h, 6);
    addGroupBox(group, coverMat,  4, cy, 0, 0.7, h, 6);
  } else if (t === 2) {
    // Diagonal barricades
    for (let i = -3; i <= 3; i++) {
      addGroupBox(group, coverMat, i * 3.5, cy, i * 3.5, 0.7, h, 0.7);
    }
    addGroupBox(group, coverMat, -12, cy, -6, 6, h, 0.7);
    addGroupBox(group, coverMat,  12, cy,  6, 6, h, 0.7);
    for (const [cx, cz] of [[-8,8],[8,-8]]) addGroupBox(group, crateMat, cx, cH/2, cz, 1.2, cH, 1.2);
  } else if (t === 3) {
    // Concentric ring cover
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      addGroupBox(group, coverMat, Math.cos(a)*9, cy, Math.sin(a)*9, 0.7, h, 4);
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      addGroupBox(group, coverMat, Math.cos(a)*5, cy, Math.sin(a)*5, 0.7, h, 3);
    }
    addGroupBox(group, coverMat, 0, cy, 0, 1.2, h, 1.2);
  } else if (t === 4) {
    // Grid of pillars
    for (let gx = -1; gx <= 1; gx++) {
      for (let gz = -1; gz <= 1; gz++) {
        if (gx === 0 && gz === 0) continue;
        const px = gx * 8, pz = gz * 8;
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, h, 8), coverMat);
        mesh.position.set(px, cy, pz);
        group.add(mesh);
      }
    }
    for (const [cx, cz] of [[-14,-14],[14,14],[14,-14],[-14,14]]) addGroupBox(group, coverMat, cx, cy, cz, 0.7, h, 4);
  } else if (t === 5) {
    // Long corridors (maze-like)
    addGroupBox(group, coverMat, -10, cy,  4, 10, h, 0.7);
    addGroupBox(group, coverMat,  10, cy, -4, 10, h, 0.7);
    addGroupBox(group, coverMat, -5, cy, -10, 0.7, h, 10);
    addGroupBox(group, coverMat,  5, cy,  10, 0.7, h, 10);
    for (const [cx, cz] of [[-14,0],[14,0],[0,-14],[0,14]]) addGroupBox(group, coverMat, cx, cy, cz, 0.7, h, 3);
  } else if (t === 6) {
    // Wide U-shaped barriers
    addGroupBox(group, coverMat, -7, cy, -6, 0.7, h, 8);
    addGroupBox(group, coverMat, -10, cy, -2, 5, h, 0.7);
    addGroupBox(group, coverMat,  7, cy,  6, 0.7, h, 8);
    addGroupBox(group, coverMat,  10, cy,  2, 5, h, 0.7);
    for (const [cx, cz] of [[-3,-12],[3,12],[-13,5],[13,-5]]) addGroupBox(group, crateMat, cx, cH/2, cz, 1.2, cH, 1.2);
  } else {
    // t === 7: Symmetric X layout
    addGroupBox(group, coverMat, -8, cy, -8, 0.7, h, 10);
    addGroupBox(group, coverMat,  8, cy,  8, 0.7, h, 10);
    addGroupBox(group, coverMat, -8, cy,  8, 10, h, 0.7);
    addGroupBox(group, coverMat,  8, cy, -8, 10, h, 0.7);
    addGroupBox(group, coverMat,  0, cy,  0, 1.5, h, 1.5);
    for (const [cx, cz] of [[-4,0],[4,0],[0,-4],[0,4]]) addGroupBox(group, crateMat, cx, cH/2, cz, 1.2, cH, 1.2);
  }

  return group;
}

// ── Obstacle collision helpers ────────────────────────────────────────────────
function extractObstacleBoxes(grp: THREE.Group): THREE.Box3[] {
  const boxes: THREE.Box3[] = [];
  grp.traverse(child => {
    if (child instanceof THREE.Mesh) boxes.push(new THREE.Box3().setFromObject(child));
  });
  return boxes;
}

function resolveObstacleCollision(pos: THREE.Vector3, radius: number, boxes: THREE.Box3[]): void {
  for (const box of boxes) {
    const cx = Math.max(box.min.x, Math.min(box.max.x, pos.x));
    const cz = Math.max(box.min.z, Math.min(box.max.z, pos.z));
    const dx = pos.x - cx, dz = pos.z - cz;
    const dist2 = dx * dx + dz * dz;
    if (dist2 < radius * radius) {
      const dist = Math.sqrt(dist2);
      if (dist < 0.001) {
        const dl = pos.x - box.min.x, dr = box.max.x - pos.x;
        const dt = pos.z - box.min.z, db = box.max.z - pos.z;
        const mn = Math.min(dl, dr, dt, db);
        if (mn === dl) pos.x = box.min.x - radius;
        else if (mn === dr) pos.x = box.max.x + radius;
        else if (mn === dt) pos.z = box.min.z - radius;
        else pos.z = box.max.z + radius;
      } else {
        pos.x += (dx / dist) * (radius - dist);
        pos.z += (dz / dist) * (radius - dist);
      }
    }
  }
}

function buildRoomGeom(shapeIdx: number): {
  group: THREE.Group;
  wallBoxes: THREE.Box3[];
  doorBlockerBox: THREE.Box3;
  torchLights: THREE.PointLight[];
  doorMesh: THREE.Mesh;
} {
  const shape = roomShapes.ROOM_SHAPES[shapeIdx];
  const group = new THREE.Group();
  group.name = "roomGeom";
  const wallBoxes: THREE.Box3[] = [];
  const WT = 0.6;
  const hw = shape.floorW / 2;
  const hd = shape.floorD / 2;
  const EX = hw + WT / 2;
  const WX = -(hw + WT / 2);
  const NZ = -(hd + WT / 2);
  const SZ = hd + WT / 2;
  const OUTER_W = shape.floorW + WT;
  const OUTER_D = shape.floorD + WT;

  const floorTex = stoneTileTex();
  floorTex.repeat.set(shape.floorW / 4, shape.floorD / 4);
  const floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
  const ceilTex = woodPlankTex();
  ceilTex.repeat.set(shape.floorW / 3, shape.floorD / 3);
  const ceilMat = new THREE.MeshLambertMaterial({ map: ceilTex });
  const wallMat = new THREE.MeshLambertMaterial({ map: stoneBrickTex() });
  const pillarMat = new THREE.MeshLambertMaterial({ map: roughStoneTex() });

  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(shape.floorW, shape.floorD), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  group.add(floorMesh);
  const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(shape.floorW, shape.floorD), ceilMat);
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.y = WALL_HEIGHT;
  group.add(ceilMesh);

  function addWall(x: number, z: number, w: number, d: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_HEIGHT, d), wallMat);
    mesh.position.set(x, WALL_HEIGHT / 2, z);
    group.add(mesh);
    wallBoxes.push(new THREE.Box3().setFromObject(mesh));
  }

  function addWallWithGap(isHoriz: boolean, base: number, gapCenter: number, totalLen: number) {
    const half = totalLen / 2;
    const g0 = gapCenter - roomShapes.DOOR_W / 2;
    const g1 = gapCenter + roomShapes.DOOR_W / 2;
    const lenL = g0 - (-half);
    const lenR = half - g1;
    if (isHoriz) {
      if (lenL > 0) addWall(-half + lenL / 2, base, lenL, WT);
      if (lenR > 0) addWall(half - lenR / 2, base, lenR, WT);
    } else {
      if (lenL > 0) addWall(base, -half + lenL / 2, WT, lenL);
      if (lenR > 0) addWall(base, half - lenR / 2, WT, lenR);
    }
  }

  const { exitFacing, exitX, exitZ } = shape;
  if (exitFacing === "N") {
    addWallWithGap(true, NZ, exitX, OUTER_W);
    addWall(0, SZ, OUTER_W, WT);
    addWall(EX, 0, WT, OUTER_D);
    addWall(WX, 0, WT, OUTER_D);
  } else if (exitFacing === "S") {
    addWall(0, NZ, OUTER_W, WT);
    addWallWithGap(true, SZ, exitX, OUTER_W);
    addWall(EX, 0, WT, OUTER_D);
    addWall(WX, 0, WT, OUTER_D);
  } else if (exitFacing === "E") {
    addWall(0, NZ, OUTER_W, WT);
    addWall(0, SZ, OUTER_W, WT);
    addWallWithGap(false, EX, exitZ, OUTER_D);
    addWall(WX, 0, WT, OUTER_D);
  } else {
    addWall(0, NZ, OUTER_W, WT);
    addWall(0, SZ, OUTER_W, WT);
    addWall(EX, 0, WT, OUTER_D);
    addWallWithGap(false, WX, exitZ, OUTER_D);
  }

  for (const [bx, bz, bw, bd] of shape.blockers) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, WALL_HEIGHT, bd), wallMat);
    mesh.position.set(bx, WALL_HEIGHT / 2, bz);
    group.add(mesh);
    wallBoxes.push(new THREE.Box3().setFromObject(mesh));
  }

  for (const [px, pz] of [[WX + 1.5, NZ + 1.5], [EX - 1.5, NZ + 1.5], [WX + 1.5, SZ - 1.5], [EX - 1.5, SZ - 1.5]]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, WALL_HEIGHT, 1.4), pillarMat);
    mesh.position.set(px, WALL_HEIGHT / 2, pz);
    group.add(mesh);
  }

  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9922 });
  const bracketMat2 = new THREE.MeshLambertMaterial({ color: 0x3d2010 });
  const flameGeo2 = new THREE.BoxGeometry(0.2, 0.3, 0.2);
  const torchLights: THREE.PointLight[] = [];
  const torchPositions: [number, number, number][] = [
    [hw * 0.45, 2.6, NZ + 0.8],
    [-(hw * 0.45), 2.6, NZ + 0.8],
    [EX - 0.8, 2.6, hd * 0.45],
    [EX - 0.8, 2.6, -(hd * 0.45)],
  ];
  for (const [tx, ty, tz] of torchPositions) {
    const light = new THREE.PointLight(0xff8c30, 14, 20);
    light.position.set(tx, ty, tz);
    group.add(light);
    torchLights.push(light);
    const flame = new THREE.Mesh(flameGeo2, flameMat);
    flame.position.set(tx, ty + 0.1, tz);
    group.add(flame);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), bracketMat2);
    bracket.position.set(tx, ty - 0.3, tz);
    group.add(bracket);
  }

  let doorX = exitX, doorZ = exitZ;
  let doorRotY = 0;
  if (exitFacing === "N") doorZ = NZ;
  else if (exitFacing === "S") doorZ = SZ;
  else if (exitFacing === "E") { doorX = EX; doorRotY = Math.PI / 2; }
  else { doorX = WX; doorRotY = Math.PI / 2; }
  const doorMat = new THREE.MeshBasicMaterial({ color: 0x550000, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(roomShapes.DOOR_W, WALL_HEIGHT, 0.12), doorMat);
  doorMesh.position.set(doorX, WALL_HEIGHT / 2, doorZ);
  doorMesh.rotation.y = doorRotY;
  doorMesh.name = "exitDoor";
  group.add(doorMesh);

  let dbMinX: number, dbMaxX: number, dbMinZ: number, dbMaxZ: number;
  if (exitFacing === "N") {
    dbMinX = exitX - roomShapes.DOOR_W / 2; dbMaxX = exitX + roomShapes.DOOR_W / 2;
    dbMinZ = NZ - WT / 2; dbMaxZ = NZ + WT / 2;
  } else if (exitFacing === "S") {
    dbMinX = exitX - roomShapes.DOOR_W / 2; dbMaxX = exitX + roomShapes.DOOR_W / 2;
    dbMinZ = SZ - WT / 2; dbMaxZ = SZ + WT / 2;
  } else if (exitFacing === "E") {
    dbMinX = EX - WT / 2; dbMaxX = EX + WT / 2;
    dbMinZ = exitZ - roomShapes.DOOR_W / 2; dbMaxZ = exitZ + roomShapes.DOOR_W / 2;
  } else {
    dbMinX = WX - WT / 2; dbMaxX = WX + WT / 2;
    dbMinZ = exitZ - roomShapes.DOOR_W / 2; dbMaxZ = exitZ + roomShapes.DOOR_W / 2;
  }
  const doorBlockerBox = new THREE.Box3(
    new THREE.Vector3(dbMinX, 0, dbMinZ),
    new THREE.Vector3(dbMaxX, WALL_HEIGHT, dbMaxZ)
  );

  return { group, wallBoxes, doorBlockerBox, torchLights, doorMesh };
}

// ── Pixel-art human face textures ─────────────────────────────────────────────
const _faceTextureCache = new Map<string, THREE.CanvasTexture>();

function createPixelFaceTexture(enemyType: string): THREE.CanvasTexture {
  const cached = _faceTextureCache.get(enemyType);
  if (cached) return cached;

  const W = 32, H = 32;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  const r = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const p = (x: number, y: number, c: string) => r(x, y, 1, 1, c);

  function drawBase(skin: string, hair: string, eyePupil: string, brow: string, mouthStyle: string, extras?: () => void) {
    ctx.clearRect(0, 0, W, H);
    r(7, 0, 18, 7, hair); r(5, 2, 22, 5, hair);
    r(8, 5, 16, 22, skin); r(6, 7, 20, 18, skin); r(4, 9, 24, 14, skin);
    r(4, 11, 3, 6, skin); r(25, 11, 3, 6, skin);
    r(4, 12, 1, 4, '#b07848'); r(27, 12, 1, 4, '#b07848');
    r(7, 17, 3, 3, '#e8aa78'); r(22, 17, 3, 3, '#e8aa78');
    r(9, 10, 5, 2, brow); r(18, 10, 5, 2, brow);
    r(8, 12, 7, 5, '#f2eeec'); r(17, 12, 7, 5, '#f2eeec');
    r(8, 12, 7, 1, '#1a0a06'); r(17, 12, 7, 1, '#1a0a06');
    r(8, 16, 7, 1, '#3a200e'); r(17, 16, 7, 1, '#3a200e');
    r(10, 13, 3, 3, eyePupil); r(19, 13, 3, 3, eyePupil);
    r(11, 14, 1, 1, '#0a0408'); r(20, 14, 1, 1, '#0a0408');
    p(10, 13, '#eef0ff'); p(19, 13, '#eef0ff');
    r(14, 19, 4, 2, '#c89870');
    r(13, 21, 2, 2, '#a07040'); r(17, 21, 2, 2, '#a07040');
    r(14, 22, 4, 1, '#d4a878');
    if (mouthStyle === 'scared') {
      r(11, 23, 10, 5, '#180808'); r(12, 24, 8, 3, '#cc1010');
      r(12, 23, 2, 2, '#e8e0dc'); r(18, 23, 2, 2, '#e8e0dc');
    } else if (mouthStyle === 'snarl') {
      r(9, 23, 14, 3, '#180808'); r(10, 23, 12, 1, '#e8e0dc');
      r(13, 22, 2, 3, '#180808'); r(17, 22, 2, 3, '#180808');
    } else if (mouthStyle === 'evil') {
      r(8, 23, 16, 2, '#180808'); r(8, 25, 3, 2, '#180808'); r(21, 25, 3, 2, '#180808');
      r(10, 24, 12, 1, '#e8e0dc');
      r(13, 24, 2, 2, '#180808'); r(17, 24, 2, 2, '#180808');
    } else if (mouthStyle === 'scream') {
      r(10, 22, 12, 7, '#180808'); r(11, 23, 10, 5, '#cc0808');
      r(11, 22, 3, 3, '#e8e0dc'); r(18, 22, 3, 3, '#e8e0dc');
      r(14, 25, 4, 2, '#800000');
    } else if (mouthStyle === 'grin') {
      r(11, 23, 10, 3, '#180808');
      r(11, 23, 10, 1, '#e8e0dc');
      r(11, 25, 10, 1, '#e8e0dc');
    } else {
      r(11, 24, 10, 2, '#c09080');
    }
    if (extras) extras();
  }

  if (enemyType === 'walker') {
    drawBase('#e8c090', '#6b3a2a', '#344488', '#4a3020', 'scared', () => {
      r(9, 9, 5, 2, '#4a3020'); r(18, 9, 5, 2, '#4a3020');
      p(9, 9, '#e8c090'); p(13, 9, '#e8c090'); p(18, 9, '#e8c090'); p(22, 9, '#e8c090');
      r(5, 11, 2, 4, '#9fd4f8'); p(6, 10, '#cce8ff'); p(5, 15, '#70b8f0');
      r(14, 8, 4, 1, '#d4b07a');
    });
  } else if (enemyType === 'runner') {
    drawBase('#ffd4a0', '#e86820', '#344488', '#3a2010', 'scared', () => {
      r(5, 0, 3, 10, '#e86820'); r(9, 0, 3, 12, '#e86820'); r(13, 0, 3, 11, '#e86820'); r(21, 0, 3, 9, '#e86820');
      r(7, 11, 9, 7, '#f8f4f0'); r(16, 11, 9, 7, '#f8f4f0');
      r(7, 11, 9, 1, '#1a0a06'); r(16, 11, 9, 1, '#1a0a06');
      p(3, 10, '#9fd4f8'); r(3, 11, 1, 4, '#7bc0f0');
      p(28, 10, '#9fd4f8'); r(28, 11, 1, 4, '#7bc0f0');
      r(6, 16, 4, 3, '#ff9090'); r(22, 16, 4, 3, '#ff9090');
    });
  } else if (enemyType === 'brute') {
    drawBase('#b08050', '#1a0a0a', '#cc1111', '#180808', 'snarl', () => {
      r(7, 9, 8, 3, '#1a0a0a'); r(17, 9, 8, 3, '#1a0a0a');
      r(7, 9, 1, 4, '#1a0a0a'); r(22, 9, 1, 4, '#1a0a0a');
      for (let sx = 9; sx < 23; sx += 2) { r(sx, 26, 1, 2, '#2a1408'); r(sx+1, 27, 1, 2, '#2a1408'); }
      r(15, 10, 2, 7, '#c06050'); r(13, 14, 6, 1, '#c06050');
      r(12, 21, 3, 2, '#7a4020'); r(17, 21, 3, 2, '#7a4020');
    });
  } else if (enemyType === 'shooter') {
    drawBase('#d4b880', '#1a2030', '#3a8888', '#0a1828', 'grin', () => {
      r(3, 0, 26, 12, '#1e2d3d'); r(2, 3, 28, 9, '#253545'); r(3, 10, 26, 2, '#1a2838');
      r(6, 11, 2, 2, '#303f50'); r(24, 11, 2, 2, '#303f50');
      r(8, 12, 7, 3, '#f2eeec'); r(17, 12, 7, 3, '#f2eeec');
      r(8, 14, 7, 2, '#1a0a06'); r(17, 14, 7, 2, '#1a0a06');
      r(13, 27, 6, 3, '#b8c0c0'); p(15, 28, '#909898'); p(17, 28, '#909898');
    });
  } else if (enemyType === 'boss') {
    drawBase('#c0c0cc', '#780610', '#ff0808', '#380000', 'evil', () => {
      r(5, 0, 22, 5, '#e8b800'); r(6, 0, 5, 7, '#e8b800'); r(13, 0, 6, 8, '#e8b800'); r(21, 0, 5, 7, '#e8b800');
      r(5, 5, 22, 2, '#c89800');
      r(8, 1, 2, 2, '#ff2020'); r(15, 0, 2, 2, '#3030ee'); r(22, 1, 2, 2, '#20ee60');
      r(6, 11, 10, 2, '#9090a8'); r(16, 11, 10, 2, '#9090a8');
      r(10, 13, 3, 3, '#ff0000'); r(19, 13, 3, 3, '#ff0000');
      p(10, 13, '#ff8080'); p(19, 13, '#ff8080');
      r(14, 27, 2, 3, '#e8e0dc'); r(18, 27, 2, 3, '#e8e0dc');
      r(15, 7, 2, 2, '#9090a8');
    });
  } else if (enemyType === 'dasher') {
    drawBase('#ff8060', '#cc2000', '#cc0000', '#aa1000', 'grin', () => {
      r(8, 0, 2, 11, '#cc2000'); r(12, 0, 2, 13, '#cc2000'); r(16, 0, 2, 12, '#cc2000'); r(20, 0, 2, 10, '#cc2000');
      p(8, 0, '#ff6030'); p(12, 0, '#ff6030'); p(16, 0, '#ff6030'); p(20, 0, '#ff6030');
      r(11, 8, 1, 3, '#cc3030'); r(10, 9, 3, 1, '#cc3030');
      r(20, 8, 1, 3, '#cc3030'); r(20, 9, 3, 1, '#cc3030');
      r(7, 11, 9, 7, '#faf6f0'); r(16, 11, 9, 7, '#faf6f0');
      r(8, 11, 7, 1, '#1a0a06'); r(17, 11, 7, 1, '#1a0a06');
      r(3, 14, 3, 2, '#ffaa80'); r(26, 14, 3, 2, '#ffaa80');
      r(2, 15, 2, 1, '#ff9060'); r(28, 15, 2, 1, '#ff9060');
    });
  } else if (enemyType === 'spitter') {
    drawBase('#88c060', '#265210', '#c07800', '#14420a', 'neutral', () => {
      r(7, 12, 2, 2, '#4a9030'); r(23, 12, 2, 2, '#4a9030');
      r(8, 21, 2, 2, '#4a9030'); r(21, 22, 2, 2, '#4a9030');
      r(17, 15, 7, 3, '#3a2010'); r(17, 16, 7, 2, '#1a0a06');
      r(15, 27, 4, 5, '#88d050'); r(16, 29, 2, 5, '#60b830');
      p(15, 27, '#a0e060'); p(18, 28, '#a0e060');
      r(13, 26, 6, 3, '#80d048');
    });
  } else if (enemyType === 'shrieker') {
    drawBase('#f0d840', '#e09000', '#0a0a14', '#aa7000', 'scream', () => {
      for (let i = 0; i < 9; i++) { r(4 + i*3, 0, 2, 3 + (i%4)*2, '#e09000'); p(4+i*3, 0, '#ffe040'); }
      r(6, 10, 11, 8, '#faf8f4'); r(15, 10, 11, 8, '#faf8f4');
      r(6, 10, 11, 1, '#1a0a06'); r(15, 10, 11, 1, '#1a0a06');
      r(9, 12, 5, 5, '#0a0408'); r(18, 12, 5, 5, '#0a0408');
      r(5, 13, 2, 1, '#e09000'); r(25, 13, 2, 1, '#e09000');
      r(4, 14, 2, 1, '#e09000'); r(26, 14, 2, 1, '#e09000');
    });
  } else if (enemyType === 'stalker') {
    drawBase('#6030a0', '#180822', '#aa00ff', '#140620', 'neutral', () => {
      r(3, 0, 26, 19, 'rgba(10,0,20,0.78)');
      r(3, 6, 26, 2, '#260848');
      r(7, 11, 9, 6, '#140420');
      r(16, 11, 10, 6, '#200838');
      r(17, 12, 8, 4, '#5a10a0');
      r(18, 13, 6, 2, '#cc00ff');
      r(20, 13, 2, 2, '#ee80ff');
      p(20, 13, '#ffffff');
      r(12, 23, 8, 1, 'rgba(200,150,240,0.4)');
    });
  } else if (enemyType === 'bomber') {
    drawBase('#e0b870', '#221000', '#ff5500', '#180a00', 'neutral', () => {
      r(3, 18, 26, 13, '#cc2800'); r(3, 18, 26, 2, '#aa2000'); r(3, 20, 26, 1, '#ee4400');
      for (let bx = 6; bx < 27; bx += 3) p(bx, 22, '#ff5500');
      for (let bx = 7; bx < 27; bx += 3) p(bx, 24, '#aa2000');
      r(7, 11, 9, 7, '#fff8ee'); r(16, 11, 9, 7, '#fff8ee');
      r(7, 11, 9, 1, '#1a0a06'); r(16, 11, 9, 1, '#1a0a06');
      r(9, 13, 4, 3, '#ff4400'); r(18, 13, 4, 3, '#ff4400');
      p(9, 13, '#ffffff'); p(18, 13, '#ffffff');
      r(16, 0, 2, 5, '#604020'); p(15, 5, '#ff8800'); p(16, 5, '#ffdd00'); p(17, 5, '#ffdd00'); p(16, 6, '#ffaa00');
    });
  } else if (enemyType === 'sentinel') {
    ctx.clearRect(0, 0, W, H);
    r(2, 2, 28, 28, '#1e2c3a'); r(3, 3, 26, 26, '#283848');
    r(2, 14, 28, 1, '#1a2230'); r(2, 22, 28, 1, '#1a2230'); r(14, 2, 1, 28, '#1a2230');
    r(3, 3, 3, 3, '#3a5060'); r(26, 3, 3, 3, '#3a5060'); r(3, 26, 3, 3, '#3a5060'); r(26, 26, 3, 3, '#3a5060');
    r(3, 11, 26, 8, '#080c10'); r(4, 12, 24, 6, '#0a1520');
    r(5, 12, 22, 6, '#cc2800'); r(6, 13, 20, 4, '#ee4400'); r(8, 14, 16, 2, '#ff8800'); r(12, 14, 8, 2, '#ffcc60');
    for (let g = 7; g < 26; g += 3) r(g, 23, 1, 6, '#1a2230');
    r(15, 0, 2, 4, '#304050'); p(15, 0, '#4a6880'); p(16, 0, '#4a6880');
  } else if (enemyType === 'charger') {
    drawBase('#ff5040', '#380808', '#cc0000', '#280000', 'snarl', () => {
      r(0, 0, 7, 12, '#b07830'); r(25, 0, 7, 12, '#b07830');
      r(1, 0, 5, 8, '#c08840'); r(26, 0, 5, 8, '#c08840');
      r(2, 0, 3, 4, '#e0a040'); r(27, 0, 3, 4, '#e0a040');
      p(3, 0, '#f0b848'); p(28, 0, '#f0b848');
      r(7, 9, 8, 3, '#280000'); r(17, 9, 8, 3, '#280000');
      r(7, 11, 2, 2, '#280000'); r(22, 11, 2, 2, '#280000');
      r(12, 7, 1, 4, '#cc2020'); r(11, 8, 3, 1, '#cc2020');
      r(19, 7, 1, 4, '#cc2020'); r(19, 8, 3, 1, '#cc2020');
      r(11, 20, 4, 3, '#9a3820'); r(17, 20, 4, 3, '#9a3820');
      r(12, 21, 2, 2, '#1a0808'); r(18, 21, 2, 2, '#1a0808');
    });
  } else if (enemyType === 'necromancer') {
    drawBase('#a89ec0', '#180a28', '#00ff88', '#100820', 'evil', () => {
      r(6, 10, 11, 8, '#0c0418'); r(15, 10, 11, 8, '#0c0418');
      r(7, 11, 9, 6, '#080218'); r(16, 11, 9, 6, '#080218');
      r(8, 12, 7, 4, '#004820'); r(17, 12, 7, 4, '#004820');
      r(9, 13, 5, 2, '#00cc66'); r(18, 13, 5, 2, '#00cc66');
      r(10, 13, 3, 2, '#00ff88'); r(19, 13, 3, 2, '#00ff88');
      p(11, 13, '#aaffcc'); p(20, 13, '#aaffcc');
      r(13, 5, 6, 2, '#807898'); r(15, 5, 2, 6, '#807898'); r(14, 6, 4, 1, '#807898');
      r(14, 19, 4, 5, '#100830'); r(13, 21, 2, 2, '#0c0418'); r(17, 21, 2, 2, '#0c0418');
      for (let jy = 24; jy < 30; jy += 2) r(13, jy, 6, 1, '#1a0a28');
    });
  } else {
    drawBase('#e8c090', '#6a4020', '#344488', '#4a3020', 'neutral');
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  _faceTextureCache.set(enemyType, tex);
  return tex;
}

// ── Enemy mesh: simple body + billboard pixel-art face sprite ─────────────────
function createEnemyMesh(scene: THREE.Scene, enemy: Enemy): THREE.Group {
  const group = new THREE.Group();
  group.name = enemy.id;
  const { def } = enemy;
  const s = def.size;
  const color = new THREE.Color(def.color);
  const isTransparent = enemy.type === 'stalker';
  const bodyMat = new THREE.MeshLambertMaterial({ color, transparent: isTransparent, opacity: isTransparent ? 0.55 : 1.0 });
  const darkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(def.color).multiplyScalar(0.55), transparent: isTransparent, opacity: isTransparent ? 0.6 : 1.0 });

  function mb(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    group.add(m);
  }

  if (enemy.type === 'boss') {
    mb(0, s*0.7, 0, s*2.4, s*1.6, s*2.4, bodyMat);
    mb(0, s*1.95, 0, s*1.8, s*1.4, s*1.8, darkMat);
    const crownMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      mb(Math.cos(a)*s*0.8, s*2.85+(i%2)*0.38, Math.sin(a)*s*0.8, 0.3, 0.48, 0.3, crownMat);
    }
  } else if (enemy.type === 'sentinel') {
    const metalMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(def.color).multiplyScalar(0.80) });
    mb(0, s*0.3, 0, s*2.6, s*0.7, s*2.0, bodyMat);
    mb(0, s*0.9, 0, s*2.0, s*0.65, s*1.6, metalMat);
    mb(-s*0.7, s*0.28, 0, s*0.55, s*0.55, s*1.3, darkMat);
    mb( s*0.7, s*0.28, 0, s*0.55, s*0.55, s*1.3, darkMat);
  } else if (enemy.type === 'necromancer') {
    const robeMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(def.color).multiplyScalar(0.7) });
    mb(0, s*0.5, 0, s*1.1, s*1.2, s*1.0, robeMat);
    mb(0, s*1.5, 0, s*0.85, s*1.0, s*0.85, bodyMat);
    mb(s*0.62, s*2.1, 0, s*0.12, s*1.4, s*0.12, darkMat);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x44ffaa });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(s*0.22, 6, 6), orbMat);
    orb.position.set(s*0.62, s*2.85, 0); group.add(orb);
  } else {
    const bodyH = s * 0.9;
    mb(0, bodyH * 0.5, 0, s * 0.75, bodyH, s * 0.6, bodyMat);
    mb(-s*0.5, bodyH*0.4, 0, s*0.22, s*0.6, s*0.22, darkMat);
    mb( s*0.5, bodyH*0.4, 0, s*0.22, s*0.6, s*0.22, darkMat);
    mb(-s*0.22, 0, 0, s*0.22, s*0.35, s*0.22, darkMat);
    mb( s*0.22, 0, 0, s*0.22, s*0.35, s*0.22, darkMat);
    if (enemy.type === 'charger' && enemy.chargeState === 'telegraphing') {
      const telegMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(s*0.6, 0.07, 5, 14), telegMat);
      ring.position.y = s * 0.5;
      group.add(ring);
    }
  }

  // Pixel-art face sprite — always faces camera (billboard)
  const faceTex = createPixelFaceTexture(enemy.type);
  const spriteMat = new THREE.SpriteMaterial({ map: faceTex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  const headSz = enemy.type === 'boss' ? s*2.2 : enemy.type === 'sentinel' ? s*1.3 : s*1.55;
  const headY  = enemy.type === 'boss' ? s*2.2 : enemy.type === 'necromancer' ? s*2.65 : enemy.type === 'sentinel' ? s*0.95 : s*1.25;
  sprite.scale.set(headSz, headSz, 1);
  sprite.position.y = headY;
  sprite.name = "face_sprite";
  group.add(sprite);

  // Elite ring
  if (enemy.isElite) {
    const eliteColor = enemy.eliteType === "shielded" ? 0x4080ff : enemy.eliteType === "fast" ? 0x40ff80 : 0xff6000;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(def.size * 0.9, 0.06, 6, 24), new THREE.MeshBasicMaterial({ color: eliteColor }));
    ring.position.y = def.size * 0.5;
    group.add(ring);
  }

  // HP bar
  const hpBarGroup = new THREE.Group();
  hpBarGroup.name = "hpbar";
  hpBarGroup.position.y = headY + headSz * 0.58;
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(def.size * 2.2, 0.12), new THREE.MeshBasicMaterial({ color: 0x1a1a1a, depthTest: false }));
  hpBarGroup.add(bgMesh);
  const fillMesh = new THREE.Mesh(new THREE.PlaneGeometry(def.size * 2.2, 0.12), new THREE.MeshBasicMaterial({ color: 0x22c55e, depthTest: false }));
  fillMesh.name = "hpfill";
  fillMesh.position.z = 0.001;
  hpBarGroup.add(fillMesh);
  if (enemy.maxShield && enemy.maxShield > 0) {
    const shieldFill = new THREE.Mesh(new THREE.PlaneGeometry(def.size * 2.2, 0.08), new THREE.MeshBasicMaterial({ color: 0x4080ff, depthTest: false, transparent: true, opacity: 0.85 }));
    shieldFill.name = "shieldfill";
    shieldFill.position.y = 0.14;
    shieldFill.position.z = 0.001;
    hpBarGroup.add(shieldFill);
  }
  group.add(hpBarGroup);
  group.position.copy(enemy.position);
  scene.add(group);
  return group;
}

interface Props {
  onPhaseChange: () => void;
  touchControlsActive: boolean;
}

const MAX_PARTICLES = 512;
const MAX_TRAIL = 5;
const _sharedTrailGeo = new THREE.SphereGeometry(0.04, 4, 4);

export default function GameScene({ onPhaseChange, touchControlsActive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const joystickThumbRef = useRef<HTMLDivElement>(null);
  const touchMoveRef = useRef({ x: 0, y: 0 });
  const touchLookRef = useRef({ dx: 0, dy: 0 });
  const touchShootRef = useRef(false);
  const touchDashRef = useRef(false);
  const touchSpecialRef = useRef(false);
  const touchPlaceRef = useRef(false);
  const touchConsumableRef = useRef<number | null>(null);
  const joystickPointerRef = useRef<number | null>(null);
  const lookPointerRef = useRef<number | null>(null);
  const lookLastRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef({
    enemyMeshes: new Map<string, THREE.Group>(),
    projectileMeshes: new Map<string, THREE.Group>(),
    chestMeshes: new Map<string, THREE.Group>(),
    structureMeshes: new Map<string, THREE.Group>(),
    companionMeshes: new Map<string, THREE.Mesh>(),
    xpGemMeshes: [] as Array<{ mesh: THREE.Mesh; vel: THREE.Vector3; value: number }>,
    damageNumbers: [] as Array<{ pos: THREE.Vector3; value: number; isCrit: boolean; age: number; maxAge: number }>,
    laserBeamLine: null as THREE.Line | null,
    laserBeamTimer: 0,
    meleeMesh: null as THREE.Mesh | null,
    meleeTimer: 0,
    meleeMaxTimer: 0.2,
    doorBarriers: [] as THREE.Mesh[],
    spikeMeshes: new Map<string, THREE.Mesh>(),
    particleGeo: null as THREE.BufferGeometry | null,
    particlePoints: null as THREE.Points | null,
    particlePositions: new Float32Array(MAX_PARTICLES * 3),
    particleColors: new Float32Array(MAX_PARTICLES * 3),
  });
  const onPhaseChangeRef = useRef(onPhaseChange);
  onPhaseChangeRef.current = onPhaseChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const testCtx = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!testCtx) {
      console.warn("WebGL not available");
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", context: testCtx as WebGLRenderingContext });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    if (canvas2dRef.current) {
      canvas2dRef.current.width = canvas.clientWidth;
      canvas2dRef.current.height = canvas.clientHeight;
    }
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 150);
    camera.position.set(0, PLAYER_HEIGHT, 0);

    const { scene } = buildScene();
    const meshState = stateRef.current;
    let roomTorchLights: THREE.PointLight[] = [];
    let roomGeomGroup: THREE.Group | null = null;
    let roomWallBoxes: THREE.Box3[] = [];
    let currentDoorMesh: THREE.Mesh | null = null;
    let currentDoorBlockerBox: THREE.Box3 | null = null;
    let cachedObstacleBoxes: THREE.Box3[] = [];
    let doorOpenLastFrame = false;

    // Particle system
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(meshState.particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(meshState.particleColors, 3));
    const particleMat = new THREE.PointsMaterial({ size: 0.25, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);
    meshState.particleGeo = particleGeo;
    meshState.particlePoints = particlePoints;

    // Melee swing visual — a thin glowing arc that appears on melee attack
    const meleeGeo = new THREE.TorusGeometry(0.9, 0.06, 4, 10, Math.PI * 1.4);
    const meleeMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const meleeMesh = new THREE.Mesh(meleeGeo, meleeMat);
    scene.add(meleeMesh);
    meshState.meleeMesh = meleeMesh;

    // Initial room obstacle group (rebuilt each room change)
    let obstacleGroup = new THREE.Group();
    scene.add(obstacleGroup);
    let obstacleBoxes: THREE.Box3[] = [];
    let lastRoomIdx = -1;

    const keys: Record<string, boolean> = {};
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    let pointerLocked = false;
    let animId: number;

    const basePos = new THREE.Vector3(0, PLAYER_HEIGHT, 0);

    function applyConsumable(type: ConsumableType) {
      switch (type) {
        case "grenade": {
          const blastRadius = 7;
          let exploded = false;
          gameState.enemies = gameState.enemies.map((en) => {
            if (!en.isAlive) return en;
            const dist = basePos.distanceTo(en.position);
            if (dist < blastRadius) {
              const dmg = 80 * gameState.damage;
              const newHp = en.hp - dmg;
              if (newHp <= 0 && en.isAlive) {
                gameState.gainXP(en.def.xpReward);
                gameState.gainCoins(en.def.coinReward);
                gameState.totalKills++;
                gameState.damageDealt += dmg;
                gameState.particles.push(...createExplosion(en.position, en.def.color, 16));
              } else {
                gameState.damageDealt += dmg;
              }
              exploded = true;
              return { ...en, hp: Math.max(0, newHp), isAlive: newHp > 0, hitFlash: 1 };
            }
            return en;
          });
          if (exploded) {
            gameState.particles.push(...createExplosion(basePos.clone(), "#f97316", 28));
            gameState.addScreenShake(0.6, 0.3);
          }
          break;
        }
        case "potion":
          gameState.heal(40);
          break;
        case "freeze":
          gameState.freezeTimer = 4.0;
          break;
        case "magnet":
          // Instant coin reward (simulates magnet vacuum)
          gameState.gainCoins(10 * gameState.enemies.filter(e => e.isAlive).length);
          break;
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      keys[e.code] = true;

      if (gameState.phase !== "playing") return;

      // SPACE = dash
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState.dashChargesAvail > 0 || gameState.dashCd <= 0) {
          if (gameState.dashChargesAvail > 0) {
            gameState.dashChargesAvail--;
            gameState.dashCd = gameState.dashMax;
            playDash();
          }
          // Get movement direction for dash
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
          const dashDir = new THREE.Vector3();
          if (keys["KeyW"]) dashDir.add(forward);
          if (keys["KeyS"]) dashDir.sub(forward);
          if (keys["KeyD"]) dashDir.add(right);
          if (keys["KeyA"]) dashDir.sub(right);
          if (dashDir.length() < 0.1) dashDir.copy(forward);
          dashDir.normalize();
          gameState.isDashing = true;
          gameState.dashTime = 0.22;
          gameState.dashDir.copy(dashDir);
          gameState.invincible = true;
        }
      }

      // Q = special
      if (e.code === "KeyQ") {
        gameState.triggerSpecial(basePos.clone());
        onPhaseChangeRef.current();
      }

      // P = activate placement for next carried structure, or confirm placement
      if (e.code === "KeyP") {
        if (gameState.placementMode === "structure" && gameState.placementType) {
          // Confirm placement at look position
          const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
          const placePos = camera.position.clone().add(lookDir.multiplyScalar(3));
          placePos.x = Math.max(-HALF_ROOM + 1, Math.min(HALF_ROOM - 1, placePos.x));
          placePos.z = Math.max(-HALF_ROOM + 1, Math.min(HALF_ROOM - 1, placePos.z));
          placePos.y = 0;
          gameState.placeStructure(gameState.placementType, placePos);
          onPhaseChangeRef.current();
        } else if (gameState.carriedStructures.length > 0) {
          // Activate placement mode for the first carried structure
          const next = gameState.carriedStructures.shift()!;
          gameState.placementMode = "structure";
          gameState.placementType = next;
          onPhaseChangeRef.current();
        }
      }

      // 1/2/3 = consumables
      if (e.code === "Digit1") {
        const type = gameState.useConsumable(0);
        if (type) applyConsumable(type);
      }
      if (e.code === "Digit2") {
        const type = gameState.useConsumable(1);
        if (type) applyConsumable(type);
      }
      if (e.code === "Digit3") {
        const type = gameState.useConsumable(2);
        if (type) applyConsumable(type);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!pointerLocked) return;
      euler.y -= e.movementX * 0.006;
      euler.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.x - e.movementY * 0.006));
      camera.quaternion.setFromEuler(euler);
    };
    let mouseDown = false;
    let wantMouseDown = false;
    // ── Gamepad state ──
    let gamepadActive = false;
    let gamepadIndex = -1;
    let gpPrevDash = false, gpPrevSpecial = false, gpPrevA = false;
    const onPointerLockChange = () => {
      pointerLocked = document.pointerLockElement === canvas;
      if (pointerLocked && wantMouseDown) { mouseDown = true; wantMouseDown = false; }
      if (!pointerLocked) {
        mouseDown = false; wantMouseDown = false;
        // Pause when pointer lock is released (ESC) while playing
        if (gameState.phase === "playing") {
          gameState.phase = "paused";
          onPhaseChangeRef.current();
        }
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!pointerLocked && (gameState.phase === "playing" || gameState.phase === "paused")) {
        if (gameState.phase === "paused") gameState.phase = "playing";
        canvas.requestPointerLock();
        wantMouseDown = true;
      } else if (pointerLocked) {
        mouseDown = true;
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) { mouseDown = false; wantMouseDown = false; }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    const onGamepadConnected = (e: GamepadEvent) => { gamepadActive = true; gamepadIndex = e.gamepad.index; };
    const onGamepadDisconnected = (e: GamepadEvent) => { if (e.gamepad.index === gamepadIndex) { gamepadActive = false; gamepadIndex = -1; } };
    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      if (canvas2dRef.current) {
        canvas2dRef.current.width = canvas.clientWidth;
        canvas2dRef.current.height = canvas.clientHeight;
      }
    };
    window.addEventListener("resize", resize);

    let prevTime = performance.now();
    let lastLevel = gameState.level;
    let leashTimer = 0;
    let killStreak = 0;
    let dangerCloseFlash = 0;
    let enemySurgeActive = false;
    const _forward = new THREE.Vector3();
    const _right = new THREE.Vector3();
    const _up = new THREE.Vector3(0, 1, 0);
    const _move = new THREE.Vector3();
    const _tempColor = new THREE.Color();

    function getDifficultyConfig() {
      return DIFFICULTIES.find(d => d.id === gameState.selectedDifficulty) || DIFFICULTIES[2];
    }

    function gameLoop() {
      animId = requestAnimationFrame(gameLoop);

      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      // Torch flicker — sinusoidal intensity jitter per torch
      const tSec = now / 1000;
      for (let i = 0; i < roomTorchLights.length; i++) {
        const ph = i * 1.37;
        roomTorchLights[i].intensity = 12 + Math.sin(tSec * 4.3 + ph) * 1.8 + Math.sin(tSec * 11.5 + ph * 0.7) * 0.9;
      }

      // Paused: still render scene but skip all game logic
      if (gameState.phase === "paused") {
        renderer.render(scene, camera);
        return;
      }

      // Level-up sound detection
      if (gameState.level > lastLevel) {
        playLevelUp();
        lastLevel = gameState.level;
      }

      if (gameState.phase !== "playing") {
        renderer.render(scene, camera);
        return;
      }

      const nowSec = now / 1000;

      // ── Gamepad polling ──
      let gpShoot = false, gpDash = false, gpSpecial = false;
      let gpMoveX = 0, gpMoveY = 0;
      if (gamepadActive) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[gamepadIndex];
        if (gp) {
          const DEAD = 0.15;
          gpMoveX = Math.abs(gp.axes[0]) > DEAD ? gp.axes[0] : 0;
          gpMoveY = Math.abs(gp.axes[1]) > DEAD ? gp.axes[1] : 0;
          const lx = Math.abs(gp.axes[2] ?? 0) > DEAD ? (gp.axes[2] ?? 0) : 0;
          const ly = Math.abs(gp.axes[3] ?? 0) > DEAD ? (gp.axes[3] ?? 0) : 0;
          if (lx !== 0 || ly !== 0) {
            euler.y -= lx * dt * 3.0;
            euler.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.x - ly * dt * 2.2));
            camera.quaternion.setFromEuler(euler);
          }
          // RT = button[7] or axes[5] (analog trigger, starts at -1 at rest)
          gpShoot = (gp.buttons[7]?.value ?? 0) > 0.3 || ((gp.axes[5] ?? -1) > -0.3);
          const curDash = gp.buttons[4]?.pressed ?? false;
          gpDash = curDash && !gpPrevDash; gpPrevDash = curDash;
          const curSpecial = gp.buttons[5]?.pressed ?? false;
          gpSpecial = curSpecial && !gpPrevSpecial; gpPrevSpecial = curSpecial;
          const curA = gp.buttons[0]?.pressed ?? false;
          if (curA && !gpPrevA && gameState.phase === "playing" && !pointerLocked) canvas?.requestPointerLock();
          gpPrevA = curA;
        }
      }

      const touchLook = touchLookRef.current;
      if (touchLook.dx !== 0 || touchLook.dy !== 0) {
        euler.y -= touchLook.dx * 0.0048;
        euler.x = Math.max(
          -Math.PI / 2 + 0.05,
          Math.min(Math.PI / 2 - 0.05, euler.x - touchLook.dy * 0.0048),
        );
        camera.quaternion.setFromEuler(euler);
        touchLook.dx = 0;
        touchLook.dy = 0;
      }

      // -- Room geometry swap on room index change --
      const roomIdx = gameState.roomIndex;
      if (roomIdx !== lastRoomIdx) {
        lastRoomIdx = roomIdx;
        if (roomGeomGroup) scene.remove(roomGeomGroup);
        scene.remove(obstacleGroup);
        const built = buildRoomGeom(gameState.currentRoomShape);
        roomGeomGroup = built.group;
        roomWallBoxes = built.wallBoxes;
        currentDoorMesh = built.doorMesh;
        currentDoorBlockerBox = built.doorBlockerBox;
        roomTorchLights = built.torchLights;
        scene.add(roomGeomGroup);
        const shapeData = roomShapes.ROOM_SHAPES[gameState.currentRoomShape];
        obstacleGroup = buildRoomObstacles(gameState.currentRoomShape);
        scene.add(obstacleGroup);
        cachedObstacleBoxes = extractObstacleBoxes(obstacleGroup);
        doorOpenLastFrame = gameState.doorOpen;
        obstacleBoxes = [
          ...roomWallBoxes,
          ...(gameState.doorOpen ? [] : [currentDoorBlockerBox]),
          ...cachedObstacleBoxes,
        ];
        basePos.set(shapeData.spawnX, PLAYER_HEIGHT, shapeData.spawnZ);
      }

      // -- Recompute obstacle boxes when door opens --
      if (gameState.doorOpen !== doorOpenLastFrame) {
        doorOpenLastFrame = gameState.doorOpen;
        obstacleBoxes = [
          ...roomWallBoxes,
          ...(gameState.doorOpen ? [] : (currentDoorBlockerBox ? [currentDoorBlockerBox] : [])),
          ...cachedObstacleBoxes,
        ];
      }

      // -- Player movement + dash --
      // Phantom special: 3× speed boost while phaseTimer active
      const phantomBoost = (gameState.selectedCharacter === "phantom" && gameState.phaseTimer > 0) ? 3.0 : 1.0;
      const moveSpeed = MOVE_SPEED * gameState.moveSpeed * phantomBoost;

      camera.getWorldDirection(_forward);
      _forward.y = 0;
      _forward.normalize();
      _right.crossVectors(_forward, _up).normalize();

      _move.set(0, 0, 0);
      if (keys["KeyW"]) _move.add(_forward);
      if (keys["KeyS"]) _move.sub(_forward);
      if (keys["KeyD"]) _move.add(_right);
      if (keys["KeyA"]) _move.sub(_right);
      const touchMove = touchMoveRef.current;
      if (touchMove.x !== 0) _move.addScaledVector(_right, touchMove.x);
      if (touchMove.y !== 0) _move.addScaledVector(_forward, -touchMove.y);
      // Gamepad left stick adds to movement (analog)
      if (gpMoveX !== 0) _move.addScaledVector(_right, gpMoveX);
      if (gpMoveY !== 0) _move.addScaledVector(_forward, -gpMoveY);

      if (gameState.isDashing && gameState.dashTime > 0) {
        gameState.dashTime -= dt;
        _move.copy(gameState.dashDir).multiplyScalar(14 * dt);
        basePos.add(_move);
        if (gameState.dashTime <= 0) {
          gameState.isDashing = false;
          gameState.invincible = false;
        }
      } else if (_move.length() > 0) {
        _move.normalize().multiplyScalar(moveSpeed * dt);
        basePos.add(_move);
      }

      // Gamepad dash (LB) and special (RB)
      if (gpDash && gameState.dashChargesAvail > 0) {
        gameState.dashChargesAvail--;
        gameState.dashCd = gameState.dashMax;
        playDash();
        const gpDashDir = new THREE.Vector3();
        if (gpMoveX !== 0 || gpMoveY !== 0) {
          gpDashDir.addScaledVector(_right, gpMoveX).addScaledVector(_forward, -gpMoveY);
        } else {
          gpDashDir.copy(_forward);
        }
        gpDashDir.normalize();
        gameState.isDashing = true;
        gameState.dashTime = 0.22;
        gameState.dashDir.copy(gpDashDir);
        gameState.invincible = true;
      }
      if (gpSpecial) {
        gameState.triggerSpecial(basePos.clone());
        onPhaseChangeRef.current();
      }

      if (touchDashRef.current && gameState.dashChargesAvail > 0) {
        touchDashRef.current = false;
        gameState.dashChargesAvail--;
        gameState.dashCd = gameState.dashMax;
        playDash();
        const touchDashDir = new THREE.Vector3();
        if (touchMove.x !== 0 || touchMove.y !== 0) {
          touchDashDir.addScaledVector(_right, touchMove.x).addScaledVector(_forward, -touchMove.y);
        } else {
          touchDashDir.copy(_forward);
        }
        touchDashDir.normalize();
        gameState.isDashing = true;
        gameState.dashTime = 0.22;
        gameState.dashDir.copy(touchDashDir);
        gameState.invincible = true;
      } else {
        touchDashRef.current = false;
      }

      if (touchSpecialRef.current) {
        touchSpecialRef.current = false;
        gameState.triggerSpecial(basePos.clone());
        onPhaseChangeRef.current();
      }

      if (touchConsumableRef.current !== null) {
        const type = gameState.useConsumable(touchConsumableRef.current);
        touchConsumableRef.current = null;
        if (type) applyConsumable(type);
      }

      if (touchPlaceRef.current) {
        touchPlaceRef.current = false;
        if (gameState.placementMode === "structure" && gameState.placementType) {
          const placeDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
          const placePos = camera.position.clone().add(placeDir.multiplyScalar(3));
          placePos.x = Math.max(-HALF_ROOM + 1, Math.min(HALF_ROOM - 1, placePos.x));
          placePos.z = Math.max(-HALF_ROOM + 1, Math.min(HALF_ROOM - 1, placePos.z));
          placePos.y = 0;
          gameState.placeStructure(gameState.placementType, placePos);
          onPhaseChangeRef.current();
        } else if (gameState.carriedStructures.length > 0) {
          const next = gameState.carriedStructures.shift()!;
          gameState.placementMode = "structure";
          gameState.placementType = next;
          onPhaseChangeRef.current();
        }
      }

      // Vortex — pull all enemies toward player
      if (gameState.vortexTimer > 0) {
        gameState.vortexTimer -= dt;
        for (const e of gameState.enemies) {
          if (!e.isAlive) continue;
          const toward = basePos.clone().sub(e.position).setY(0).normalize();
          e.position.addScaledVector(toward, 8 * dt);
        }
      }

      // Death spin — damage nearby enemies every tick
      if (gameState.deathSpinTimer > 0) {
        gameState.deathSpinTimer -= dt;
        for (const e of gameState.enemies) {
          if (!e.isAlive) continue;
          const dist = basePos.distanceTo(e.position);
          if (dist < 4.5) {
            const dmg = 25 * gameState.damage * dt * 5;
            e.hp -= dmg;
            gameState.damageDealt += dmg;
            e.hitFlash = 1;
            if (e.hp <= 0 && e.isAlive) {
              e.isAlive = false;
              gameState.gainXP(e.def.xpReward);
              gameState.gainCoins(e.def.coinReward);
              gameState.totalKills++;
              if (gameState.lifesteal > 0) gameState.heal(gameState.lifesteal);
              gameState.particles.push(...createExplosion(e.position, e.def.color, 16));
            }
          }
        }
      }

      // Bastion wall timer
      if (gameState.bastionTimer > 0) {
        gameState.bastionTimer -= dt;
        if (gameState.bastionTimer <= 0) gameState.bastionTimer = 0;
      }

      // Hunter mark timer
      for (const e of gameState.enemies) {
        if (e.markTimer !== undefined && e.markTimer > 0) {
          e.markTimer -= dt;
          if (e.markTimer <= 0) { e.marked = false; e.markTimer = 0; }
        }
      }

      // Structure AI
      for (const struct of gameState.structures) {
        if (struct.hp <= 0) continue;
        if (struct.type === "turret") {
          struct.shootCd = Math.max(0, struct.shootCd - dt);
          if (struct.shootCd <= 0) {
            const target = gameState.enemies
              .filter(e => e.isAlive && e.position.distanceTo(struct.position) < 14)
              .sort((a, b) => a.position.distanceTo(struct.position) - b.position.distanceTo(struct.position))[0];
            if (target) {
              const dir = target.position.clone().sub(struct.position).setY(0).normalize();
              gameState.projectiles.push({
                id: `turret_${++projId}`,
                position: struct.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
                velocity: dir.multiplyScalar(18),
                damage: 20 * gameState.damage,
                isPlayer: true,
                ttl: 1.4, maxTtl: 1.4,
                color: "#ffdd44",
                trail: [],
              });
              struct.shootCd = 1.2;
            }
          }
        } else if (struct.type === "healingtree") {
          struct.shootCd = Math.max(0, struct.shootCd - dt);
          if (struct.shootCd <= 0 && struct.position.distanceTo(basePos) < 5) {
            gameState.heal(2);
            struct.shootCd = 2.0;
          }
        }
      }
      gameState.structures = gameState.structures.filter(s => s.hp > 0);

      // Companion AI
      for (const comp of gameState.companions) {
        if (comp.hp <= 0) continue;
        comp.orbitAngle += dt * (comp.type === "familiar" ? 2.5 : 1.0);
        // Follow player: orbit at distance
        const orbitDist = comp.type === "familiar" ? 2.5 : 3.5;
        const target = new THREE.Vector3(
          basePos.x + Math.cos(comp.orbitAngle) * orbitDist,
          0,
          basePos.z + Math.sin(comp.orbitAngle) * orbitDist
        );
        comp.position.lerp(target, Math.min(1, dt * 5));
        // Shoot nearest enemy
        comp.shootCd = Math.max(0, comp.shootCd - dt);
        if (comp.shootCd <= 0) {
          const nearest = gameState.enemies
            .filter(e => e.isAlive && e.position.distanceTo(comp.position) < 12)
            .sort((a, b) => a.position.distanceTo(comp.position) - b.position.distanceTo(comp.position))[0];
          if (nearest) {
            const dir = nearest.position.clone().sub(comp.position).setY(0).normalize();
            gameState.projectiles.push({
              id: `companion_${++projId}`,
              position: comp.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
              velocity: dir.multiplyScalar(comp.type === "familiar" ? 22 : 15),
              damage: (comp.type === "familiar" ? 15 : 25) * gameState.damage,
              isPlayer: true,
              ttl: 1.2, maxTtl: 1.2,
              color: comp.type === "familiar" ? "#a0e0ff" : "#90ff90",
              trail: [],
            });
            comp.shootCd = comp.type === "familiar" ? 0.6 : 1.2;
          }
        }
      }
      gameState.companions = gameState.companions.filter(c => c.hp > 0);

      // WILDFIRE: spread ignite from burning enemies to 3 nearest neighbours
      if (gameState.wildcardIgnite) {
        gameState.wildcardIgnite = false;
        const burning = gameState.enemies.filter(e => e.isAlive && (e.igniteDmg ?? 0) > 0 && (e.igniteTimer ?? 0) > 0);
        for (const src of burning) {
          const neighbours = gameState.enemies
            .filter(e => e.isAlive && e.id !== src.id && ((e.igniteTimer ?? 0) <= 0))
            .sort((a, b) => a.position.distanceTo(src.position) - b.position.distanceTo(src.position))
            .slice(0, 3);
          for (const t of neighbours) {
            t.igniteDmg = src.igniteDmg;
            t.igniteTimer = 2.0;
            t.igniteTick = 0;
            gameState.particles.push(...createHitSpark(t.position.clone(), "#ff6010"));
          }
        }
        gameState.addScreenShake(0.2, 0.3);
      }

      // Phase timer (phantom)
      if (gameState.phaseTimer > 0) {
        gameState.phaseTimer -= dt;
        if (gameState.phaseTimer <= 0) {
          gameState.phaseTimer = 0;
          gameState.invincible = false;
        }
      }

      basePos.x = THREE.MathUtils.clamp(basePos.x, -80, 80);
      basePos.z = THREE.MathUtils.clamp(basePos.z, -80, 80);
      basePos.y = PLAYER_HEIGHT;
      resolveObstacleCollision(basePos, PLAYER_RADIUS, obstacleBoxes);

      // Dash CD / charge regen
      if (!gameState.isDashing) {
        if (gameState.dashChargesAvail < gameState.dashCharges) {
          gameState.dashCd -= dt;
          if (gameState.dashCd <= 0) {
            gameState.dashChargesAvail = Math.min(gameState.dashCharges, gameState.dashChargesAvail + 1);
            gameState.dashCd = gameState.dashChargesAvail < gameState.dashCharges ? gameState.dashMax : 0;
          }
        }
      }

      // Special CD
      if (gameState.specialCd > 0 && gameState.specialMax > 0) {
        gameState.specialCd = Math.max(0, gameState.specialCd - dt);
      }

      // Volt overcharge
      if (gameState.voltOvercharge > 0) gameState.voltOvercharge -= dt;

      // Freeze timer
      if (gameState.freezeTimer > 0) gameState.freezeTimer -= dt;

      // Screen shake
      const { screenShake } = gameState;
      let shakeX = 0, shakeY = 0;
      if (screenShake.elapsed < screenShake.duration) {
        const t = 1 - screenShake.elapsed / screenShake.duration;
        const mag = screenShake.intensity * t;
        shakeX = (Math.random() - 0.5) * mag * 0.4;
        shakeY = (Math.random() - 0.5) * mag * 0.4;
        screenShake.elapsed += dt;
      }
      camera.position.set(basePos.x + shakeX, basePos.y + shakeY, basePos.z);

      // HP regen
      if (gameState.hpRegen > 0 && gameState.hp < gameState.maxHp) {
        if (nowSec - gameState.lastHealTime > 1) {
          gameState.heal(gameState.hpRegen);
          gameState.lastHealTime = nowSec;
        }
      }

      // Shield regen (recharges out of combat)
      if (gameState.shieldMax > 0 && gameState.shield < gameState.shieldMax) {
        if (gameState.shieldRegenTimer > 0) {
          gameState.shieldRegenTimer -= dt;
        } else {
          gameState.shield = Math.min(gameState.shieldMax, gameState.shield + gameState.shieldMax * 0.2 * dt);
        }
      }

      // -- Door advance trigger --
      if (gameState.doorOpen && gameState.phase === "playing" && currentDoorMesh) {
        const shape = roomShapes.ROOM_SHAPES[gameState.currentRoomShape];
        const hw2 = shape.floorW / 2, hd2 = shape.floorD / 2;
        const WT2 = 0.6;
        let doorTriggered = false;
        const { exitFacing, exitX, exitZ } = shape;
        const DG = roomShapes.DOOR_W / 2 + 0.6;
        if (exitFacing === "N" && basePos.z < -(hd2 + WT2 * 0.5) && Math.abs(basePos.x - exitX) < DG) doorTriggered = true;
        else if (exitFacing === "S" && basePos.z > (hd2 + WT2 * 0.5) && Math.abs(basePos.x - exitX) < DG) doorTriggered = true;
        else if (exitFacing === "E" && basePos.x > (hw2 + WT2 * 0.5) && Math.abs(basePos.z - exitZ) < DG) doorTriggered = true;
        else if (exitFacing === "W" && basePos.x < -(hw2 + WT2 * 0.5) && Math.abs(basePos.z - exitZ) < DG) doorTriggered = true;
        if (doorTriggered) {
          gameState.advanceRoom();
          onPhaseChangeRef.current();
          return;
        }
      }

      // Wave state machine
      if (!gameState.waveActive && !gameState.doorOpen &&
          (gameState.currentRoomType === "combat" || gameState.currentRoomType === "boss")) {
        gameState.waveCountdown -= dt;
        if (gameState.waveCountdown <= 0 && gameState.wave < gameState.totalWaves) {
          gameState.wave += 1;
          gameState.waveActive = true;
          gameState.waveCountdown = 5;
          gameState.enemies = [];
          gameState.waveSpawned = false;
          gameState.bossPhase = 0;
        }
      }

      // Spawn enemies
      if (gameState.waveActive && !gameState.waveSpawned) {
        gameState.waveSpawned = true;
        const isBoss = gameState.currentRoomType === "boss";
        const depth = gameState.roomIndex;
        const diffConf = getDifficultyConfig();
        const shape = roomShapes.ROOM_SHAPES[gameState.currentRoomShape];
        const spawnBounds = { hw: shape.floorW / 2 - 2, hd: shape.floorD / 2 - 2 };
        const newEnemies = spawnEnemies(gameState.wave, depth, diffConf, isBoss, spawnBounds);
        gameState.enemies = newEnemies;
      }

      // Check wave cleared
      const aliveEnemies = gameState.enemies.filter(e => e.isAlive);
      if (gameState.waveActive && gameState.waveSpawned && aliveEnemies.length === 0 && gameState.enemies.length > 0) {
        gameState.waveSpawned = false;
        gameState.enemies = [];
        if (gameState.wave >= gameState.totalWaves) {
          gameState.waveActive = false;
          gameState.clearRoom();
          onPhaseChangeRef.current();
          return;
        } else {
          gameState.waveActive = false;
          gameState.waveCountdown = 5;
          playWaveClear();
        }
      }

      // Puddles tick
      gameState.puddles = gameState.puddles
        .map(p => ({ ...p, ttl: p.ttl - dt }))
        .filter(p => p.ttl > 0);
      for (const puddle of gameState.puddles) {
        if (basePos.distanceTo(puddle.position) < puddle.radius) {
          gameState.takeDamage(puddle.dmgPerSec * dt);
        }
      }

      // Chest collection — auto-collect within pickupRange * 1.5u; may drop consumable, HP heal, or upgrade
      const chestCollectDist = 1.5 * gameState.pickupRange;
      for (const chest of gameState.chests) {
        if (!chest.opened && basePos.distanceTo(chest.position) < chestCollectDist) {
          chest.opened = true;
          playPickup();
          gameState.gainCoins(chest.coinReward);
          gameState.particles.push(...createExplosion(chest.position.clone().add(new THREE.Vector3(0,0.5,0)), "#ffd700", 14));
          const roll = Math.random();
          if (roll < 0.12) {
            // 12% chance: free upgrade (level-up screen)
            gameState.rollUpgrades();
            gameState.phase = "levelup";
            onPhaseChangeRef.current();
          } else if (roll < 0.30) {
            // 18% chance: HP heal
            gameState.heal(30);
          } else if (roll < 0.60) {
            // 30% chance: consumable
            const cTypes = ["grenade", "potion", "freeze", "magnet"] as const;
            gameState.addConsumable(cTypes[Math.floor(Math.random() * cTypes.length)]);
          }
          // Otherwise just coins (40%)
        }
      }

      // Spike zone damage — tick every 1 second
      for (const spike of gameState.spikeZones) {
        spike.tickTimer += dt;
        if (spike.tickTimer >= 1.0) {
          spike.tickTimer -= 1.0;
          if (basePos.distanceTo(spike.position) < spike.radius) {
            gameState.takeDamage(spike.dmg);
            gameState.addScreenShake(0.15, 0.2);
          }
        }
      }

      // Auto-attack
      const aliveForShooting = gameState.enemies.filter(e => e.isAlive);
      const camPos = camera.position.clone();
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const startPos = camPos.clone().addScaledVector(camDir, 0.3);

      for (const slot of gameState.weaponSlots) {
        const weapon = WEAPONS[slot.type as keyof typeof WEAPONS];
        if (!weapon) continue;
        const fireInterval = 1 / (weapon.fireRate * gameState.attackSpeed);
        slot.cd = Math.max(0, slot.cd - dt);

        // Heat management for laser
        if (weapon.special === "laser" && slot.heat !== undefined) {
          if (slot.cd <= 0 && (mouseDown || gpShoot || touchShootRef.current) && aliveForShooting.length > 0) {
            if (slot.heat < (weapon.heatMax || 1)) {
              slot.heat = Math.min(weapon.heatMax || 1, slot.heat + (weapon.heatPerShot || 0.1));
            } else {
              slot.cd = 0.5; // overheat cooldown
              continue;
            }
          } else {
            slot.heat = Math.max(0, slot.heat - (weapon.heatCoolRate || 0.6) * dt);
          }
        }

        // Skip melee weapons when no enemies nearby (auto swing still fires)
        const isMelee = weapon.special?.startsWith("melee");

        if (slot.cd <= 0 && (mouseDown || gpShoot || touchShootRef.current) && aliveForShooting.length > 0) {
          slot.cd = fireInterval;
          const isCrit = Math.random() < gameState.critChance || gameState.headshot;
          if (gameState.headshot) gameState.headshot = false;
          let dmg = weapon.damage * gameState.damage * (isCrit ? gameState.critDmg : 1);

          gameState.particles.push(...createMuzzleFlash(startPos, weapon.color));
          playShoot();

          function applyMeleeDmg(e: Enemy) {
            gameState.damageDealt += dmg;
            e.hp -= dmg;
            e.hitFlash = 1;
            if (e.hp <= 0 && e.isAlive) {
              e.isAlive = false;
              playEnemyDie();
              gameState.gainXP(e.def.xpReward);
              gameState.gainCoins(e.def.coinReward);
              gameState.totalKills++;
              if (gameState.lifesteal > 0) gameState.heal(gameState.lifesteal);
              if (gameState.selectedCharacter === "reaper") gameState.heal(2);
              gameState.particles.push(...createExplosion(e.position, e.def.color, 12));
            } else {
              playHit();
              gameState.particles.push(...createHitSpark(e.position.clone(), weapon.color));
            }
          }

          if (slot.type === "laser") {
            // Continuous raycast beam — pierces all enemies in a line
            const beamDir = camDir.clone().normalize();
            const beamEnd = camPos.clone().addScaledVector(beamDir, weapon.range);
            for (const e of aliveForShooting) {
              const toEnemy = new THREE.Vector3().subVectors(e.position, camPos);
              const proj = toEnemy.dot(beamDir);
              if (proj < 0 || proj > weapon.range) continue;
              const perpDist = new THREE.Vector3().copy(toEnemy).addScaledVector(beamDir, -proj).length();
              if (perpDist < e.def.size + 0.4) applyMeleeDmg(e);
            }
            // Render laser beam as THREE.Line
            const ms = meshState;
            if (!ms.laserBeamLine) {
              const pts = [camPos.clone(), beamEnd.clone()];
              const geo = new THREE.BufferGeometry().setFromPoints(pts);
              const mat = new THREE.LineBasicMaterial({ color: weapon.color, linewidth: 3 });
              ms.laserBeamLine = new THREE.Line(geo, mat);
              scene.add(ms.laserBeamLine);
            } else {
              (ms.laserBeamLine.geometry as THREE.BufferGeometry).setFromPoints([camPos, beamEnd]);
              (ms.laserBeamLine.material as THREE.LineBasicMaterial).color.set(weapon.color);
            }
            ms.laserBeamLine.visible = true;
            ms.laserBeamTimer = 0.12; // beam lingers briefly
          } else if (slot.type === "spear") {
            // Narrow forward thrust — long but tight
            const thrustRange = weapon.range || 6;
            const thrustWidth = weapon.thrustWidth ?? 1.5;
            for (const e of aliveForShooting) {
              const toEnemy = new THREE.Vector3().subVectors(e.position, basePos);
              const proj = toEnemy.dot(camDir);
              if (proj < 0 || proj > thrustRange + e.def.size) continue;
              const perpDist = new THREE.Vector3().copy(toEnemy).addScaledVector(camDir, -proj).length();
              if (perpDist < thrustWidth + e.def.size * 0.5) {
                applyMeleeDmg(e);
                // Knockback in camera direction
                if (e.isAlive) {
                  const kb = weapon.thrustKnockback ?? 4;
                  e.position.addScaledVector(camDir, kb * 0.4);
                }
              }
            }
            meshState.meleeTimer = meshState.meleeMaxTimer;
            if (meshState.meleeMesh) (meshState.meleeMesh.material as THREE.MeshBasicMaterial).color.set(weapon.color);
          } else if (slot.type === "flail") {
            // Flail: 360° spin — hit everything in range
            // Cyclone passive: flail orbit radius grows +15% per level
            const baseFlailRange = weapon.range || 3;
            const range = gameState.selectedCharacter === "cyclone"
              ? baseFlailRange * (1 + (gameState.level - 1) * 0.15)
              : baseFlailRange;
            for (const e of aliveForShooting) {
              const dist = basePos.distanceTo(e.position);
              if (dist < range + e.def.size) applyMeleeDmg(e);
            }
            meshState.meleeTimer = meshState.meleeMaxTimer;
            if (meshState.meleeMesh) (meshState.meleeMesh.material as THREE.MeshBasicMaterial).color.set(weapon.color);
          } else if (isMelee) {
            // Sword: wide arc
            const arcAngle = weapon.arcAngle || 2.2;
            const range = weapon.arcRange || weapon.range || 5;
            for (const e of aliveForShooting) {
              const toEnemy = new THREE.Vector3().subVectors(e.position, basePos);
              const dist = toEnemy.length();
              if (dist > range + e.def.size) continue;
              const angle = toEnemy.angleTo(camDir);
              if (angle <= arcAngle / 2) applyMeleeDmg(e);
            }
            meshState.meleeTimer = meshState.meleeMaxTimer;
            if (meshState.meleeMesh) (meshState.meleeMesh.material as THREE.MeshBasicMaterial).color.set(weapon.color);
          } else if (slot.type === "shotcircle") {
            // 360° circle burst — all pellets spread radially around player
            const totalPellets = weapon.projectileCount + gameState.multishot;
            const projSpeed = weapon.projectileSpeed * gameState.bulletSpeedMult;
            const projTtl = weapon.range / projSpeed;
            for (let i = 0; i < totalPellets; i++) {
              const angle = (i / totalPellets) * Math.PI * 2;
              const d = new THREE.Vector3(Math.cos(angle), (Math.random() - 0.5) * 0.05, Math.sin(angle));
              gameState.projectiles.push({
                id: `proj_${++projId}`,
                position: startPos.clone(),
                velocity: d.multiplyScalar(projSpeed),
                damage: dmg / totalPellets,
                isPlayer: true, ttl: projTtl, maxTtl: projTtl,
                color: weapon.color, trail: [],
                piercesLeft: gameState.bulletPierce,
                bouncesLeft: gameState.bulletBounce > 0 ? gameState.bulletBounce : undefined,
              });
            }
            gameState.addScreenShake(0.18, 0.12);
          } else if (slot.type === "grenade_launcher") {
            // Arc projectile with gravity and area explosion
            const projSpeed = weapon.projectileSpeed * gameState.bulletSpeedMult;
            const projTtl = (weapon.range / projSpeed) * 2.2;
            const d = camDir.clone().setY(0.45).normalize();
            gameState.projectiles.push({
              id: `proj_${++projId}`,
              position: startPos.clone(),
              velocity: d.multiplyScalar(projSpeed),
              damage: dmg,
              isPlayer: true, ttl: projTtl, maxTtl: projTtl,
              color: weapon.color, trail: [],
              gravity: weapon.gravity ?? 10,
              explosionRadius: weapon.explosionRadius ?? 4.5,
              piercesLeft: 0,
            });
          } else {
            // Standard projectile weapons
            const extraShots = gameState.multishot;
            const totalPellets = weapon.projectileCount + extraShots;
            for (let i = 0; i < totalPellets; i++) {
              const d = camDir.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * weapon.spread * 2,
                (Math.random() - 0.5) * weapon.spread,
                (Math.random() - 0.5) * weapon.spread * 2
              )).normalize();

              const projSpeed = weapon.projectileSpeed * gameState.bulletSpeedMult;
              const projTtl = weapon.range / projSpeed;
              const isBoomerang = slot.type === "boomerang";
              const isTesla = slot.type === "tesla";
              const isFlame = slot.type === "flamethrower";
              const chainBonus = gameState.selectedCharacter === "volt" ? 1 : 0;
              gameState.projectiles.push({
                id: `proj_${++projId}`,
                position: startPos.clone(),
                velocity: d.multiplyScalar(projSpeed),
                damage: dmg / totalPellets,
                isPlayer: true,
                ttl: projTtl,
                maxTtl: projTtl,
                color: weapon.color,
                trail: [],
                piercesLeft: isBoomerang ? 99 : gameState.bulletPierce,
                returning: isBoomerang ? false : undefined,
                spawnPos: isBoomerang ? startPos.clone() : undefined,
                hitEnemyIds: isBoomerang ? [] : undefined,
                chainWeapon: isTesla ? "tesla" : undefined,
                chainCount: isTesla ? (2 + chainBonus) : undefined,
                isFlame: isFlame ? true : undefined,
                igniteDmg: isFlame ? (weapon.igniteDmg ?? 0) : undefined,
                igniteDuration: isFlame ? (weapon.igniteDuration ?? 2) : undefined,
                bouncesLeft: gameState.bulletBounce > 0 ? gameState.bulletBounce : undefined,
              });
            }
          }
        }
      }

      // Update enemies
      const updatedEnemies: Enemy[] = [];
      for (const enemy of gameState.enemies) {
        if (!enemy.isAlive) { updatedEnemies.push(enemy); continue; }
        const { updates, spawnPuddle } = updateEnemyAI(enemy, camera.position, dt, gameState.enemies, gameState.freezeTimer);
        const updated = { ...enemy, ...updates };

        if (spawnPuddle && Math.random() < dt * 0.8) {
          const pId = `puddle_${Date.now()}_${Math.random()}`;
          gameState.puddles.push({
            id: pId,
            position: updated.position.clone(),
            radius: spawnPuddle.radius,
            dmgPerSec: spawnPuddle.dmgPerSec,
            ttl: spawnPuddle.ttl,
            maxTtl: spawnPuddle.ttl,
          });
        }

        // Shrieker buff nearby
        if (enemy.type === "shrieker" && (updated.screamTimer || 0) === 0) {
          for (const other of gameState.enemies) {
            if (!other.isAlive || other.id === enemy.id) continue;
            const dist = updated.position.distanceTo(other.position);
            if (dist < (ENEMIES.shrieker.screamRange || 10)) {
              other.screamBuff = ENEMIES.shrieker.screamBuff;
              other.screamBuffTimer = ENEMIES.shrieker.screamDuration;
            }
          }
        }
        // Tick screamBuffTimer
        if (updated.screamBuffTimer && updated.screamBuffTimer > 0) {
          updated.screamBuffTimer = Math.max(0, updated.screamBuffTimer - dt);
        }

        // Ignite tick (flamethrower / Ember)
        if ((updated.igniteTimer ?? 0) > 0) {
          updated.igniteTimer = (updated.igniteTimer ?? 0) - dt;
          updated.igniteTick = (updated.igniteTick ?? 0) + dt;
          if (updated.igniteTick >= 0.5) {
            updated.igniteTick = 0;
            const igDmg = (updated.igniteDmg ?? 0) * gameState.damage;
            updated.hp -= igDmg;
            gameState.damageDealt += igDmg;
            updated.hitFlash = 0.5;
            gameState.particles.push(...createHitSpark(updated.position.clone(), "#ff6010"));
            if (updated.hp <= 0 && updated.isAlive) {
              updated.isAlive = false;
              gameState.gainXP(updated.def.xpReward);
              gameState.gainCoins(updated.def.coinReward);
              gameState.totalKills++;
              if (gameState.lifesteal > 0) gameState.heal(gameState.lifesteal);
              gameState.particles.push(...createExplosion(updated.position, "#ff6010", 12));
            }
          }
          if (updated.igniteTimer <= 0) { updated.igniteDmg = 0; }
        }

        // Spitter — shoot puddle projectiles
        if (enemy.type === "spitter") {
          const distP = updated.position.distanceTo(camera.position);
          if (distP < (ENEMIES.spitter.shootRange || 18) && nowSec - (updated.shootCooldown || 0) > (ENEMIES.spitter.shootCd || 2.2)) {
            const dir2 = new THREE.Vector3().subVectors(camera.position, updated.position).normalize();
            dir2.y += (Math.random() - 0.5) * 0.08;
            gameState.projectiles.push({
              id: `proj_${++projId}`,
              position: updated.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
              velocity: dir2.multiplyScalar(ENEMIES.spitter.projSpeed || 10),
              damage: enemy.def.damage,
              isPlayer: false,
              ttl: 2.5,
              maxTtl: 2.5,
              color: "#60c030",
              trail: [],
              isAcid: true,
            });
            updated.shootCooldown = nowSec;
          }
        }

        // Shooter — ranged
        if (enemy.type === "shooter") {
          const distP = updated.position.distanceTo(camera.position);
          if (distP < (ENEMIES.shooter.shootRange || 16) && nowSec - (updated.shootCooldown || 0) > (ENEMIES.shooter.shootCd || 1.8)) {
            const dir2 = new THREE.Vector3().subVectors(camera.position, updated.position).normalize();
            dir2.y += (Math.random() - 0.5) * 0.1;
            gameState.projectiles.push({
              id: `proj_${++projId}`,
              position: updated.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
              velocity: dir2.multiplyScalar(ENEMIES.shooter.projSpeed || 12),
              damage: enemy.def.damage,
              isPlayer: false,
              ttl: 2.2,
              maxTtl: 2.2,
              color: "#4080a0",
              trail: [],
            });
            updated.shootCooldown = nowSec;
          }
        }

        // Sentinel — rooted heavy turret
        if (enemy.type === "sentinel") {
          const distP = updated.position.distanceTo(camera.position);
          if (distP < ((ENEMIES.sentinel as { shootRange?: number }).shootRange || 22) &&
              nowSec - (updated.shootCooldown || 0) > ((ENEMIES.sentinel as { shootCd?: number }).shootCd || 1.2)) {
            const dir2 = new THREE.Vector3().subVectors(camera.position, updated.position).normalize();
            gameState.projectiles.push({
              id: `proj_${++projId}`,
              position: updated.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
              velocity: dir2.multiplyScalar((ENEMIES.sentinel as { projSpeed?: number }).projSpeed || 16),
              damage: enemy.def.damage,
              isPlayer: false, ttl: 2.0, maxTtl: 2.0, color: "#4060c0", trail: [],
            });
            updated.shootCooldown = nowSec;
          }
        }

        // Necromancer — ranged caster + revive dead allies
        if (enemy.type === "necromancer") {
          const distP = updated.position.distanceTo(camera.position);
          if (distP < ((ENEMIES.necromancer as { shootRange?: number }).shootRange || 14) &&
              nowSec - (updated.shootCooldown || 0) > ((ENEMIES.necromancer as { shootCd?: number }).shootCd || 2.0)) {
            const dir2 = new THREE.Vector3().subVectors(camera.position, updated.position).normalize();
            dir2.y += (Math.random() - 0.5) * 0.05;
            gameState.projectiles.push({
              id: `proj_${++projId}`,
              position: updated.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
              velocity: dir2.multiplyScalar((ENEMIES.necromancer as { projSpeed?: number }).projSpeed || 10),
              damage: enemy.def.damage,
              isPlayer: false, ttl: 2.2, maxTtl: 2.2, color: "#8020c0", trail: [],
            });
            updated.shootCooldown = nowSec;
          }
          // Revive nearby dead allies
          const reviveCd = (ENEMIES.necromancer as { reviveCd?: number }).reviveCd ?? 5;
          const reviveRange = (ENEMIES.necromancer as { reviveRange?: number }).reviveRange ?? 8;
          if ((updated.reviveCooldown ?? 0) <= 0) {
            const deadNearby = gameState.enemies.find(e => !e.isAlive && updated.position.distanceTo(e.position) < reviveRange);
            if (deadNearby) {
              deadNearby.isAlive = true;
              deadNearby.hp = deadNearby.maxHp * 0.3;
              deadNearby.hitFlash = 1;
              updated.reviveCooldown = reviveCd;
              gameState.particles.push(...createExplosion(deadNearby.position, "#00ff88", 12));
              gameState.addScreenShake(0.2, 0.2);
            }
          } else {
            updated.reviveCooldown = Math.max(0, (updated.reviveCooldown ?? 0) - dt);
          }
        }

        // Bomber — explode near player
        if (enemy.type === "bomber") {
          const distP = updated.position.distanceTo(basePos);
          if (distP < (ENEMIES.bomber.fuseRange || 3)) {
            updated.fuseTimer = (updated.fuseTimer || 0) + dt;
            if ((updated.fuseTimer || 0) >= 1.5) {
              // Explode!
              const expRadius = ENEMIES.bomber.explosionRadius || 6;
              const distExp = basePos.distanceTo(updated.position);
              if (distExp < expRadius) {
                gameState.takeDamage(enemy.def.damage * (1 - distExp / expRadius));
                if (gameState.phase !== "playing") { onPhaseChangeRef.current(); }
              }
              gameState.particles.push(...createExplosion(updated.position, "#ff6010", 28));
              gameState.addScreenShake(0.7, 0.4);
              updated.isAlive = false;
              updated.hp = 0;
            }
          } else {
            updated.fuseTimer = 0;
          }
        }

        // Boss logic
        if (enemy.type === "boss") {
          const hpPct = updated.hp / updated.maxHp;
          const newPhase = hpPct <= 0.1 ? 4 : hpPct <= 0.25 ? 3 : hpPct <= 0.5 ? 2 : hpPct <= 0.75 ? 1 : 0;

          if (newPhase > gameState.bossPhase) {
            gameState.bossPhase = newPhase;
            gameState.addScreenShake(0.6, 0.4);
            const burstCount = 4 + newPhase * 2;
            for (let bi = 0; bi < burstCount; bi++) {
              const angle = (bi / burstCount) * Math.PI * 2;
              const dir = new THREE.Vector3(Math.cos(angle), 0.1, Math.sin(angle));
              gameState.projectiles.push({
                id: `proj_${++projId}`,
                position: updated.position.clone().add(new THREE.Vector3(0, 1, 0)),
                velocity: dir.multiplyScalar(10 + newPhase * 2),
                damage: updated.def.damage * 1.5,
                isPlayer: false, ttl: 2, maxTtl: 2, color: "#d97706", trail: [],
              });
            }
            gameState.particles.push(...createExplosion(updated.position, "#d97706", 24));
            if (newPhase === 1) {
              for (let mi = 0; mi < 4; mi++) {
                const a = (mi / 4) * Math.PI * 2;
                gameState.enemies.push(createEnemy("runner", updated.position.clone().add(new THREE.Vector3(Math.cos(a) * 5, 0, Math.sin(a) * 5))));
              }
            }
            if (newPhase === 2) {
              gameState.addScreenShake(1.0, 0.6);
              if (camera.position.distanceTo(updated.position) < 8) gameState.takeDamage(25);
            }
            if (newPhase === 3) {
              for (let mi = 0; mi < 2; mi++) {
                const a = (mi / 2) * Math.PI * 2;
                gameState.enemies.push(createEnemy("brute", updated.position.clone().add(new THREE.Vector3(Math.cos(a) * 6, 0, Math.sin(a) * 6))));
              }
            }
            if (newPhase === 4) {
              gameState.addScreenShake(1.5, 0.8);
              if (camera.position.distanceTo(updated.position) < 12) gameState.takeDamage(35);
              for (let mi = 0; mi < 3; mi++) {
                const a = (mi / 3) * Math.PI * 2;
                gameState.enemies.push(createEnemy("runner", updated.position.clone().add(new THREE.Vector3(Math.cos(a) * 4, 0, Math.sin(a) * 4))));
              }
            }
          }

          // Boss charge attack (phases 2+)
          if (gameState.bossPhase >= 2) {
            const bChargeState = updated.chargeState || "idle";
            const bChargeTimer = (updated.chargeTimer || 0) + dt;
            const distP2 = updated.position.distanceTo(camera.position);
            if (bChargeState === "idle") {
              updated.chargeTimer = bChargeTimer;
              if (bChargeTimer > (4 - gameState.bossPhase * 0.5) && distP2 < 20) {
                updated.chargeState = "telegraphing";
                updated.chargeTimer = 0;
                updated.chargeDir = new THREE.Vector3().subVectors(camera.position, updated.position).normalize();
                gameState.addScreenShake(0.4, 0.3);
                playCharge();
                gameState.particles.push(...createExplosion(updated.position, "#d97706", 16));
              }
            } else if (bChargeState === "telegraphing") {
              updated.chargeTimer = bChargeTimer;
              if (bChargeTimer >= 0.7) {
                updated.chargeState = "charging";
                updated.chargeTimer = 0;
              }
            } else if (bChargeState === "charging") {
              const cDir = updated.chargeDir || new THREE.Vector3(0, 0, 1);
              const chargeSpeed = 22 + gameState.bossPhase * 3;
              updated.position.addScaledVector(cDir, chargeSpeed * dt);
              updated.chargeTimer = bChargeTimer;
              // Hit player during charge
              if (updated.position.distanceTo(camera.position) < 2.2) {
                gameState.takeDamage(updated.def.damage * 1.5);
                gameState.addScreenShake(0.8, 0.5);
              }
              if (bChargeTimer >= 0.45 || Math.abs(updated.position.x) > 20 || Math.abs(updated.position.z) > 20) {
                updated.chargeState = "cooldown";
                updated.chargeTimer = 0;
                updated.position.x = THREE.MathUtils.clamp(updated.position.x, -20, 20);
                updated.position.z = THREE.MathUtils.clamp(updated.position.z, -20, 20);
                gameState.addScreenShake(0.5, 0.4);
                gameState.particles.push(...createExplosion(updated.position, "#d97706", 20));
              }
            } else if (bChargeState === "cooldown") {
              updated.chargeTimer = bChargeTimer;
              if (bChargeTimer >= 2.0) {
                updated.chargeState = "idle";
                updated.chargeTimer = 0;
              }
            }
          }

          // Boss shoot
          const bossShootInterval = Math.max(0.5, 2 - gameState.bossPhase * 0.3);
          if (nowSec - (updated.shootCooldown || 0) > bossShootInterval) {
            const distP = updated.position.distanceTo(camera.position);
            if (distP < 20) {
              const dir2 = new THREE.Vector3().subVectors(camera.position, updated.position).normalize();
              gameState.projectiles.push({
                id: `proj_${++projId}`,
                position: updated.position.clone().add(new THREE.Vector3(0, 1, 0)),
                velocity: dir2.multiplyScalar(12),
                damage: updated.def.damage,
                isPlayer: false, ttl: 2.5, maxTtl: 2.5, color: "#fbbf24", trail: [],
              });
              if (gameState.bossPhase >= 2) {
                for (let si = 0; si < gameState.bossPhase; si++) {
                  const a = (si / gameState.bossPhase) * Math.PI * 2;
                  gameState.projectiles.push({
                    id: `proj_${++projId}`,
                    position: updated.position.clone().add(new THREE.Vector3(0, 1, 0)),
                    velocity: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(9),
                    damage: updated.def.damage * 0.7,
                    isPlayer: false, ttl: 2, maxTtl: 2, color: "#f97316", trail: [],
                  });
                }
              }
              updated.shootCooldown = nowSec;
            }
          }
        }

        // Melee attack (exclude ranged/sentinel types)
        if (updated.isAlive && !["shooter", "spitter", "bomber", "sentinel", "necromancer"].includes(enemy.type)) {
          const distToPlayer = updated.position.distanceTo(camera.position);
          if (distToPlayer < 1.5 + enemy.def.size) {
            const attackInterval = 1 / enemy.def.attackRate;
            if (nowSec - updated.lastAttack >= attackInterval) {
              const dmg = enemy.def.damage;
              gameState.takeDamage(dmg);
              killStreak = 0;
              if (gameState.thorns > 0) {
                enemy.hp -= gameState.thorns;
                if (enemy.hp <= 0 && updated.isAlive) {
                  updated.isAlive = false;
                  gameState.gainXP(enemy.def.xpReward);
                  gameState.gainCoins(enemy.def.coinReward);
                  gameState.totalKills++;

                }
              }
              if (gameState.phase !== "playing") { onPhaseChangeRef.current(); }
              updated.lastAttack = nowSec;
            }
          }
        }

        resolveObstacleCollision(updated.position, Math.min(0.65, updated.def.size * 0.38), obstacleBoxes);
        updatedEnemies.push(updated);
      }
      gameState.enemies = updatedEnemies;

      // ── Leash pressure: if player hides from all enemies, they surge ──
      {
        const aliveEns = gameState.enemies.filter(e => e.isAlive);
        if (aliveEns.length > 0) {
          const nearestDist = aliveEns.reduce((mn, e) => Math.min(mn, e.position.distanceTo(basePos)), Infinity);
          if (nearestDist > 12) {
            leashTimer += dt;
            if (leashTimer > 2.5) enemySurgeActive = true;
          } else {
            leashTimer = Math.max(0, leashTimer - dt * 0.8);
            if (leashTimer <= 0) enemySurgeActive = false;
          }
          // Surge: extra movement push toward player
          if (enemySurgeActive) {
            for (const en of gameState.enemies) {
              if (!en.isAlive) continue;
              const toP = basePos.clone().sub(en.position).setY(0);
              if (toP.length() > 0.1) en.position.addScaledVector(toP.normalize(), en.def.speed * 2.0 * dt);
            }
          }
          // Half-wave enrage: when ≤50% remain alive, survivors sprint harder
          const totalForWave = gameState.enemies.length;
          const stillAlive = aliveEns.length;
          if (totalForWave >= 4 && stillAlive <= Math.ceil(totalForWave * 0.5)) {
            for (const en of gameState.enemies) {
              if (!en.isAlive) continue;
              const toP2 = basePos.clone().sub(en.position).setY(0);
              if (toP2.length() > 0.1) en.position.addScaledVector(toP2.normalize(), en.def.speed * 0.35 * dt);
            }
          }
        } else {
          leashTimer = 0;
          enemySurgeActive = false;
        }
      }

      // Update projectiles
      const updatedProj: Projectile[] = [];
      const enemyDamageMap: Record<string, number> = {};

      for (const proj of gameState.projectiles) {
        if (proj.ttl <= 0) {
          // Acid projectile expired without hitting player — create puddle at landing position
          if (proj.isAcid && !proj.isPlayer) {
            const pId = `puddle_exp_${Date.now()}_${Math.random()}`;
            gameState.puddles.push({ id: pId, position: proj.position.clone(), radius: 2.2, dmgPerSec: 4, ttl: 4.5, maxTtl: 4.5 });
          }
          continue;
        }

        // Boomerang: when TTL < 40% of maxTtl, start returning to player
        // Apply gravity to arc projectiles (grenade launcher)
        let vel = proj.gravity && proj.gravity > 0
          ? new THREE.Vector3(proj.velocity.x, proj.velocity.y - proj.gravity * dt, proj.velocity.z)
          : proj.velocity;
        let returning = proj.returning;
        if (proj.returning !== undefined) {
          const halfTtl = (proj.maxTtl || proj.ttl) * 0.4;
          if (!returning && proj.ttl < halfTtl) {
            returning = true;
            // Flip velocity toward player
            const toPlayer = basePos.clone().sub(proj.position).setY(0).normalize();
            vel = toPlayer.multiplyScalar(proj.velocity.length());
          } else if (returning) {
            // Steer toward current player position
            const toPlayer = basePos.clone().sub(proj.position).setY(0).normalize();
            vel = toPlayer.multiplyScalar(proj.velocity.length());
            // Absorbed by player when close
            if (proj.position.distanceTo(basePos) < 1.0) continue;
          }
        }

        const newPos = proj.position.clone().add(vel.clone().multiplyScalar(dt));
        const newTtl = proj.ttl - dt;

        let hitObstacle = false;
        for (const ob of obstacleBoxes) {
          if (newPos.x > ob.min.x && newPos.x < ob.max.x && newPos.z > ob.min.z && newPos.z < ob.max.z) {
            hitObstacle = true; break;
          }
        }
        if (hitObstacle || Math.abs(newPos.x) > HALF_ROOM || Math.abs(newPos.z) > HALF_ROOM || newPos.y < 0 || newPos.y > 6) {
          // Grenade: explode on floor/wall impact
          if (proj.isPlayer && proj.explosionRadius && proj.explosionRadius > 0) {
            const expPos = proj.position.clone();
            gameState.particles.push(...createExplosion(expPos, proj.color, 24));
            gameState.addScreenShake(0.5, 0.3);
            playExplosion();
            for (const en of gameState.enemies) {
              if (!en.isAlive) continue;
              const d = expPos.distanceTo(en.position);
              if (d < proj.explosionRadius) {
                const falloff = 1 - d / proj.explosionRadius;
                const expDmg = proj.damage * falloff;
                en.hp -= expDmg; en.hitFlash = 1;
                gameState.damageDealt += expDmg;
                if (en.hp <= 0 && en.isAlive) {
                  en.isAlive = false; playEnemyDie();
                  gameState.gainXP(en.def.xpReward); gameState.gainCoins(en.def.coinReward);
                  gameState.totalKills++; if (gameState.lifesteal > 0) gameState.heal(gameState.lifesteal);
                  gameState.particles.push(...createExplosion(en.position, en.def.color, 10));
                  // XP gem drop
                  const gemGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
                  const gemMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
                  const gemMesh = new THREE.Mesh(gemGeo, gemMat);
                  gemMesh.position.copy(en.position).add(new THREE.Vector3(0, 0.5, 0));
                  scene.add(gemMesh);
                  meshState.xpGemMeshes.push({ mesh: gemMesh, vel: new THREE.Vector3((Math.random()-0.5)*3, 4, (Math.random()-0.5)*3), value: en.def.xpReward });
                } else { playHit(); }
              }
            }
            // Shockwave player if close
            if (basePos.distanceTo(expPos) < proj.explosionRadius * 0.6) {
              gameState.takeDamage(proj.damage * 0.15);
              gameState.addScreenShake(0.3, 0.25);
            }
            continue;
          }
          // Player projectile with bounce — reflect off wall
          if (proj.isPlayer && (proj.bouncesLeft ?? 0) > 0) {
            const bounced = { ...proj };
            bounced.bouncesLeft = (proj.bouncesLeft ?? 0) - 1;
            // Reflect the appropriate axis
            if (Math.abs(newPos.x) > HALF_ROOM) {
              bounced.velocity = new THREE.Vector3(-proj.velocity.x, proj.velocity.y, proj.velocity.z);
            } else if (Math.abs(newPos.z) > HALF_ROOM) {
              bounced.velocity = new THREE.Vector3(proj.velocity.x, proj.velocity.y, -proj.velocity.z);
            } else {
              bounced.velocity = new THREE.Vector3(proj.velocity.x, -proj.velocity.y, proj.velocity.z);
            }
            bounced.position = proj.position.clone();
            bounced.ttl = proj.ttl;
            bounced.trail = [];
            bounced.hitEnemyIds = []; // allow re-hitting enemies on bounce
            updatedProj.push(bounced);
            continue;
          }
          // Acid projectile hit a wall — spawn puddle at impact
          if (proj.isAcid && !proj.isPlayer) {
            const pId = `puddle_wall_${Date.now()}_${Math.random()}`;
            gameState.puddles.push({ id: pId, position: proj.position.clone(), radius: 2, dmgPerSec: 4, ttl: 4, maxTtl: 4 });
          }
          continue;
        }

        let hit = false;
        let piercesLeft = proj.piercesLeft ?? 0;

        if (!proj.isPlayer) {
          // Enemy projectile hits player
          if (newPos.distanceTo(camera.position) < 0.5) {
            // Bastion wall: block frontal projectiles while active
            const projIncoming = proj.velocity.clone().normalize();
            const playerFront = camDir.clone().normalize();
            const frontality = projIncoming.dot(playerFront.negate());
            if (gameState.bastionTimer > 0 && frontality > 0.3) {
              hit = true;
              gameState.particles.push(...createHitSpark(newPos, "#8090ff"));
              continue; // blocked, skip damage
            }
            gameState.takeDamage(proj.damage);
            killStreak = 0;
            playPlayerHurt();
            // Acid puddle from spitter hitting player
            if (proj.isAcid) {
              const pId = `puddle_${Date.now()}_${Math.random()}`;
              gameState.puddles.push({ id: pId, position: newPos.clone(), radius: 2, dmgPerSec: 4, ttl: 4, maxTtl: 4 });
            }
            if (gameState.phase !== "playing") { onPhaseChangeRef.current(); }
            gameState.particles.push(...createHitSpark(newPos, "#ef4444"));
            hit = true;
          }
        } else {
          // Player projectile hits enemies
          for (const enemy of gameState.enemies) {
            if (!enemy.isAlive) continue;
            // Boomerang tracks which enemies were already hit per pass
            if (proj.hitEnemyIds && proj.hitEnemyIds.includes(enemy.id)) continue;
            const enemyHitCenter = new THREE.Vector3(enemy.position.x, enemy.def.size * 0.6, enemy.position.z);
            if (newPos.distanceTo(enemyHitCenter) < enemy.def.size + 0.35) {
              // Shield absorption
              let dmg = proj.damage;
              // Ember passive: +50% damage to ignited enemies
              if (gameState.selectedCharacter === "ember" && (enemy.igniteDmg ?? 0) > 0 && (enemy.igniteTimer ?? 0) > 0) dmg *= 1.5;
              // Hunter passive: +25% damage to marked enemies
              if (gameState.selectedCharacter === "hunter" && enemy.marked) dmg *= 1.25;
              // Hunter railgun: mark on hit
              if (gameState.selectedCharacter === "hunter" && proj.isPlayer) {
                enemy.marked = true;
                enemy.markTimer = 5.0;
              }
              if (enemy.shield && enemy.shield > 0) {
                const absorbed = Math.min(enemy.shield, dmg);
                enemy.shield -= absorbed;
                dmg -= absorbed;
              }
              if (dmg > 0) {
                enemyDamageMap[enemy.id] = (enemyDamageMap[enemy.id] || 0) + dmg;
                gameState.damageDealt += dmg;
              }
              // Flamethrower ignite
              if (proj.isFlame && (proj.igniteDmg ?? 0) > 0) {
                enemy.igniteDmg = Math.max(enemy.igniteDmg ?? 0, proj.igniteDmg!);
                enemy.igniteTimer = Math.max(enemy.igniteTimer ?? 0, proj.igniteDuration ?? 2.0);
                enemy.igniteTick = enemy.igniteTick ?? 0;
              }
              gameState.particles.push(...createHitSpark(newPos, enemy.def.color));
              if (proj.hitEnemyIds) proj.hitEnemyIds.push(enemy.id);
              // Knockback: push enemy away from player
              if (gameState.knockback > 0 && dmg > 0) {
                const kb = new THREE.Vector3().subVectors(enemy.position, camPos).setY(0).normalize();
                enemy.position.addScaledVector(kb, gameState.knockback * 0.25);
              }
              // Slow on hit: reduce enemy speed (via screamBuff reuse pattern)
              if (gameState.slowOnHit > 0 && dmg > 0) {
                enemy.screamBuffTimer = Math.max(enemy.screamBuffTimer ?? 0, gameState.slowOnHit);
                enemy.screamBuff = Math.min(enemy.screamBuff ?? 1.0, 0.45);
              }

              // Tesla chain lightning (range-constrained; Volt OVERCHARGE = infinite range/count)
              if (proj.chainWeapon === "tesla" && (proj.chainCount ?? 0) > 0) {
                const overcharge = gameState.voltOvercharge > 0;
                const chainR = overcharge ? 999 : 8;
                const chainLimit = overcharge ? gameState.enemies.length : (proj.chainCount ?? 2);
                const chainTargets = gameState.enemies
                  .filter(e => e.isAlive && e.id !== enemy.id && e.position.distanceTo(enemy.position) <= chainR)
                  .sort((a, b) => a.position.distanceTo(enemy.position) - b.position.distanceTo(enemy.position))
                  .slice(0, chainLimit);
                for (const target of chainTargets) {
                  const chainDmg = proj.damage * 0.6;
                  if (target.shield && target.shield > 0) {
                    const absorbed = Math.min(target.shield, chainDmg);
                    target.shield -= absorbed;
                    const net = chainDmg - absorbed;
                    if (net > 0) { enemyDamageMap[target.id] = (enemyDamageMap[target.id] || 0) + net; gameState.damageDealt += net; }
                  } else {
                    enemyDamageMap[target.id] = (enemyDamageMap[target.id] || 0) + chainDmg;
                    gameState.damageDealt += chainDmg;
                  }
                  gameState.particles.push(...createHitSpark(target.position.clone(), "#c0c0ff"));
                }
              }

              if (piercesLeft > 0) {
                piercesLeft--;
              } else {
                hit = !returning; // boomerang never "expires" on hit — it passes through
                break;
              }
            }
          }

          // Explosive rounds
          if (hit && gameState.explosiveRounds > 0) {
            for (const enemy of gameState.enemies) {
              if (!enemy.isAlive) continue;
              const eDist = newPos.distanceTo(enemy.position);
              if (eDist < 3.5) {
                const expDmg = proj.damage * 0.4;
                enemyDamageMap[enemy.id] = (enemyDamageMap[enemy.id] || 0) + expDmg;
                gameState.damageDealt += expDmg;
              }
            }
            gameState.particles.push(...createExplosion(newPos, "#ff8040", 8));
          }
        }

        if (!hit) {
          const trail = [newPos.clone(), ...proj.trail.slice(0, 4)];
          updatedProj.push({ ...proj, position: newPos, velocity: vel, ttl: newTtl, trail, piercesLeft, returning });
        }
      }
      gameState.projectiles = updatedProj;

      // Apply enemy damage
      if (Object.keys(enemyDamageMap).length > 0) {
        gameState.enemies = gameState.enemies.map(e => {
          if (enemyDamageMap[e.id]) {
            const newHp = e.hp - enemyDamageMap[e.id];
            const wasAlive = e.isAlive;
            const isNowDead = newHp <= 0;
            if (wasAlive && isNowDead) {
              playEnemyDie();
              gameState.gainXP(e.def.xpReward);
              if (gameState.phase !== "playing") { onPhaseChangeRef.current(); }
              gameState.gainCoins(e.def.coinReward);
              gameState.totalKills++;
              // Codex: track kills per enemy type
              gameState.codexSeen.add(e.type);
              gameState.codexKills[e.type] = (gameState.codexKills[e.type] || 0) + 1;
              if (gameState.lifesteal > 0) gameState.heal(gameState.lifesteal);
              gameState.particles.push(...createExplosion(e.position, e.def.color));
              gameState.addScreenShake(0.15, 0.1);
              // XP gem drop — 3D spinning cube that flies to player
              const gemGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
              const gemMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
              const gemMesh = new THREE.Mesh(gemGeo, gemMat);
              gemMesh.position.copy(e.position).add(new THREE.Vector3(0, 0.4, 0));
              scene.add(gemMesh);
              meshState.xpGemMeshes.push({
                mesh: gemMesh,
                vel: new THREE.Vector3((Math.random()-0.5)*4, 3+Math.random()*2, (Math.random()-0.5)*4),
                value: e.def.xpReward,
              });
              // Kill feed entry
              gameState.killFeed.unshift({ name: e.def.name, color: e.def.color, time: nowSec });
              if (gameState.killFeed.length > 5) gameState.killFeed.pop();
              // Kill streak
              killStreak++;
              // Danger-close bonus: killing within 4.5u grants bonus XP + coins + vignette flash
              const killDist = basePos.distanceTo(e.position);
              if (killDist < 4.5) {
                gameState.gainXP(Math.ceil(e.def.xpReward * 0.8));
                gameState.gainCoins(e.def.coinReward);
                dangerCloseFlash = 1.2;
                // Haptic feedback for danger-close kill
                if (gamepadActive) {
                  const _gps = navigator.getGamepads();
                  const _gp = _gps[gamepadIndex];
                  (_gp as unknown as { vibrationActuator?: { playEffect: (t: string, o: object) => Promise<void> } })?.vibrationActuator?.playEffect("dual-rumble", { startDelay: 0, duration: 120, weakMagnitude: 0.5, strongMagnitude: 1.0 }).catch(() => {});
                }
              }
              // Elite explosive-on-death: damages all nearby enemies and player
              if (e.isElite && e.eliteType === "explosive") {
                const BLAST_RADIUS = 5;
                for (const other of gameState.enemies) {
                  if (!other.isAlive || other.id === e.id) continue;
                  if (e.position.distanceTo(other.position) < BLAST_RADIUS) {
                    other.hp -= 35;
                    other.hitFlash = 1;
                  }
                }
                if (e.position.distanceTo(basePos) < BLAST_RADIUS) {
                  gameState.takeDamage(20 * (getDifficultyConfig().dmg ?? 1));
                }
                gameState.particles.push(...createExplosion(e.position, "#ff4400", 20));
                gameState.addScreenShake(0.5, 0.35);
              }
            }
            if (wasAlive && !isNowDead) {
              if (e.type === "boss") playBossHit(); else playHit();
            }
            // Floating damage number
            meshState.damageNumbers.push({ pos: e.position.clone(), value: enemyDamageMap[e.id], isCrit: false, age: 0, maxAge: 1.1 });
            return { ...e, hp: newHp, isAlive: newHp > 0, hitFlash: 1 };
          }
          return e;
        });
      }

      // Tick particles
      gameState.particles = gameState.particles
        .map(p => ({ ...p, ttl: p.ttl - dt, position: p.position.clone().add(p.velocity.clone().multiplyScalar(dt)) }))
        .filter(p => p.ttl > 0);

      // Tick hit flash
      gameState.enemies = gameState.enemies.map(e =>
        e.hitFlash > 0 ? { ...e, hitFlash: Math.max(0, e.hitFlash - dt * 8) } : e
      );

      // XP gem physics — gravity, bounce, magnet pull, collect
      meshState.xpGemMeshes = meshState.xpGemMeshes.filter(gem => {
        gem.vel.y -= 14 * dt;
        gem.mesh.position.addScaledVector(gem.vel, dt);
        if (gem.mesh.position.y < 0.15) {
          gem.mesh.position.y = 0.15;
          gem.vel.y = Math.abs(gem.vel.y) * 0.28;
          gem.vel.x *= 0.82; gem.vel.z *= 0.82;
        }
        const distToPlayer = gem.mesh.position.distanceTo(basePos);
        // Magnet pull within 7u
        if (distToPlayer < 7) {
          const pull = basePos.clone().sub(gem.mesh.position).normalize();
          const strength = Math.min(22, 60 / Math.max(0.3, distToPlayer));
          gem.vel.addScaledVector(pull, strength * dt);
        }
        // Collect
        if (distToPlayer < 0.9 + gameState.pickupRange * 0.3) {
          gameState.gainXP(gem.value);
          scene.remove(gem.mesh);
          gameState.particles.push(...createHitSpark(gem.mesh.position.clone(), "#00ff88"));
          playXpCollect();
          return false;
        }
        gem.mesh.rotation.y += dt * 4;
        gem.mesh.rotation.x += dt * 2;
        return true;
      });

      // Render enemy meshes
      for (const [id, mesh] of meshState.enemyMeshes) {
        const enemy = gameState.enemies.find(e => e.id === id);
        if (!enemy || !enemy.isAlive) {
          scene.remove(mesh);
          meshState.enemyMeshes.delete(id);
        }
      }

      for (const enemy of gameState.enemies) {
        if (!enemy.isAlive) continue;
        let group = meshState.enemyMeshes.get(enemy.id);
        if (!group) {
          group = createEnemyMesh(scene, enemy);
          meshState.enemyMeshes.set(enemy.id, group);
        }
        group.position.copy(enemy.position);

        const hpBarGroup = group.getObjectByName("hpbar") as THREE.Group;
        if (hpBarGroup) {
          hpBarGroup.quaternion.copy(camera.quaternion);
          const hpPct = enemy.hp / enemy.maxHp;
          const fillMesh = hpBarGroup.getObjectByName("hpfill") as THREE.Mesh;
          if (fillMesh) {
            fillMesh.scale.x = Math.max(0, hpPct);
            fillMesh.position.x = -((enemy.def.size * 2.2) * (1 - hpPct)) / 2;
            (fillMesh.material as THREE.MeshBasicMaterial).color.set(
              hpPct > 0.5 ? 0x22c55e : hpPct > 0.25 ? 0xf59e0b : 0xef4444
            );
          }
          if (enemy.maxShield && enemy.maxShield > 0) {
            const shieldFill = hpBarGroup.getObjectByName("shieldfill") as THREE.Mesh;
            if (shieldFill) {
              const sp = Math.max(0, (enemy.shield || 0) / enemy.maxShield);
              shieldFill.scale.x = sp;
              shieldFill.position.x = -((enemy.def.size * 2.2) * (1 - sp)) / 2;
            }
          }
        }

        group.traverse(obj => {
          if (obj instanceof THREE.Mesh && obj.name !== "hpfill" && obj.name !== "shieldfill") {
            const mat = obj.material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              if (enemy.hitFlash > 0.5) {
                mat.emissive.set(0xff4444);
              } else if (enemy.type === "boss") {
                // Phase-based emissive color shift
                const bPhaseColors = [0x000000, 0x220800, 0x441000, 0x662000, 0xff6600];
                mat.emissive.set(bPhaseColors[Math.min(gameState.bossPhase, 4)]);
                // Pulse on charge
                if (enemy.chargeState === "telegraphing") {
                  const pulse = Math.abs(Math.sin(nowSec * 12));
                  mat.emissive.lerp(new THREE.Color(0xff8800), pulse * 0.7);
                } else if (enemy.chargeState === "charging") {
                  mat.emissive.set(0xff8800);
                }
              } else {
                mat.emissive.set(0x000000);
              }
            }
            // Stalker visibility: invisible (opacity ~0.08) until revealed, then fade in to 0.85
            if (enemy.type === "stalker" && mat.transparent) {
              const targetOpacity = enemy.revealed ? 0.85 : 0.08;
              mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, dt * 6);
            }
          }
        });
      }

      // Projectile meshes
      const projSet = new Set(gameState.projectiles.map(p => p.id));
      for (const [id, mesh] of meshState.projectileMeshes) {
        if (!projSet.has(id)) { scene.remove(mesh); meshState.projectileMeshes.delete(id); }
      }
      for (const proj of gameState.projectiles) {
        let group = meshState.projectileMeshes.get(proj.id);
        if (!group) {
          group = new THREE.Group();
          const coreGeo = new THREE.SphereGeometry(proj.isPlayer ? 0.07 : 0.1, 6, 6);
          const coreMat = new THREE.MeshBasicMaterial({ color: proj.color });
          const ball = new THREE.Mesh(coreGeo, coreMat);
          ball.name = "core";
          group.add(ball);
          const trailColor = new THREE.Color(proj.color);
          for (let ti = 0; ti < MAX_TRAIL; ti++) {
            const ratio = 1 - ti / MAX_TRAIL;
            const trailMat = new THREE.MeshBasicMaterial({ color: trailColor, transparent: true, opacity: ratio * 0.6 });
            const trailMesh = new THREE.Mesh(_sharedTrailGeo, trailMat);
            trailMesh.name = `trail_${ti}`;
            trailMesh.visible = false;
            group.add(trailMesh);
          }
          scene.add(group);
          meshState.projectileMeshes.set(proj.id, group);
        }
        group.position.copy(proj.position);
        for (let ti = 0; ti < MAX_TRAIL; ti++) {
          const trailMesh = group.getObjectByName(`trail_${ti}`) as THREE.Mesh | undefined;
          if (!trailMesh) continue;
          if (ti < proj.trail.length) {
            const tp = proj.trail[ti];
            trailMesh.position.set(tp.x - proj.position.x, tp.y - proj.position.y, tp.z - proj.position.z);
            trailMesh.visible = true;
            (trailMesh.material as THREE.MeshBasicMaterial).opacity = (1 - ti / Math.max(proj.trail.length, 1)) * 0.6;
          } else {
            trailMesh.visible = false;
          }
        }
      }

      // Particle points
      {
        const particles = gameState.particles;
        const cap = Math.min(particles.length, MAX_PARTICLES);
        const pos = meshState.particlePositions;
        const col = meshState.particleColors;
        for (let i = 0; i < cap; i++) {
          const part = particles[i];
          const alpha = part.ttl / part.maxTtl;
          _tempColor.set(part.color);
          const bi = i * 3;
          pos[bi] = part.position.x; pos[bi + 1] = part.position.y; pos[bi + 2] = part.position.z;
          col[bi] = _tempColor.r * alpha; col[bi + 1] = _tempColor.g * alpha; col[bi + 2] = _tempColor.b * alpha;
        }
        for (let i = cap; i < MAX_PARTICLES; i++) {
          const bi = i * 3;
          pos[bi] = 0; pos[bi + 1] = -1000; pos[bi + 2] = 0;
          col[bi] = 0; col[bi + 1] = 0; col[bi + 2] = 0;
        }
        if (meshState.particleGeo) {
          meshState.particleGeo.setDrawRange(0, cap || 1);
          (meshState.particleGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
          (meshState.particleGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        }
      }
      // Laser beam decay
      if (meshState.laserBeamLine) {
        meshState.laserBeamTimer -= dt;
        if (meshState.laserBeamTimer <= 0) {
          meshState.laserBeamLine.visible = false;
        } else {
          const fade = Math.min(1, meshState.laserBeamTimer / 0.08);
          (meshState.laserBeamLine.material as THREE.LineBasicMaterial).opacity = fade;
        }
      }
      // Melee swing visual — update position/rotation to match camera and fade
      if (meshState.meleeMesh) {
        if (meshState.meleeTimer > 0) {
          meshState.meleeTimer -= dt;
          const t = Math.max(0, meshState.meleeTimer / meshState.meleeMaxTimer);
          // Position arc in front of player, offset slightly forward
          meshState.meleeMesh.position.copy(basePos).addScaledVector(camDir, 1.1);
          meshState.meleeMesh.position.y = basePos.y;
          // Orient arc to face same direction as player
          meshState.meleeMesh.quaternion.copy(camera.quaternion);
          // Tilt arc to lay flat-ish (angled swing)
          meshState.meleeMesh.rotateX(Math.PI / 2 + (1 - t) * 1.2);
          const opacity = t * 0.8;
          (meshState.meleeMesh.material as THREE.MeshBasicMaterial).opacity = opacity;
        } else {
          (meshState.meleeMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Exit door mesh — dark red (closed) or green transparent (open)
      if (currentDoorMesh) {
        const dmat = currentDoorMesh.material as THREE.MeshBasicMaterial;
        if (gameState.doorOpen) {
          dmat.color.setHex(0x004400);
          dmat.opacity = 0.28;
        } else {
          dmat.color.setHex(0x550000);
          dmat.opacity = 0.92;
        }
      }

      // Render chests — gold boxes with bob animation
      for (const [id, group] of meshState.chestMeshes) {
        const chest = gameState.chests.find(c => c.id === id);
        if (!chest || chest.opened) { scene.remove(group); meshState.chestMeshes.delete(id); }
      }
      for (const chest of gameState.chests) {
        if (chest.opened) continue;
        let group = meshState.chestMeshes.get(chest.id);
        if (!group) {
          group = new THREE.Group();
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ color: "#c8962e", emissive: "#ffd700", emissiveIntensity: 0.4 })
          );
          box.castShadow = true;
          group.add(box);
          const lid = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.15, 0.5),
            new THREE.MeshStandardMaterial({ color: "#a07020" })
          );
          lid.position.y = 0.32;
          group.add(lid);
          scene.add(group);
          meshState.chestMeshes.set(chest.id, group);
        }
        group.position.copy(chest.position);
        group.position.y = 0.3 + Math.sin(nowSec * 2) * 0.08;
        group.rotation.y = nowSec * 0.5;
      }

      // Render structures
      for (const [id, group] of meshState.structureMeshes) {
        if (!gameState.structures.find(s => s.id === id)) { scene.remove(group); meshState.structureMeshes.delete(id); }
      }
      for (const struct of gameState.structures) {
        if (struct.hp <= 0) continue;
        let group = meshState.structureMeshes.get(struct.id);
        if (!group) {
          group = new THREE.Group();
          if (struct.type === "turret") {
            const base = new THREE.Mesh(
              new THREE.CylinderGeometry(0.4, 0.5, 0.6, 8),
              new THREE.MeshStandardMaterial({ color: "#708090", emissive: "#304050", emissiveIntensity: 0.3 })
            );
            group.add(base);
            const barrel = new THREE.Mesh(
              new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8),
              new THREE.MeshStandardMaterial({ color: "#a0a0a0" })
            );
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0.5, 0.35);
            group.add(barrel);
            const flash = new THREE.PointLight("#ffdd44", 0, 2);
            flash.name = "flash";
            group.add(flash);
          } else {
            const trunk = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.25, 1.4, 7),
              new THREE.MeshStandardMaterial({ color: "#5a3010" })
            );
            group.add(trunk);
            const canopy = new THREE.Mesh(
              new THREE.SphereGeometry(0.9, 8, 6),
              new THREE.MeshStandardMaterial({ color: "#228b22", emissive: "#004400", emissiveIntensity: 0.3 })
            );
            canopy.position.y = 1.5;
            group.add(canopy);
          }
          scene.add(group);
          meshState.structureMeshes.set(struct.id, group);
        }
        group.position.copy(struct.position);
        group.position.y = 0;
        // HP fade as structure takes damage
        const hpRatio = struct.hp / struct.maxHp;
        const base = group.children[0] as THREE.Mesh;
        if (base?.material instanceof THREE.MeshStandardMaterial) base.material.emissiveIntensity = (1 - hpRatio) * 0.8;
      }

      // Render companions
      for (const [id, mesh] of meshState.companionMeshes) {
        if (!gameState.companions.find(c => c.id === id)) { scene.remove(mesh); meshState.companionMeshes.delete(id); }
      }
      for (const comp of gameState.companions) {
        if (comp.hp <= 0) continue;
        let mesh = meshState.companionMeshes.get(comp.id);
        if (!mesh) {
          const color = comp.type === "familiar" ? "#a0e0ff" : "#90ff90";
          mesh = new THREE.Mesh(
            new THREE.SphereGeometry(comp.type === "familiar" ? 0.3 : 0.5, 8, 6),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
          );
          scene.add(mesh);
          meshState.companionMeshes.set(comp.id, mesh);
        }
        mesh.position.set(comp.position.x, comp.type === "familiar" ? 1.2 + Math.sin(nowSec * 3 + comp.orbitAngle) * 0.3 : 0.6, comp.position.z);
      }

      // Placement ghost — shows where structure will be placed
      if (gameState.placementMode === "structure" && gameState.placementType) {
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
        const ghostPos = camera.position.clone().add(lookDir.multiplyScalar(3));
        ghostPos.y = 0.4;
        // Draw a simple pulsing ring on floor
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.7, 0.85, 16),
          new THREE.MeshBasicMaterial({ color: "#44ffaa", transparent: true, opacity: 0.5 + 0.3 * Math.sin(nowSec * 4), side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(ghostPos.x, 0.02, ghostPos.z);
        scene.add(ring);
        // Remove next frame — drawn fresh each frame
        requestAnimationFrame(() => scene.remove(ring));
      }

      // Render spike zones — red floor discs that pulse
      for (const [id, mesh] of meshState.spikeMeshes) {
        const spike = gameState.spikeZones.find(s => s.id === id);
        if (!spike) { scene.remove(mesh); meshState.spikeMeshes.delete(id); }
      }
      for (const spike of gameState.spikeZones) {
        let mesh = meshState.spikeMeshes.get(spike.id);
        if (!mesh) {
          mesh = new THREE.Mesh(
            new THREE.CircleGeometry(spike.radius, 16),
            new THREE.MeshBasicMaterial({ color: "#8b1010", transparent: true, opacity: 0.55, side: THREE.DoubleSide })
          );
          mesh.rotation.x = -Math.PI / 2;
          scene.add(mesh);
          meshState.spikeMeshes.set(spike.id, mesh);
        }
        mesh.position.set(spike.position.x, 0.02, spike.position.z);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.2 * Math.abs(Math.sin(nowSec * 3 + spike.position.x));
      }

      renderer.render(scene, camera);

      // ── Draw floating damage numbers on 2D overlay canvas ──
      const cvs2 = canvas2dRef.current;
      if (cvs2) {
        const ctx2 = cvs2.getContext("2d");
        if (ctx2) {
          ctx2.clearRect(0, 0, cvs2.width, cvs2.height);
          meshState.damageNumbers = meshState.damageNumbers.filter(dn => {
            dn.age += dt;
            if (dn.age >= dn.maxAge) return false;
            const floatPos = dn.pos.clone().add(new THREE.Vector3(0, dn.age * 2.8, 0));
            const ndc = floatPos.project(camera);
            if (ndc.z > 1) return true;
            const sx = (ndc.x * 0.5 + 0.5) * cvs2.width;
            const sy = (-ndc.y * 0.5 + 0.5) * cvs2.height;
            const alpha = Math.max(0, 1 - dn.age / dn.maxAge);
            const fontSize = dn.isCrit ? 18 : 12;
            ctx2.save();
            ctx2.globalAlpha = alpha;
            ctx2.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
            ctx2.textAlign = "center";
            ctx2.strokeStyle = "#000";
            ctx2.lineWidth = 3;
            ctx2.fillStyle = dn.isCrit ? "#ffdd00" : "#ffffff";
            const txt = dn.isCrit ? `★${Math.round(dn.value)}` : String(Math.round(dn.value));
            ctx2.strokeText(txt, sx, sy);
            ctx2.fillText(txt, sx, sy);
            ctx2.restore();
            return true;
          });

          // ── Kill streak display ──
          if (killStreak >= 3) {
            const streakColors = ["#ffffff", "#ffdd00", "#ff8800", "#ff2200"];
            const colorIdx = Math.min(3, Math.floor(killStreak / 5));
            const fontSize = Math.min(28, 18 + killStreak);
            ctx2.save();
            ctx2.globalAlpha = 0.92;
            ctx2.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
            ctx2.textAlign = "center";
            const streakTxt = `× ${killStreak} STREAK`;
            ctx2.strokeStyle = "#000";
            ctx2.lineWidth = 4;
            ctx2.fillStyle = streakColors[colorIdx];
            ctx2.strokeText(streakTxt, cvs2.width / 2, cvs2.height * 0.76);
            ctx2.fillText(streakTxt, cvs2.width / 2, cvs2.height * 0.76);
            ctx2.restore();
          }

          // ── Danger-close orange vignette + text ──
          if (dangerCloseFlash > 0) {
            dangerCloseFlash = Math.max(0, dangerCloseFlash - dt * 2.8);
            const flashA = dangerCloseFlash * 0.55;
            if (flashA > 0) {
              ctx2.save();
              const grad = ctx2.createRadialGradient(cvs2.width / 2, cvs2.height / 2, cvs2.height * 0.12, cvs2.width / 2, cvs2.height / 2, cvs2.height * 0.72);
              grad.addColorStop(0, "rgba(255, 90, 0, 0)");
              grad.addColorStop(1, `rgba(255, 50, 0, ${flashA})`);
              ctx2.fillStyle = grad;
              ctx2.fillRect(0, 0, cvs2.width, cvs2.height);
              if (dangerCloseFlash > 0.4) {
                ctx2.globalAlpha = Math.min(1, (dangerCloseFlash - 0.4) * 3);
                ctx2.font = "bold 16px 'Press Start 2P', monospace";
                ctx2.textAlign = "center";
                ctx2.strokeStyle = "#000";
                ctx2.lineWidth = 3;
                ctx2.fillStyle = "#ffaa00";
                ctx2.strokeText("DANGER CLOSE!", cvs2.width / 2, cvs2.height * 0.36);
                ctx2.fillText("DANGER CLOSE!", cvs2.width / 2, cvs2.height * 0.36);
              }
              ctx2.restore();
            }
          }

          // ── Enemy surge warning ──
          if (enemySurgeActive) {
            const pulse = 0.5 + 0.5 * Math.abs(Math.sin(nowSec * 5));
            ctx2.save();
            ctx2.globalAlpha = pulse * 0.85;
            ctx2.font = "bold 13px 'Press Start 2P', monospace";
            ctx2.textAlign = "center";
            ctx2.strokeStyle = "#000";
            ctx2.lineWidth = 3;
            ctx2.fillStyle = "#ff2020";
            ctx2.strokeText("! ENEMY SURGE !", cvs2.width / 2, 68);
            ctx2.fillText("! ENEMY SURGE !", cvs2.width / 2, 68);
            ctx2.restore();
          }

          // ── Controller indicator ──
          if (gamepadActive) {
            ctx2.save();
            ctx2.globalAlpha = 0.55;
            ctx2.font = "8px 'Press Start 2P', monospace";
            ctx2.textAlign = "left";
            ctx2.fillStyle = "#88ff88";
            ctx2.fillText("CTRL", 10, cvs2.height - 10);
            ctx2.restore();
          }
        }
      }
    }

    gameLoop();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", resize);
      window.removeEventListener("gamepadconnected", onGamepadConnected);
      window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
      for (const mesh of meshState.enemyMeshes.values()) scene.remove(mesh);
      for (const mesh of meshState.projectileMeshes.values()) scene.remove(mesh);
      for (const mesh of meshState.chestMeshes.values()) scene.remove(mesh);
      for (const mesh of meshState.spikeMeshes.values()) scene.remove(mesh);
      for (const mesh of meshState.structureMeshes.values()) scene.remove(mesh);
      for (const mesh of meshState.companionMeshes.values()) scene.remove(mesh);
      if (meshState.laserBeamLine) { scene.remove(meshState.laserBeamLine); meshState.laserBeamLine = null; }
      if (meshState.meleeMesh) { scene.remove(meshState.meleeMesh); meshState.meleeMesh = null; }
      if (roomGeomGroup) { scene.remove(roomGeomGroup); roomGeomGroup = null; }
      scene.remove(obstacleGroup);
      if (meshState.particlePoints) scene.remove(meshState.particlePoints);
      meshState.enemyMeshes.clear();
      meshState.projectileMeshes.clear();
      meshState.chestMeshes.clear();
      meshState.spikeMeshes.clear();
      meshState.structureMeshes.clear();
      meshState.companionMeshes.clear();
      gameState.waveSpawned = false;
      gameState.bossPhase = 0;
    };
  }, []);

  const setJoystickFromPointer = (clientX: number, clientY: number, bounds: DOMRect) => {
    const radius = Math.max(36, Math.min(bounds.width, bounds.height) * 0.36);
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const dist = Math.hypot(rawX, rawY);
    const angle = Math.atan2(rawY, rawX);
    const clamped = Math.min(dist, radius);
    const x = dist > 4 ? Math.cos(angle) * clamped : 0;
    const y = dist > 4 ? Math.sin(angle) * clamped : 0;
    touchMoveRef.current.x = dist > 6 ? Math.cos(angle) : 0;
    touchMoveRef.current.y = dist > 6 ? Math.sin(angle) : 0;
    if (joystickThumbRef.current) {
      joystickThumbRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  const resetJoystick = () => {
    touchMoveRef.current.x = 0;
    touchMoveRef.current.y = 0;
    if (joystickThumbRef.current) joystickThumbRef.current.style.transform = "translate(0, 0)";
  };

  const pressAction = (action: "dash" | "special" | "place" | "c1" | "c2" | "c3") => {
    if (action === "dash") touchDashRef.current = true;
    else if (action === "special") touchSpecialRef.current = true;
    else if (action === "place") touchPlaceRef.current = true;
    else touchConsumableRef.current = Number(action.slice(1)) - 1;
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
      <canvas
        ref={canvas2dRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
      <div
        className={`mobile-play-controls ${touchControlsActive ? "active" : ""}`}
        aria-hidden={!touchControlsActive}
      >
        <div
          className="mobile-look-zone"
          onPointerDown={(e) => {
            if (!touchControlsActive || lookPointerRef.current !== null) return;
            e.preventDefault();
            lookPointerRef.current = e.pointerId;
            lookLastRef.current = { x: e.clientX, y: e.clientY };
            touchShootRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (e.pointerId !== lookPointerRef.current) return;
            e.preventDefault();
            const last = lookLastRef.current;
            touchLookRef.current.dx += e.clientX - last.x;
            touchLookRef.current.dy += e.clientY - last.y;
            lookLastRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            if (e.pointerId !== lookPointerRef.current) return;
            e.preventDefault();
            lookPointerRef.current = null;
            touchShootRef.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={(e) => {
            if (e.pointerId !== lookPointerRef.current) return;
            lookPointerRef.current = null;
            touchShootRef.current = false;
          }}
        />
        <div
          className="mobile-joystick"
          onPointerDown={(e) => {
            if (!touchControlsActive || joystickPointerRef.current !== null) return;
            e.preventDefault();
            joystickPointerRef.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            setJoystickFromPointer(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
          }}
          onPointerMove={(e) => {
            if (e.pointerId !== joystickPointerRef.current) return;
            e.preventDefault();
            setJoystickFromPointer(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
          }}
          onPointerUp={(e) => {
            if (e.pointerId !== joystickPointerRef.current) return;
            e.preventDefault();
            joystickPointerRef.current = null;
            e.currentTarget.releasePointerCapture(e.pointerId);
            resetJoystick();
          }}
          onPointerCancel={() => {
            joystickPointerRef.current = null;
            resetJoystick();
          }}
        >
          <div className="mobile-joystick-base">
            <div ref={joystickThumbRef} className="mobile-joystick-thumb" />
          </div>
        </div>
        <div className="mobile-action-cluster">
          <button type="button" className="mobile-action small" onPointerDown={(e) => { e.preventDefault(); pressAction("c1"); }}>1</button>
          <button type="button" className="mobile-action small" onPointerDown={(e) => { e.preventDefault(); pressAction("c2"); }}>2</button>
          <button type="button" className="mobile-action small" onPointerDown={(e) => { e.preventDefault(); pressAction("c3"); }}>3</button>
          <button type="button" className="mobile-action" onPointerDown={(e) => { e.preventDefault(); pressAction("special"); }}>Q</button>
          <button type="button" className="mobile-action primary" onPointerDown={(e) => { e.preventDefault(); pressAction("dash"); }}>DASH</button>
          <button type="button" className="mobile-action" onPointerDown={(e) => { e.preventDefault(); pressAction("place"); }}>BUILD</button>
        </div>
        <div className="mobile-fire-hint">DRAG AIM · HOLD FIRE</div>
      </div>
    </div>
  );
}
