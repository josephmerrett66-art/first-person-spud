import { useState } from "react";
import { WEAPONS, RARITY_COLORS } from "../game/constants";
import type { ShopItem, WeaponType, WeaponSlot } from "../game/types";
import { MAX_WEAPON_SLOTS } from "../game/types";

interface Props {
  coins: number;
  weaponSlots: WeaponSlot[];
  shopCap: number;
  onBuyWeapon: (w: WeaponType, cost: number, itemId: string) => void;
  onSellWeapon: (slotIndex: number) => void;
  onBuyShopStat: (applyKey: string) => void;
  onBuyConsumable: (type: string, dryRun: boolean) => boolean;
  onBuyStructure: (structureType: string) => void;
  onBuyAlly: (allyType: string) => void;
  onLeave: () => void;
  onReroll: () => void;
  shopRerollCost: number;
  spendCoins: (cost: number) => boolean;
  shopDiscount: number;
  shopItems: ShopItem[];
  bought: string[];
  onMarkBought: (itemId: string) => void;
}

const PIXEL = "'Press Start 2P', monospace";

const PANEL: React.CSSProperties = {
  background: "rgba(0,0,0,0.72)",
  border: "2px solid #7c4e14",
  borderRadius: 0,
};

export default function ShopScreen({
  coins, weaponSlots, shopCap, onBuyWeapon, onSellWeapon, onBuyShopStat, onBuyConsumable, onBuyStructure, onBuyAlly, onLeave, onReroll, shopRerollCost, spendCoins, shopDiscount,
  shopItems, bought, onMarkBought,
}: Props) {
  const [feedback, setFeedback] = useState<string>("");

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2000);
  }

  function discountedCost(cost: number) {
    return Math.max(1, Math.ceil(cost * (1 - shopDiscount)));
  }

  function handleReroll() {
    const cost = shopRerollCost;
    if (!spendCoins(cost)) { showFeedback("Not enough coins to reroll!"); return; }
    showFeedback("Shop refreshed!");
    onReroll();
  }

  function handleBuy(item: ShopItem) {
    if (bought.length >= shopCap) { showFeedback(`Max ${shopCap} purchases per shop!`); return; }
    if (bought.includes(item.id)) { showFeedback("Already bought!"); return; }
    const cost = discountedCost(item.cost);

    if (item.type === "weapon") {
      if (coins < cost) { showFeedback("Not enough coins!"); return; }
      onBuyWeapon(item.weaponId!, cost, item.id);
      showFeedback(`Got ${item.name}!`);
    } else if (item.type === "stat") {
      if (!spendCoins(cost)) { showFeedback("Not enough coins!"); return; }
      onBuyShopStat(item.applyKey!);
      onMarkBought(item.id);
      showFeedback(`Applied: ${item.name}!`);
    } else if (item.type === "consumable") {
      const canAdd = onBuyConsumable(item.consumable!, true);
      if (!canAdd) { showFeedback("Consumable slots full!"); return; }
      if (!spendCoins(cost)) { showFeedback("Not enough coins!"); return; }
      onBuyConsumable(item.consumable!, false);
      onMarkBought(item.id);
      showFeedback(`Got ${item.name}!`);
    } else if (item.type === "structure") {
      if (!spendCoins(cost)) { showFeedback("Not enough coins!"); return; }
      onBuyStructure(item.structureType!);
      onMarkBought(item.id);
      showFeedback(`${item.name} ready — press P to place!`);
    } else if (item.type === "ally") {
      if (!spendCoins(cost)) { showFeedback("Not enough coins!"); return; }
      onBuyAlly(item.allyType!);
      onMarkBought(item.id);
      showFeedback(`${item.name} joins your side!`);
    }
  }

  const slotsUsed = weaponSlots.length;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto py-4"
      style={{ background: "radial-gradient(ellipse at center, #2a1200 0%, #0d0600 100%)" }}
    >
      {/* Header */}
      <div style={{ fontFamily: PIXEL, fontSize: 8, color: "#c0842a", letterSpacing: "0.12em", marginBottom: 6 }}>
        DUNGEON MERCHANT
      </div>
      <h2
        style={{
          fontFamily: PIXEL,
          fontSize: "clamp(0.9rem, 3vw, 1.5rem)",
          color: "#d97706",
          textShadow: "4px 4px 0 #7c2d12, -2px -2px 0 #3d1208",
          marginBottom: 8,
        }}
      >
        THE SPUD SHOP
      </h2>

      {/* Coin display */}
      <div
        className="mb-3 flex items-center gap-4"
        style={{ ...PANEL, padding: "6px 14px" }}
      >
        <span style={{ fontFamily: PIXEL, fontSize: 10, color: "#f0c050" }}>🪙 {coins}</span>
        <span style={{ fontFamily: PIXEL, fontSize: 8, color: "#a07030" }}>{shopCap - bought.length} BUYS LEFT</span>
        {shopDiscount > 0 && (
          <span style={{ fontFamily: PIXEL, fontSize: 8, color: "#44cc66" }}>-{Math.round(shopDiscount * 100)}% OFF</span>
        )}
      </div>

      {/* Gun Rack */}
      <div className="mb-4" style={{ ...PANEL, padding: "10px 14px", minWidth: 320, maxWidth: 680, width: "90%" }}>
        <div style={{ fontFamily: PIXEL, fontSize: 8, color: "#c0842a", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>GUN RACK ({slotsUsed}/{MAX_WEAPON_SLOTS})</span>
          <span style={{ color: "#7a5020", fontSize: 7 }}>click to sell</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {weaponSlots.map((slot, i) => {
            const w = WEAPONS[slot.type];
            if (!w) return null;
            const sellPrice = Math.floor(w.cost / 2);
            return (
              <button
                key={i}
                onClick={() => {
                  if (weaponSlots.length <= 1) { showFeedback("Can't sell your last weapon!"); return; }
                  onSellWeapon(i);
                  showFeedback(`Sold ${w.name} for ${sellPrice}🪙`);
                }}
                style={{
                  fontFamily: PIXEL,
                  fontSize: 7,
                  background: "rgba(40,20,5,0.9)",
                  border: `2px solid ${w.color}88`,
                  borderRadius: 0,
                  color: w.color,
                  padding: "4px 8px",
                  cursor: weaponSlots.length > 1 ? "pointer" : "not-allowed",
                  opacity: weaponSlots.length > 1 ? 1 : 0.4,
                }}
                onMouseEnter={(e) => { if (weaponSlots.length > 1) (e.currentTarget as HTMLElement).style.background = "rgba(80,30,5,0.9)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(40,20,5,0.9)"; }}
              >
                {w.name}{weaponSlots.length > 1 && <span style={{ opacity: 0.5 }}> ✕{sellPrice}🪙</span>}
              </button>
            );
          })}
          {slotsUsed < MAX_WEAPON_SLOTS && (
            <div style={{
              fontFamily: PIXEL, fontSize: 7, color: "#7a5020",
              border: "2px solid #4a2e0a", borderRadius: 0, padding: "4px 8px",
            }}>
              + empty
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mb-3 px-4 py-2 text-sm font-bold" style={{
          fontFamily: PIXEL, fontSize: 9, borderRadius: 0,
          background: feedback.toLowerCase().includes("got") || feedback.toLowerCase().includes("applied") || feedback.toLowerCase().includes("sold") || feedback.toLowerCase().includes("refreshed") ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
          color: feedback.toLowerCase().includes("got") || feedback.toLowerCase().includes("applied") || feedback.toLowerCase().includes("sold") || feedback.toLowerCase().includes("refreshed") ? "#86efac" : "#fca5a5",
          border: "2px solid rgba(255,255,255,0.15)",
        }}>
          {feedback}
        </div>
      )}

      {/* Shop items */}
      <div className="flex flex-wrap justify-center gap-3 mb-4" style={{ maxWidth: 700 }}>
        {shopItems.map((item) => {
          const isBought = bought.includes(item.id);
          const cost = discountedCost(item.cost);
          const canAfford = coins >= cost;
          const maxed = bought.length >= shopCap;
          const disabled = isBought || maxed;
          const rarityColor = RARITY_COLORS[item.rarity] || "#d0b890";

          const typeEmoji = item.type === "weapon" ? "🔫"
            : item.type === "consumable" ? (item.consumable === "potion" ? "🧪" : item.consumable === "grenade" ? "💣" : item.consumable === "freeze" ? "❄️" : "🧲")
            : item.rarity === "epic" ? "🔮" : item.rarity === "rare" ? "💎" : "⚙️";

          return (
            <div
              key={item.id}
              onClick={() => !disabled && canAfford && handleBuy(item)}
              style={{
                background: isBought ? "rgba(20,40,20,0.85)" : "rgba(30,15,4,0.95)",
                border: `2px solid ${isBought ? "rgba(34,197,94,0.5)" : rarityColor + "66"}`,
                borderRadius: 0,
                width: 120,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: disabled || !canAfford ? "not-allowed" : "pointer",
                opacity: !canAfford || disabled ? 0.55 : 1,
                transition: "transform 0.1s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!disabled && canAfford) {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${rarityColor}44`;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute", top: 3, right: 4,
                fontFamily: PIXEL, fontSize: 6, color: rarityColor, textTransform: "uppercase",
              }}>
                {item.rarity}
              </div>
              <div style={{ fontSize: 28 }}>{typeEmoji}</div>
              <div style={{ fontFamily: PIXEL, fontSize: 7, textAlign: "center", color: rarityColor }}>{item.name}</div>
              <div style={{ fontFamily: PIXEL, fontSize: 6, textAlign: "center", color: "#a07040", lineHeight: 1.5 }}>{item.description}</div>
              <div className="mt-auto" style={{
                fontFamily: PIXEL, fontSize: 7, padding: "3px 8px", borderRadius: 0,
                background: isBought ? "rgba(34,197,94,0.2)" : "rgba(217,119,6,0.2)",
                color: isBought ? "#86efac" : "#fbbf24",
                border: `2px solid ${isBought ? "rgba(34,197,94,0.5)" : "rgba(217,119,6,0.5)"}`,
              }}>
                {isBought ? "✓ BOUGHT" : `🪙 ${cost}${shopDiscount > 0 ? ` (${item.cost})` : ""}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reroll + Leave buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleReroll}
          style={{
            fontFamily: PIXEL, fontSize: 8,
            background: "rgba(40,20,5,0.85)",
            color: coins >= shopRerollCost ? "#f0d060" : "#806030",
            border: `2px solid ${coins >= shopRerollCost ? "#c09030" : "rgba(80,60,30,0.4)"}`,
            borderRadius: 0,
            padding: "8px 14px",
            cursor: coins >= shopRerollCost ? "pointer" : "not-allowed",
            transition: "transform 0.1s",
          }}
          onMouseEnter={e => { if (coins >= shopRerollCost) (e.target as HTMLElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          🔄 REROLL ({shopRerollCost}🪙)
        </button>
        <button
          onClick={onLeave}
          style={{
            fontFamily: PIXEL, fontSize: 10,
            background: "linear-gradient(135deg, #d97706, #b45309)",
            color: "#fff",
            border: "2px solid #92400e",
            borderRadius: 0,
            padding: "10px 22px",
            boxShadow: "4px 4px 0 #7c2d12",
            cursor: "pointer",
            letterSpacing: "0.08em",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        >
          LEAVE SHOP
        </button>
      </div>
    </div>
  );
}
