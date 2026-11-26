export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.offroadGain = null;
    this.isStarted = false;
    this.isMuted = false;
  }

  // Navegadores exigem uma ação do usuário (tecla ou clique) para liberar o áudio
  start() {
    if (this.isStarted) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // --- 1. CANAL DO MOTOR (Onda Dente-de-Serra estilo 16-bit) ---
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 45; // Marcha lenta (Hz)

    // Filtro passa-baixa para tirar o agudo estridente e dar corpo ao ronco
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 220;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.14;

    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();

    // --- 2. CANAL DE TERRA/GRAMA (Ruído Branco para quando sai da pista) ---
    this.setupOffroadNoise();

    this.isStarted = true;
  }

  setupOffroadNoise() {
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 650;

    this.offroadGain = this.ctx.createGain();
    this.offroadGain.gain.value = 0; // Começa mudo

    noise.connect(filter);
    filter.connect(this.offroadGain);
    this.offroadGain.connect(this.ctx.destination);
    noise.start();
  }

  // Atualiza frequência e volume a cada frame
  update(player) {
    if (!this.isStarted || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Frequência sobe de 45Hz (parado) até 210Hz (giro máximo da marcha)
    const targetFreq = 45 + (player.rpmRatio * 165);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.04);

    // Abre o filtro quando acelera para o som ficar mais encorpado
    const targetFilter = player.isAccelerating
      ? 240 + (player.rpmRatio * 480)
      : 160;
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.05);

    // Ativa som de derrapagem na grama se sair da pista em movimento
    const isOffroad = Math.abs(player.x) > 1.05 && player.speed > 500;
    const targetOffroadVol = isOffroad ? 0.12 : 0;
    this.offroadGain.gain.setTargetAtTime(targetOffroadVol, now, 0.05);
  }

  // Alterna mudo (útil para ligar na tecla M)
  toggleMute() {
    if (!this.isStarted) return;
    this.isMuted = !this.isMuted;
    this.engineGain.gain.value = this.isMuted ? 0 : 0.14;
    if (this.isMuted) this.offroadGain.gain.value = 0;
  }

  playCrash() {
  if (!this.ctx || this.isMuted) return;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, this.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.22);

  gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

  osc.connect(gain);
  gain.connect(this.ctx.destination);
  osc.start();
  osc.stop(this.ctx.currentTime + 0.23);
}
}