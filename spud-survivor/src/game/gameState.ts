import * as THREE from "three";
import type {
  Enemy, Projectile, Particle, WeaponType, WeaponSlot, RoomDef, ScreenShake,
  Upgrade, GamePhase, RoomType, ConsumableSlot, WaveStats, Puddle, Chest, SpikeZone, ShopItem,
  Structure, Companion,
} from "./types";
import { MAX_WEAPON_SLOTS } from "./types";
import { getRoomType, getRoomShape, ROOM_SHAPES } from "./roomShapes";
import { GRID_SIZE, XP_PER_LEVEL, UPGRADES, CHARACTERS, DIFFICULTIES, capMul, dimBoost, capCoin, WEAPONS, SHOP_ITEMS } from "./constants";

export interface UISnapshot {
  hp: number;
  maxHp: number;
  shield: number;
  shieldMax: number;
  xp: number;
  xpToLevel: number;
  level: number;
  coins: number;
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
  critChance: number;
  hpRegen: number;
  armor: number;
  weaponSlots: WeaponSlot[];
  wave: number;
  totalWaves: number;
  waveActive: boolean;
  waveCountdown: number;
  enemiesLeft: number;
  phase: GamePhase;
  upgradeChoices: Upgrade[];
  rooms: RoomDef[][];
  currentRoom: { x: number; y: number };
  dashCharges: number;
  dashChargesAvail: number;
  dashCd: number;
  dashMax: number;
  specialCd: number;
  specialMax: number;
  selectedCharacter: string;
  consumables: (ConsumableSlot | null)[];
  waveStats: WaveStats | null;
  pendingWeapon: WeaponType | null;
  lockedAdjacentRooms: { x: number; y: number }[];
  roomIndex: number;
  doorOpen: boolean;
  currentRoomType: RoomType;
  totalKills: number;
  damageDealt: number;
  runStartTime: number;
  selectedDifficulty: string;
  killFeed: { name: string; color: string; time: number }[];
  freezeTimer: number;
  shopCap: number;
}

function generateRooms(): RoomDef[][] {
  const rooms: RoomDef[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    rooms[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const isBoss = x === GRID_SIZE - 1 && y === GRID_SIZE - 1;
      rooms[y][x] = {
        x, y,
        type: isBoss ? "boss" : "combat",
        cleared: false,
        unlocked: x === 2 && y === 2,
        template: x === 2 && y === 2 ? 0 : (x * 7 + y * 11 + x * y * 3) % 9,
      };
    }
  }
  return rooms;
}

function getLockedAdjacentRooms(rooms: RoomDef[][]): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (let gy = 0; gy < GRID_SIZE; gy++) {
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      if (rooms[gy][gx].unlocked) continue;
      const neighbors = [[gx + 1, gy], [gx - 1, gy], [gx, gy + 1], [gx, gy - 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
        if (rooms[ny][nx].unlocked) { result.push({ x: gx, y: gy }); break; }
      }
    }
  }
  return result;
}

export class GameState {
  phase: GamePhase = "charselect";
  hp = 100;
  maxHp = 100;
  shield = 0;
  shieldMax = 0;
  shieldRegenTimer = 0;
  xp = 0;
  xpToLevel = 50;
  level = 1;
  coins = 0;
  damage = 1.0;
  attackSpeed = 1.0;
  moveSpeed = 1.0;
  bulletSpeedMult = 1.0;
  critChance = 0.02;
  critDmg = 2.0;
  hpRegen = 0;
  regenAccum = 0;
  armor = 0;
  lifesteal = 0;
  thorns = 0;
  dodgeChance = 0;
  bulletPierce = 0;
  bulletBounce = 0;
  explosiveRounds = 0;
  multishot = 0;
  knockback = 0;
  slowOnHit = 0;
  pickupRange = 1.0;
  secondChance = false;
  secondChanceUsed = false;
  xpMult = 1.0;
  coinMult = 1.0;
  shopDiscount = 0;
  rerollDiscount = 0;
  damageReduction = 0;
  // Dash
  dashCharges = 1;
  dashChargesAvail = 1;
  dashCd = 0;
  dashMax = 2.0;
  dashTime = 0;
  dashDir = new THREE.Vector3();
  isDashing = false;
  invincible = false;
  // Special
  specialCd = 0;
  specialMax = 0;
  // Character
  selectedCharacter = "spud";
  selectedDifficulty = "punishing";
  voltOvercharge = 0;
  phaseTimer = 0;
  deathSpinTimer = 0;
  bastionTimer = 0;
  bastionAngle = 0;
  vortexTimer = 0;
  goldenWave = false;
  wildcardIgnite = false;
  headshot = false;
  consumableCharges = 1;
  // Consumables
  consumables: (ConsumableSlot | null)[] = [null, null, null];
  // Game objects
  weaponSlots: WeaponSlot[] = [{ type: "pistol", cd: 0 }];
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  puddles: Puddle[] = [];
  chests: Chest[] = [];
  spikeZones: SpikeZone[] = [];
  structures: Structure[] = [];
  companions: Companion[] = [];
  // Codex: track seen enemy types
  codexSeen: Set<string> = new Set();
  codexKills: Record<string, number> = {};
  // Placement mode (P key) and carried structure queue
  placementMode: "none" | "structure" = "none";
  placementType: Structure["type"] | null = null;
  carriedStructures: Structure["type"][] = [];
  // Codex (Tab key)
  codexOpen = false;
  // Map
  rooms: RoomDef[][] = generateRooms();
  currentRoom = { x: 2, y: 2 };
  wave = 0;
  totalWaves = 1;
  waveActive = false;
  waveCountdown = 3;
  // Lifecycle state mirrored from GameScene module globals (reset with run)
  waveSpawned = false;
  bossPhase = 0;
  screenShake: ScreenShake = { intensity: 0, duration: 0, elapsed: 0 };
  upgradeChoices: Upgrade[] = [];
  lastHealTime = 0;
  // Pending weapon (for weapon replace screen)
  pendingWeapon: WeaponType | null = null;
  pendingWeaponCost = 0;
  pendingShopItemId: string | null = null;
  // Wave stats
  waveStats: WaveStats | null = null;
  totalKills = 0;
  damageDealt = 0;
  killFeed: { name: string; color: string; time: number }[] = [];
  waveKills = 0;
  waveCoinsStart = 0;
  waveDamageStart = 0;
  runStartTime = 0;
  // Shop
  shopRerollCost = 5;
  shopPurchases = 0;
  shopCap = 3;
  // Linear run system
  roomIndex = 0;
  doorOpen = false;
  currentRoomType: RoomType = "combat";
  currentRoomShape = 0;
  // Shop session (persisted across weapon-replace round-trips)
  shopSessionItems: ShopItem[] = [];
  shopSessionBought: string[] = [];
  // Freeze
  freezeTimer = 0;
  // New passives
  soulHarvest = false;
  ironWillActive = false;
  luckyShotActive = false;
  berserkerActive = false;
  critDmgBonus = 0;

  reset() {
    const char = CHARACTERS[this.selectedCharacter] || CHARACTERS.spud;
    const diff = DIFFICULTIES.find(d => d.id === this.selectedDifficulty) || DIFFICULTIES[2];

    this.phase = "playing";
    this.hp = 100;
    this.maxHp = 100;
    this.shield = 0;
    this.shieldMax = 0;
    this.shieldRegenTimer = 0;
    this.xp = 0;
    this.xpToLevel = XP_PER_LEVEL(1);
    this.level = 1;
    this.coins = 0;
    this.damage = 1.0;
    this.attackSpeed = 1.0;
    this.moveSpeed = 1.0;
    this.bulletSpeedMult = 1.0;
    this.critChance = 0.02;
    this.critDmg = 2.0;
    this.hpRegen = 0;
    this.regenAccum = 0;
    this.armor = 0;
    this.lifesteal = 0;
    this.thorns = 0;
    this.dodgeChance = 0;
    this.bulletPierce = 0;
    this.bulletBounce = 0;
    this.explosiveRounds = 0;
    this.multishot = 0;
    this.knockback = 0;
    this.slowOnHit = 0;
    this.pickupRange = 1.0;
    this.secondChance = false;
    this.secondChanceUsed = false;
    this.xpMult = 1.0;
    this.coinMult = 1.0;
    this.shopDiscount = 0;
    this.rerollDiscount = 0;
    this.damageReduction = 0;
    this.dashCharges = 1;
    this.dashChargesAvail = 1;
    this.dashCd = 0;
    this.dashMax = 2.0;
    this.dashTime = 0;
    this.isDashing = false;
    this.invincible = false;
    this.specialCd = char.specialCooldown;
    this.specialMax = char.specialCooldown;
    this.voltOvercharge = 0;
    this.phaseTimer = 0;
    this.deathSpinTimer = 0;
    this.bastionTimer = 0;
    this.bastionAngle = 0;
    this.vortexTimer = 0;
    this.goldenWave = false;
    this.wildcardIgnite = false;
    this.headshot = false;
    this.consumableCharges = 1;
    this.consumables = [null, null, null];
    this.weaponSlots = char.startWeapons.map(w => ({ type: w, cd: 0 }));
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.puddles = [];
    this.chests = [];
    this.spikeZones = [];
    this.structures = [];
    this.companions = [];
    this.codexSeen = new Set();
    this.codexKills = {};
    this.placementMode = "none";
    this.placementType = null;
    this.carriedStructures = [];
    this.codexOpen = false;
    this.rooms = [];
    this.currentRoom = { x: 0, y: 0 };
    this.roomIndex = 0;
    this.doorOpen = false;
    this.currentRoomType = "combat";
    this.currentRoomShape = getRoomShape(0);
    this.wave = 0;
    this.totalWaves = 1;
    this.waveActive = false;
    this.waveCountdown = 3;
    this.waveSpawned = false;
    this.bossPhase = 0;
    this.screenShake = { intensity: 0, duration: 0, elapsed: 0 };
    this.upgradeChoices = [];
    this.lastHealTime = 0;
    this.pendingWeapon = null;
    this.pendingWeaponCost = 0;
    this.pendingShopItemId = null;
    this.waveStats = null;
    this.totalKills = 0;
    this.damageDealt = 0;
    this.killFeed = [];
    this.waveKills = 0;
    this.waveCoinsStart = 0;
    this.waveDamageStart = 0;
    this.runStartTime = Date.now();
    this.shopRerollCost = 5;
    this.shopPurchases = 0;
    this.shopCap = diff.shopCap ?? 3;
    this.freezeTimer = 0;
    this.soulHarvest = false;
    this.ironWillActive = false;
    this.luckyShotActive = false;
    this.berserkerActive = false;
    this.critDmgBonus = 0;

    // Apply character passives
    if (this.selectedCharacter === "fortress") {
      this.armor += 3;
      this.damageReduction = 0.20;
    } else if (this.selectedCharacter === "phantom") {
      this.dodgeChance = Math.min(1, this.dodgeChance + 0.15);
    } else if (this.selectedCharacter === "scrooge") {
      this.shopDiscount = Math.min(0.4, this.shopDiscount + 0.20);
      this.coins += 30;
    } else if (this.selectedCharacter === "hunter") {
      this.bulletSpeedMult = capMul(dimBoost(this.bulletSpeedMult, 1.3));
    } else if (this.selectedCharacter === "chemist") {
      this.consumableCharges = 2;
    }
  }

  takeDamage(amount: number) {
    if (this.invincible || this.phaseTimer > 0) return;
    if (this.dodgeChance > 0 && Math.random() < this.dodgeChance) return;
    let dmg = Math.max(1, amount - this.armor);
    dmg *= (1 - this.damageReduction);
    // Shield absorbs first
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, dmg);
      this.shield -= absorbed;
      dmg -= absorbed;
      this.shieldRegenTimer = 5;
    }
    if (dmg <= 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.addScreenShake(0.4, 0.25);
    if (this.hp <= 0) {
      if (this.secondChance && !this.secondChanceUsed) {
        this.secondChanceUsed = true;
        this.hp = Math.floor(this.maxHp * 0.5);
        this.invincible = true;
        setTimeout(() => { this.invincible = false; }, 2000);
        return;
      }
      this.phase = "gameover";
    }
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  gainXP(amount: number) {
    const gained = amount * this.xpMult;
    this.xp += gained;
    let leveledUp = false;
    while (this.xp >= this.xpToLevel) {
      this.xp -= this.xpToLevel;
      this.level++;
      this.xpToLevel = XP_PER_LEVEL(this.level);
      leveledUp = true;
    }
    if (leveledUp) {
      this.rollUpgrades();
      this.phase = "levelup";
    }
  }

  gainCoins(amount: number) {
    let total = amount * this.coinMult;
    if (this.goldenWave) total *= 3;
    const diff = DIFFICULTIES.find(d => d.id === this.selectedDifficulty);
    if (diff?.coinMult) total *= diff.coinMult;
    this.coins += Math.floor(total);
  }

  spendCoins(amount: number): boolean {
    if (this.coins < amount) return false;
    this.coins -= amount;
    return true;
  }

  discountedCost(amount: number): number {
    return Math.max(1, Math.ceil(amount * (1 - this.shopDiscount)));
  }

  applyUpgrade(id: string) {
    switch (id) {
      case "damage_15":  this.damage = capMul(dimBoost(this.damage, 1.15)); break;
      case "atkspd_10":  this.attackSpeed = capMul(dimBoost(this.attackSpeed, 1.10)); break;
      case "movespd_12": this.moveSpeed = capMul(dimBoost(this.moveSpeed, 1.12)); break;
      case "maxhp_20":   this.maxHp += 20; this.hp = Math.min(this.maxHp, this.hp + 20); break;
      case "pickup_30":  this.pickupRange = Math.min(3.0, this.pickupRange * 1.30); break;
      case "crit_5":     this.critChance = Math.min(1, this.critChance + 0.05); break;
      case "armor_1":    this.armor += 1; break;
      case "bspd_15":    this.bulletSpeedMult = capMul(dimBoost(this.bulletSpeedMult, 1.15)); break;
      case "regen_05":   this.hpRegen = Math.min(3, this.hpRegen + 0.5); break;
      case "regen_1":    this.hpRegen = Math.min(3, this.hpRegen + 1); break;
      case "xp_25":      this.xpMult = capMul(dimBoost(this.xpMult, 1.25)); break;
      case "coin_15":    this.coinMult = capCoin(this.coinMult * 1.15); break;
      case "bigheal":    this.hp = Math.min(this.maxHp, this.hp + 40); break;
      case "bbounce":      this.bulletBounce += 1; break;
      case "glass_cannon": this.damage = capMul(dimBoost(this.damage, 1.40)); this.maxHp = Math.max(20, this.maxHp - 20); this.hp = Math.min(this.maxHp, this.hp); break;
      case "double_dash":  this.dashCharges = Math.min(5, this.dashCharges + 1); this.dashChargesAvail = Math.min(this.dashCharges, this.dashChargesAvail + 1); break;
      case "overclock":    this.attackSpeed = capMul(dimBoost(this.attackSpeed, 1.25)); break;
      case "soul_harvest": this.soulHarvest = true; break;
      case "iron_will":    this.damageReduction = Math.min(0.7, this.damageReduction + 0.15); break;
      case "lucky_shot":   this.luckyShotActive = true; break;
      case "crit_dmg_up":  this.critDmg = Math.min(5.0, this.critDmg + 0.30); break;
      case "shield_up":    this.shieldMax += 50; this.shield = Math.min(this.shieldMax, this.shield + 50); break;
      case "berserker":    this.berserkerActive = true; break;
      case "quick_feet":   this.moveSpeed = capMul(dimBoost(this.moveSpeed, 1.18)); break;
    }
    this.phase = "playing";
  }

  applyShopStat(key: string) {
    switch (key) {
      case "sdmg":       this.damage = capMul(dimBoost(this.damage, 1.20)); break;
      case "satkspd":    this.attackSpeed = capMul(dimBoost(this.attackSpeed, 1.15)); break;
      case "smovespd":   this.moveSpeed = capMul(dimBoost(this.moveSpeed, 1.15)); break;
      case "shp":        this.maxHp += 25; this.hp = Math.min(this.maxHp, this.hp + 25); break;
      case "smag":       this.pickupRange = Math.min(3.0, this.pickupRange * 1.50); break;
      case "scrit":      this.critChance = Math.min(1, this.critChance + 0.08); break;
      case "sarmor2":    this.armor += 2; break;
      case "svampire":   this.lifesteal += 1; break;
      case "sgold":      this.coinMult = capCoin(this.coinMult * 1.2); break;
      case "sscholar":   this.xpMult = capMul(dimBoost(this.xpMult, 1.3)); break;
      case "smedkit":    this.hp = Math.min(this.maxHp, this.hp + 50); break;
      case "sregen":     this.hpRegen = Math.min(3, this.hpRegen + 0.5); break;
      case "spierce":    this.bulletPierce += 1; break;
      case "sexplosive": this.explosiveRounds += 1; break;
      case "smultishot": this.multishot += 1; break;
      case "sknock":     this.knockback += 2; break;
      case "sthorns":    this.thorns += 5; break;
      case "shp2":       this.maxHp += 40; this.hp = Math.min(this.maxHp, this.hp + 40); break;
      case "sevasion":   this.dodgeChance = Math.min(0.6, this.dodgeChance + 0.08); break;
      case "sfrost":     this.slowOnHit = Math.min(2.0, this.slowOnHit + 0.5); break;
      case "sshield":    this.shieldMax += 30; this.shield = this.shieldMax; break;
      case "shaggler":   this.shopDiscount = Math.min(0.4, this.shopDiscount + 0.10); break;
      case "sheavy":     this.damage = capMul(dimBoost(this.damage, 1.30)); break;
      case "squick":     this.attackSpeed = capMul(dimBoost(this.attackSpeed, 1.20)); break;
      case "sswift":     this.moveSpeed = capMul(dimBoost(this.moveSpeed, 1.20)); break;
      case "sbounce":    this.bulletBounce += 1; break;
      case "srerolldisc": this.rerollDiscount = Math.min(0.5, this.rerollDiscount + 0.15); break;
      case "ssoul":       this.soulHarvest = true; break;
      case "scritdmg":    this.critDmg = Math.min(5.0, this.critDmg + 0.30); break;
    }
  }

  addWeapon(w: WeaponType, cost = 0): boolean {
    if (this.weaponSlots.length >= MAX_WEAPON_SLOTS) {
      // Defer coin spending until replacement is confirmed
      this.pendingWeapon = w;
      this.pendingWeaponCost = cost;
      this.phase = "weaponreplace";
      return false;
    }
    // Free slot: spend coins and equip immediately
    this.spendCoins(cost);
    this.weaponSlots.push({ type: w, cd: 0 });
    return true;
  }

  replaceWeapon(slotIndex: number) {
    if (this.pendingWeapon && slotIndex >= 0 && slotIndex < this.weaponSlots.length) {
      // Spend coins only now that replacement is confirmed
      this.spendCoins(this.pendingWeaponCost);
      this.weaponSlots[slotIndex] = { type: this.pendingWeapon, cd: 0 };
      this.pendingWeapon = null;
      this.pendingWeaponCost = 0;
      // Mark shop item as bought now that replacement is confirmed
      if (this.pendingShopItemId) {
        this.markShopItemBought(this.pendingShopItemId);
        this.pendingShopItemId = null;
      }
    }
    this.phase = "shop";
  }

  cancelWeaponReplace() {
    // No coins spent — replacement was not confirmed; shop item not bought
    this.pendingWeapon = null;
    this.pendingWeaponCost = 0;
    this.pendingShopItemId = null;
    this.phase = "shop";
  }

  removeWeapon(slotIndex: number) {
    if (this.weaponSlots.length > 1) {
      const halfPrice = Math.floor((WEAPONS[this.weaponSlots[slotIndex].type]?.cost ?? 0) / 2);
      this.weaponSlots.splice(slotIndex, 1);
      this.coins += halfPrice;
    }
  }

  addConsumable(type: import("./types").ConsumableType, dryRun = false): boolean {
    const emptyIdx = this.consumables.findIndex(c => c === null);
    if (emptyIdx === -1) return false;
    if (!dryRun) this.consumables[emptyIdx] = { type, charges: this.consumableCharges };
    return true;
  }

  useConsumable(slotIdx: number): import("./types").ConsumableType | null {
    const slot = this.consumables[slotIdx];
    if (!slot) return null;
    const type = slot.type;
    slot.charges--;
    if (slot.charges <= 0) this.consumables[slotIdx] = null;
    return type;
  }

  addScreenShake(intensity: number, duration: number) {
    this.screenShake = { intensity, duration, elapsed: 0 };
  }

  clearRoom() {
    this.goldenWave = false;
    if (this.currentRoomType === "boss") {
      this.phase = "bossdeath";
    } else {
      this.doorOpen = true;
    }
  }

  advanceRoom() {
    this.roomIndex++;
    this.currentRoomType = getRoomType(this.roomIndex);
    this.currentRoomShape = getRoomShape(this.roomIndex);

    this.enemies = [];
    this.projectiles = [];
    this.puddles = [];
    this.particles = [];
    this.structures = [];
    this.companions = [];
    this.chests = [];
    this.wave = 0;
    this.waveActive = false;
    this.waveSpawned = false;
    this.waveCountdown = 3;
    this.bossPhase = 0;
    this.goldenWave = false;
    this.doorOpen = false;
    this.waveKills = this.totalKills;
    this.waveCoinsStart = this.coins;
    this.waveDamageStart = this.damageDealt;
    this.totalWaves = 1;

    const depth = this.roomIndex;
    const spikeLayouts: Array<Array<[number, number]>> = [
      [],
      [[0, 0]],
      [[-6, 6], [6, -6]],
      [[8, 0], [-8, 0]],
      [[0, 8], [0, -8], [0, 0]],
      [[-10, -10], [10, 10]],
      [[-5, 5], [5, -5], [-5, -5], [5, 5]],
      [[0, 5], [0, -5], [6, 0], [-6, 0]],
    ];
    this.spikeZones = [];
    if (depth >= 3) {
      const positions = spikeLayouts[this.currentRoomShape % spikeLayouts.length];
      const dmg = 5 + Math.floor(depth / 3) * 2;
      positions.forEach(([sx, sz], i) => {
        this.spikeZones.push({
          id: `spike_${Date.now()}_${i}`,
          position: new THREE.Vector3(sx, 0, sz),
          radius: 1.8,
          dmg,
          tickTimer: 0,
        });
      });
    }

    const chestChance = this.selectedCharacter === "scrooge" ? 0.3 : 0.2;
    if (Math.random() < chestChance) {
      const shape = ROOM_SHAPES[this.currentRoomShape];
      this.chests.push({
        id: `chest_${Date.now()}`,
        position: new THREE.Vector3(shape.spawnX + 2, 0, shape.spawnZ - 2),
        opened: false,
        coinReward: 10 + Math.floor(Math.random() * 20),
      });
    }

    if (this.currentRoomType === "heal") {
      this.heal(Math.floor(this.maxHp * 0.35));
      this.doorOpen = true;
      this.phase = "playing";
    } else if (this.currentRoomType === "shop") {
      this.startShopAfterWave();
    } else if (this.currentRoomType === "maze") {
      this.doorOpen = true;
      this.phase = "playing";
    } else {
      this.phase = "playing";
    }
  }

  startShopAfterWave() {
    this.shopPurchases = 0;
    this.shopRerollCost = Math.max(2, this.shopRerollCost - Math.floor(this.shopRerollCost * this.rerollDiscount));
    if (this.selectedCharacter === "scrooge") this.specialCd = 0;
    // Generate fresh shop inventory for this visit (persisted across weapon-replace trips)
    const shuffled = [...SHOP_ITEMS].sort(() => Math.random() - 0.5);
    this.shopSessionItems = shuffled.slice(0, 6);
    this.shopSessionBought = [];
    this.phase = "shop";
  }

  rerollShopSession() {
    const shuffled = [...SHOP_ITEMS].sort(() => Math.random() - 0.5);
    this.shopSessionItems = shuffled.slice(0, 6);
    this.shopSessionBought = [];
  }

  markShopItemBought(itemId: string) {
    if (!this.shopSessionBought.includes(itemId)) {
      this.shopSessionBought.push(itemId);
    }
  }

  placeStructure(type: Structure["type"], position: THREE.Vector3) {
    const defs: Record<Structure["type"], { hp: number }> = {
      turret: { hp: 60 },
      healingtree: { hp: 80 },
    };
    this.structures.push({
      id: `struct_${Date.now()}_${Math.random()}`,
      type,
      position: position.clone(),
      hp: defs[type].hp,
      maxHp: defs[type].hp,
      shootCd: 0,
    });
    // After placing, activate the next carried structure if any
    const next = this.carriedStructures.shift() ?? null;
    if (next) {
      this.placementMode = "structure";
      this.placementType = next;
    } else {
      this.placementMode = "none";
      this.placementType = null;
    }
  }

  addCompanion(type: Companion["type"]) {
    const defs: Record<Companion["type"], { hp: number }> = {
      defender: { hp: 60 },
      familiar: { hp: 40 },
    };
    const angle = Math.random() * Math.PI * 2;
    this.companions.push({
      id: `companion_${Date.now()}_${Math.random()}`,
      type,
      position: new THREE.Vector3(Math.cos(angle) * 2, 0, Math.sin(angle) * 2),
      hp: defs[type].hp,
      maxHp: defs[type].hp,
      shootCd: 0,
      orbitAngle: angle,
    });
  }

  unlockRoom(x: number, y: number) {
    this.rooms[y][x].unlocked = true;
    this.currentRoom = { x, y };
    this.enemies = [];
    this.projectiles = [];
    this.puddles = [];
    this.particles = [];
    this.structures = []; // structures reset each room
    this.wave = 0;
    this.waveActive = false;
    this.waveCountdown = 3;
    // Boss room gets 1 climactic wave; regular rooms have 3 waves each
    const isBossRoom2 = x === GRID_SIZE - 1 && y === GRID_SIZE - 1;
    this.totalWaves = 1;
    this.waveKills = this.totalKills;
    this.waveCoinsStart = this.coins;
    this.waveDamageStart = this.damageDealt;
    // Spike zones: template-defined positions tied to room template index
    const depth = Math.abs(x - 2) + Math.abs(y - 2);
    this.spikeZones = [];
    const template = this.rooms[y]?.[x]?.template ?? 0;
    const spikeLayouts: Array<Array<[number, number]>> = [
      [],                                      // template 0: no spikes
      [[0, 0]],                                // template 1: center spike
      [[-6, 6], [6, -6]],                     // template 2: diagonal pair
      [[8, 0], [-8, 0]],                       // template 3: side pair
      [[0, 8], [0, -8], [0, 0]],              // template 4: three-lane
      [[-10, -10], [10, 10]],                  // template 5: corner pair
      [[-5, 5], [5, -5], [-5, -5], [5, 5]],  // template 6: quad corner
      [[0, 5], [0, -5], [6, 0], [-6, 0]],    // template 7: cross
    ];
    if (depth >= 1) {
      const positions = spikeLayouts[template % spikeLayouts.length];
      const dmg = 5 + depth * 2;
      positions.forEach(([sx, sz], i) => {
        this.spikeZones.push({
          id: `spike_${Date.now()}_${i}`,
          position: new THREE.Vector3(sx, 0, sz),
          radius: 1.8,
          dmg,
          tickTimer: 0,
        });
      });
    }
    // Spawn a chest on room entry so it's collectible during the playing phase
    // (20% chance per room; Scrooge gets 30%)
    this.chests = [];
    const chestChance = this.selectedCharacter === "scrooge" ? 0.3 : 0.2;
    if (Math.random() < chestChance) {
      const chestAnchors: [number, number][] = [
        [0, 4],   // 0: north
        [4, 0],   // 1: east
        [0, -4],  // 2: south
        [-4, 0],  // 3: west
        [3, 3],   // 4: NE
        [-3, 3],  // 5: NW
        [3, -3],  // 6: SE
        [-3, -3], // 7: SW
      ];
      const [cx, cz] = chestAnchors[template % chestAnchors.length];
      this.chests.push({
        id: `chest_${Date.now()}`,
        position: new THREE.Vector3(cx, 0, cz),
        opened: false,
        coinReward: 10 + Math.floor(Math.random() * 20),
      });
    }
    this.phase = "playing";
  }

  rollUpgrades() {
    const byRarity = { common: [] as typeof UPGRADES, rare: [] as typeof UPGRADES, epic: [] as typeof UPGRADES };
    for (const u of UPGRADES) byRarity[u.rarity].push(u);
    const result: typeof UPGRADES = [];
    const rarityCounts: Array<"common" | "rare" | "epic"> = ["common", "common", "rare"];
    const rarityRoll = Math.random();
    if (rarityRoll < 0.15) rarityCounts[2] = "epic";
    else if (rarityRoll < 0.40) rarityCounts[2] = "rare";
    else rarityCounts[2] = "common";

    const used = new Set<string>();
    for (const rarity of rarityCounts) {
      const pool = byRarity[rarity].filter(u => !used.has(u.id));
      if (pool.length === 0) {
        const any = UPGRADES.filter(u => !used.has(u.id));
        if (any.length > 0) {
          const pick = any[Math.floor(Math.random() * any.length)];
          result.push(pick);
          used.add(pick.id);
        }
        continue;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      result.push(pick);
      used.add(pick.id);
    }
    this.upgradeChoices = result;
  }

  triggerSpecial(playerPos: THREE.Vector3) {
    if (this.specialCd > 0 || this.specialMax === 0) return;
    this.specialCd = this.specialMax;

    switch (this.selectedCharacter) {
      case "volt":
        this.voltOvercharge = 3.0;
        break;
      case "ember":
        this.wildcardIgnite = true;
        break;
      case "reaper":
        this.deathSpinTimer = 4.0;
        break;
      case "fortress":
        this.bastionTimer = 3.0;
        this.bastionAngle = Math.atan2(playerPos.z, playerPos.x);
        break;
      case "phantom":
        this.phaseTimer = 2.0;
        this.invincible = true;
        break;
      case "scrooge":
        this.goldenWave = true;
        this.specialCd = 999;
        break;
      case "hunter":
        this.headshot = true;
        break;
      case "cyclone":
        this.vortexTimer = 2.0;
        break;
      case "chemist": {
        const types: Array<import("./types").ConsumableType> = ["grenade", "potion", "freeze", "magnet"];
        for (let i = 0; i < this.consumables.length; i++) {
          // Refill ALL slots (including occupied) and restore charges
          if (this.consumables[i]) {
            this.consumables[i]!.charges = this.consumableCharges;
          } else {
            this.consumables[i] = { type: types[Math.floor(Math.random() * types.length)], charges: this.consumableCharges };
          }
        }
        break;
      }
    }
    this.addScreenShake(0.3, 0.2);
  }

  getLockedAdjacentRooms(): { x: number; y: number }[] {
    return [];
  }

  getUISnapshot(): UISnapshot {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      shield: this.shield,
      shieldMax: this.shieldMax,
      xp: this.xp,
      xpToLevel: this.xpToLevel,
      level: this.level,
      coins: this.coins,
      damage: this.damage,
      attackSpeed: this.attackSpeed,
      moveSpeed: this.moveSpeed,
      critChance: this.critChance,
      hpRegen: this.hpRegen,
      armor: this.armor,
      weaponSlots: this.weaponSlots,
      wave: this.wave,
      totalWaves: this.totalWaves,
      waveActive: this.waveActive,
      waveCountdown: this.waveCountdown,
      enemiesLeft: this.enemies.filter(e => e.isAlive).length,
      phase: this.phase,
      upgradeChoices: this.upgradeChoices,
      rooms: this.rooms,
      currentRoom: this.currentRoom,
      roomIndex: this.roomIndex,
      doorOpen: this.doorOpen,
      currentRoomType: this.currentRoomType,
      dashCharges: this.dashCharges,
      dashChargesAvail: this.dashChargesAvail,
      dashCd: this.dashCd,
      dashMax: this.dashMax,
      specialCd: this.specialCd,
      specialMax: this.specialMax,
      selectedCharacter: this.selectedCharacter,
      consumables: this.consumables,
      waveStats: this.waveStats,
      pendingWeapon: this.pendingWeapon,
      lockedAdjacentRooms: this.getLockedAdjacentRooms(),
      totalKills: this.totalKills,
      damageDealt: this.damageDealt,
      runStartTime: this.runStartTime,
      selectedDifficulty: this.selectedDifficulty,
      killFeed: this.killFeed,
      freezeTimer: this.freezeTimer,
      shopCap: this.shopCap,
    };
  }
}

export const gameState = new GameState();
