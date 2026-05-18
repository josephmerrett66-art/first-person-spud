import type { WeaponDef, EnemyDef, Upgrade, ShopItem, CharacterDef, DifficultyDef } from "./types";

export const ROOM_SIZE = 40;
export const WALL_HEIGHT = 5;
export const GRID_SIZE = 5;
export const PLAYER_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.4;
export const WALL_THICKNESS = 0.5;

// ===== CHARACTERS =====
export const CHARACTERS: Record<string, CharacterDef> = {
  spud: {
    id: "spud", name: "Spud", emoji: "🥔",
    desc: "The original potato. Balanced stats, no gimmicks.",
    passive: "No special passive.",
    specialDesc: "No special ability.",
    specialEmoji: "🥔",
    specialCooldown: 0,
    startWeapons: ["pistol"],
    color: "#c89060",
  },
  ember: {
    id: "ember", name: "Ember", emoji: "🔥",
    desc: "Fire specialist. Ignite everything.",
    passive: "Ignited enemies take +50% damage from all sources.",
    specialDesc: "WILDFIRE — spread fire from each ignited enemy to 3 nearest neighbours.",
    specialEmoji: "🔥",
    specialCooldown: 20,
    startWeapons: ["flamethrower"],
    color: "#ff6010",
  },
  volt: {
    id: "volt", name: "Volt", emoji: "⚡",
    desc: "Lightning chainer. Electricity arcs between enemies.",
    passive: "Tesla chains to +1 extra target.",
    specialDesc: "OVERCHARGE — Tesla chains infinitely for 3 seconds.",
    specialEmoji: "⚡",
    specialCooldown: 20,
    startWeapons: ["tesla"],
    color: "#a060ff",
  },
  reaper: {
    id: "reaper", name: "Reaper", emoji: "🗡️",
    desc: "Melee specialist. Gets close and personal.",
    passive: "Melee kills heal 2 HP.",
    specialDesc: "DEATH SPIN — auto-flail spins around you for 4 seconds.",
    specialEmoji: "🗡️",
    specialCooldown: 15,
    startWeapons: ["sword"],
    color: "#c0c0e0",
  },
  fortress: {
    id: "fortress", name: "Fortress", emoji: "🛡️",
    desc: "Tank. High armor, reduced damage taken.",
    passive: "+3 armor, -20% damage taken.",
    specialDesc: "BASTION — indestructible shield wall in front for 3 seconds.",
    specialEmoji: "🛡️",
    specialCooldown: 20,
    startWeapons: ["cannon"],
    color: "#8090d0",
  },
  phantom: {
    id: "phantom", name: "Phantom", emoji: "👻",
    desc: "Elusive. Hard to hit, harder to kill.",
    passive: "15% dodge chance from the start.",
    specialDesc: "PHASE — invincible + 3× speed for 2 seconds.",
    specialEmoji: "👻",
    specialCooldown: 25,
    startWeapons: ["boomerang"],
    color: "#80e0ff",
  },
  scrooge: {
    id: "scrooge", name: "Scrooge", emoji: "💰",
    desc: "Economy king. Coins and discounts are your power.",
    passive: "Shop items cost 20% less. Starts with +30 coins.",
    specialDesc: "GOLDEN TOUCH — next wave drops 3× coins.",
    specialEmoji: "💰",
    specialCooldown: 999,
    startWeapons: ["pistol"],
    color: "#f0d060",
  },
  chemist: {
    id: "chemist", name: "Chemist", emoji: "🧪",
    desc: "Consumable expert. Everything has two uses.",
    passive: "Consumables have 2 charges instead of 1.",
    specialDesc: "SYNTHESIS — instantly refills all consumable slots.",
    specialEmoji: "🧪",
    specialCooldown: 30,
    startWeapons: ["pistol"],
    color: "#60e0a0",
  },
  hunter: {
    id: "hunter", name: "Hunter", emoji: "🏹",
    desc: "Precision sniper. One shot, one kill.",
    passive: "+30% bullet speed. Marked enemies take +25% damage.",
    specialDesc: "HEADSHOT — next shot is guaranteed double-damage crit.",
    specialEmoji: "🏹",
    specialCooldown: 12,
    startWeapons: ["railgun"],
    color: "#80c040",
  },
  cyclone: {
    id: "cyclone", name: "Cyclone", emoji: "🌪️",
    desc: "Pulls enemies in, then destroys them with the flail.",
    passive: "Flail orbit grows per level.",
    specialDesc: "VORTEX — pull all room enemies toward you for 2 seconds.",
    specialEmoji: "🌪️",
    specialCooldown: 18,
    startWeapons: ["flail"],
    color: "#60c0e0",
  },
};

// ===== DIFFICULTIES =====
export const DIFFICULTIES: DifficultyDef[] = [
  { id: "chill",     name: "Chill",      desc: "Forgiving. Learn the ropes.",                  count: 0.55, hp: 0.75, dmg: 0.75, eliteBonus: -0.10, color: "#70c0ff" },
  { id: "normal",    name: "Normal",     desc: "Standard survivor challenge.",                  count: 0.75, hp: 0.90, dmg: 0.90, eliteBonus:  0.00, color: "#70e080" },
  { id: "punishing", name: "Punishing",  desc: "You will die. A lot.",                          count: 1.00, hp: 1.00, dmg: 1.00, eliteBonus:  0.00, color: "#e08040" },
  { id: "deathwish", name: "Death Wish", desc: "Near impossible.",                              count: 1.40, hp: 1.50, dmg: 1.40, eliteBonus:  0.10, color: "#ff4060" },
  { id: "nightmare", name: "Nightmare",  desc: "Enemies hit harder and flood every room.",      count: 1.80, hp: 2.00, dmg: 1.80, eliteBonus:  0.15, color: "#cc2080" },
  { id: "torment",   name: "Torment",    desc: "Elites everywhere. Coin drops halved.",         count: 2.20, hp: 2.60, dmg: 2.20, eliteBonus:  0.20, color: "#9900cc", coinMult: 0.5 },
  { id: "oblivion",  name: "Oblivion",   desc: "Walls of enemies. One-hit from most attacks.",  count: 2.80, hp: 3.50, dmg: 3.00, eliteBonus:  0.25, color: "#660000", coinMult: 0.4 },
  { id: "spudgod",   name: "SPUD GOD",   desc: "You will not survive. This is not balanced.",   count: 3.50, hp: 5.00, dmg: 4.00, eliteBonus:  0.35, color: "#ff8800", coinMult: 0.3, shopCap: 2 },
];

// ===== WEAPONS =====
export const WEAPONS: Record<string, WeaponDef> = {
  pistol: {
    id: "pistol", name: "Potato Pistol",
    damage: 25, fireRate: 1.5, spread: 0.02, projectileSpeed: 22, projectileCount: 1, range: 20,
    color: "#f4c47a", cost: 0,
  },
  shotgun: {
    id: "shotgun", name: "Spud Shotgun",
    damage: 18, fireRate: 0.6, spread: 0.18, projectileSpeed: 18, projectileCount: 5, range: 14,
    color: "#ff8040", cost: 80,
  },
  smg: {
    id: "smg", name: "Tater SMG",
    damage: 8, fireRate: 8, spread: 0.06, projectileSpeed: 28, projectileCount: 1, range: 18,
    color: "#70ff70", cost: 100,
  },
  cannon: {
    id: "cannon", name: "Spud Cannon",
    damage: 80, fireRate: 0.4, spread: 0, projectileSpeed: 15, projectileCount: 1, range: 22,
    color: "#ff4080", cost: 120,
  },
  laser: {
    id: "laser", name: "Laser Spud",
    damage: 12, fireRate: 12, spread: 0, projectileSpeed: 45, projectileCount: 1, range: 28,
    color: "#ff2020", cost: 140,
    special: "laser", heatMax: 1.0, heatPerShot: 0.12, heatCoolRate: 0.6,
  },
  flamethrower: {
    id: "flamethrower", name: "Fry Blaster",
    damage: 6, fireRate: 12, spread: 0.30, projectileSpeed: 10, projectileCount: 2, range: 8,
    color: "#ff6010", cost: 120,
    special: "flame", igniteDmg: 3, igniteDuration: 2.0,
  },
  railgun: {
    id: "railgun", name: "Rail Spud",
    damage: 200, fireRate: 0.3, spread: 0, projectileSpeed: 60, projectileCount: 1, range: 38,
    color: "#40ffff", cost: 180,
    special: "railgun",
  },
  boomerang: {
    id: "boomerang", name: "Boomerang",
    damage: 35, fireRate: 0.6, spread: 0, projectileSpeed: 14, projectileCount: 1, range: 18,
    color: "#d4a030", cost: 100,
    special: "boomerang",
  },
  tesla: {
    id: "tesla", name: "Tesla Coil",
    damage: 40, fireRate: 1.0, spread: 0, projectileSpeed: 20, projectileCount: 1, range: 20,
    color: "#a060ff", cost: 140,
    special: "tesla", chainCount: 4, chainRange: 8, chainDmgFalloff: 0.6,
  },
  sword: {
    id: "sword", name: "Sword",
    damage: 60, fireRate: 1.5, spread: 0, projectileSpeed: 0, projectileCount: 1, range: 5,
    color: "#c0c0e0", cost: 100,
    special: "melee_arc", arcAngle: 2.2, arcRange: 5,
  },
  spear: {
    id: "spear", name: "Spear",
    damage: 90, fireRate: 1.2, spread: 0, projectileSpeed: 0, projectileCount: 1, range: 6,
    color: "#a08050", cost: 110,
    special: "melee_thrust", thrustWidth: 1.5, thrustKnockback: 4,
  },
  flail: {
    id: "flail", name: "Flail",
    damage: 20, fireRate: 5, spread: 0, projectileSpeed: 0, projectileCount: 1, range: 3,
    color: "#e0a030", cost: 90,
    special: "melee_spin",
  },
  grenade_launcher: {
    id: "grenade_launcher", name: "Spud Launcher",
    damage: 120, fireRate: 0.5, spread: 0.04, projectileSpeed: 14, projectileCount: 1, range: 22,
    color: "#80ff40", cost: 160,
    special: "grenade", explosionRadius: 4.5,
  },
  minigun: {
    id: "minigun", name: "Tater Minigun",
    damage: 6, fireRate: 18, spread: 0.12, projectileSpeed: 30, projectileCount: 1, range: 20,
    color: "#ffdd00", cost: 150,
  },
  crossbow: {
    id: "crossbow", name: "Bolt Caster",
    damage: 150, fireRate: 0.7, spread: 0.005, projectileSpeed: 35, projectileCount: 1, range: 32,
    color: "#c0a060", cost: 130,
    special: "railgun",
  },
  shotcircle: {
    id: "shotcircle", name: "Ring Blaster",
    damage: 22, fireRate: 0.8, spread: 0, projectileSpeed: 12, projectileCount: 12, range: 10,
    color: "#ff60ff", cost: 140,
    special: "circle",
  },
};

// ===== ENEMIES =====
export const ENEMIES: Record<string, EnemyDef> = {
  walker: {
    type: "walker", name: "Walker",
    hp: 35, speed: 3.5, damage: 10, attackRate: 0.9,
    xpReward: 5, coinReward: 2, color: "#c05050", size: 0.55, behavior: "chase",
  },
  runner: {
    type: "runner", name: "Runner",
    hp: 20, speed: 6.5, damage: 8, attackRate: 1.1,
    xpReward: 5, coinReward: 2, color: "#c090e0", size: 0.45, behavior: "chase",
  },
  brute: {
    type: "brute", name: "Brute",
    hp: 140, speed: 2.2, damage: 22, attackRate: 0.7,
    xpReward: 15, coinReward: 6, color: "#806040", size: 0.9, behavior: "chase",
  },
  shooter: {
    type: "shooter", name: "Shooter",
    hp: 45, speed: 2.8, damage: 12, attackRate: 1.0,
    xpReward: 10, coinReward: 4, color: "#4080a0", size: 0.6, behavior: "ranged",
    shootCd: 1.4, shootRange: 18, projSpeed: 14,
  },
  dasher: {
    type: "dasher", name: "Dasher",
    hp: 55, speed: 3.0, damage: 26, attackRate: 0.6,
    xpReward: 10, coinReward: 4, color: "#ff4020", size: 0.55, behavior: "dasher",
    dashSpeed: 28, chargeTime: 1.0, dashDuration: 0.4, resetTime: 0.6,
  },
  spitter: {
    type: "spitter", name: "Spitter",
    hp: 40, speed: 2.2, damage: 8, attackRate: 0.6,
    xpReward: 10, coinReward: 4, color: "#60c030", size: 0.55, behavior: "spitter",
    shootCd: 1.8, shootRange: 18, projSpeed: 12,
    puddleRadius: 2.0, puddleDmg: 5, puddleDuration: 4.0,
  },
  shrieker: {
    type: "shrieker", name: "Shrieker",
    hp: 30, speed: 2.8, damage: 5, attackRate: 0.5,
    xpReward: 15, coinReward: 4, color: "#f0c000", size: 0.5, behavior: "shrieker",
    screamCd: 2.5, screamRange: 12, screamBuff: 1.5, screamDuration: 4.0,
  },
  stalker: {
    type: "stalker", name: "Stalker",
    hp: 45, speed: 4.2, damage: 20, attackRate: 0.9,
    xpReward: 15, coinReward: 5, color: "#8040c0", size: 0.55, behavior: "stalker",
    revealRange: 6,
  },
  bomber: {
    type: "bomber", name: "Bomber",
    hp: 70, speed: 2.8, damage: 55, attackRate: 0.2,
    xpReward: 15, coinReward: 4, color: "#ff8020", size: 0.65, behavior: "bomber",
    fuseRange: 3, explosionRadius: 6,
  },
  sentinel: {
    type: "sentinel", name: "Sentinel",
    hp: 200, speed: 0.3, damage: 30, attackRate: 0.3,
    xpReward: 25, coinReward: 8, color: "#4060c0", size: 0.85, behavior: "sentinel",
    shootCd: 1.0, shootRange: 24, projSpeed: 18,
  },
  charger: {
    type: "charger", name: "Charger",
    hp: 80, speed: 3.2, damage: 40, attackRate: 0.3,
    xpReward: 18, coinReward: 6, color: "#ff2060", size: 0.7, behavior: "charger",
    chargeSpeed: 32, chargeRange: 18,
  },
  necromancer: {
    type: "necromancer", name: "Necromancer",
    hp: 55, speed: 2.2, damage: 10, attackRate: 0.4,
    xpReward: 30, coinReward: 10, color: "#8020c0", size: 0.65, behavior: "necromancer",
    reviveRange: 8, reviveCd: 4,
    shootCd: 1.6, shootRange: 16, projSpeed: 12,
  },
  boss: {
    type: "boss", name: "Potato King",
    hp: 1800, speed: 2.8, damage: 35, attackRate: 0.5,
    xpReward: 500, coinReward: 200, color: "#a02040", size: 2.2, behavior: "boss",
    shootCd: 0.7, projSpeed: 16,
  },
};

// ===== STAT CAP / DIM BOOST =====
const STAT_CAP = 3.5;
const COIN_CAP = 1.5;
export function capMul(v: number): number { return Math.min(STAT_CAP, v); }
export function capCoin(v: number): number { return Math.min(COIN_CAP, v); }
export function dimBoost(current: number, rawBoost: number): number {
  const progress = Math.max(0, (current - 1) / (STAT_CAP - 1));
  const factor = 1 - progress;
  return current * (1 + (rawBoost - 1) * factor);
}

// ===== UPGRADES =====
export const UPGRADES: Upgrade[] = [
  { id: "damage_15",    name: "+15% Damage",       description: "Hit harder across the board",       rarity: "common", icon: "⚔️",  applyKey: "damage_15" },
  { id: "atkspd_10",   name: "+10% Attack Speed",  description: "All weapons fire faster",           rarity: "common", icon: "⚡",  applyKey: "atkspd_10" },
  { id: "movespd_12",  name: "+12% Move Speed",    description: "Run faster",                        rarity: "common", icon: "💨",  applyKey: "movespd_12" },
  { id: "maxhp_20",    name: "+20 Max HP",          description: "Also heals 20 HP",                  rarity: "common", icon: "❤️",  applyKey: "maxhp_20" },
  { id: "pickup_30",   name: "+30% Pickup Range",  description: "Vacuum gems and coins",             rarity: "common", icon: "🧲",  applyKey: "pickup_30" },
  { id: "crit_5",      name: "+5% Crit Chance",    description: "Crits deal 2x damage",              rarity: "rare",   icon: "🎯",  applyKey: "crit_5" },
  { id: "armor_1",     name: "+1 Armor",            description: "Reduces all incoming damage by 1",  rarity: "rare",   icon: "🛡️", applyKey: "armor_1" },
  { id: "bspd_15",     name: "+15% Bullet Speed",  description: "Bullets travel faster and farther", rarity: "common", icon: "🔫",  applyKey: "bspd_15" },
  { id: "regen_05",    name: "+0.5 HP Regen",       description: "Regen 0.5 HP per second (cap 3)",   rarity: "rare",   icon: "🌿",  applyKey: "regen_05" },
  { id: "regen_1",     name: "+1 HP Regen",         description: "Regen 1 HP per second (cap 3)",     rarity: "epic",   icon: "🌳",  applyKey: "regen_1" },
  { id: "xp_25",       name: "+25% XP Gain",        description: "Gain more XP from all sources",     rarity: "rare",   icon: "⭐",  applyKey: "xp_25" },
  { id: "coin_15",     name: "Lucky Find",          description: "Enemies drop 15% more coins",       rarity: "rare",   icon: "🪙",  applyKey: "coin_15" },
  { id: "bigheal",     name: "Big Heal",            description: "Heal 40 HP now",                    rarity: "common", icon: "💊",  applyKey: "bigheal" },
  { id: "bbounce",     name: "Ricochet",            description: "Bullets bounce off walls once",      rarity: "epic",   icon: "🪃",  applyKey: "bbounce" },
  { id: "glass_cannon",name: "Glass Cannon",        description: "+40% damage but -20 max HP",        rarity: "epic",   icon: "💥",  applyKey: "glass_cannon" },
  { id: "double_dash", name: "Double Dash",         description: "+1 dash charge",                    rarity: "rare",   icon: "💨",  applyKey: "double_dash" },
  { id: "overclock",   name: "Overclock",           description: "+25% attack speed",                 rarity: "rare",   icon: "⚙️",  applyKey: "overclock" },
  { id: "soul_harvest",name: "Soul Harvest",        description: "Kills heal 1.5 HP",                 rarity: "rare",   icon: "💀",  applyKey: "soul_harvest" },
  { id: "iron_will",   name: "Iron Will",           description: "+15% damage reduction",             rarity: "epic",   icon: "🏰",  applyKey: "iron_will" },
  { id: "lucky_shot",  name: "Lucky Shot",          description: "+10% chance for double damage",     rarity: "rare",   icon: "🍀",  applyKey: "lucky_shot" },
  { id: "crit_dmg_up", name: "+30% Crit Damage",   description: "Crits hit even harder",             rarity: "rare",   icon: "🎯",  applyKey: "crit_dmg_up" },
  { id: "shield_up",   name: "+50 Shield",         description: "Adds/increases energy shield",      rarity: "rare",   icon: "🔷",  applyKey: "shield_up" },
  { id: "berserker",   name: "Berserker",           description: "+20% damage & speed when below 30% HP", rarity: "epic", icon: "🔴", applyKey: "berserker" },
  { id: "quick_feet",  name: "Quick Feet",         description: "+18% move speed",                   rarity: "common", icon: "👟",  applyKey: "quick_feet" },
];

// ===== SHOP ITEMS =====
export const SHOP_ITEMS: ShopItem[] = [
  { id: "s_shotgun",    name: "Shotgun",       description: "Close-range spread weapon",         cost: 15, rarity: "rare",   type: "weapon", weaponId: "shotgun" },
  { id: "s_smg",        name: "SMG",           description: "Fast-firing, low damage",           cost: 15, rarity: "rare",   type: "weapon", weaponId: "smg" },
  { id: "s_cannon",     name: "Cannon",        description: "Slow, heavy, high damage",          cost: 25, rarity: "epic",   type: "weapon", weaponId: "cannon" },
  { id: "s_laser",      name: "Laser",         description: "Continuous beam, overheats fast",   cost: 22, rarity: "epic",   type: "weapon", weaponId: "laser" },
  { id: "s_flamethrower",name:"Flamethrower",  description: "Short-range cone, ignites enemies", cost: 20, rarity: "rare",   type: "weapon", weaponId: "flamethrower" },
  { id: "s_railgun",    name: "Railgun",       description: "Slow charge, pierces everything",   cost: 30, rarity: "epic",   type: "weapon", weaponId: "railgun" },
  { id: "s_boomerang",  name: "Boomerang",     description: "Returns to you, hits twice",        cost: 18, rarity: "rare",   type: "weapon", weaponId: "boomerang" },
  { id: "s_tesla",      name: "Tesla",         description: "Chains lightning to 4 enemies",     cost: 24, rarity: "epic",   type: "weapon", weaponId: "tesla" },
  { id: "s_sword",      name: "Sword",         description: "Wide melee arc, high damage",       cost: 18, rarity: "rare",   type: "weapon", weaponId: "sword" },
  { id: "s_spear",      name: "Spear",         description: "Narrow thrust, pierces all",        cost: 20, rarity: "rare",   type: "weapon", weaponId: "spear" },
  { id: "s_flail",      name: "Flail",         description: "Spins around you, no aiming",       cost: 16, rarity: "rare",   type: "weapon", weaponId: "flail" },
  { id: "s_pistol2",    name: "Pistol",        description: "Another reliable pistol",           cost: 10, rarity: "common", type: "weapon", weaponId: "pistol" },
  { id: "s_grenade_launcher", name: "Spud Launcher", description: "Arcing grenades — big explosions", cost: 28, rarity: "epic", type: "weapon", weaponId: "grenade_launcher" },
  { id: "s_minigun",    name: "Minigun",       description: "Spin up — insane fire rate",        cost: 25, rarity: "epic",   type: "weapon", weaponId: "minigun" },
  { id: "s_crossbow",   name: "Bolt Caster",   description: "Heavy bolt, pierces all",           cost: 22, rarity: "rare",   type: "weapon", weaponId: "crossbow" },
  { id: "s_shotcircle", name: "Ring Blaster",  description: "Fires in all directions at once",   cost: 24, rarity: "epic",   type: "weapon", weaponId: "shotcircle" },
  { id: "s_dmg",        name: "Sharp Rounds",  description: "+20% damage",                       cost: 10, rarity: "common", type: "stat",   applyKey: "sdmg" },
  { id: "s_atkspd",     name: "Fast Hands",    description: "+15% attack speed",                 cost: 10, rarity: "common", type: "stat",   applyKey: "satkspd" },
  { id: "s_movespd",    name: "Track Shoes",   description: "+15% move speed",                   cost: 8,  rarity: "common", type: "stat",   applyKey: "smovespd" },
  { id: "s_hp",         name: "Iron Skin",     description: "+25 max HP, heal",                  cost: 10, rarity: "common", type: "stat",   applyKey: "shp" },
  { id: "s_mag",        name: "Magnet",        description: "+50% pickup range",                 cost: 8,  rarity: "common", type: "stat",   applyKey: "smag" },
  { id: "s_crit",       name: "Lucky Charm",   description: "+8% crit chance",                   cost: 14, rarity: "rare",   type: "stat",   applyKey: "scrit" },
  { id: "s_armor2",     name: "Plate Mail",    description: "+2 armor",                          cost: 16, rarity: "rare",   type: "stat",   applyKey: "sarmor2" },
  { id: "s_vampire",    name: "Vampire Tooth", description: "Lifesteal 1 HP/kill",               cost: 20, rarity: "epic",   type: "stat",   applyKey: "svampire" },
  { id: "s_gold",       name: "Gold Tongue",   description: "+20% coin drops",                   cost: 12, rarity: "rare",   type: "stat",   applyKey: "sgold" },
  { id: "s_scholar",    name: "Scholar",       description: "+30% XP gain",                      cost: 12, rarity: "rare",   type: "stat",   applyKey: "sscholar" },
  { id: "s_medkit",     name: "Medkit",        description: "Heal 50 HP",                        cost: 8,  rarity: "common", type: "stat",   applyKey: "smedkit" },
  { id: "s_regen",      name: "Regen Amulet",  description: "+0.5 HP regen/sec",                 cost: 18, rarity: "epic",   type: "stat",   applyKey: "sregen" },
  { id: "s_grenade",    name: "Grenade",       description: "Throws an AoE bomb (key 1/2/3)",   cost: 10, rarity: "common", type: "consumable", consumable: "grenade" },
  { id: "s_potion",     name: "Health Potion", description: "Instant 40 HP heal (key 1/2/3)",   cost: 8,  rarity: "common", type: "consumable", consumable: "potion" },
  { id: "s_freeze",     name: "Freeze Bomb",   description: "Slows all enemies (key 1/2/3)",     cost: 12, rarity: "rare",   type: "consumable", consumable: "freeze" },
  { id: "s_magnet",     name: "Coin Magnet",   description: "Pulls all pickups (key 1/2/3)",     cost: 6,  rarity: "common", type: "consumable", consumable: "magnet" },
  { id: "s_pierce",     name: "Piercing Rounds",description: "Bullets pierce +1 enemy",          cost: 18, rarity: "rare",   type: "stat",   applyKey: "spierce" },
  { id: "s_explosive",  name: "Explosive Rounds",description: "Bullets explode on hit",          cost: 24, rarity: "epic",   type: "stat",   applyKey: "sexplosive" },
  { id: "s_multishot",  name: "Multishot",     description: "+1 extra pellet per shot",          cost: 20, rarity: "epic",   type: "stat",   applyKey: "smultishot" },
  { id: "s_knock",      name: "Knockback",     description: "Bullets push enemies back",         cost: 10, rarity: "common", type: "stat",   applyKey: "sknock" },
  { id: "s_thorns",     name: "Thorns",        description: "Reflect 5 dmg to attackers",        cost: 14, rarity: "rare",   type: "stat",   applyKey: "sthorns" },
  { id: "s_hp2",        name: "+40 Max HP",    description: "Bulk up; also heals 40",            cost: 12, rarity: "common", type: "stat",   applyKey: "shp2" },
  { id: "s_evasion",    name: "Evasion",       description: "+8% chance to dodge damage",        cost: 18, rarity: "rare",   type: "stat",   applyKey: "sevasion" },
  { id: "s_frost",      name: "Frost Bullets", description: "Hits slow enemies for 0.5s",        cost: 14, rarity: "rare",   type: "stat",   applyKey: "sfrost" },
  { id: "s_shield",     name: "Energy Shield", description: "+30 shield (recharges out of combat)", cost: 22, rarity: "epic", type: "stat",  applyKey: "sshield" },
  { id: "s_haggler",    name: "Haggler",       description: "-10% shop prices",                  cost: 15, rarity: "rare",   type: "stat",   applyKey: "shaggler" },
  { id: "s_heavy",      name: "Heavy Hitter",  description: "+30% damage",                       cost: 16, rarity: "rare",   type: "stat",   applyKey: "sheavy" },
  { id: "s_quick",      name: "Quick Reload",  description: "+20% attack speed",                 cost: 14, rarity: "rare",   type: "stat",   applyKey: "squick" },
  { id: "s_swift",      name: "Swift Feet",    description: "+20% move speed",                   cost: 12, rarity: "rare",   type: "stat",   applyKey: "sswift" },
  { id: "s_bounce",     name: "Ricochet Rounds",description: "Bullets bounce off walls once",       cost: 18, rarity: "epic",   type: "stat",   applyKey: "sbounce" },
  { id: "s_reroller",   name: "Reroller",      description: "-15% shop reroll cost each visit",   cost: 16, rarity: "rare",   type: "stat",   applyKey: "srerolldisc" },
  { id: "s_soul",       name: "Soul Stone",    description: "Kills heal 1.5 HP",                 cost: 20, rarity: "epic",   type: "stat",   applyKey: "ssoul" },
  { id: "s_crit_dmg",   name: "Crit Lens",     description: "+30% crit damage",                  cost: 16, rarity: "rare",   type: "stat",   applyKey: "scritdmg" },
  // Structures (place with P key after buying)
  { id: "s_turret",     name: "Turret",        description: "Deploy a turret that shoots enemies (P to place)", cost: 20, rarity: "rare",  type: "structure", structureType: "turret" },
  { id: "s_healingtree",name: "Healing Tree",  description: "Deploy a tree that heals you nearby (P to place)", cost: 18, rarity: "rare", type: "structure", structureType: "healingtree" },
  // Companions (follow you and fight)
  { id: "s_defender",   name: "Defender",      description: "A loyal ally that follows and shoots enemies",     cost: 25, rarity: "epic", type: "ally", allyType: "defender" },
  { id: "s_familiar",   name: "Familiar",      description: "A tiny spirit that orbits and zaps enemies",      cost: 22, rarity: "epic", type: "ally", allyType: "familiar" },
];

export const XP_PER_LEVEL = (level: number) => Math.floor(50 + level * 30);

export const CONSUMABLE_DEFS: Record<string, { name: string; emoji: string; color: string }> = {
  grenade: { name: "Grenade",       emoji: "💣", color: "#ff6040" },
  potion:  { name: "Potion",        emoji: "🧪", color: "#60e080" },
  freeze:  { name: "Freeze Bomb",   emoji: "❄️", color: "#80d0ff" },
  magnet:  { name: "Coin Magnet",   emoji: "🧲", color: "#f0d040" },
};

export const RARITY_COLORS: Record<string, string> = {
  common: "#d0b890",
  rare:   "#70c0ff",
  epic:   "#c070ff",
};
