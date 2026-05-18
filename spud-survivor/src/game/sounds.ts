let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function masterGain(): GainNode {
  const g = getCtx().createGain();
  g.gain.value = 0.18;
  g.connect(getCtx().destination);
  return g;
}

function noise(duration: number, out: AudioNode) {
  const ac = getCtx();
  const bufSize = Math.ceil(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(out);
  src.start();
  return src;
}

function osc(type: OscillatorType, freq: number, duration: number, out: AudioNode) {
  const ac = getCtx();
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(out);
  o.start();
  o.stop(ac.currentTime + duration);
  return o;
}

export function playShoot() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.14;
    const filt = ac.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 900;
    filt.Q.value = 1.2;
    filt.connect(master);

    const env = ac.createGain();
    env.gain.setValueAtTime(1, ac.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.09);
    env.connect(filt);

    noise(0.09, env);

    const tone = ac.createOscillator();
    tone.type = "square";
    tone.frequency.setValueAtTime(520, ac.currentTime);
    tone.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.07);
    const toneEnv = ac.createGain();
    toneEnv.gain.setValueAtTime(0.5, ac.currentTime);
    toneEnv.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
    tone.connect(toneEnv);
    toneEnv.connect(master);
    tone.start();
    tone.stop(ac.currentTime + 0.07);
  } catch { /* safari quirks */ }
}

export function playHit() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.13;

    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 600;
    filt.connect(master);

    const env = ac.createGain();
    env.gain.setValueAtTime(1, ac.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
    env.connect(filt);

    noise(0.06, env);
  } catch { /**/ }
}

export function playEnemyDie() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.15;

    const env = ac.createGain();
    env.gain.setValueAtTime(1, ac.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    env.connect(master);

    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(800, ac.currentTime);
    filt.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.22);
    filt.connect(env);

    noise(0.22, filt);

    const t = ac.createOscillator();
    t.type = "sawtooth";
    t.frequency.setValueAtTime(300, ac.currentTime);
    t.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.18);
    const te = ac.createGain();
    te.gain.setValueAtTime(0.6, ac.currentTime);
    te.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    t.connect(te);
    te.connect(master);
    t.start();
    t.stop(ac.currentTime + 0.18);
  } catch { /**/ }
}

export function playPlayerHurt() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.22;

    const env = ac.createGain();
    env.gain.setValueAtTime(1, ac.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    env.connect(master);

    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 300;
    filt.connect(env);

    noise(0.3, filt);

    const t = ac.createOscillator();
    t.type = "sawtooth";
    t.frequency.setValueAtTime(120, ac.currentTime);
    t.frequency.exponentialRampToValueAtTime(55, ac.currentTime + 0.25);
    const te = ac.createGain();
    te.gain.setValueAtTime(0.7, ac.currentTime);
    te.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    t.connect(te);
    te.connect(master);
    t.start();
    t.stop(ac.currentTime + 0.25);
  } catch { /**/ }
}

export function playPickup() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.11;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const delay = i * 0.055;
      const o = ac.createOscillator();
      o.type = "square";
      o.frequency.value = freq;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, ac.currentTime + delay);
      g.gain.linearRampToValueAtTime(1, ac.currentTime + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.12);
      o.connect(g);
      g.connect(master);
      o.start(ac.currentTime + delay);
      o.stop(ac.currentTime + delay + 0.12);
    });
  } catch { /**/ }
}

export function playLevelUp() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.13;
    const notes = [392, 523, 659, 784, 1047, 1175];
    notes.forEach((freq, i) => {
      const delay = i * 0.07;
      const o = ac.createOscillator();
      o.type = "square";
      o.frequency.value = freq;
      const g = ac.createGain();
      g.gain.setValueAtTime(0, ac.currentTime + delay);
      g.gain.linearRampToValueAtTime(0.9, ac.currentTime + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.18);
      o.connect(g);
      g.connect(master);
      o.start(ac.currentTime + delay);
      o.stop(ac.currentTime + delay + 0.18);
    });
  } catch { /**/ }
}

export function playWaveClear() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.13;
    const chord = [523, 659, 784];
    chord.forEach((freq) => {
      const o = ac.createOscillator();
      o.type = "square";
      o.frequency.value = freq;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.8, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ac.currentTime + 0.5);
    });
  } catch { /**/ }
}

export function playDash() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.1;

    const env = ac.createGain();
    env.gain.setValueAtTime(1, ac.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    env.connect(master);

    const filt = ac.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.setValueAtTime(400, ac.currentTime);
    filt.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.1);
    filt.Q.value = 2;
    filt.connect(env);

    noise(0.12, filt);
  } catch { /**/ }
}

export function playExplosion() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.22;

    // Low boom
    const boomEnv = ac.createGain();
    boomEnv.gain.setValueAtTime(1, ac.currentTime);
    boomEnv.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
    boomEnv.connect(master);
    const boomFilt = ac.createBiquadFilter();
    boomFilt.type = "lowpass";
    boomFilt.frequency.setValueAtTime(300, ac.currentTime);
    boomFilt.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.5);
    boomFilt.connect(boomEnv);
    noise(0.55, boomFilt);

    // Crack transient
    const crackEnv = ac.createGain();
    crackEnv.gain.setValueAtTime(0.8, ac.currentTime);
    crackEnv.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
    crackEnv.connect(master);
    const crackFilt = ac.createBiquadFilter();
    crackFilt.type = "bandpass";
    crackFilt.frequency.value = 1800;
    crackFilt.Q.value = 0.8;
    crackFilt.connect(crackEnv);
    noise(0.12, crackFilt);
  } catch { /**/ }
}

export function playXpCollect() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.09;
    const notes = [880, 1100];
    notes.forEach((freq, i) => {
      const delay = i * 0.04;
      const o = ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, ac.currentTime + delay);
      o.frequency.exponentialRampToValueAtTime(freq * 1.5, ac.currentTime + delay + 0.06);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.8, ac.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.1);
      o.connect(g); g.connect(master);
      o.start(ac.currentTime + delay);
      o.stop(ac.currentTime + delay + 0.1);
    });
  } catch { /**/ }
}

export function playBossHit() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.2;

    const env = ac.createGain();
    env.gain.setValueAtTime(1, ac.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    env.connect(master);

    const filt = ac.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(1200, ac.currentTime);
    filt.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.15);
    filt.connect(env);
    noise(0.18, filt);

    const t = ac.createOscillator();
    t.type = "sawtooth";
    t.frequency.setValueAtTime(180, ac.currentTime);
    t.frequency.exponentialRampToValueAtTime(55, ac.currentTime + 0.14);
    const te = ac.createGain();
    te.gain.setValueAtTime(0.8, ac.currentTime);
    te.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14);
    t.connect(te); te.connect(master);
    t.start(); t.stop(ac.currentTime + 0.14);
  } catch { /**/ }
}

export function playCharge() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.16;

    const env = ac.createGain();
    env.gain.setValueAtTime(0.3, ac.currentTime);
    env.gain.linearRampToValueAtTime(1, ac.currentTime + 0.12);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
    env.connect(master);

    const filt = ac.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.setValueAtTime(200, ac.currentTime);
    filt.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.25);
    filt.Q.value = 1.5;
    filt.connect(env);
    noise(0.35, filt);
  } catch { /**/ }
}

export function playMenuClick() {
  try {
    const ac = getCtx();
    const master = masterGain();
    master.gain.value = 0.1;
    osc("square", 440, 0.06, master);
    const g = ac.createGain();
    g.gain.setValueAtTime(1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
    g.connect(master);
  } catch { /**/ }
}
