import { CONFIG } from './config.js';

const RIVAL_DRIVERS = [
  { name: 'A. SENNA',      color: '#ff2222', ratio: 0.96 },
  { name: 'A. PROST',      color: '#0055ff', ratio: 0.94 },
  { name: 'N. MANSELL',    color: '#ffcc00', ratio: 0.92 },
  { name: 'N. PIQUET',     color: '#00cc44', ratio: 0.90 },
  { name: 'M. SCHUMACHER', color: '#ff6600', ratio: 0.88 },
  { name: 'M. HÄKKINEN',   color: '#9933ff', ratio: 0.86 },
  { name: 'G. BERGER',     color: '#00cccc', ratio: 0.84 }
];

export class RivalsManager {
  constructor(track) {
    this.cars = [];
    this.sparks = [];
    this.difficulty = 1.0;
    this.reset(track);
  }

  setDifficulty(mult) {
    this.difficulty = mult;
  }

  reset(track) {
    this.cars = [];
    this.sparks = [];

    for (let i = 0; i < RIVAL_DRIVERS.length; i++) {
      const driver = RIVAL_DRIVERS[i];
      const gridRow = Math.floor(i / 2) + 1;
      const laneSide = (i % 2 === 0) ? -0.42 : 0.42;
      const startZ = gridRow * 480;

      this.cars.push({
        id: i + 1,
        name: driver.name,
        z: startZ,
        x: laneSide,
        vx: 0,
        targetX: laneSide,
        speed: 0,
        maxSpeed: CONFIG.MAX_SPEED * driver.ratio * this.difficulty,
        color: driver.color,
        lap: 1,
        aiTimer: Math.random() * 2,
        hitCooldown: 0
      });
    }
  }

  update(dt, track, player, canMove, audio = null) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 450 * dt;
      s.life -= dt;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    for (const car of this.cars) {
      if (car.hitCooldown > 0) car.hitCooldown -= dt;

      if (!canMove) {
        car.speed = 0;
        continue;
      }

      const seg = track.findSegment(car.z);
      const curvePenalty = Math.min(0.28, Math.abs(seg.curve) * 0.055);
      const desiredSpeed = car.maxSpeed * (1 - curvePenalty);

      if (car.speed < desiredSpeed) {
        car.speed += CONFIG.ACCEL * 0.85 * this.difficulty * dt;
      } else {
        car.speed -= CONFIG.DECEL * 0.9 * dt;
      }

      car.speed = Math.max(0, Math.min(car.maxSpeed, car.speed));
      car.z += car.speed * dt;

      if (car.z >= track.totalLength) {
        car.z -= track.totalLength;
        car.lap += 1;
      }

      car.aiTimer -= dt;
      if (car.aiTimer <= 0) {
        car.aiTimer = 2.0 + Math.random() * 3.0;
        const lanes = [-0.55, 0, 0.55];
        car.targetX = lanes[Math.floor(Math.random() * lanes.length)];
      }

      const dz = this.getRelativeZ(car.z, player.position, track.totalLength);
      if (dz > 0 && dz < 900 && Math.abs(car.x - player.x) < 0.45) {
        car.targetX = player.x > 0 ? -0.5 : 0.5;
      }

      car.x += car.vx * dt;
      car.vx *= Math.pow(0.05, dt);
      car.x += (car.targetX - car.x) * 2.2 * dt;
      car.x = Math.max(-0.82, Math.min(0.82, car.x));

      const hitZ = 240;
      const hitX = 0.34;

      if (Math.abs(dz) < hitZ && Math.abs(car.x - player.x) < hitX) {
        const pushDir = player.x >= car.x ? 1 : -1;

        if (dz > 80 && player.speed > car.speed) {
          const impactDiff = player.speed - car.speed;
          player.speed = Math.max(car.speed * 0.75, player.speed - impactDiff * 0.65);
          car.speed = Math.min(car.maxSpeed * 1.12, car.speed + impactDiff * 0.45);
          player.position = car.z - hitZ;
          player.lateralVelocity += pushDir * 1.6;
          car.vx -= pushDir * 1.4;
        } else {
          player.speed *= 0.96;
          player.lateralVelocity += pushDir * 2.6;
          car.vx -= pushDir * 2.4;
          player.x = car.x + pushDir * (hitX + 0.02);
        }

        if (car.hitCooldown <= 0) {
          car.hitCooldown = 0.35;
          player.shakeTimer = 2.0;
          player.tireWear = Math.max(15, player.tireWear - 4.5);
          this.spawnSparks(CONFIG.WIDTH / 2 - pushDir * 35, CONFIG.HEIGHT - 72);
          if (audio) audio.playCrash();
        }
      }
    }
  }

  spawnSparks(screenX, screenY) {
    for (let i = 0; i < 14; i++) {
      this.sparks.push({
        x: screenX,
        y: screenY,
        vx: (Math.random() - 0.5) * 320,
        vy: -80 - Math.random() * 180,
        life: 0.2 + Math.random() * 0.2,
        color: Math.random() > 0.4 ? '#ffcc00' : '#ff5500'
      });
    }
  }

  renderSparks(ctx) {
    for (const s of this.sparks) {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, 4, 4);
    }
  }

  getRelativeZ(carZ, playerZ, totalLength) {
    let dz = carZ - playerZ;
    if (dz < -totalLength / 2) dz += totalLength;
    if (dz > totalLength / 2) dz -= totalLength;
    return dz;
  }

  getPlayerRank(player, track) {
    const playerTotalDist = (player.lap - 1) * track.totalLength + player.position;
    let rank = 1;
    for (const car of this.cars) {
      const carTotalDist = (car.lap - 1) * track.totalLength + car.z;
      if (carTotalDist > playerTotalDist) rank++;
    }
    return rank;
  }

  getStandingsOrder(player, track, playerTeamName = 'VOCÊ') {
    const entries = [
      {
        id: 'player',
        name: `${playerTeamName} (VOCÊ)`,
        isPlayer: true,
        dist: (player.lap - 1) * track.totalLength + player.position
      }
    ];

    for (const car of this.cars) {
      entries.push({
        id: car.name,
        name: car.name,
        isPlayer: false,
        dist: (car.lap - 1) * track.totalLength + car.z
      });
    }

    entries.sort((a, b) => b.dist - a.dist);
    return entries;
  }
}