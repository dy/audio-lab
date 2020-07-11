// refs:
// https://glitch.com/edit/#!/metronomes?path=metronome.js
// audio-context-timers

const ctx = new (window.AudioContext || window.webkitAudioContext)();

const tickBuffer = new AudioBuffer({ length: 2, sampleRate: ctx.sampleRate });
const tickDuration = 2 / ctx.sampleRate;


export default class MetronomeNode {
  constructor(o) {
    this.tempo = o.tempo || 60;
    this.playing = false;

    this.tickSource = ctx.createOscillator();
    this.tickVolume = ctx.createGain();
    this.tickSource.type = 'sine';
    this.tickSource.frequency.value = 1080;
    this.tickVolume.gain.value = 0;

    this.tickSource.connect(this.tickVolume);
    this.tickVolume.connect(ctx.destination);
    this.tickSource.start(0);
  }

  beep() {
    let time = ctx.currentTime
    this.tickVolume.gain.cancelScheduledValues(time)
    this.tickVolume.gain.value = 1
    this.tickVolume.gain.setValueAtTime(0, time + 0.001)
  }

  start() {
    this.playing = true
    this.beep()
    this.scheduleBeep()
  }

  scheduleBeep() {
    const tickTimer = new AudioBufferSourceNode(ctx, { buffer: tickBuffer })
    tickTimer.onended = () => {
      if (this.playing) this.beep(), this.scheduleBeep()
    }
    tickTimer.connect(ctx.destination)
    tickTimer.start(ctx.currentTime + (60 / this.tempo) - tickDuration)
  }

  stop() {
    this.playing = false;
    this.tickVolume.gain.value = 0;
    this.tickVolume.gain.cancelScheduledValues(ctx.currentTime);
  }
}
