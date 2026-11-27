import { CONFIG } from './config.js';
import { CHAMPIONSHIP_TRACKS } from './tracks-data.js';

export class Track {
  constructor(trackId = 'monaco') {
    this.segments = [];
    this.mapPoints = [];
    this.loadTrack(trackId);
  }

  loadTrack(trackId) {
    const def = CHAMPIONSHIP_TRACKS.find((t) => t.id === trackId) || CHAMPIONSHIP_TRACKS[0];
    this.id = def.id;
    this.name = def.name;
    this.fullName = def.fullName;
    this.minimapTitle = def.minimapTitle;
    this.theme = def.theme;
    this.colors = def.colors;
    this.pitSide = def.pitSide ?? -1; // -1 = esquerda, +1 = direita
    this.lengthMeters = def.lengthMeters || 4309;
    this.brakingPercentages = def.brakingPercentages || [0.16, 0.45, 0.72, 0.88];

    this.segments = [];
    this.mapPoints = [];

    if (def.points) {
      this.buildFromPoints(
        def.points,
        def.heights || [],
        def.tunnelPercent || null,
        this.lengthMeters,
        def.overpassPercent ?? null,
        def.viaductPercent ?? null
      );
    }

    this.buildPitLane();
    this.populateScenery();
  }

  buildFromPoints(
    rawPoints,
    heights = [],
    tunnelPercent = null,
    lengthMeters = 4309,
    overpassPercent = null,
    viaductPercent = null
  ) {
    const n = rawPoints.length;
    // Calibrado para 360 km/h: ~1:20 em Monza, ~1:10 em Mônaco/Interlagos, ~1:25 em Silverstone
    const totalSegments = Math.round(lengthMeters * 1.0);

    const cumLen = [0];
    for (let i = 0; i < n; i++) {
      const p0 = rawPoints[i];
      const p1 = rawPoints[(i + 1) % n];
      cumLen.push(cumLen[i] + Math.hypot(p1[0] - p0[0], p1[1] - p0[1]));
    }
    const perimeter = cumLen[n];

    const linear = [];
    for (let s = 0; s < totalSegments; s++) {
      const targetDist = (s / totalSegments) * perimeter;
      let segIdx = 0;
      while (segIdx < n - 1 && cumLen[segIdx + 1] < targetDist) {
        segIdx++;
      }
      const span = Math.max(0.0001, cumLen[segIdx + 1] - cumLen[segIdx]);
      const t = (targetDist - cumLen[segIdx]) / span;

      const p0 = rawPoints[segIdx];
      const p1 = rawPoints[(segIdx + 1) % n];
      linear.push({
        x: p0[0] + (p1[0] - p0[0]) * t,
        y: p0[1] + (p1[1] - p0[1]) * t
      });
    }

    const smoothRadius = Math.max(4, Math.round(totalSegments / 380));
    const dense = [];
    for (let i = 0; i < totalSegments; i++) {
      let sx = 0;
      let sy = 0;
      let count = 0;
      for (let k = -smoothRadius; k <= smoothRadius; k++) {
        const pt = linear[(i + k + totalSegments) % totalSegments];
        sx += pt.x;
        sy += pt.y;
        count++;
      }
      dense.push({ x: sx / count, y: sy / count });
    }

    this.mapPoints = dense;

    const headings = [];
    for (let i = 0; i < totalSegments; i++) {
      const a = dense[i];
      const b = dense[(i + 1) % totalSegments];
      headings.push(Math.atan2(b.y - a.y, b.x - a.x));
    }

    const getElevationAt = (pct) => {
      if (!heights.length) return 0;
      const scaled = pct * heights.length;
      const idx = Math.floor(scaled) % heights.length;
      const next = (idx + 1) % heights.length;
      const frac = scaled - Math.floor(scaled);
      return this.easeInOut(heights[idx], heights[next], frac);
    };

    const curveGain = (totalSegments / 800) * 44;

    for (let i = 0; i < totalSegments; i++) {
      const hPrev = headings[(i - 1 + totalSegments) % totalSegments];
      const hCurr = headings[i];
      let dAngle = hCurr - hPrev;
      while (dAngle > Math.PI) dAngle -= Math.PI * 2;
      while (dAngle < -Math.PI) dAngle += Math.PI * 2;

      const curve = Math.max(-5.2, Math.min(5.2, dAngle * curveGain));
      const pct = i / totalSegments;
      const yNext = getElevationAt((i + 1) / totalSegments);
      const isTunnel = Boolean(
        tunnelPercent && pct >= tunnelPercent[0] && pct <= tunnelPercent[1]
      );
      const isOverpassBridge = Boolean(
        overpassPercent !== null && Math.abs(pct - overpassPercent) < 0.004
      );
      const isViaduct = Boolean(
        viaductPercent && pct >= viaductPercent[0] && pct <= viaductPercent[1]
      );

      this.addSegment(curve, yNext, isTunnel, isOverpassBridge, isViaduct);
    }
  }

  addSegment(curve, y, isTunnel = false, isOverpassBridge = false, isViaduct = false) {
    const index = this.segments.length;
    const isStartLine = index < 5;
    const color = isStartLine
      ? this.colors.start
      : (Math.floor(index / 3) % 2 === 0 ? this.colors.light : this.colors.dark);

    this.segments.push({
      index,
      p1: { x: 0, y: this.lastY(), z: index * CONFIG.SEGMENT_LENGTH, screen: {} },
      p2: { x: 0, y: y,            z: (index + 1) * CONFIG.SEGMENT_LENGTH, screen: {} },
      curve,
      color,
      sprites: [],
      hasPit: false,
      pitSide: this.pitSide,
      isPitBox: false,
      isTunnel,
      isOverpassBridge,
      isViaduct
    });
  }

  addSprite(segmentIndex, type, offset) {
    if (this.segments[segmentIndex]) {
      this.segments[segmentIndex].sprites.push({ type, offset });
    }
  }

  buildPitLane() {
    const total = this.segments.length;
    const side = this.pitSide; // -1 esquerda, +1 direita

    // Placa azul PIT bem antes da entrada para dar tempo de frear
    this.addSprite(total - 140, 'pitSign', 1.45 * side);

    // Entrada longa do Pit Lane antes da linha de chegada (110 segmentos)
    for (let i = total - 110; i < total; i++) {
      this.segments[i].hasPit = true;
      this.segments[i].pitSide = side;
    }

    // Reta completa dos boxes após a linha de chegada (220 segmentos)
    for (let i = 0; i < 220; i++) {
      this.segments[i].hasPit = true;
      this.segments[i].pitSide = side;
      if (i % 12 === 0) {
        this.addSprite(i, 'pitGarage', 3.05 * side);
      }
    }

    // Área amarela de parada do Pit Stop mais longa (30 segmentos)
    for (let i = 85; i <= 115; i++) {
      this.segments[i].isPitBox = true;
    }
  }

  addBrakingBoards(cornerStartSegment, side) {
    this.addSprite(cornerStartSegment - 27, 'board150', side);
    this.addSprite(cornerStartSegment - 18, 'board100', side);
    this.addSprite(cornerStartSegment - 9,  'board50',  side);
  }

  populateScenery() {
    const total = this.segments.length;
    const pitSide = this.pitSide ?? -1;
    const oppositePitSide = -pitSide;
    const grandstandZones = new Set();

    const placeGrandstand = (segIdx, side) => {
      const idx = (segIdx + total) % total;
      const seg = this.segments[idx];
      if (!seg || seg.isTunnel || seg.isOverpassBridge) return;
      if (seg.hasPit && Math.sign(side) === seg.pitSide) return;
      this.addSprite(idx, 'grandstand', side);
      for (let pad = -4; pad <= 4; pad++) {
        grandstandZones.add(`${(idx + pad + total) % total}_${Math.sign(side)}`);
      }
    };

    // Pórtico de Largada/Chegada cruzando por cima da pista
    this.addSprite(3, 'overheadGantry', 0);

    // Torre de cronometragem perto da largada (do lado oposto aos boxes)
    this.addSprite(18, 'timingTower', 1.45 * oppositePitSide);

    // Arquibancadas lotadas na reta principal inteira (lado oposto aos boxes)
    for (let i = 8; i < 240; i += 8) {
      placeGrandstand(i, 1.48 * oppositePitSide);
    }
    for (let i = total - 120; i < total - 10; i += 8) {
      placeGrandstand(i, 1.48 * oppositePitSide);
    }

    // Arquibancadas nas curvas principais da pista (lado de fora da curva)
    for (const pct of this.brakingPercentages) {
      const cornerSeg = Math.floor(total * pct);
      for (let k = -16; k <= 24; k += 8) {
        const idx = (cornerSeg + k + total) % total;
        const seg = this.segments[idx];
        const outSide = (seg && seg.curve >= 0) ? -1.48 : 1.48;
        placeGrandstand(idx, outSide);
      }
    }

    // Pórticos de patrocínio espalhados pelas grandes retas da pista
    const gantryPositions = [0.22, 0.55, 0.84];
    for (const pct of gantryPositions) {
      const segIdx = Math.floor(total * pct);
      const seg = this.segments[segIdx];
      if (seg && !seg.isTunnel && !seg.isOverpassBridge) {
        this.addSprite(segIdx, 'overheadGantry', 0);
      }
    }

    // Placas de frenagem (150m, 100m, 50m)
    for (const pct of this.brakingPercentages) {
      const cornerSeg = Math.floor(total * pct);
      const seg = this.segments[cornerSeg];
      const side = (seg && seg.curve < 0) ? 1.38 : -1.38;
      if (!(seg && seg.hasPit && Math.sign(side) === seg.pitSide)) {
        this.addBrakingBoards(cornerSeg, side);
      }
    }

    const isUrban = this.theme === 'monaco';

    for (let i = 8; i < total - 8; i++) {
      const seg = this.segments[i];
      if (seg.isTunnel) continue;

      // Placas amarelas de curva acentuada
      if (Math.abs(seg.curve) > 2.5 && i % 9 === 0) {
        const side = seg.curve > 0 ? -1.4 : 1.4;
        if (!(seg.hasPit && Math.sign(side) === seg.pitSide)) {
          const signType = seg.curve > 0 ? 'signRight' : 'signLeft';
          this.addSprite(i, signType, side);
        }
      }

      const hasStandLeft  = grandstandZones.has(`${i}_-1`);
      const hasStandRight = grandstandZones.has(`${i}_1`);

      if (isUrban) {
        if (i % 6 === 0 && !(seg.hasPit && seg.pitSide < 0) && !hasStandLeft) {
          this.addSprite(i, 'cityBuilding', -1.85);
        }
        if (i % 6 === 3 && !(seg.hasPit && seg.pitSide > 0) && !hasStandRight) {
          this.addSprite(i, 'cityBuilding', 1.85);
        }
      } else {
        if (i % 8 === 0 && !(seg.hasPit && seg.pitSide < 0) && !hasStandLeft) {
          this.addSprite(i, 'tree', -1.75 - Math.random() * 1.4);
        }
        if (i % 10 === 0 && !(seg.hasPit && seg.pitSide > 0) && !hasStandRight) {
          this.addSprite(i, 'tree', 1.75 + Math.random() * 1.4);
        }
        if (i % 18 === 0) {
          const side = i % 2 === 0 ? -1.45 : 1.45;
          const hasStandSide = grandstandZones.has(`${i}_${Math.sign(side)}`);
          if (!(seg.hasPit && Math.sign(side) === seg.pitSide) && !hasStandSide) {
            this.addSprite(i, 'bush', side);
          }
        }
      }
    }
  }

  lastY() {
    return this.segments.length === 0 ? 0 : this.segments[this.segments.length - 1].p2.y;
  }

  easeInOut(a, b, percent) {
    return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
  }

  get totalLength() {
    return this.segments.length * CONFIG.SEGMENT_LENGTH;
  }

  findSegment(z) {
    const index = Math.floor(z / CONFIG.SEGMENT_LENGTH) % this.segments.length;
    return this.segments[index < 0 ? index + this.segments.length : index];
  }
}