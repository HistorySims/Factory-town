import { COLORS } from '../core/Constants.js';
import { lerp, clamp } from './MathUtils.js';

export function riverColor(pollution) {
  const p = clamp(pollution, 0, 1);
  const r = Math.round(lerp(0x3a, 0x6b, p));
  const g = Math.round(lerp(0x6f, 0x5a, p));
  const b = Math.round(lerp(0xb5, 0x30, p));
  return `rgb(${r},${g},${b})`;
}

export function workerColor(mood) {
  // mood: 0 = angry, 0.5 = neutral, 1 = happy
  const m = clamp(mood, 0, 1);
  if (m > 0.5) {
    const t = (m - 0.5) * 2;
    const r = Math.round(lerp(0xc8, 0x60, t));
    const g = Math.round(lerp(0xb0, 0xb8, t));
    const b = Math.round(lerp(0x40, 0x48, t));
    return `rgb(${r},${g},${b})`;
  } else {
    const t = m * 2;
    const r = Math.round(lerp(0xc8, 0xc8, t));
    const g = Math.round(lerp(0x40, 0xb0, t));
    const b = Math.round(lerp(0x40, 0x40, t));
    return `rgb(${r},${g},${b})`;
  }
}

export function pollutionOverlay(pollution) {
  const a = clamp(pollution * 0.4, 0, 0.4);
  return `rgba(80, 65, 30, ${a})`;
}

export function smokeColor(age) {
  const a = clamp(1 - age, 0, 0.3);
  return `rgba(60, 55, 50, ${a})`;
}
