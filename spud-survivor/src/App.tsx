import { useState, useEffect, useCallback, useRef } from "react";
import { gameState } from "./game/gameState";
import type { UISnapshot } from "./game/gameState";
import type { ConsumableType, WeaponType } from "./game/types";
import GameScene from "./components/GameScene";
import HUD from "./components/HUD";
import PauseMenu from "./components/PauseMenu";
import WeaponView from "./components/WeaponView";
import CharacterSelectScreen from "./screens/CharacterSelectScreen";
import MenuScreen from "./screens/MenuScreen";
import LevelUpScreen from "./screens/LevelUpScreen";
import ShopScreen from "./screens/ShopScreen";
import WeaponReplaceScreen from "./screens/WeaponReplaceScreen";
import GameOverScreen from "./screens/GameOverScreen";
import VictoryScreen from "./screens/VictoryScreen";
import CodexOverlay from "./screens/CodexOverlay";

export default function App() {
  const [ui, setUI] = useState<UISnapshot>(() => gameState.getUISnapshot());
  const bossDeathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    setUI(gameState.getUISnapshot());
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 80);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const syncViewport = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${Math.round(h)}px`);
      document.body.classList.toggle(
        "touch-device",
        "ontouchstart" in window || navigator.maxTouchPoints > 0,
      );
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("resize", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("resize", syncViewport);
    };
  }, []);

  const { phase } = ui;

  // Q key (from non-playing screens) and Tab (global fallback) open codex
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        e.preventDefault();
        gameState.codexOpen = !gameState.codexOpen;
        refresh();
      }
      if (e.code === "KeyQ" && phase !== "playing") {
        e.preventDefault();
        gameState.codexOpen = !gameState.codexOpen;
        refresh();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, refresh]);

  useEffect(() => {
    if (phase !== "playing") {
      if (document.pointerLockElement) document.exitPointerLock();
    }
    if (phase === "bossdeath") {
      if (bossDeathTimer.current) clearTimeout(bossDeathTimer.current);
      bossDeathTimer.current = setTimeout(() => {
        gameState.doorOpen = true;
        gameState.phase = "playing";
        refresh();
      }, 3000);
    }
    return () => { if (bossDeathTimer.current) clearTimeout(bossDeathTimer.current); };
  }, [phase, refresh]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0a0402", position: "relative", userSelect: "none" }}>
      <GameScene onPhaseChange={refresh} touchControlsActive={phase === "playing"} />

      {/* ── CHARACTER SELECT ── */}
      {phase === "charselect" && (
        <CharacterSelectScreen
          selectedCharacter={ui.selectedCharacter}
          onSelect={(charId) => {
            gameState.selectedCharacter = charId;
            gameState.phase = "menu";
            refresh();
          }}
        />
      )}

      {/* ── MENU + DIFFICULTY ── */}
      {phase === "menu" && (
        <MenuScreen
          selectedCharacter={ui.selectedCharacter}
          selectedDifficulty={ui.selectedDifficulty}
          onSelectDifficulty={(id) => {
            gameState.selectedDifficulty = id;
            refresh();
          }}
          onChangeChar={() => {
            gameState.phase = "charselect";
            refresh();
          }}
          onStart={() => {
            gameState.reset();
            refresh();
          }}
        />
      )}

      {/* ── LEVEL UP ── */}
      {phase === "levelup" && (
        <LevelUpScreen
          level={ui.level}
          choices={ui.upgradeChoices}
          onChoose={(id) => {
            gameState.applyUpgrade(id);
            refresh();
          }}
        />
      )}

      {/* ── SHOP ── */}
      {phase === "shop" && (
        <ShopScreen
          coins={ui.coins}
          weaponSlots={ui.weaponSlots}
          shopCap={ui.shopCap}
          shopDiscount={gameState.shopDiscount}
          shopRerollCost={gameState.shopRerollCost}
          onBuyWeapon={(w: WeaponType, cost: number, itemId: string) => {
            const immediatelyAdded = gameState.addWeapon(w, cost);
            if (immediatelyAdded) {
              gameState.markShopItemBought(itemId);
            } else {
              // Replacement pending — track item to mark bought after confirmation
              gameState.pendingShopItemId = itemId;
            }
            refresh();
          }}
          onSellWeapon={(i) => { gameState.removeWeapon(i); refresh(); }}
          onBuyShopStat={(key) => { gameState.applyShopStat(key); refresh(); }}
          onBuyConsumable={(type, dryRun) => {
            const added = gameState.addConsumable(type as ConsumableType, dryRun);
            if (!dryRun) refresh();
            return added;
          }}
          onBuyStructure={(structureType) => {
            const st = structureType as import("./game/types").Structure["type"];
            gameState.carriedStructures.push(st);
            refresh();
          }}
          onBuyAlly={(allyType) => {
            gameState.addCompanion(allyType as import("./game/types").Companion["type"]);
            refresh();
          }}
          onReroll={() => { gameState.rerollShopSession(); refresh(); }}
          onLeave={() => {
            gameState.doorOpen = true;
            gameState.phase = "playing";
            refresh();
          }}
          spendCoins={(cost) => {
            const ok = gameState.spendCoins(cost);
            refresh();
            return ok;
          }}
          shopItems={gameState.shopSessionItems}
          bought={gameState.shopSessionBought}
          onMarkBought={(itemId) => { gameState.markShopItemBought(itemId); refresh(); }}
        />
      )}

      {/* ── WEAPON REPLACE ── */}
      {phase === "weaponreplace" && ui.pendingWeapon && (
        <WeaponReplaceScreen
          weaponSlots={ui.weaponSlots}
          pendingWeapon={ui.pendingWeapon}
          onReplace={(slotIndex) => {
            gameState.replaceWeapon(slotIndex);
            refresh();
          }}
          onCancel={() => {
            gameState.cancelWeaponReplace();
            refresh();
          }}
        />
      )}

      {/* ── GAME OVER ── */}
      {phase === "gameover" && (
        <GameOverScreen
          level={ui.level}
          coins={ui.coins}
          roomIndex={ui.roomIndex ?? 0}
          totalKills={ui.totalKills}
          damageDealt={ui.damageDealt}
          runStartTime={ui.runStartTime}
          wave={ui.wave}
          selectedDifficulty={ui.selectedDifficulty}
          onRestart={() => {
            gameState.reset();
            refresh();
          }}
          onMenu={() => {
            gameState.phase = "charselect";
            refresh();
          }}
        />
      )}

      {/* ── BOSS DEATH ── */}
      {phase === "bossdeath" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.85)", zIndex: 50 }}>
          <div style={{ fontSize: 80, animation: "spin 1s linear infinite" }}>👑</div>
          <h2 className="font-black mt-6" style={{
            fontSize: "clamp(2rem, 6vw, 3rem)", color: "#d97706",
            textShadow: "0 0 40px rgba(217,119,6,1)", fontFamily: "Georgia, serif",
            letterSpacing: "0.1em", animation: "bossFlash 0.5s ease-in-out infinite alternate",
          }}>
            THE POTATO KING FALLS!
          </h2>
          <p className="text-amber-300/70 text-lg mt-4">The dungeon trembles…</p>
          <style>{`
            @keyframes spin { from { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.3); } to { transform: rotate(360deg) scale(1); } }
            @keyframes bossFlash { from { text-shadow: 0 0 20px rgba(217,119,6,0.5); } to { text-shadow: 0 0 60px rgba(217,119,6,1), 0 0 120px rgba(249,115,22,0.8); } }
          `}</style>
        </div>
      )}

      {/* ── VICTORY ── */}
      {phase === "victory" && (
        <VictoryScreen
          level={ui.level}
          hp={ui.hp}
          coins={ui.coins}
          rooms={ui.rooms}
          totalKills={ui.totalKills}
          damageDealt={ui.damageDealt}
          runStartTime={ui.runStartTime}
          selectedDifficulty={ui.selectedDifficulty}
          wave={ui.wave}
          onRestart={() => {
            gameState.reset();
            refresh();
          }}
          onMenu={() => {
            gameState.phase = "charselect";
            refresh();
          }}
        />
      )}

      {/* ── CODEX OVERLAY (Tab while playing, Q from menu/shop) ── */}
      {gameState.codexOpen && (
        <CodexOverlay
          codexSeen={gameState.codexSeen}
          codexKills={gameState.codexKills}
          onClose={() => { gameState.codexOpen = false; refresh(); }}
        />
      )}

      {/* ── PLACEMENT MODE indicator ── */}
      {phase === "playing" && !gameState.codexOpen && (
        <>
          {gameState.placementMode === "structure" && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
              style={{ zIndex: 30 }}
            >
              <div
                className="rounded-xl px-5 py-3 font-bold text-sm"
                style={{ background: "rgba(0,0,0,0.7)", color: "#44ffaa", border: "1px solid #44ffaa60" }}
              >
                🏗 PLACEMENT MODE — Press P to place {gameState.placementType} here
                {gameState.carriedStructures.length > 0 && (
                  <span className="ml-2 text-amber-300">+{gameState.carriedStructures.length} more</span>
                )}
              </div>
            </div>
          )}
          {gameState.placementMode === "none" && gameState.carriedStructures.length > 0 && (
            <div
              className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center pointer-events-none"
              style={{ zIndex: 30 }}
            >
              <div
                className="rounded-lg px-4 py-2 font-bold text-xs"
                style={{ background: "rgba(0,0,0,0.65)", color: "#44ffaa", border: "1px solid #44ffaa40" }}
              >
                🏗 {gameState.carriedStructures.length} structure{gameState.carriedStructures.length > 1 ? "s" : ""} carried — Press P to place
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PAUSE MENU ── */}
      {phase === "paused" && (
        <PauseMenu
          onResume={() => {
            gameState.phase = "playing";
            refresh();
          }}
          onRestart={() => {
            gameState.reset();
            refresh();
          }}
          onMenu={() => {
            gameState.phase = "charselect";
            refresh();
          }}
        />
      )}

      {/* ── HUD (playing + paused) ── */}
      {(phase === "playing" || phase === "paused") && (
        <>
          <HUD
            hp={ui.hp}
            maxHp={ui.maxHp}
            shield={ui.shield}
            shieldMax={ui.shieldMax}
            xp={ui.xp}
            xpToLevel={ui.xpToLevel}
            level={ui.level}
            coins={ui.coins}
            damage={ui.damage}
            armor={ui.armor}
            weaponSlots={ui.weaponSlots}
            wave={ui.wave}
            totalWaves={ui.totalWaves}
            waveActive={ui.waveActive}
            waveCountdown={ui.waveCountdown}
            enemiesLeft={ui.enemiesLeft}
            dashChargesAvail={ui.dashChargesAvail}
            dashCharges={ui.dashCharges}
            dashCd={ui.dashCd}
            dashMax={ui.dashMax}
            specialCd={ui.specialCd}
            specialMax={ui.specialMax}
            selectedCharacter={ui.selectedCharacter}
            consumables={ui.consumables}
            freezeTimer={ui.freezeTimer}
            roomIndex={ui.roomIndex ?? 0}
            currentRoomType={ui.currentRoomType ?? "combat"}
            doorOpen={ui.doorOpen ?? false}
            killFeed={ui.killFeed ?? []}
            nowSec={performance.now() / 1000}
          />
          {phase === "playing" && <WeaponView weapon={ui.weaponSlots[0]?.type ?? "pistol"} />}
        </>
      )}
    </div>
  );
}
