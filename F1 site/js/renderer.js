import { CONFIG } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
    this.playerParticles = [];
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

    if (player.shakeTimer > 0) {
      player.shakeTimer = Math.max(0, player.shakeTimer - (1 / 60));
      const intensity = Math.min(1, player.shakeTimer) * 10;
      const shakeX = (Math.random() - 0.5) * intensity;
      const shakeY = (Math.random() - 0.5) * intensity;
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

    for (let n = 0; n < CONFIG.DRAW_DISTANCE; n++) {
      const segIndex = (baseSegment.index + n) % track.segments.length;
      const segment = track.segments[segIndex];
      const looped = segIndex < baseSegment.index;
      const camZ = player.position - (looped ? track.totalLength : 0);

      segment.p1.x = x;
      segment.p2.x = x + dx;
      segment.clip = maxY;

      this.project(segment.p1, player.x * CONFIG.ROAD_WIDTH, playerY + CONFIG.CAMERA_HEIGHT, camZ);
      this.project(segment.p2, player.x * CONFIG.ROAD_WIDTH, playerY + CONFIG.CAMERA_HEIGHT, camZ);

      x += dx;
      dx += segment.curve;

      const s1 = segment.p1.screen;
      const s2 = segment.p2.screen;

      // Impede projeção invertida ou estourada quando um segmento cruza o plano da câmera
      if (
        segment.p1.z <= camZ + 50 ||
        s2.y >= maxY ||
        s2.y >= s1.y ||
        s1.w <= 0 ||
        s2.w <= 0 ||
        s1.w > CONFIG.WIDTH * 1.5
      ) {
        continue;
      }

      maxY = s2.y;

      ctx.fillStyle = segment.color.grass;
      ctx.fillRect(0, s2.y, CONFIG.WIDTH, s1.y - s2.y);

      this.drawPolygon(
        segment.color.rumble,
        s1.x - s1.w * 1.2, s1.y,
        s1.x + s1.w * 1.2, s1.y,
        s2.x + s2.w * 1.2, s2.y,
        s2.x - s2.w * 1.2, s2.y
      );

      this.drawPolygon(
        segment.color.road,
        s1.x - s1.w, s1.y,
        s1.x + s1.w, s1.y,
        s2.x + s2.w, s2.y,
        s2.x - s2.w, s2.y
      );

      // Pit Lane largo e longo (esquerda: side = -1, direita: side = +1)
      if (segment.hasPit) {
        const side = segment.pitSide ?? -1;

        const p1Inner = s1.x + side * s1.w * 1.22;
        const p1Outer = s1.x + side * s1.w * 2.45;
        const p2Inner = s2.x + side * s2.w * 1.22;
        const p2Outer = s2.x + side * s2.w * 2.45;

        this.drawPolygon(
          '#3a3a44',
          Math.min(p1Inner, p1Outer), s1.y,
          Math.max(p1Inner, p1Outer), s1.y,
          Math.max(p2Inner, p2Outer), s2.y,
          Math.min(p2Inner, p2Outer), s2.y
        );

        const l1Inner = s1.x + side * s1.w * 1.18;
        const l1Outer = s1.x + side * s1.w * 1.28;
        const l2Inner = s2.x + side * s2.w * 1.18;
        const l2Outer = s2.x + side * s2.w * 1.28;

        this.drawPolygon(
          '#e0e0e0',
          Math.min(l1Inner, l1Outer), s1.y,
          Math.max(l1Inner, l1Outer), s1.y,
          Math.max(l2Inner, l2Outer), s2.y,
          Math.min(l2Inner, l2Outer), s2.y
        );

        if (segment.isPitBox) {
          const b1Inner = s1.x + side * s1.w * 1.38;
          const b1Outer = s1.x + side * s1.w * 2.30;
          const b2Inner = s2.x + side * s2.w * 1.38;
          const b2Outer = s2.x + side * s2.w * 2.30;

          this.drawPolygon(
            '#ffcc00',
            Math.min(b1Inner, b1Outer), s1.y,
            Math.max(b1Inner, b1Outer), s1.y,
            Math.max(b2Inner, b2Outer), s2.y,
            Math.min(b2Inner, b2Outer), s2.y
          );
        }
      }

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

      // Teto e paredes do Túnel de Mônaco
      if (segment.isTunnel) {
        const wallH1 = s1.w * 0.95;
        const wallH2 = s2.w * 0.95;
        const tunnelColor = (segment.index % 4 < 2) ? '#1c1e26' : '#262933';

        this.drawPolygon(
          tunnelColor,
          s1.x - s1.w * 1.25, s1.y,
          s1.x - s1.w * 1.15, s1.y - wallH1,
          s2.x - s2.w * 1.15, s2.y - wallH2,
          s2.x - s2.w * 1.25, s2.y
        );

        this.drawPolygon(
          tunnelColor,
          s1.x + s1.w * 1.15, s1.y - wallH1,
          s1.x + s1.w * 1.25, s1.y,
          s2.x + s2.w * 1.25, s2.y,
          s2.x + s2.w * 1.15, s2.y - wallH2
        );

        this.drawPolygon(
          '#12131a',
          s1.x - s1.w * 1.20, s1.y - wallH1,
          s1.x + s1.w * 1.20, s1.y - wallH1,
          s2.x + s2.w * 1.20, s2.y - wallH2,
          s2.x - s2.w * 1.20, s2.y - wallH2
        );

        if (segment.index % 6 === 0) {
          this.drawPolygon(
            '#ff9900',
            s1.x - s1.w * 0.12, s1.y - wallH1 * 0.96,
            s1.x + s1.w * 0.12, s1.y - wallH1 * 0.96,
            s2.x + s2.w * 0.12, s2.y - wallH2 * 0.96,
            s2.x - s2.w * 0.12, s2.y - wallH2 * 0.96
          );
        }
      }

      // Viaduto cruzando por cima da pista (Suzuka - passagem inferior após Degner 2)
      if (segment.isOverpassBridge && s1.w > 8 && s1.w < CONFIG.WIDTH * 0.9) {
        const bridgeBottom1 = s1.y - s1.w * 0.92;
        const bridgeTop1    = s1.y - s1.w * 1.28;
        const bridgeBottom2 = s2.y - s2.w * 0.92;
        const bridgeTop2    = s2.y - s2.w * 1.28;

        this.drawPolygon(
          'rgba(0, 0, 0, 0.42)',
          s1.x - s1.w * 1.2, s1.y,
          s1.x + s1.w * 1.2, s1.y,
          s2.x + s2.w * 1.2, s2.y,
          s2.x - s2.w * 1.2, s2.y
        );

        this.drawPolygon(
          '#5b6270',
          s1.x - s1.w * 1.65, s1.y,
          s1.x - s1.w * 1.35, bridgeBottom1,
          s2.x - s2.w * 1.35, bridgeBottom2,
          s2.x - s2.w * 1.65, s2.y
        );
        this.drawPolygon(
          '#5b6270',
          s1.x + s1.w * 1.35, bridgeBottom1,
          s1.x + s1.w * 1.65, s1.y,
          s2.x + s2.w * 1.65, s2.y,
          s2.x + s2.w * 1.35, bridgeBottom2
        );

        this.drawPolygon(
          '#7f8696',
          s1.x - s1.w * 2.1, bridgeBottom1,
          s1.x + s1.w * 2.1, bridgeBottom1,
          s2.x + s2.w * 2.1, bridgeBottom2,
          s2.x - s2.w * 2.1, bridgeBottom2
        );

        this.drawPolygon(
          '#e2e6f0',
          s1.x - s1.w * 2.1, bridgeTop1,
          s1.x + s1.w * 2.1, bridgeTop1,
          s2.x + s2.w * 2.1, bridgeTop2,
          s2.x - s2.w * 2.1, bridgeTop2
        );
      }

      // Muretas laterais quando o jogador está passando POR CIMA do viaduto (rumo à 130R)
      if (segment.isViaduct) {
        const wallH1 = s1.w * 0.24;
        const wallH2 = s2.w * 0.24;
        const wallColor = (segment.index % 4 < 2) ? '#d5dae6' : '#b4bcc9';

        this.drawPolygon(
          wallColor,
          s1.x - s1.w * 1.24, s1.y,
          s1.x - s1.w * 1.18, s1.y - wallH1,
          s2.x - s2.w * 1.18, s2.y - wallH2,
          s2.x - s2.w * 1.24, s2.y
        );
        this.drawPolygon(
          wallColor,
          s1.x + s1.w * 1.18, s1.y - wallH1,
          s1.x + s1.w * 1.24, s1.y,
          s2.x + s2.w * 1.24, s2.y,
          s2.x + s2.w * 1.18, s2.y - wallH2
        );
      }
    }

    for (let n = CONFIG.DRAW_DISTANCE - 1; n >= 0; n--) {
      const segIndex = (baseSegment.index + n) % track.segments.length;
      const segment = track.segments[segIndex];
      const s1 = segment.p1.screen;
      const s2 = segment.p2.screen;

      if (!s1 || s1.w <= 0 || s1.w > CONFIG.WIDTH * 1.5) continue;

      for (const sprite of segment.sprites) {
        const spriteX = s1.x + (sprite.offset * s1.w);
        const spriteY = s1.y;
        const clipLimit = n < 25 ? CONFIG.HEIGHT : segment.clip + 8;
        this.drawScenerySprite(sprite.type, spriteX, spriteY, s1.w, clipLimit);
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

    // Linhas de vento quando o Vácuo está ativo
    if (player.inSlipstream) {
      this.drawSlipstreamLines();
    }

    this.updateAndDrawPlayerParticles(player, track);
    this.drawPlayerCar(player);

    if (rivals) {
      rivals.renderSparks(ctx);
    }

    ctx.restore();

    if (minimap) {
      minimap.render(ctx, player, track, rivals);
    }
  }

  drawSlipstreamLines() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = CONFIG.WIDTH / 2 + side * (160 + (i * 45) % 260);
      const y = (performance.now() * 1.4 + i * 110) % CONFIG.HEIGHT;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * 12, y + 48);
      ctx.stroke();
    }
  }

  drawScenerySprite(type, x, y, roadHalfWidth, clipY) {
    const ctx = this.ctx;
    const baseSize = roadHalfWidth * 0.28;
    if (baseSize < 2 || y > clipY + 8) return;

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
    } else if (type === 'board150' || type === 'board100' || type === 'board50') {
      const w = baseSize * 0.36;
      const h = baseSize * 0.58;
      ctx.fillStyle = '#888888';
      ctx.fillRect(x - w * 0.08, y - h * 0.55, w * 0.16, h * 0.55);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - w * 0.5, y - h, w, h * 0.5);
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = Math.max(1, w * 0.08);
      ctx.strokeRect(x - w * 0.5, y - h, w, h * 0.5);
      ctx.fillStyle = '#111111';
      const distText = type.replace('board', '');
      ctx.font = `bold ${Math.max(6, Math.floor(w * 0.42))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(distText, x, y - h * 0.66);
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
      const w = baseSize * 1.25;
      const h = baseSize * 0.85;
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
    } else if (type === 'cityBuilding') {
      const w = baseSize * 0.95;
      const h = baseSize * 1.45;
      ctx.fillStyle = '#e8d5b7';
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.fillStyle = '#a8382b';
      ctx.fillRect(x - w / 2, y - h, w, h * 0.12);
      ctx.fillStyle = '#2d4259';
      ctx.fillRect(x - w * 0.32, y - h * 0.78, w * 0.22, h * 0.22);
      ctx.fillRect(x + w * 0.10, y - h * 0.78, w * 0.22, h * 0.22);
      ctx.fillRect(x - w * 0.32, y - h * 0.45, w * 0.22, h * 0.22);
      ctx.fillRect(x + w * 0.10, y - h * 0.45, w * 0.22, h * 0.22);
    } else if (type === 'grandstand') {
      const w = baseSize * 2.1;
      const h = baseSize * 1.15;
      // Garante que a borda interna da arquibancada fique sempre fora da pista (após a zebra)
      const side = x < CONFIG.WIDTH / 2 ? -1 : 1;
      const drawX = x + side * (w * 0.35);

      ctx.fillStyle = '#2d313d';
      ctx.fillRect(drawX - w / 2, y - h, w, h);

      ctx.fillStyle = '#e6e9f0';
      ctx.fillRect(drawX - w * 0.52, y - h, w * 1.04, h * 0.14);
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(drawX - w * 0.52, y - h * 0.86, w * 1.04, h * 0.06);

      const crowdColors = ['#ff3333', '#ffcc00', '#3399ff', '#ffffff', '#00cc66'];
      for (let row = 0; row < 4; row++) {
        const rowY = y - h * (0.22 + row * 0.14);
        const cols = 8;
        const step = (w * 0.88) / cols;
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = crowdColors[(c + row * 2) % crowdColors.length];
          ctx.fillRect(drawX - w * 0.44 + c * step, rowY, step * 0.72, h * 0.09);
        }
      }
    } else if (type === 'overheadGantry') {
      const roadHalf = roadHalfWidth;
      const spanW = roadHalf * 2.55;
      const pillarW = Math.max(3, roadHalf * 0.14);
      const archH = baseSize * 1.25;
      const bannerH = archH * 0.28;

      ctx.fillStyle = '#cfd4de';
      ctx.fillRect(x - spanW / 2, y - archH, pillarW, archH);
      ctx.fillRect(x + spanW / 2 - pillarW, y - archH, pillarW, archH);

      ctx.fillStyle = '#141824';
      ctx.fillRect(x - spanW / 2, y - archH, spanW, bannerH);
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(x - spanW / 2, y - archH + bannerH * 0.78, spanW, bannerH * 0.22);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(6, Math.floor(bannerH * 0.55))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('FORMULA 1 • GRAND PRIX', x, y - archH + bannerH * 0.62);
    } else if (type === 'timingTower') {
      const w = baseSize * 0.55;
      const h = baseSize * 1.85;
      ctx.fillStyle = '#1c202b';
      ctx.fillRect(x - w / 2, y - h, w, h);
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = Math.max(1, w * 0.06);
      ctx.strokeRect(x - w / 2, y - h, w, h);

      const posColors = ['#ffcc00', '#ffffff', '#ffffff', '#00e676', '#ffffff', '#ff5252'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = posColors[i];
        ctx.fillRect(x - w * 0.34, y - h * (0.86 - i * 0.12), w * 0.68, h * 0.06);
      }
    }

    ctx.restore();
  }

  drawRivalCar(car, x, y, roadHalfWidth, clipY) {
    const ctx = this.ctx;
    if (roadHalfWidth <= 0 || roadHalfWidth > CONFIG.WIDTH * 1.4 || y > clipY || y < 40) return;

    const w = Math.min(roadHalfWidth * 0.28, CONFIG.WIDTH * 0.32);
    const h = w * 0.52;
    if (w < 3) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CONFIG.WIDTH, clipY);
    ctx.clip();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x - w * 0.52, y - h * 0.14, w * 1.04, h * 0.16);

    ctx.fillStyle = '#181818';
    ctx.fillRect(x - w * 0.50, y - h * 0.55, w * 0.20, h * 0.50);
    ctx.fillRect(x + w * 0.30, y - h * 0.55, w * 0.20, h * 0.50);

    ctx.fillStyle = car.color;
    ctx.fillRect(x - w * 0.38, y - h * 0.68, w * 0.76, h * 0.42);

    ctx.fillStyle = '#22313f';
    ctx.fillRect(x - w * 0.22, y - h * 0.92, w * 0.44, h * 0.26);

    ctx.fillStyle = car.color;
    ctx.fillRect(x - w * 0.44, y - h * 0.85, w * 0.88, h * 0.14);

    ctx.fillStyle = '#ff2222';
    ctx.fillRect(x - w * 0.32, y - h * 0.52, w * 0.15, h * 0.12);
    ctx.fillRect(x + w * 0.17, y - h * 0.52, w * 0.15, h * 0.12);

    ctx.restore();
  }

  updateAndDrawPlayerParticles(player, track) {
    const ctx = this.ctx;
    const centerX = CONFIG.WIDTH / 2;
    const baseY = CONFIG.HEIGHT - 54;
    const currentSeg = track.findSegment(player.position);
    const inPit = Boolean(currentSeg && currentSeg.hasPit && Math.abs(player.x) > 1.2);
    const isOffroad = !inPit && Math.abs(player.x) > 1.05;

    // 1. Fumaça branca de travagem forte
    if (player.isBraking && player.kmh > 165) {
      for (const side of [-1, 1]) {
        this.playerParticles.push({
          x: centerX + side * 32 + (Math.random() - 0.5) * 6,
          y: baseY - 6,
          vx: side * (18 + Math.random() * 25),
          vy: -12 - Math.random() * 18,
          size: 6 + Math.random() * 6,
          life: 0.35,
          maxLife: 0.35,
          color: 'rgba(235, 240, 248, 0.7)'
        });
      }
    }

    // 2. Terra/grama voando ao sair da pista
    if (isOffroad && player.kmh > 60) {
      const dirtColor = track.theme === 'monaco' ? '#9aa0ab' : '#248f24';
      for (const side of [-1, 1]) {
        this.playerParticles.push({
          x: centerX + side * 34 + (Math.random() - 0.5) * 8,
          y: baseY - 4,
          vx: side * (35 + Math.random() * 45),
          vy: -35 - Math.random() * 40,
          size: 4 + Math.random() * 4,
          life: 0.28,
          maxLife: 0.28,
          color: dirtColor
        });
      }
    }

    // 3. Faíscas douradas de assoalho acima de 310 km/h
    if (player.kmh > 310 && Math.random() < 0.65) {
      this.playerParticles.push({
        x: centerX + (Math.random() - 0.5) * 44,
        y: baseY - 5,
        vx: (Math.random() - 0.5) * 110,
        vy: -20 - Math.random() * 35,
        size: 3 + Math.random() * 2,
        life: 0.18,
        maxLife: 0.18,
        color: Math.random() < 0.5 ? '#ffdf4d' : '#ff8800'
      });
    }

    const dt = 1 / 60;
    for (let i = this.playerParticles.length - 1; i >= 0; i--) {
      const p = this.playerParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      p.life -= dt;

      if (p.life <= 0) {
        this.playerParticles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawPlayerCar(player) {
    const ctx = this.ctx;
    const centerX = CONFIG.WIDTH / 2;
    const baseY = CONFIG.HEIGHT - 54;
    const steerOffset = player.steerDirection * 6;
    const livery = player.livery || { body: '#d91e18', wing: '#b01510', accent: '#ffcc00' };

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(centerX - 44, baseY - 6, 88, 10);

    ctx.fillStyle = '#181818';
    ctx.fillRect(centerX - 42, baseY - 22, 16, 20);
    ctx.fillRect(centerX + 26, baseY - 22, 16, 20);

    // Chassi principal na cor da escuderia
    ctx.fillStyle = livery.body;
    ctx.fillRect(centerX - 34 + steerOffset * 0.4, baseY - 28, 68, 18);

    // Faixa detalhe da equipe
    ctx.fillStyle = livery.accent;
    ctx.fillRect(centerX - 28 + steerOffset * 0.4, baseY - 26, 56, 4);

    // Cockpit / Capacete
    ctx.fillStyle = '#22313f';
    ctx.fillRect(centerX - 24 + steerOffset, baseY - 40, 48, 12);

    // Aerofólio traseiro
    ctx.fillStyle = livery.wing;
    ctx.fillRect(centerX - 36 + steerOffset * 0.7, baseY - 33, 72, 5);

    ctx.fillStyle = player.isBraking ? '#ff5555' : '#ffaa00';
    ctx.fillRect(centerX - 30 + steerOffset * 0.4, baseY - 22, 14, 5);
    ctx.fillRect(centerX + 16 + steerOffset * 0.4, baseY - 22, 14, 5);
  }
}