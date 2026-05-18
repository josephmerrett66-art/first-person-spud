import * as THREE from "three";

export type GamePhase =
  | "charselect"
  | "menu"
  | "playing"
  | "paused"
  | "levelup"
  | "shop"
  | "weaponreplace"
  | "gameover"
  | "victory"
  | "bossdeath";

export type WeaponType =
  | "pistol"
  | "shotgun"
  | "smg"
  | "cannon"
  | "laser"
  | "flamethrower"
  | "railgun"
  | "boomerang"
  | "tesla"
  | "sword"
  | "spear"
  | "flail"
  | "grenade_launcher"
  | "minigun"
  | "crossbow"
  | "shotcircle";

export interface WeaponSlot {
  type: WeaponType;
  cd: number;
  heat?: number;
}

export const MAX_WEAPON_SLOTS = 5;

export type EnemyType = "walker" | "runner" | "brute" | "shooter" | "dasher" | "spitter" | "shrieker" | "stalker" | "bomber" | "boss" | "sentinel" | "charger" | "necromancer";

export type RoomType = "combat" | "heal" | "shop" | "maze" | "boss";

export interface WeaponDef {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  spread: number;
  projectileSpeed: number;
  projectileCount: number;
  range: number;
  color: string;
  cost: number;
  special?: string;
  heatMax?: number;
  heatPerShot?: number;
  heatCoolRate?: number;
  chainCount?: number;
  chainRange?: number;
  chainDmgFalloff?: number;
  arcAngle?: number;
  arcRange?: number;
  thrustWidth?: number;
  thrustKnockback?: number;
  igniteDmg?: number;
  igniteDuration?: number;
  explosionRadius?: number;
  gravity?: number;
}

export interface EnemyDef {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  attackRate: number;
  xpReward: number;
  coinReward: number;
  color: string;
  size: number;
  behavior: string;
  shootRange?: number;
  shootCd?: number;
  projSpeed?: number;
  dashSpeed?: number;
  chargeTime?: number;
  dashDuration?: number;
  resetTime?: number;
  puddleRadius?: number;
  puddleDmg?: number;
  puddleDuration?: number;
  screamCd?: number;
  screamRange?: number;
  screamBuff?: number;
  screamDuration?: number;
  revealRange?: number;
  fuseRange?: number;
  explosionRadius?: number;
  reviveRange?: number;
  reviveCd?: number;
  chargeSpeed?: number;
  chargeRange?: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  def: EnemyDef;
  lastAttack: number;
  isAlive: boolean;
  velocity: THREE.Vector3;
  hitFlash: number;
  shootCooldown: number;
  // Elite fields
  isElite?: boolean;
  eliteType?: "shielded" | "fast" | "explosive";
  shield?: number;
  maxShield?: number;
  // Behavior state
  dashState?: "idle" | "charging" | "dashing" | "resetting";
  dashTimer?: number;
  dashDir?: THREE.Vector3;
  screamTimer?: number;
  screamBuff?: number;
  screamBuffTimer?: number;
  igniteTimer?: number;
  igniteDmg?: number;
  igniteTick?: number;
  revealed?: boolean;
  fuseTimer?: number;
  // Hunter mark
  marked?: boolean;
  markTimer?: number;
  // Charger
  chargeState?: "idle" | "telegraphing" | "charging" | "cooldown";
  chargeTimer?: number;
  chargeDir?: THREE.Vector3;
  // Necromancer
  reviveCooldown?: number;
  // Sentinel
  rootPos?: THREE.Vector3;
  // Death tumble visual
  deathTimer?: number;
  deathAngle?: number;
}

export interface Structure {
  id: string;
  type: "turret" | "healingtree";
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  shootCd: number;
}

export interface Companion {
  id: string;
  type: "defender" | "familiar";
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  shootCd: number;
  orbitAngle: number;
}

export interface Projectile {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  isPlayer: boolean;
  ttl: number;
  maxTtl: number;
  color: string;
  trail: THREE.Vector3[];
  isAcid?: boolean;
  piercesLeft?: number;
  returning?: boolean;
  spawnPos?: THREE.Vector3;
  hitEnemyIds?: string[];
  chainWeapon?: string;
  chainCount?: number;
  isFlame?: boolean;
  igniteDmg?: number;
  igniteDuration?: number;
  bouncesLeft?: number;
  gravity?: number;
  explosionRadius?: number;
  isCrit?: boolean;
}

export interface XpGem {
  id: string;
  position: THREE.Vector3;
  value: number;
  vel: THREE.Vector3;
  age: number;
}

export interface DamageNumber {
  id: string;
  position: THREE.Vector3;
  value: number;
  isCrit: boolean;
  age: number;
  maxAge: number;
  color: string;
}

export interface Puddle {
  id: string;
  position: THREE.Vector3;
  radius: number;
  dmgPerSec: number;
  ttl: number;
  maxTtl: number;
}

export interface Particle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  size: number;
  ttl: number;
  maxTtl: number;
}

export interface Chest {
  id: string;
  position: THREE.Vector3;
  opened: boolean;
  coinReward: number;
}

export interface SpikeZone {
  id: string;
  position: THREE.Vector3;
  radius: number;
  dmg: number;
  tickTimer: number;
}

export interface RoomDef {
  x: number;
  y: number;
  type: RoomType;
  cleared: boolean;
  unlocked: boolean;
  template: number;
}

export type UpgradeRarity = "common" | "rare" | "epic";

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: UpgradeRarity;
  applyKey: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "weapon" | "stat" | "consumable" | "ally" | "structure";
  rarity: UpgradeRarity;
  weaponId?: WeaponType;
  applyKey?: string;
  consumable?: ConsumableType;
  allyType?: string;
  structureType?: string;
}

export type ConsumableType = "grenade" | "potion" | "freeze" | "magnet";

export interface ConsumableSlot {
  type: ConsumableType;
  charges: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
}

export interface WaveStats {
  wave: number;
  kills: number;
  coinsEarned: number;
  damageDealt: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  passive: string;
  specialDesc: string;
  specialEmoji: string;
  specialCooldown: number;
  startWeapons: WeaponType[];
  color: string;
}

export interface DifficultyDef {
  id: string;
  name: string;
  desc: string;
  count: number;
  hp: number;
  dmg: number;
  eliteBonus: number;
  color: string;
  coinMult?: number;
  shopCap?: number;
}
