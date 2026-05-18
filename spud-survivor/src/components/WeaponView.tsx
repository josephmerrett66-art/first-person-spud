import { useEffect, useRef } from "react";
import type { WeaponType } from "../game/types";
import { WEAPONS } from "../game/constants";

interface Props {
  weapon: WeaponType;
  recoilId?: number;
}

export default function WeaponView({ weapon, recoilId }: Props) {
  const def = WEAPONS[weapon];
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current || recoilId === undefined) return;
    const el = divRef.current;
    el.style.transition = "none";
    el.style.transform = "translateY(18px) rotate(-2deg)";
    const id = requestAnimationFrame(() => {
      el.style.transition = "transform 0.18s cubic-bezier(0.22,1,0.36,1)";
      el.style.transform = "";
    });
    return () => cancelAnimationFrame(id);
  }, [recoilId]);

  if (!def) return null;

  return (
    <div
      ref={divRef}
      className="weapon-view absolute bottom-0 right-0 pointer-events-none select-none"
      style={{ width: 320, height: 200, imageRendering: "pixelated" }}
    >
      <style>{`
        @keyframes weaponBob {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(4px); }
        }
        .weapon-bob { animation: weaponBob 0.9s ease-in-out infinite; }
      `}</style>
      <div className="weapon-bob" style={{ width: "100%", height: "100%" }}>
        <svg
          viewBox="0 0 320 200"
          width="320"
          height="200"
          style={{
            filter: `drop-shadow(0 0 10px ${def.color}88) drop-shadow(0 4px 6px #000a)`,
            imageRendering: "pixelated",
          }}
          shapeRendering="crispEdges"
        >
          {weapon === "pistol"            && <PixelPistol     color={def.color} />}
          {weapon === "shotgun"           && <PixelShotgun    color={def.color} />}
          {weapon === "smg"               && <PixelSMG        color={def.color} />}
          {weapon === "flamethrower"      && <PixelFlame      color={def.color} />}
          {weapon === "railgun"           && <PixelRailgun    color={def.color} />}
          {weapon === "grenade_launcher"  && <PixelGrenadeLauncher color={def.color} />}
          {weapon === "minigun"           && <PixelMinigun    color={def.color} />}
          {weapon === "crossbow"          && <PixelCrossbow   color={def.color} />}
          {weapon === "shotcircle"        && <PixelShotcircle color={def.color} />}
        </svg>
      </div>
    </div>
  );
}

function PixelPistol({ color }: { color: string }) {
  return (
    <g>
      <rect x="170" y="130" width="60" height="70" fill="#8b5e3c" />
      <rect x="170" y="126" width="64" height="8" fill="#7a5030" />
      <rect x="168" y="130" width="8" height="50" fill="#7a5030" />
      <rect x="190" y="138" width="32" height="50" fill="#5a3820" />
      <rect x="194" y="142" width="6" height="6" fill="#4a2810" />
      <rect x="204" y="142" width="6" height="6" fill="#4a2810" />
      <rect x="194" y="152" width="6" height="6" fill="#4a2810" />
      <rect x="204" y="152" width="6" height="6" fill="#4a2810" />
      <rect x="90"  y="90"  width="130" height="44" fill={color} />
      <rect x="90"  y="90"  width="130" height="8"  fill="#fff4" />
      <rect x="90"  y="126" width="130" height="8"  fill="#0006" />
      <rect x="100" y="94"  width="80"  height="36" fill={color} />
      <rect x="108" y="100" width="60"  height="6"  fill="#0003" />
      <rect x="108" y="110" width="60"  height="6"  fill="#0003" />
      <rect x="220" y="96"  width="80"  height="20" fill="#555" />
      <rect x="220" y="96"  width="80"  height="6"  fill="#777" />
      <rect x="296" y="96"  width="8"   height="20" fill="#333" />
      <rect x="150" y="134" width="8"   height="30" fill="#4a3020" />
      <rect x="150" y="160" width="40"  height="8"  fill="#4a3020" />
      <rect x="186" y="134" width="8"   height="30" fill="#4a3020" />
    </g>
  );
}

function PixelShotgun({ color }: { color: string }) {
  return (
    <g>
      <rect x="140" y="120" width="70" height="80" fill="#8b5e3c" />
      <rect x="140" y="116" width="74" height="8"  fill="#7a5030" />
      <rect x="20"  y="100" width="110" height="30" fill="#8b6030" />
      <rect x="20"  y="100" width="110" height="6"  fill="#a07040" />
      <rect x="20"  y="122" width="110" height="8"  fill="#6a4820" />
      <rect x="40"  y="102" width="2" height="26" fill="#7a5428" />
      <rect x="70"  y="102" width="2" height="26" fill="#7a5428" />
      <rect x="100" y="102" width="2" height="26" fill="#7a5428" />
      <rect x="100" y="84"  width="90"  height="48" fill={color} />
      <rect x="100" y="84"  width="90"  height="8"  fill="#fff3" />
      <rect x="100" y="124" width="90"  height="8"  fill="#0005" />
      <rect x="170" y="90"  width="30"  height="20" fill="#8b6030" />
      <rect x="170" y="90"  width="30"  height="4"  fill="#a07040" />
      <rect x="188" y="88"  width="112" height="14" fill="#666" />
      <rect x="188" y="104" width="112" height="14" fill="#666" />
      <rect x="188" y="88"  width="112" height="4"  fill="#888" />
      <rect x="188" y="104" width="112" height="4"  fill="#888" />
      <rect x="296" y="88"  width="8"   height="14" fill="#333" />
      <rect x="296" y="104" width="8"   height="14" fill="#333" />
      <rect x="120" y="100" width="24"  height="12" fill="#333" />
      <rect x="168" y="132" width="8"   height="28" fill="#3a2810" />
      <rect x="168" y="158" width="36"  height="8"  fill="#3a2810" />
      <rect x="200" y="132" width="8"   height="28" fill="#3a2810" />
    </g>
  );
}

function PixelSMG({ color }: { color: string }) {
  return (
    <g>
      <rect x="160" y="130" width="60" height="70" fill="#8b5e3c" />
      <rect x="160" y="126" width="64" height="8"  fill="#7a5030" />
      <rect x="175" y="130" width="30" height="70" fill="#3a2810" />
      <rect x="180" y="152" width="20" height="48" fill="#555" />
      <rect x="180" y="152" width="20" height="4"  fill="#777" />
      <rect x="182" y="160" width="4"  height="36" fill="#444" />
      <rect x="60"  y="90"  width="150" height="40" fill={color} />
      <rect x="60"  y="90"  width="150" height="7"  fill="#fff3" />
      <rect x="60"  y="123" width="150" height="7"  fill="#0005" />
      <rect x="70"  y="96"  width="6"   height="28" fill="#0004" />
      <rect x="82"  y="96"  width="6"   height="28" fill="#0004" />
      <rect x="94"  y="96"  width="6"   height="28" fill="#0004" />
      <rect x="130" y="86"  width="20"  height="12" fill="#444" />
      <rect x="208" y="94"  width="100" height="22" fill="#666" />
      <rect x="208" y="94"  width="100" height="6"  fill="#888" />
      <rect x="300" y="94"  width="8"   height="22" fill="#333" />
      <rect x="295" y="90"  width="14"  height="30" fill="#555" />
      <rect x="295" y="90"  width="14"  height="6"  fill="#777" />
      <rect x="158" y="130" width="8"   height="24" fill="#3a2810" />
      <rect x="158" y="150" width="30"  height="8"  fill="#3a2810" />
      <rect x="184" y="130" width="8"   height="24" fill="#3a2810" />
    </g>
  );
}

function PixelFlame({ color }: { color: string }) {
  return (
    <g>
      <rect x="140" y="120" width="60" height="80" fill="#8b5e3c" />
      <rect x="140" y="116" width="64" height="8"  fill="#7a5030" />
      <rect x="20"  y="80"  width="60"  height="80" fill="#555" />
      <rect x="20"  y="80"  width="60"  height="10" fill="#777" />
      <rect x="24"  y="94"  width="12"  height="20" fill="#444" />
      <rect x="44"  y="94"  width="12"  height="20" fill="#444" />
      <rect x="24"  y="120" width="52"  height="4"  fill="#444" />
      <rect x="78"  y="110" width="80"  height="12" fill="#555" />
      <rect x="78"  y="108" width="80"  height="4"  fill="#777" />
      <rect x="110" y="88"  width="100" height="52" fill={color} />
      <rect x="110" y="88"  width="100" height="8"  fill="#fff3" />
      <rect x="110" y="132" width="100" height="8"  fill="#0005" />
      <rect x="208" y="98"  width="90"  height="30" fill="#888" />
      <rect x="208" y="98"  width="90"  height="6"  fill="#aaa" />
      <rect x="288" y="94"  width="16"  height="38" fill="#666" />
      <rect x="302" y="82"  width="14"  height="24" fill="#ff8800" />
      <rect x="306" y="70"  width="10"  height="16" fill="#ffaa00" />
      <rect x="310" y="62"  width="6"   height="12" fill="#ffee00" />
      <rect x="304" y="104" width="12"  height="20" fill="#ff6600" />
      <rect x="300" y="120" width="10"  height="12" fill="#ff4400" />
      <rect x="158" y="140" width="8"   height="24" fill="#3a2810" />
      <rect x="158" y="160" width="30"  height="8"  fill="#3a2810" />
      <rect x="184" y="140" width="8"   height="24" fill="#3a2810" />
    </g>
  );
}

function PixelRailgun({ color }: { color: string }) {
  return (
    <g>
      <rect x="150" y="120" width="65" height="80" fill="#8b5e3c" />
      <rect x="150" y="116" width="69" height="8"  fill="#7a5030" />
      <rect x="30"  y="90"  width="50"  height="60" fill="#334" />
      <rect x="30"  y="90"  width="50"  height="8"  fill="#556" />
      <rect x="34"  y="102" width="12"  height="16" fill={color} />
      <rect x="52"  y="102" width="12"  height="16" fill={color} />
      <rect x="34"  y="102" width="12"  height="3"  fill="#fff6" />
      <rect x="52"  y="102" width="12"  height="3"  fill="#fff6" />
      <rect x="50"  y="80"  width="165" height="56" fill={color} />
      <rect x="50"  y="80"  width="165" height="8"  fill="#fff3" />
      <rect x="50"  y="128" width="165" height="8"  fill="#0005" />
      <rect x="60"  y="86"  width="145" height="6"  fill="#0004" />
      <rect x="60"  y="118" width="145" height="6"  fill="#0004" />
      <rect x="90"  y="72"  width="60"  height="16" fill="#556" />
      <rect x="118" y="68"  width="8"   height="8"  fill="#889" />
      <rect x="92"  y="74"  width="56"  height="10" fill="#334" />
      <rect x="116" y="74"  width="12"  height="10" fill="#88aaff" />
      <rect x="212" y="84"  width="100" height="48" fill="#445" />
      <rect x="212" y="84"  width="100" height="6"  fill="#778" />
      {[220,234,248,262,276,290,304].map(x => (
        <rect key={x} x={x} y="84" width="6" height="48" fill={color} opacity="0.7" />
      ))}
      <rect x="308" y="88"  width="10"  height="10" fill="#fff" />
      <rect x="308" y="118" width="10"  height="10" fill="#fff" />
      <rect x="306" y="96"  width="14"  height="24" fill="#a78bfa" />
      <rect x="166" y="136" width="8"   height="24" fill="#3a2810" />
      <rect x="166" y="156" width="30"  height="8"  fill="#3a2810" />
      <rect x="192" y="136" width="8"   height="24" fill="#3a2810" />
    </g>
  );
}

function PixelGrenadeLauncher({ color }: { color: string }) {
  return (
    <g>
      {/* Hand */}
      <rect x="155" y="120" width="65" height="80" fill="#8b5e3c" />
      <rect x="155" y="116" width="69" height="8"  fill="#7a5030" />
      {/* Stock */}
      <rect x="20"  y="96"  width="100" height="38" fill="#6a4020" />
      <rect x="20"  y="96"  width="100" height="6"  fill="#8a5828" />
      <rect x="40"  y="98"  width="2"   height="34" fill="#5a3018" />
      <rect x="70"  y="98"  width="2"   height="34" fill="#5a3018" />
      {/* Body */}
      <rect x="90"  y="82"  width="130" height="54" fill={color} />
      <rect x="90"  y="82"  width="130" height="8"  fill="#fff3" />
      <rect x="90"  y="128" width="130" height="8"  fill="#0005" />
      {/* Tube barrel — big bore */}
      <rect x="218" y="78"  width="96"  height="62" fill="#555" />
      <rect x="218" y="78"  width="96"  height="8"  fill="#777" />
      <rect x="218" y="128" width="96"  height="10" fill="#333" />
      {/* Bore hole */}
      <rect x="290" y="84"  width="20"  height="48" fill="#222" />
      {/* Grenade loaded */}
      <rect x="272" y="94"  width="18"  height="28" fill="#80ff40" />
      <rect x="272" y="94"  width="18"  height="5"  fill="#a0ff60" />
      {/* Rail mount */}
      <rect x="100" y="76"  width="80"  height="10" fill="#666" />
      <rect x="100" y="72"  width="8"   height="12" fill="#888" />
      <rect x="160" y="72"  width="8"   height="12" fill="#888" />
      {/* Trigger */}
      <rect x="170" y="136" width="8"   height="28" fill="#3a2810" />
      <rect x="170" y="162" width="38"  height="8"  fill="#3a2810" />
      <rect x="204" y="136" width="8"   height="28" fill="#3a2810" />
    </g>
  );
}

function PixelMinigun({ color }: { color: string }) {
  return (
    <g>
      {/* Hand */}
      <rect x="135" y="115" width="70" height="85" fill="#8b5e3c" />
      <rect x="135" y="111" width="74" height="8"  fill="#7a5030" />
      {/* Grip ammo box */}
      <rect x="155" y="140" width="38" height="58" fill="#444" />
      <rect x="155" y="140" width="38" height="6"  fill="#666" />
      <rect x="158" y="150" width="6"  height="40" fill="#333" />
      {/* Main body - rotating barrel housing */}
      <rect x="40"  y="82"  width="200" height="50" fill={color} />
      <rect x="40"  y="82"  width="200" height="8"  fill="#fff3" />
      <rect x="40"  y="124" width="200" height="8"  fill="#0004" />
      {/* 6 rotating barrels */}
      {[0,1,2,3,4,5].map(i => {
        const angle = (i / 6) * Math.PI * 2;
        const cy = 107 + Math.sin(angle) * 16;
        return <rect key={i} x="235" y={cy - 3} width="80" height="6" fill="#666" />;
      })}
      {/* Center spindle */}
      <rect x="232" y="90"  width="14"  height="34" fill="#333" />
      {/* Front ring */}
      <rect x="308" y="78"  width="10"  height="58" fill="#888" />
      <rect x="306" y="80"  width="14"  height="8"  fill="#aaa" />
      {/* Motor */}
      <rect x="50"  y="86"  width="60"  height="42" fill="#444" />
      <rect x="60"  y="90"  width="16"  height="10" fill={color} />
      <rect x="82"  y="90"  width="16"  height="10" fill={color} />
      <rect x="60"  y="106" width="16"  height="10" fill={color} />
      <rect x="82"  y="106" width="16"  height="10" fill={color} />
      {/* Trigger */}
      <rect x="155" y="132" width="8"   height="22" fill="#3a2810" />
      <rect x="155" y="150" width="36"  height="8"  fill="#3a2810" />
      <rect x="187" y="132" width="8"   height="22" fill="#3a2810" />
    </g>
  );
}

function PixelCrossbow({ color }: { color: string }) {
  return (
    <g>
      {/* Hand */}
      <rect x="155" y="115" width="65" height="85" fill="#8b5e3c" />
      <rect x="155" y="111" width="69" height="8"  fill="#7a5030" />
      {/* Bow limbs */}
      <rect x="240" y="42"  width="10"  height="70" fill="#8b6030" />
      <rect x="240" y="102" width="10"  height="70" fill="#8b6030" />
      <rect x="240" y="42"  width="10"  height="6"  fill="#a07840" />
      <rect x="240" y="166" width="10"  height="6"  fill="#a07840" />
      {/* Bowstring */}
      <rect x="248" y="44"  width="3"   height="126" fill="#ddc888" />
      {/* Rail / tiller */}
      <rect x="30"  y="94"  width="220" height="26" fill={color} />
      <rect x="30"  y="94"  width="220" height="6"  fill="#fff3" />
      <rect x="30"  y="112" width="220" height="8"  fill="#0005" />
      {/* Groove */}
      <rect x="40"  y="100" width="180" height="8"  fill="#0003" />
      {/* Bolt loaded */}
      <rect x="50"  y="102" width="180" height="4"  fill={color} />
      <rect x="44"  y="100" width="14"  height="8"  fill="#888" />
      {/* Stirrup */}
      <rect x="220" y="80"  width="22"  height="54" fill="#555" />
      <rect x="220" y="80"  width="22"  height="6"  fill="#777" />
      {/* Trigger + nut */}
      <rect x="170" y="120" width="18"  height="16" fill="#444" />
      <rect x="170" y="136" width="8"   height="26" fill="#3a2810" />
      <rect x="170" y="158" width="36"  height="8"  fill="#3a2810" />
      <rect x="202" y="136" width="8"   height="26" fill="#3a2810" />
      {/* Scope */}
      <rect x="80"  y="82"  width="60"  height="16" fill="#445" />
      <rect x="108" y="78"  width="8"   height="8"  fill="#667" />
      <rect x="84"  y="84"  width="52"  height="10" fill="#223" />
      <rect x="106" y="84"  width="12"  height="10" fill="#a0c0ff" />
    </g>
  );
}

function PixelShotcircle({ color }: { color: string }) {
  return (
    <g>
      {/* Hand */}
      <rect x="145" y="110" width="75" height="90" fill="#8b5e3c" />
      <rect x="145" y="106" width="79" height="8"  fill="#7a5030" />
      {/* Grip */}
      <rect x="165" y="128" width="36" height="70" fill="#5a2080" />
      {/* Body — wide circular emitter */}
      <rect x="50"  y="76"  width="220" height="60" fill={color} />
      <rect x="50"  y="76"  width="220" height="8"  fill="#fff3" />
      <rect x="50"  y="128" width="220" height="8"  fill="#0005" />
      {/* Ring chamber — multiple barrels around center */}
      {[0,1,2,3,4,5,6,7].map(i => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const cx = 170 + Math.cos(a) * 20;
        const cy = 106 + Math.sin(a) * 18;
        return <rect key={i} x={cx - 3} y={cy - 3} width="6" height="6" fill="#222" />;
      })}
      {/* Center glowing core */}
      <rect x="160" y="96"  width="20"  height="22" fill="#fff" />
      <rect x="162" y="98"  width="16"  height="18" fill={color} />
      {/* Ring emitter barrel */}
      <rect x="268" y="84"  width="46"  height="46" fill="#666" />
      <rect x="268" y="84"  width="46"  height="6"  fill="#888" />
      <rect x="286" y="80"  width="10"  height="54" fill="#444" />
      {/* Muzzle glow */}
      <rect x="306" y="88"  width="10"  height="38" fill="#fff9" />
      <rect x="304" y="90"  width="14"  height="8"  fill={color} />
      <rect x="304" y="116" width="14"  height="8"  fill={color} />
      {/* Trigger */}
      <rect x="163" y="136" width="8"   height="28" fill="#3a2810" />
      <rect x="163" y="162" width="38"  height="8"  fill="#3a2810" />
      <rect x="197" y="136" width="8"   height="28" fill="#3a2810" />
    </g>
  );
}
