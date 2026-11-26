import { CONFIG } from './config.js';

export class Background {
  constructor() {
    this.width = CONFIG.WIDTH;
    this.height = CONFIG.HEIGHT;
    this.skyOffset = 0;
    this.farMountainOffset = 0;
    this.nearMountainOffset = 0;

    // Pré-renderiza as duas camadas de montanhas para rodar a 60 FPS sem pesar
    this.farMountains = this.createMountainLayer('#3a407a', 0.48, 95, 1.0);
    this.nearMountains = this.createMountainLayer('#22264c', 0.52, 70, 1.4);
  }

  // Cria uma silhueta de montanhas com loop perfeito (início e fim na mesma altura)
  createMountainLayer(color, horizonRatio, maxPeak, frequency) {
    const offscreen = document.createElement('canvas');
    offscreen.width = this.width;
    offscreen.height = this.height;
    const octx = offscreen.getContext('2d');

    const horizonY = Math.floor(this.height * horizonRatio);
    const step = 16; // Blocos de 16px para dar degraus estilo 16-bit

    octx.fillStyle = color;
    octx.beginPath();
    octx.moveTo(0, this.height);

    for (let x = 0; x <= this.width; x += step) {
      const angle = (x / this.width) * Math.PI * 2 * frequency;
      // Combina duas ondas senoidais para picos irregulares naturais
      const wave = Math.sin(angle) * 0.65 + Math.sin(angle * 2.3 + 1.2) * 0.35;
      const peakHeight = Math.abs(wave) * maxPeak;
      const y = Math.round((horizonY - peakHeight) / 4) * 4;

      octx.lineTo(x, y);
    }

    octx.lineTo(this.width, this.height);
    octx.closePath();
    octx.fill();

    return offscreen;
  }

  // Atualiza deslocamento horizontal baseado na curva atual e velocidade
  update(dt, track, player) {
    const currentSegment = track.findSegment(player.position);
    const speedRatio = player.speed / CONFIG.MAX_SPEED;
    const turnDelta = currentSegment.curve * speedRatio * dt;

    // Nuvens têm brisa própria (+8 px/s) + reação suave às curvas
    this.skyOffset = (this.skyOffset + 8 * dt + turnDelta * 20) % this.width;
    this.farMountainOffset = (this.farMountainOffset + turnDelta * 45) % this.width;
    this.nearMountainOffset = (this.nearMountainOffset + turnDelta * 85) % this.width;

    // Mantém valores positivos para funcionar em curvas à esquerda e à direita
    if (this.skyOffset < 0) this.skyOffset += this.width;
    if (this.farMountainOffset < 0) this.farMountainOffset += this.width;
    if (this.nearMountainOffset < 0) this.nearMountainOffset += this.width;
  }

  render(ctx) {
    // 1. Céu em degradê (estilo entardecer Top Gear)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
    skyGrad.addColorStop(0, '#18225c');
    skyGrad.addColorStop(0.55, '#4c6ec9');
    skyGrad.addColorStop(1, '#f4a261');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Nuvens em loop
    const skyX = -Math.floor(this.skyOffset);
    this.drawClouds(ctx, skyX);
    this.drawClouds(ctx, skyX + this.width);

    // 3. Montanhas distantes (mais claras e lentas)
    const farX = -Math.floor(this.farMountainOffset);
    ctx.drawImage(this.farMountains, farX, 0);
    ctx.drawImage(this.farMountains, farX + this.width, 0);

    // 4. Montanhas próximas (mais escuras e rápidas)
    const nearX = -Math.floor(this.nearMountainOffset);
    ctx.drawImage(this.nearMountains, nearX, 0);
    ctx.drawImage(this.nearMountains, nearX + this.width, 0);
  }

  drawClouds(ctx, offsetX) {
    ctx.fillStyle = 'rgba(255, 245, 235, 0.75)';

    // Nuvem 1
    ctx.fillRect(offsetX + 70, 42, 76, 12);
    ctx.fillRect(offsetX + 86, 34, 44, 8);

    // Nuvem 2
    ctx.fillRect(offsetX + 290, 64, 96, 14);
    ctx.fillRect(offsetX + 312, 54, 52, 10);

    // Nuvem 3
    ctx.fillRect(offsetX + 510, 36, 64, 10);
    ctx.fillRect(offsetX + 522, 28, 36, 8);
  }
}