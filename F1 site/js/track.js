import { CONFIG } from './config.js';

const COLORS = {
  LIGHT: { road: '#555555', grass: '#109910', rumble: '#cc0000', lane: '#ffffff' },
  DARK:  { road: '#4d4d4d', grass: '#0c820c', rumble: '#ffffff', lane: '' },
  START: { road: '#ffffff', grass: '#109910', rumble: '#ffffff', lane: '' }
};

export class Track {
  constructor() {
    this.segments = [];
    this.buildInterlagos();
    this.buildPitLane();
    this.populateScenery();
  }

  addSection(enter, hold, leave, curve, yEnd) {
    const startY = this.lastY();
    const endY = startY + yEnd;
    const total = enter + hold + leave;

    for (let n = 0; n < enter; n++) {
      this.addSegment(this.easeIn(0, curve, n / enter), this.easeInOut(startY, endY, n / total));
    }
    for (let n = 0; n < hold; n++) {
      this.addSegment(curve, this.easeInOut(startY, endY, (enter + n) / total));
    }
    for (let n = 0; n < leave; n++) {
      this.addSegment(this.easeInOut(curve, 0, n / leave), this.easeInOut(startY, endY, (enter + hold + n) / total));
    }
  }

  addSegment(curve, y) {
    const index = this.segments.length;
    const isStartLine = index < 4;
    const color = isStartLine
      ? COLORS.START
      : (Math.floor(index / 3) % 2 === 0 ? COLORS.LIGHT : COLORS.DARK);

    this.segments.push({
      index,
      p1: { x: 0, y: this.lastY(), z: index * CONFIG.SEGMENT_LENGTH, screen: {} },
      p2: { x: 0, y: y,            z: (index + 1) * CONFIG.SEGMENT_LENGTH, screen: {} },
      curve,
      color,
      sprites: [],
      hasPit: false,
      isPitBox: false
    });
  }

  addSprite(segmentIndex, type, offset) {
    if (this.segments[segmentIndex]) {
      this.segments[segmentIndex].sprites.push({ type, offset });
    }
  }

  // Configura o Pit Lane de Interlagos (lado esquerdo da Reta Principal)
  buildPitLane() {
    const total = this.segments.length;

    // Placa avisando a entrada do Pit Lane na Curva do Café
    this.addSprite(total - 55, 'pitSign', -1.4);

    // Entrada do Pit Lane nos últimos 45 segmentos (Curva do Café / Subida)
    for (let i = total - 45; i < total; i++) {
      this.segments[i].hasPit = true;
    }

    // Reta dos Boxes nos primeiros 110 segmentos da pista
    for (let i = 0; i < 110; i++) {
      this.segments[i].hasPit = true;
      if (i % 8 === 0) {
        this.addSprite(i, 'pitGarage', -2.45);
      }
    }

    // Área amarela do seu Box para parada (segmentos 45 a 55)
    for (let i = 45; i <= 55; i++) {
      this.segments[i].isPitBox = true;
    }
  }

  populateScenery() {
    // Torres na linha de largada
    this.addSprite(2, 'banner', -1.35);
    this.addSprite(2, 'banner', 1.35);

    for (let i = 10; i < this.segments.length - 10; i++) {
      const seg = this.segments[i];

      // Placas de aviso de curva nas freadas fortes
      if (Math.abs(seg.curve) > 2.2 && i % 10 === 0) {
        const side = seg.curve > 0 ? -1.4 : 1.4;
        // Evita colocar placa em cima do corredor do Pit Lane
        if (!(seg.hasPit && side < 0)) {
          const signType = seg.curve > 0 ? 'signRight' : 'signLeft';
          this.addSprite(i, signType, side);
        }
      }

      // Árvores na esquerda (apenas fora da área do Pit Lane)
      if (i % 7 === 0 && !seg.hasPit) {
        this.addSprite(i, 'tree', -1.7 - Math.random() * 1.4);
      }

      // Árvores na direita
      if (i % 9 === 0) {
        this.addSprite(i, 'tree', 1.7 + Math.random() * 1.4);
      }

      // Arbustos
      if (i % 16 === 0) {
        const side = i % 2 === 0 ? -1.45 : 1.45;
        if (!(seg.hasPit && side < 0)) {
          this.addSprite(i, 'bush', side);
        }
      }
    }
  }

  lastY() {
    return this.segments.length === 0 ? 0 : this.segments[this.segments.length - 1].p2.y;
  }

  easeIn(a, b, percent) {
    return a + (b - a) * Math.pow(percent, 2);
  }

  easeInOut(a, b, percent) {
    return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
  }

  // Traçado de Interlagos (4.309m e 40m de variação de altitude)
  buildInterlagos() {
    this.segments = [];

    // 1. Reta Principal (+4m)
    this.addSection(0, 115, 0, 0.0, 1400);

    // 2. S do Senna (-22m)
    this.addSection(8, 22, 8, -4.2, -5200);
    this.addSection(8, 22, 8,  4.2, -2500);

    // 3. Curva do Sol (-18m)
    this.addSection(12, 46, 12, -2.35, -6300);

    // 4. Reta Oposta (+8m)
    this.addSection(0, 135, 0, 0.0, 2800);

    // 5. Descida do Lago (-7m)
    this.addSection(10, 34, 10, -2.85, -2450);

    // 6. Reta até a Ferradura (+5m)
    this.addSection(0, 48, 0, 0.0, 1750);

    // 7. Ferradura (+5m)
    this.addSection(10, 32, 10, 2.3, 1750);

    // 8. Laranjinha (-2m)
    this.addSection(8, 22, 8, 2.7, -700);

    // 9. Pinheirinho (-3m)
    this.addSection(8, 26, 8, -3.9, -1050);

    // 10. Bico de Pato (+2m)
    this.addSection(8, 34, 8, 4.1, 700);

    // 11. Mergulho (-9m)
    this.addSection(10, 22, 10, -2.5, -3150);

    // 12. Junção (+3m)
    this.addSection(10, 30, 10, -3.4, 1050);

    // 13. Subida dos Boxes / Curva do Café (+34m)
    this.addSection(12, 65, 12, -1.15, 11900);
  }

  get totalLength() {
    return this.segments.length * CONFIG.SEGMENT_LENGTH;
  }

  getMeters(z) {
    return Math.round((z / this.totalLength) * 4309);
  }

  findSegment(z) {
    const index = Math.floor(z / CONFIG.SEGMENT_LENGTH) % this.segments.length;
    return this.segments[index < 0 ? index + this.segments.length : index];
  }
}