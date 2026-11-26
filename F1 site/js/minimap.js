export class Minimap {
  constructor(track) {
    this.points = [];
    this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    this.buildMap(track);
  }

  buildMap(track) {
    let x = 0;
    let y = 0;
    let angle = -Math.PI * 0.72;
    const rawPoints = [];

    for (let i = 0; i < track.segments.length; i++) {
      const seg = track.segments[i];
      angle += seg.curve * 0.0158;
      x += Math.cos(angle) * 2;
      y += Math.sin(angle) * 2;
      rawPoints.push({ x, y });
    }

    const endPoint = rawPoints[rawPoints.length - 1];
    const total = rawPoints.length;

    for (let i = 0; i < total; i++) {
      const progress = i / (total - 1);
      const closedX = rawPoints[i].x - endPoint.x * progress;
      const closedY = rawPoints[i].y - endPoint.y * progress;

      this.points.push({ x: closedX, y: closedY });

      if (closedX < this.bounds.minX) this.bounds.minX = closedX;
      if (closedX > this.bounds.maxX) this.bounds.maxX = closedX;
      if (closedY < this.bounds.minY) this.bounds.minY = closedY;
      if (closedY > this.bounds.maxY) this.bounds.maxY = closedY;
    }
  }

  render(ctx, player, track, rivals = null) {
    const boxX = 16;
    const boxY = 16;
    const boxSize = 105;
    const padding = 14;

    ctx.fillStyle = 'rgba(15, 15, 25, 0.78)';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('INTERLAGOS 4.3KM', boxX + 6, boxY + 11);

    const mapW = this.bounds.maxX - this.bounds.minX || 1;
    const mapH = this.bounds.maxY - this.bounds.minY || 1;
    const scale = (boxSize - padding * 2 - 8) / Math.max(mapW, mapH);

    const offsetX = boxX + (boxSize - mapW * scale) / 2 - this.bounds.minX * scale;
    const offsetY = boxY + 6 + (boxSize - mapH * scale) / 2 - this.bounds.minY * scale;

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i += 2) {
      const px = this.points[i].x * scale + offsetX;
      const py = this.points[i].y * scale + offsetY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    const startPt = this.points[0];
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(startPt.x * scale + offsetX - 3, startPt.y * scale + offsetY - 3, 6, 6);

    // Pontos azuis dos adversários no minimapa
    if (rivals) {
      for (const car of rivals.cars) {
        const rIdx = Math.floor((car.z / track.totalLength) * this.points.length) % this.points.length;
        const rPt = this.points[rIdx];
        if (rPt) {
          ctx.fillStyle = '#00bfff';
          ctx.beginPath();
          ctx.arc(rPt.x * scale + offsetX, rPt.y * scale + offsetY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Ponto vermelho do jogador
    const currentIndex = Math.floor((player.position / track.totalLength) * this.points.length) % this.points.length;
    const playerPt = this.points[currentIndex];
    if (playerPt) {
      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.arc(playerPt.x * scale + offsetX, playerPt.y * scale + offsetY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}