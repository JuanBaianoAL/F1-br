import { CONFIG } from './config.js';

export class Background {
  constructor() {
    this.skyOffset = 0;
    this.hillOffset = 0;
    this.treeOffset = 0;
    this.theme = 'interlagos';
  }

  setTheme(theme) {
    this.theme = theme || 'interlagos';
  }

  update(dt, track, player) {
    const segment = track.findSegment(player.position);
    const speedRatio = player.speed / CONFIG.MAX_SPEED;

    this.skyOffset = (this.skyOffset + segment.curve * speedRatio * dt * 15) % CONFIG.WIDTH;
    this.hillOffset = (this.hillOffset + segment.curve * speedRatio * dt * 45) % CONFIG.WIDTH;
    this.treeOffset = (this.treeOffset + segment.curve * speedRatio * dt * 95) % CONFIG.WIDTH;
  }

  render(ctx) {
    const horizon = CONFIG.HEIGHT / 2;

    if (this.theme === 'monaco') {
      this.renderMonacoBackground(ctx, horizon);
      return;
    }

    // Céu em gradiente retrô (Interlagos, Monza, Silverstone)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    if (this.theme === 'silverstone') {
      skyGrad.addColorStop(0, '#365880');
      skyGrad.addColorStop(1, '#8faec9');
    } else {
      skyGrad.addColorStop(0, '#1e4fa3');
      skyGrad.addColorStop(1, '#68a4f1');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CONFIG.WIDTH, horizon);

    // Nuvens em blocos 16-bits
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    for (let i = -1; i <= 2; i++) {
      const baseX = i * 480 - this.skyOffset;
      ctx.fillRect(baseX + 80, 48, 95, 16);
      ctx.fillRect(baseX + 100, 36, 55, 14);
      ctx.fillRect(baseX + 310, 68, 120, 14);
      ctx.fillRect(baseX + 335, 56, 65, 14);
    }

    // Montanhas / Arquibancadas ao fundo
    ctx.fillStyle = this.theme === 'park' ? '#244d36' : '#2d3b55';
    for (let i = -1; i <= 2; i++) {
      const baseX = i * 480 - this.hillOffset;
      ctx.beginPath();
      ctx.moveTo(baseX, horizon);
      ctx.lineTo(baseX + 120, horizon - 82);
      ctx.lineTo(baseX + 260, horizon - 38);
      ctx.lineTo(baseX + 390, horizon - 95);
      ctx.lineTo(baseX + 480, horizon);
      ctx.closePath();
      ctx.fill();
    }

    // Silhueta distante
    ctx.fillStyle = this.theme === 'park' ? '#134f21' : '#1b2838';
    for (let i = -1; i <= 2; i++) {
      const baseX = i * 480 - this.treeOffset;
      ctx.fillRect(baseX, horizon - 18, 480, 18);
      ctx.fillRect(baseX + 40, horizon - 30, 70, 14);
      ctx.fillRect(baseX + 220, horizon - 26, 110, 10);
      ctx.fillRect(baseX + 370, horizon - 32, 60, 16);
    }
  }

  renderMonacoBackground(ctx, horizon) {
    // 1. Céu ensolarado da Riviera Francesa
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#1366c2');
    skyGrad.addColorStop(1, '#79c2ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CONFIG.WIDTH, horizon);

    // 2. Rocha de Monte Carlo (Tête de Chien) ao fundo
    ctx.fillStyle = '#5c6b7a';
    for (let i = -1; i <= 2; i++) {
      const baseX = i * 480 - this.hillOffset;
      ctx.beginPath();
      ctx.moveTo(baseX, horizon);
      ctx.lineTo(baseX + 90, horizon - 125);
      ctx.lineTo(baseX + 240, horizon - 110);
      ctx.lineTo(baseX + 380, horizon - 135);
      ctx.lineTo(baseX + 480, horizon);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Prédios da Vila de Mônaco escalonados na encosta
    const buildings = [
      { dx: 18, w: 46, h: 72, color: '#f2d9b1' },
      { dx: 70, w: 54, h: 88, color: '#e8a87c' },
      { dx: 132, w: 44, h: 64, color: '#f7efe2' },
      { dx: 184, w: 62, h: 94, color: '#d98a6c' },
      { dx: 254, w: 48, h: 76, color: '#f2e2c4' },
      { dx: 310, w: 58, h: 84, color: '#e6b88a' },
      { dx: 376, w: 46, h: 68, color: '#ffffff' },
      { dx: 428, w: 44, h: 78, color: '#deb887' }
    ];

    for (let i = -1; i <= 2; i++) {
      const baseX = i * 480 - this.treeOffset;

      for (const b of buildings) {
        const bx = baseX + b.dx;
        const by = horizon - 14 - b.h;
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.w, b.h);

        // Telhado terracota
        ctx.fillStyle = '#a8382b';
        ctx.fillRect(bx - 2, by - 4, b.w + 4, 5);

        // Janelas em pixel art
        ctx.fillStyle = '#2d4259';
        for (let wy = by + 8; wy < horizon - 22; wy += 12) {
          for (let wx = bx + 6; wx < bx + b.w - 8; wx += 10) {
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }

      // 4. Mar Mediterrâneo & Iates na base da vila
      ctx.fillStyle = '#0088cc';
      ctx.fillRect(baseX, horizon - 14, 480, 14);

      // Iates brancos ancorados na marina
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(baseX + 55, horizon - 13, 28, 5);
      ctx.fillRect(baseX + 62, horizon - 17, 14, 4);
      ctx.fillRect(baseX + 290, horizon - 13, 34, 5);
      ctx.fillRect(baseX + 300, horizon - 18, 16, 5);
    }
  }
}