export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.isMuted = false;
    this.started = false;
  }

  start() {
    if (this.started) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 55;
    this.engineGain.gain.value = 0.04;

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();

    this.started = true;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.engineGain) {
      this.engineGain.gain.value = this.isMuted ? 0 : 0.04;
    }
  }

  update(player, inMenu = false) {
    if (!this.started || !this.ctx || !this.engineOsc) return;

    if (this.isMuted || inMenu) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      return;
    }

    const baseFreq = 52 + player.rpmRatio * 145 + (player.gear - 1) * 14;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.04);

    const targetVol = player.speed > 0 || player.isAccelerating ? 0.065 : 0.025;
    this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
  }

  // Bipes das luzes vermelhas (false) e tom agudo de largada (true)
  playStartBeep(isGo = false) {
    if (!this.started || !this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, this.ctx.currentTime);

    const duration = isGo ? 0.45 : 0.16;
    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.02);
  }

  // Som de chave pneumática no Pit Stop
  playPitDrill() {
    if (!this.started || !this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320 + i * 40, now + i * 0.28);
      osc.frequency.linearRampToValueAtTime(520, now + i * 0.28 + 0.16);

      gain.gain.setValueAtTime(0.12, now + i * 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.28 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.28);
      osc.stop(now + i * 0.28 + 0.2);
    }
  }

  // Baque de colisão
  playCrash() {
    if (!this.started || !this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.24);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Fanfarra 16-bits na linha de chegada
  playVictoryFanfare() {
    if (!this.started || !this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    const times = [0, 0.14, 0.28, 0.42, 0.62, 0.78];
    const durs  = [0.12, 0.12, 0.12, 0.18, 0.14, 0.45];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + times[idx]);

      gain.gain.setValueAtTime(0.14, now + times[idx]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + times[idx] + durs[idx]);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + times[idx]);
      osc.stop(now + times[idx] + durs[idx] + 0.02);
    });
  }
}