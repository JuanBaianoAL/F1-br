export class Minimap {
  constructor(track) {
    this.x = 16;
    this.y = 16;
    this.size = 112;
    this.points = [];
    this.buildPoints(track);
  }

  buildPoints(track) {
    const raw = track.mapPoints && track.mapPoints.length > 0
      ? track.mapPoints
      : [{ x: 0, y: 0 }];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const p of raw) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const span = Math.max(maxX - minX, maxY - minY) || 1;
    const pad = 16;
    const drawArea = this.size - pad * 2;
    const offsetX = (drawArea - (maxX - minX) * (drawArea / span)) / 2;
    const offsetY = (drawArea - (maxY - minY) * (drawArea / span)) / 2;

    this.points = raw.map((p) => ({
      x: this.x + pad + offsetX + (p.x - minX) * (drawArea / span),
      y: this.y + pad + 6 + offsetY + (p.y - minY) * (drawArea / span)
    }));
  }

  render(ctx, player, track, rivals = null) {
    ctx.save();

    ctx.fillStyle = 'rgba(15, 15, 25, 0.88)';
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.size, this.size);

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(track.minimapTitle || 'CIRCUIT', this.x + this.size / 2, this.y + 12);
    ctx.strokeStyle = '#9999aa';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    this.points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.stroke();

    const startPt = this.points[0];
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startPt.x - 3, startPt.y - 3, 6, 6);

    if (rivals) {
      for (const car of rivals.cars) {
        const carSeg = track.findSegment(car.z);
        const rPt = this.points[carSeg.index] || this.points[0];
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.arc(rPt.x, rPt.y, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const currentSeg = track.findSegment(player.position);
    const pPt = this.points[currentSeg.index] || this.points[0];

    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(pPt.x, pPt.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}