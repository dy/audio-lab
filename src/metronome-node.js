
// https://glitch.com/edit/#!/metronomes?path=metronome.js
/*
 * Base metronome, with no timing.
 * More like a "beep on command" class.
 */
export default class MetronomeNode {
  constructor(o) {
    this.tempo = o.tempo || 60;
    this.playing = false;

    this.audioCtx = null;
    this.tick = null;
    this.tickVolume = null;
    this.frequency = 1080;
  }

  initAudio() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.tick = this.audioCtx.createOscillator();
    this.tickVolume = this.audioCtx.createGain();

    this.tick.type = 'sine';
    this.tick.frequency.value = this.frequency;
    this.tickVolume.gain.value = 0;

    this.tick.connect(this.tickVolume);
    this.tickVolume.connect(this.audioCtx.destination);
    this.tick.start(0);  // No offset, start immediately.
  }

  beepAtTime(time) {
    // Silence the beep.
    this.tickVolume.gain.cancelScheduledValues(time);
    this.tickVolume.gain.setValueAtTime(0, time);

    // Audible beep sound.
    this.tickVolume.gain.linearRampToValueAtTime(1, time + .001);
    this.tickVolume.gain.linearRampToValueAtTime(0, time + .001 + .01);
  }

  start() {
    this.initAudio();

    this.playing = true;
    const timeoutDuration = (60 / this.tempo);

    let now = this.audioCtx.currentTime;

    // Schedule all the beeps ahead.
    for (let i = 0; i < 100; i++) {
      this.beepAtTime(now);
      now += timeoutDuration;
    }
  }

  stop() {
    this.playing = false;
    this.tickVolume.gain.value = 0;
    this.tickVolume.gain.cancelScheduledValues(this.audioCtx.currentTime);
  }
}
