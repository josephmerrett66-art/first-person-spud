import * as THREE from "three";
import type { Enemy, EnemyType } from "./types";
import { ENEMIES } from "./constants";

let enemyIdCounter = 0;

export function createEnemy(type: EnemyType, position: THREE.Vector3, eliteType?: "shielded" | "fast" | "explosive"): Enemy {
  const def = ENEMIES[type];
  let hp = def.hp;
  let shield: number | undefined;
  let maxShield: number | undefined;

  if (eliteType === "shielded") {
    shield = Math.floor(hp * 0.5);
    maxShield = shield;
    hp = Math.floor(hp * 1.3);
  } else if (eliteType === "fast") {
    hp = Math.floor(hp * 1.1);
  } else if (eliteType === "explosive") {
    hp = Math.floor(hp * 0.9);
  }

  return {
    id: `enemy_${++enemyIdCounter}`,
    type,
    position: position.clone(),
    hp,
    maxHp: hp,
    def,
    lastAttack: 0,
    isAlive: true,
    velocity: new THREE.Vector3(),
    hitFlash: 0,
    shootCooldown: Math.random() * 2,
    isElite: !!eliteType,
    eliteType,
    shield,
    maxShield,
    dashState: type === "dasher" ? "idle" : undefined,
    dashTimer: 0,
    dashDir: type === "dasher" ? new THREE.Vector3() : undefined,
    screamTimer: type === "shrieker" ? 0 : undefined,
    revealed: type === "stalker" ? false : undefined,
    fuseTimer: type === "bomber" ? 0 : undefined,
    chargeState: type === "charger" ? "idle" : undefined,
    chargeTimer: 0,
    reviveCooldown: type === "necromancer" ? 0 : undefined,
    rootPos: type === "sentinel" ? position.clone() : undefined,
  };
}

export function spawnEnemies(
  wave: number,
  roomDepth: number,
  difficultyConfig: { count: number; hp: number; dmg: number; eliteBonus: number },
  isBoss: boolean,
  spawnBounds?: { hw: number; hd: number }
): Enemy[] {
  if (isBoss) {
    const boss = createEnemy("boss", new THREE.Vector3(0, ENEMIES.boss.size * 0.5, -8));
    boss.hp = Math.floor(boss.hp * difficultyConfig.hp);
    boss.maxHp = boss.hp;
    return [boss];
  }

  const roomFactor = Math.sqrt(Math.max(1, roomDepth));
  const base = Math.max(3, Math.floor(
    roomFactor * 1.3 * difficultyConfig.count * (3 + wave * 0.8)
  ));
  const count = Math.min(base, 26);
  const enemies: Enemy[] = [];
  const eliteChance = Math.max(0, (wave >= 3 ? 0.20 : 0) + difficultyConfig.eliteBonus);

  const comp: Partial<Record<EnemyType, number>> = {};
  if (wave >= 2 || roomDepth >= 3) comp.runner = Math.max(1, Math.floor(count * 0.28));
  if (wave >= 3 || roomDepth >= 5) comp.brute = Math.max(1, Math.floor(count * 0.10));
  if (wave >= 2 || roomDepth >= 4) comp.bomber = Math.max(1, Math.floor(count * 0.05));
  if (wave >= 3 || roomDepth >= 5) comp.dasher = Math.max(1, Math.floor(count * 0.08));
  if (wave >= 3 || roomDepth >= 6) comp.shrieker = Math.max(1, Math.floor(count * 0.05));
  if (wave >= 3 || roomDepth >= 7) comp.shooter = Math.max(1, Math.floor(count * 0.08));
  if (wave >= 3 || roomDepth >= 7) comp.spitter = Math.max(1, Math.floor(count * 0.06));
  if (roomDepth >= 8) comp.stalker = Math.max(1, Math.floor(count * 0.04));
  // New enemy types unlock later
  if (roomDepth >= 4 || wave >= 3) comp.sentinel = Math.max(1, Math.floor(count * 0.05));
  if (roomDepth >= 5 || wave >= 3) comp.charger = Math.max(1, Math.floor(count * 0.06));
  if (roomDepth >= 7) comp.necromancer = Math.max(1, Math.floor(count * 0.04));

  const allocatedSoFar = Object.values(comp).reduce((s, v) => s + v, 0);
  comp.walker = Math.max(1, count - allocatedSoFar);

  const hpMult = (1 + wave * 0.20 + roomDepth * 0.15) * difficultyConfig.hp;
  const dmgMult = (1 + wave * 0.10 + roomDepth * 0.08) * difficultyConfig.dmg;

  let i = 0;
  for (const [etype, cnt] of Object.entries(comp) as [EnemyType, number][]) {
    for (let j = 0; j < cnt && i < count; j++, i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8;
      const hw = spawnBounds ? spawnBounds.hw : 11;
      const hd = spawnBounds ? spawnBounds.hd : 11;
      const maxR = Math.min(hw, hd);
      const radius = Math.min(9 + Math.random() * 4, maxR - 1.5);
      const x = Math.cos(angle) * Math.min(radius, hw - 1.5);
      const z = Math.sin(angle) * Math.min(radius, hd - 1.5);
      const pos = new THREE.Vector3(x, ENEMIES[etype].size * 0.5, z);

      let eliteType: "shielded" | "fast" | "explosive" | undefined;
      if (eliteChance > 0 && Math.random() < eliteChance) {
        const roll = Math.random();
        if (roll < 0.33) eliteType = "shielded";
        else if (roll < 0.66) eliteType = "fast";
        else eliteType = "explosive";
      }

      const enemy = createEnemy(etype, pos, eliteType);
      enemy.hp = Math.floor(enemy.hp * hpMult);
      enemy.maxHp = enemy.hp;
      if (enemy.shield) {
        enemy.shield = Math.floor(enemy.shield * hpMult);
        enemy.maxShield = enemy.shield;
      }
      const modDef = { ...enemy.def, damage: Math.floor(enemy.def.damage * dmgMult) };
      enemy.def = modDef;

      enemies.push(enemy);
    }
  }

  return enemies;
}

const _tempVec = new THREE.Vector3();

export function updateEnemyAI(
  enemy: Enemy,
  playerPos: THREE.Vector3,
  dt: number,
  allEnemies: Enemy[],
  freezeTimer: number,
): { updates: Partial<Enemy>; spawnPuddle?: { x: number; y: number; z: number; radius: number; dmgPerSec: number; ttl: number } } {
  if (!enemy.isAlive) return { updates: {} };

  const { def, position } = enemy;
  const toPlayer = _tempVec.clone().subVectors(playerPos, position).setY(0);
  const dist = toPlayer.length();

  const speedMult = (enemy.isElite && enemy.eliteType === "fast" ? 1.5 : 1.0) * 0.6
    * (freezeTimer > 0 ? 0.4 : 1.0)
    * (enemy.screamBuffTimer && enemy.screamBuffTimer > 0 ? (enemy.screamBuff || 1.0) : 1.0);

  let newVelocity = new THREE.Vector3();
  let updates: Partial<Enemy> = {};
  let spawnPuddle: { x: number; y: number; z: number; radius: number; dmgPerSec: number; ttl: number } | undefined;

  const behavior = def.behavior;

  if (behavior === "dasher") {
    const state = enemy.dashState || "idle";
    const timer = (enemy.dashTimer || 0) + dt;

    if (state === "idle") {
      if (dist > 2) {
        toPlayer.normalize();
        newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.5));
      }
      if (dist < 12) {
        updates.dashState = "charging";
        updates.dashTimer = 0;
        updates.dashDir = toPlayer.clone().normalize();
      } else {
        updates.dashTimer = timer;
      }
    } else if (state === "charging") {
      updates.dashTimer = timer;
      if (timer >= (def.chargeTime || 1.4)) {
        updates.dashState = "dashing";
        updates.dashTimer = 0;
        updates.dashDir = _tempVec.clone().subVectors(playerPos, position).setY(0).normalize();
      }
    } else if (state === "dashing") {
      const dir = enemy.dashDir || new THREE.Vector3(0, 0, 1);
      newVelocity.copy(dir).multiplyScalar((def.dashSpeed || 22));
      updates.dashTimer = timer;
      if (timer >= (def.dashDuration || 0.35)) {
        updates.dashState = "resetting";
        updates.dashTimer = 0;
      }
    } else if (state === "resetting") {
      updates.dashTimer = timer;
      if (timer >= (def.resetTime || 0.8)) {
        updates.dashState = "idle";
        updates.dashTimer = 0;
      }
    }
  } else if (behavior === "spitter") {
    if (dist < 6) {
      toPlayer.normalize().negate();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult));
    } else if (dist > (def.shootRange || 18)) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.5));
    }
  } else if (behavior === "shrieker") {
    if (dist < 4) {
      toPlayer.normalize().negate();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.8));
    } else if (dist > 8) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.5));
    }
    const screamTimer = (enemy.screamTimer || 0) + dt;
    if (screamTimer >= (def.screamCd || 3.0)) {
      updates.screamTimer = 0;
    } else {
      updates.screamTimer = screamTimer;
    }
  } else if (behavior === "stalker") {
    const revealed = dist < (def.revealRange || 6) || (enemy.revealed || false);
    updates.revealed = revealed;
    if (dist > 1.5) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult));
    }
  } else if (behavior === "bomber") {
    if (dist > 1.5) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.7));
    }
  } else if (behavior === "ranged") {
    if (dist < (def.shootRange || 16) * 0.5) {
      toPlayer.normalize().negate();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult));
    } else if (dist > (def.shootRange || 16)) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.6));
    }
  } else if (behavior === "sentinel") {
    // Sentinel: plant itself, shoot heavily. Only drifts toward player if very far
    const root = enemy.rootPos || position;
    const toRoot = new THREE.Vector3().subVectors(root, position).setY(0);
    if (toRoot.length() > 2) {
      newVelocity.add(toRoot.normalize().multiplyScalar(def.speed * speedMult));
    } else if (dist > 20) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.3));
    }
  } else if (behavior === "charger") {
    const state = enemy.chargeState || "idle";
    const timer = (enemy.chargeTimer || 0) + dt;
    if (state === "idle") {
      // Slowly track player
      if (dist > 2) {
        toPlayer.normalize();
        newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.6));
      }
      if (dist < (def.chargeRange || 16) && dist > 3) {
        updates.chargeState = "telegraphing";
        updates.chargeTimer = 0;
        updates.chargeDir = toPlayer.clone().normalize();
      } else {
        updates.chargeTimer = timer;
      }
    } else if (state === "telegraphing") {
      // Stand still and glow — lock direction after 0.6s
      updates.chargeTimer = timer;
      if (timer >= 0.7) {
        updates.chargeState = "charging";
        updates.chargeTimer = 0;
      }
    } else if (state === "charging") {
      const dir = enemy.chargeDir || new THREE.Vector3(0, 0, 1);
      newVelocity.copy(dir).multiplyScalar(def.chargeSpeed || 28);
      updates.chargeTimer = timer;
      if (timer >= 0.5) {
        updates.chargeState = "cooldown";
        updates.chargeTimer = 0;
      }
    } else if (state === "cooldown") {
      updates.chargeTimer = timer;
      if (timer >= 1.2) {
        updates.chargeState = "idle";
        updates.chargeTimer = 0;
      }
    }
  } else if (behavior === "necromancer") {
    // Necromancer: keep distance, shoot, occasionally revive nearby dead enemies
    if (dist < 7) {
      toPlayer.normalize().negate();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult));
    } else if (dist > 14) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult * 0.5));
    }
    // Revive logic handled in GameScene (needs full enemy list mutation)
    updates.reviveCooldown = Math.max(0, (enemy.reviveCooldown || 0) - dt);
  } else {
    // chase / boss
    if (dist > 1.5) {
      toPlayer.normalize();
      newVelocity.add(toPlayer.multiplyScalar(def.speed * speedMult));
    }
  }

  // Separation between enemies
  for (const other of allEnemies) {
    if (other.id === enemy.id || !other.isAlive) continue;
    const sep = new THREE.Vector3().subVectors(position, other.position);
    const sepDist = sep.length();
    const minD = (def.size + other.def.size) * 1.1;
    if (sepDist < minD && sepDist > 0) {
      sep.normalize().multiplyScalar((minD - sepDist) * 2);
      newVelocity.add(sep);
    }
  }

  const halfRoom = 19;
  const newPos = position.clone().add(newVelocity.clone().multiplyScalar(dt));
  newPos.x = Math.max(-halfRoom, Math.min(halfRoom, newPos.x));
  newPos.z = Math.max(-halfRoom, Math.min(halfRoom, newPos.z));
  newPos.y = def.size * 0.5;

  const hitFlash = Math.max(0, (enemy.hitFlash || 0) - dt * 5);

  return {
    updates: {
      position: newPos,
      velocity: newVelocity,
      hitFlash,
      ...updates,
    },
    spawnPuddle,
  };
}
