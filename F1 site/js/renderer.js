import { CONFIG } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
  }

  project(p, cameraX, cameraY, cameraZ) {
    const transX = p.x - cameraX;
    const transY = p.y - cameraY;
    const transZ = Math.max(1, p.z - cameraZ);

    const scale = CONFIG.CAMERA_DEPTH / transZ;

    p.screen.x = Math.round((CONFIG.WIDTH / 2) + (scale * transX * CONFIG.WIDTH / 2));
    p.screen.y = Math.round((CONFIG.HEIGHT / 2) - (scale * transY * CONFIG.HEIGHT / 2));
    p.screen.w = Math.round(scale * CONFIG.ROAD_WIDTH * CONFIG.WIDTH / 2);
    p.screen.scale = scale;
  }

  drawPolygon(color, x1, y1, x2, y2, x3, y3, x4, y4) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.lineTo(x4, y4);
    this.ctx.closePath();
    this.ctx.fill();
  }

  render(track, player, background = null, minimap = null, rivals = null) {
    const ctx = this.ctx;

    ctx.save();

    // Tremor de câmera ao colidir com adversários
    if (player.shakeTimer > 0) {
      player.shakeTimer = Math.max(0, player.shakeTimer - (1 / 60));
      const intensity = Math.min(1, player.shakeTimer) * 10;
      const shakeX = (Math.random() - 1.5) * intensity;
      const shakeY = (Math.random() - 1.5) * intensity;
      ctx.translate(shakeX, shakeY);
    }

    if (background) {
      background.render(ctx);
    } else {
      ctx.fillStyle = '#3b7dd8';
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    const baseSegment = track.findSegment(player.position);
    const basePercent = (player.position % CONFIG.SEGMENT_LENGTH) / CONFIG.SEGMENT_LENGTH;
    const playerY = baseSegment.p1.y + (baseSegment.p2.y - baseSegment.p1.y) * basePercent;

    let dx = -(baseSegment.curve * basePercent);
    let x = 0;
    let maxY = CONFIG.HEIGHT;

    // 1. Passo Frente -> Trás: Desenha o chão (grama, pit lane, zebra, asfalto)
    for (let n = 0; n < CONFIG.DRAW_DISTANCE; n++) {
      const segIndex = (baseSegment.index + n) % track.segments.length;
      const segment = track.segments[segIndex];
      const looped = segIndex < baseSegment.index;
      const camZ = player.position - (looped ? track.totalLength : 0);

      segment.p1.x = x;
      segment.p2.x = x + dx;
      segment.clip = maxY;
      segment.projected = false;

      this.project(segment.p1, player.x * CONFIG.ROAD_WIDTH, playerY + CONFIG.CAMERA_HEIGHT, camZ);
      this.project(segment.p2, player.x * CONFIG.ROAD_WIDTH, playerY + CONFIG.CAMERA_HEIGHT, camZ);

      x += dx;
      dx += segment.curve;

      const s1 = segment.p1.screen;
      const s2 = segment.p2.screen;

      if (segment.p1.z <= camZ || s2.y >= maxY || s2.y >= s1.y) continue;

      segment.projected = true;
      maxY = s2.y;

      // Grama
      ctx.fillStyle = segment.color.grass;
      ctx.fillRect(0, s2.y, CONFIG.WIDTH, s1.y - s2.y);

      // Zebra
      this.drawPolygon(
        segment.color.rumble,
        s1.x - s1.w * 1.2, s1.y,
        s1.x + s1.w * 1.2, s1.y,
        s2.x + s2.w * 1.2, s2.y,
        s2.x - s2.w * 1.2, s2.y
      );

      // Asfalto principal
      this.drawPolygon(
        segment.color.road,
        s1.x - s1.w, s1.y,
        s1.x + s1.w, s1.y,
        s2.x + s2.w, s2.y,
        s2.x - s2.w, s2.y
      );

      // Pit Lane no lado esquerdo (asfalto + mureta + área amarela do Box)
      if (segment.hasPit) {
        this.drawPolygon(
          '#3a3a44',
          s1.x - s1.w * 1.98, s1.y,
          s1.x - s1.w * 1.25, s1.y,
          s2.x - s2.w * 1.25, s2.y,
          s2.x - s2.w * 1.98, s2.y
        );

        this.drawPolygon(
          '#e0e0e0',
          s1.x - s1.w * 1.28, s1.y,
          s1.x - s1.w * 1.20, s1.y,
          s2.x - s2.w * 1.20, s2.y,
          s2.x - s2.w * 1.28, s2.y
        );

        if (segment.isPitBox) {
          this.drawPolygon(
            '#ffcc00',
            s1.x - s1.w * 1.88, s1.y,
            s1.x - s1.w * 1.35, s1.y,
            s2.x - s2.w * 1.35, s2.y,
            s2.x - s2.w * 1.88, s2.y
          );
        }
      }

      // Faixa central tracejada
      if (segment.color.lane) {
        const l1 = s1.w * 0.04;
        const l2 = s2.w * 0.04;
        this.drawPolygon(
          segment.color.lane,
          s1.x - l1, s1.y,
          s1.x + l1, s1.y,
          s2.x + l2, s2.y,
          s2.x - l2, s2.y
        );
      }
    }

    // 2. Passo Trás -> Frente: Desenha árvores, placas, garagens e adversários
    for (let n = CONFIG.DRAW_DISTANCE - 1; n >= 0; n--) {
      const segIndex = (baseSegment.index + n) % track.segments.length;
      const segment = track.segments[segIndex];
      const s1 = segment.p1.screen;
      const s2 = segment.p2.screen;

      for (const sprite of segment.sprites) {
        const spriteX = s1.x + (s1.scale * sprite.offset * CONFIG.ROAD_WIDTH * CONFIG.WIDTH / 2);
        const spriteY = s1.y;
        this.drawScenerySprite(sprite.type, spriteX, spriteY, s1.scale, segment.clip);
      }

      if (rivals) {
        for (const car of rivals.cars) {
          const carSeg = track.findSegment(car.z);
          if (carSeg.index === segIndex && n > 0) {
            const carPercent = (car.z % CONFIG.SEGMENT_LENGTH) / CONFIG.SEGMENT_LENGTH;
            const interpX = s1.x + (s2.x - s1.x) * carPercent;
            const interpY = s1.y + (s2.y - s1.y) * carPercent;
            const interpW = s1.w + (s2.w - s1.w) * carPercent;

            const carScreenX = interpX + (car.x * interpW);
            this.drawRivalCar(car, carScreenX, interpY, interpW, segment.clip);
          }
        }
      }
    }

    // 3. Carro do jogador e faíscas de colisão
    this.drawPlayerCar(player);

    if (rivals) {
      rivals.renderSparks(ctx);
    }

    ctx.restore();

    // 4. Minimapa no canto superior esquerdo (fora do tremor da câmera)
    if (minimap) {
      minimap.render(ctx, player, track, rivals);
    }
  }

  drawScenerySprite(type, x, y, scale, clipY) {
    const ctx = this.ctx;
    const baseSize = scale * CONFIG.WIDTH * 1.8;
    if (baseSize < 2 || y > clipY) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CONFIG.WIDTH, clipY);
    ctx.clip();

    if (type === 'tree') {
      const w = baseSize * 0.55;
      const h = baseSize * 1.1;
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(x - w * 0.15, y - h * 0.25, w * 0.3, h * 0.25);
      ctx.fillStyle = '#0b5e1c';
      ctx.fillRect(x - w * 0.5, y - h * 0.5, w, h * 0.28);
      ctx.fillStyle = '#127d27';
      ctx.fillRect(x - w * 0.38, y - h * 0.75, w * 0.76, h * 0.28);
      ctx.fillStyle = '#1ca136';
      ctx.fillRect(x - w * 0.22, y - h, w * 0.44, h * 0.28);
    } else if (type === 'bush') {
      const w = baseSize * 0.45;
      const h = baseSize * 0.3;
      ctx.fillStyle = '#167a29';
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#24a83d';
      ctx.fillRect(x - w * 0.35, y - h * 0.85, w * 0.7, h * 0.5);
    } else if (type === 'signRight' || type === 'signLeft') {
      const w = baseSize * 0.32;
      const h = baseSize * 0.55;
      ctx.fillStyle = '#888888';
      ctx.fillRect(x - w * 0.08, y - h * 0.6, w * 0.16, h * 0.6);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(x - w * 0.5, y - h, w, h * 0.5);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = Math.max(1, w * 0.08);
      ctx.strokeRect(x - w * 0.5, y - h, w, h * 0.5);
      ctx.fillStyle = '#111111';
      const arrow = type === 'signRight' ? '>' : '<';
      ctx.font = `bold ${Math.max(6, Math.floor(w * 0.65))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(arrow, x, y - h * 0.63);
    } else if (type === 'pitSign') {
      const w = baseSize * 0.42;
      const h = baseSize * 0.6;
      ctx.fillStyle = '#888888';
      ctx.fillRect(x - w * 0.08, y - h * 0.6, w * 0.16, h * 0.6);
      ctx.fillStyle = '#0055cc';
      ctx.fillRect(x - w * 0.5, y - h, w, h * 0.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, w * 0.07);
      ctx.strokeRect(x - w * 0.5, y - h, w, h * 0.5);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(6, Math.floor(w * 0.38))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('PIT', x, y - h * 0.66);
    } else if (type === 'pitGarage') {
      const w = baseSize * 1.1;
      const h = baseSize * 0.75;
      ctx.fillStyle = '#d9d9e3';
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#1b365d';
      ctx.fillRect(x - w / 2, y - h, w, h * 0.22);
      ctx.fillStyle = '#22222a';
      ctx.fillRect(x - w * 0.35, y - h * 0.65, w * 0.7, h * 0.65);
    } else if (type === 'banner') {
      const w = baseSize * 0.25;
      const h = baseSize * 1.4;
      ctx.fillStyle = '#dddddd';
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(x - w / 2, y - h, w, h * 0.25);
    }

    ctx.restore();
  }

  drawRivalCar(car, x, y, roadHalfWidth, clipY) {
    const ctx = this.ctx;
    const w = roadHalfWidth * 0.28;
    const h = w * 0.52;
    if (w < 3 || y > clipY) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CONFIG.WIDTH, clipY);
    ctx.clip();

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x - w * 0.52, y - h * 0.14, w * 1.04, h * 0.16);

    // Pneus traseiros largos estilo F1
    ctx.fillStyle = '#181818';
    ctx.fillRect(x - w * 0.50, y - h * 0.55, w * 0.20, h * 0.50);
    ctx.fillRect(x + w * 0.30, y - h * 0.55, w * 0.20, h * 0.50);

    // Chassi principal na cor do adversário
    ctx.fillStyle = car.color;
    ctx.fillRect(x - w * 0.38, y - h * 0.68, w * 0.76, h * 0.42);

    // Cockpit / Capacete escuro
    ctx.fillStyle = '#22313f';
    ctx.fillRect(x - w * 0.22, y - h * 0.92, w * 0.44, h * 0.26);

    // Aerofólio traseiro
    ctx.fillStyle = car.color;
    ctx.fillRect(x - w * 0.44, y - h * 0.85, w * 0.88, h * 0.14);

    // Lanternas traseiras
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(x - w * 0.32, y - h * 0.52, w * 0.15, h * 0.12);
    ctx.fillRect(x + w * 0.17, y - h * 0.52, w * 0.15, h * 0.12);

    ctx.restore();
  }

  drawPlayerCar(player) {
    const ctx = this.ctx;
    const centerX = CONFIG.WIDTH / 2;
    const baseY = CONFIG.HEIGHT - 54;
    const steerOffset = player.steerDirection * 6;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(centerX - 44, baseY - 6, 88, 10);

    ctx.fillStyle = '#181818';
    ctx.fillRect(centerX - 42, baseY - 22, 16, 20);
    ctx.fillRect(centerX + 26, baseY - 22, 16, 20);

    ctx.fillStyle = '#d91e18';
    ctx.fillRect(centerX - 34 + steerOffset * 0.4, baseY - 28, 68, 18);

    ctx.fillStyle = '#22313f';
    ctx.fillRect(centerX - 24 + steerOffset, baseY - 40, 48, 12);

    ctx.fillStyle = '#b01510';
    ctx.fillRect(centerX - 36 + steerOffset * 0.7, baseY - 33, 72, 5);

    ctx.fillStyle = player.isBraking ? '#ff5555' : '#ffaa00';
    ctx.fillRect(centerX - 30 + steerOffset * 0.4, baseY - 22, 14, 5);
    ctx.fillRect(centerX + 16 + steerOffset * 0.4, baseY - 22, 14, 5);
  }
}