// Beeps, haptics, speech and screen wake lock for the workout and fasting screens.
let audio = null, wake = null;
export let soundOn = true;
export const setSound = v => { soundOn = v; };

export function unlockAudio() {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { audio = null; }
}
export function beep(freq, dur, times = 1) {
  if (!audio || !soundOn) return;
  for (let i = 0; i < times; i++) {
    const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + i * (dur + 0.08);
    o.frequency.value = freq; o.type = "sine"; g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
}
export function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* not supported */ } }

let voiceOn = true;
export const setVoice = v => { voiceOn = v; };
export function unlockSpeech() {
  // iOS only speaks after a first utterance made inside a tap
  if (!window.speechSynthesis) return;
  try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); } catch (e) { /* ignore */ }
}
export function say(text) {
  if (!voiceOn || !window.speechSynthesis) return;
  try { const u = new SpeechSynthesisUtterance(text); u.rate = 1.02; window.speechSynthesis.speak(u); } catch (e) { /* ignore */ }
}
export function hush() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }

export async function keepAwake() { try { wake = await navigator.wakeLock.request("screen"); } catch (e) { wake = null; } }
export function releaseAwake() { try { wake && wake.release(); } catch (e) { /* ignore */ } wake = null; }
