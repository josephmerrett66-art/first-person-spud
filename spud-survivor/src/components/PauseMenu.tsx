const PIXEL = "'Press Start 2P', monospace";

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export default function PauseMenu({ onResume, onRestart, onMenu }: Props) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.80)", zIndex: 40, backdropFilter: "blur(2px)" }}
    >
      <div style={{
        background: "rgba(10,6,2,0.97)",
        border: "3px solid #7c4e14",
        padding: "36px 48px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        minWidth: 260,
      }}>
        <h2 style={{ fontFamily: PIXEL, fontSize: 20, color: "#f0c050", letterSpacing: "0.1em", margin: 0 }}>
          PAUSED
        </h2>
        <div style={{ width: "100%", height: 2, background: "#7c4e1440" }} />
        <button
          onClick={onResume}
          style={{
            fontFamily: PIXEL, fontSize: 11, color: "#f0c050",
            background: "rgba(60,35,5,0.9)", border: "2px solid #7c4e14",
            padding: "10px 28px", cursor: "pointer", width: "100%",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(100,60,10,0.95)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(60,35,5,0.9)")}
        >
          ▶ RESUME
        </button>
        <button
          onClick={onRestart}
          style={{
            fontFamily: PIXEL, fontSize: 10, color: "#e08040",
            background: "rgba(20,12,4,0.9)", border: "2px solid #5a3810",
            padding: "10px 28px", cursor: "pointer", width: "100%",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(50,28,8,0.95)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(20,12,4,0.9)")}
        >
          ↺ RESTART
        </button>
        <button
          onClick={onMenu}
          style={{
            fontFamily: PIXEL, fontSize: 10, color: "#c09060",
            background: "rgba(20,12,4,0.9)", border: "2px solid #5a3810",
            padding: "10px 28px", cursor: "pointer", width: "100%",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(50,28,8,0.95)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(20,12,4,0.9)")}
        >
          QUIT TO MENU
        </button>
        <p style={{ fontFamily: PIXEL, fontSize: 6, color: "rgba(180,120,40,0.4)", margin: 0 }}>
          ESC to resume
        </p>
      </div>
    </div>
  );
}
