/**
 * Procedural sound engine using Web Audio API.
 * All sounds are synthesized — no audio files needed.
 * Inspired by Hearthstone's "subjective sound design":
 * every sound reflects emotional impact, not physical reality.
 */

type SoundId =
  | "card_select"
  | "card_deselect"
  | "card_play"
  | "card_flip"
  | "round_win"
  | "round_lose"
  | "round_tie"
  | "round_block"
  | "point_pop"
  | "match_found"
  | "match_win"
  | "match_lose"
  | "timer_tick"
  | "timer_urgent"
  | "rainbow_clash"
  | "ui_click";

let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;

function ctx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    _master = _ctx.createGain();
    _master.gain.value = 0.65;
    _master.connect(_ctx.destination);
  }
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function master(): GainNode {
  ctx();
  return _master!;
}

/** Play a tonal oscillator with quick attack + exponential release */
function tone(
  freq: number,
  dur: number,
  opts: {
    type?: OscillatorType;
    vol?: number;
    freqEnd?: number;
    delay?: number;
  } = {}
) {
  const c = ctx();
  const { type = "sine", vol = 0.35, freqEnd, delay = 0 } = opts;
  const t = c.currentTime + delay;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(master());

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.start(t);
  osc.stop(t + dur + 0.01);
}

/** Play filtered white noise burst */
function noise(
  dur: number,
  opts: {
    filterFreq?: number;
    filterType?: BiquadFilterType;
    vol?: number;
    delay?: number;
  } = {}
) {
  const c = ctx();
  const { filterFreq = 800, filterType = "lowpass", vol = 0.3, delay = 0 } = opts;
  const t = c.currentTime + delay;

  const samples = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(1, samples, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / samples);
  }

  const src = c.createBufferSource();
  src.buffer = buf;

  const filt = c.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.value = filterFreq;

  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filt);
  filt.connect(gain);
  gain.connect(master());
  src.start(t);
}

// ─────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────

export const SoundEngine = {
  /** Must be called on first user gesture to unlock AudioContext */
  unlock() {
    try { ctx(); } catch (_) { /* ignore */ }
  },

  play(id: SoundId) {
    try {
      switch (id) {

        // ── UI ──────────────────────────────────────
        case "ui_click":
          tone(700, 0.055, { type: "square", vol: 0.1 });
          break;

        // ── Hand interactions ────────────────────────
        case "card_select":
          // Quick ascending "thwip" — card lifts from hand
          noise(0.07, { filterFreq: 2500, filterType: "bandpass", vol: 0.18 });
          tone(900, 0.07, { type: "square", vol: 0.14, freqEnd: 1300 });
          break;

        case "card_deselect":
          tone(1100, 0.06, { type: "square", vol: 0.1, freqEnd: 700 });
          break;

        // ── Card played to arena ─────────────────────
        case "card_play":
          // Physical "thud" of card hitting the table (Hearthstone-style)
          noise(0.2, { filterFreq: 160, filterType: "lowpass", vol: 0.55 });
          tone(110, 0.18, { type: "sine", vol: 0.4 });
          // Short high "tick" for crispness
          tone(800, 0.04, { type: "square", vol: 0.1, delay: 0.01 });
          break;

        // ── Card flip reveal ─────────────────────────
        case "card_flip":
          // Paper whoosh + snap — like physically flipping a card on a table
          noise(0.1, { filterFreq: 4000, filterType: "bandpass", vol: 0.22 });
          tone(350, 0.09, { type: "sine", vol: 0.18, freqEnd: 180 });
          noise(0.05, { filterFreq: 800, vol: 0.15, delay: 0.08 });
          break;

        // ── Round results ────────────────────────────
        case "round_win":
          // Ascending major arpeggio: C → E → G (joyful, immediate)
          tone(523, 0.18, { vol: 0.28 });
          tone(659, 0.18, { vol: 0.28, delay: 0.1 });
          tone(784, 0.32, { vol: 0.35, delay: 0.2 });
          // Shimmer on top
          tone(1568, 0.25, { vol: 0.12, delay: 0.2 });
          break;

        case "round_lose":
          // Descending minor: G → Eb — resigned but not crushing
          tone(392, 0.18, { vol: 0.25 });
          tone(311, 0.38, { vol: 0.28, delay: 0.14 });
          break;

        case "round_tie":
          // Neutral "thunk" — flat, neither up nor down
          noise(0.14, { filterFreq: 280, vol: 0.28 });
          tone(220, 0.22, { vol: 0.2 });
          break;

        case "round_block":
          // "Clunk" — impact that goes nowhere
          noise(0.18, { filterFreq: 200, vol: 0.4 });
          tone(150, 0.25, { type: "square", vol: 0.2 });
          tone(300, 0.12, { vol: 0.15, delay: 0.05, freqEnd: 100 });
          break;

        // ── Score pip fill ───────────────────────────
        case "point_pop":
          // Satisfying "pop" — small reward dopamine hit
          tone(880, 0.08, { vol: 0.38, freqEnd: 1100 });
          tone(1100, 0.12, { vol: 0.22, delay: 0.04 });
          break;

        // ── Match flow ───────────────────────────────
        case "match_found":
          // Deep cosmic impact — signals something important is happening
          noise(0.35, { filterFreq: 90, filterType: "lowpass", vol: 0.65 });
          tone(140, 0.55, { vol: 0.45 });
          tone(1400, 0.28, { vol: 0.18, delay: 0.08 });
          tone(2100, 0.22, { vol: 0.12, delay: 0.18 });
          tone(2800, 0.18, { vol: 0.08, delay: 0.28 });
          break;

        case "match_win":
          // Full victory fanfare — earned, triumphant
          tone(523, 0.14, { vol: 0.38 });
          tone(659, 0.14, { vol: 0.38, delay: 0.1 });
          tone(784, 0.14, { vol: 0.38, delay: 0.2 });
          tone(1047, 0.55, { vol: 0.5, delay: 0.32 });
          // Harmony shimmer
          tone(1568, 0.5, { vol: 0.2, delay: 0.32 });
          noise(0.4, { filterFreq: 3000, filterType: "highpass", vol: 0.12, delay: 0.3 });
          break;

        case "match_lose":
          // Measured defeat — not punishing, just final
          tone(523, 0.18, { vol: 0.28 });
          tone(466, 0.18, { vol: 0.28, delay: 0.14 });
          tone(370, 0.55, { vol: 0.35, delay: 0.3 });
          break;

        // ── Timer pressure ───────────────────────────
        case "timer_tick":
          // Subtle mechanical click — clock ticking
          tone(1100, 0.035, { type: "square", vol: 0.1 });
          break;

        case "timer_urgent":
          // Heartbeat double-thump — biological urgency
          noise(0.07, { filterFreq: 120, vol: 0.4 });
          tone(75, 0.07, { vol: 0.38 });
          noise(0.06, { filterFreq: 100, vol: 0.28, delay: 0.1 });
          tone(70, 0.06, { vol: 0.28, delay: 0.1 });
          break;

        // ── Rainbow duel ─────────────────────────────
        case "rainbow_clash":
          // Ascending sparkle arpeggio — magical, special
          [1200, 1500, 1800, 2100, 2400, 1800, 2700].forEach((f, i) => {
            tone(f, 0.18, { vol: 0.14, delay: i * 0.07 });
          });
          noise(0.5, { filterFreq: 5000, filterType: "highpass", vol: 0.1 });
          break;
      }
    } catch (_) {
      // Audio is enhancement-only — never break the game
    }
  },

  setVolume(v: number) {
    if (_master) _master.gain.value = Math.max(0, Math.min(1, v));
  },
};
