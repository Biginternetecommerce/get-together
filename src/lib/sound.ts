// Tiny WebAudio ambience + chime. Only starts after a user gesture; mute is respected everywhere.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let started = false;
let muted = false;

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function startAmbient() {
  const c = ensure();
  if (!c || !master || started) return;
  started = true;
  // soft evolving pad: three sines through a slow LFO
  [220, 277.18, 329.63].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.value = 0.018;
    lfo.frequency.value = 0.07 + i * 0.03; lg.gain.value = 0.012;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(master!);
    o.start(); lfo.start();
  });
}

export function chime(freqs = [880, 1108.7, 1318.5]) {
  const c = ensure();
  if (!c || !master || muted) return;
  freqs.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.12;
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g); g.connect(master!); o.start(t); o.stop(t + 1.5);
  });
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
}
export const isMuted = () => muted;
