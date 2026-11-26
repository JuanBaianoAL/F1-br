import { CONFIG } from './config.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.position = 0;
    this.x = -0.42; // Larga na 8ª posição do grid (lado esquerdo)
    this.speed = 0;
    this.steerDirection = 0;
    this.isBraking = false;
    this.isAccelerating = false;
    this.lateralVelocity = 0; // Velocidade lateral para rebote de colisão
    this.shakeTimer = 0; // Timer para tremer o carro ao bater

    // Telemetria
    this.kmh = 0;
    this.gear = 1;
    this.rpmRatio = 0;

    // Semáforo de Largada F1
    this.startTimer = 0;
    this.lightsCount = 1; // 1 a 5 luzes acesas; 0 = apagadas (largada!)
    this.raceStarted = false;
    this.goBannerTimer = 0;

    // Sistema de Corrida (3 Voltas)
    this.lap = 1;
    this.totalLaps = 3;
    this.currentLapTime = 0;
    this.totalRaceTime = 0;
    this.bestLapTime = null;
    this.raceFinished = false;

    // Pneus e Pit Lane
    this.tireWear = 100;
    this.pitTimer = 0;
    this.pitDoneThisLap = false;
    this.pitStatusText = '';
  }

  update(dt, keys, track) {
    if (this.raceFinished) {
        this.x += this.lateralVelocity * dt;
        this.lateralVelocity *= Math.pow(0.04, dt);
      if (this.shakeTimer > 0) this.shakeTimer -= dt;
      this.speed = Math.max(0, this.speed - CONFIG.DECEL * dt);
      this.position = (this.position + this.speed * dt) % track.totalLength;
      this.updateTelemetry(this.speed / CONFIG.MAX_SPEED);
      return;
    }

    this.isAccelerating = Boolean(keys.ArrowUp || keys.KeyW);
    this.isBraking = Boolean(keys.ArrowDown || keys.KeyS);
    const turnLeft = Boolean(keys.ArrowLeft || keys.KeyA);
    const turnRight = Boolean(keys.ArrowRight || keys.KeyD);

    // Sequência do Semáforo de Largada (5 luzes acendem a cada 0.8s, depois apagam)
    if (!this.raceStarted) {
      this.startTimer += dt;
      if (this.startTimer < 4.0) {
        this.lightsCount = Math.min(5, Math.floor(this.startTimer / 0.8) + 1);
      } else {
        this.lightsCount = 0;
        this.raceStarted = true;
        this.goBannerTimer = 1.2;
      }

      // Permite acelerar o motor parado no grid (sobe o RPM sem andar!)
      this.speed = 0;
      this.rpmRatio = this.isAccelerating
        ? Math.min(1, this.rpmRatio + 1.8 * dt)
        : Math.max(0, this.rpmRatio - 2.2 * dt);
      this.pitStatusText = this.isAccelerating ? 'SEGURE O FREIO! AGUARDE AS LUZES!' : 'PREPARE-SE PARA A LARGADA';
      return;
    }

    if (this.goBannerTimer > 0) {
      this.goBannerTimer -= dt;
    }

    this.currentLapTime += dt;
    this.totalRaceTime += dt;

    const currentSegment = track.findSegment(this.position);
    const inPitLane = Boolean(currentSegment.hasPit && this.x <= -1.22 && this.x >= -1.98);
    const isOffroad = !inPitLane && Math.abs(this.x) > 1.05;

    // 1. Parada no Box (Pit Stop) ou Aceleração/Freio normal
    if (this.pitTimer > 0) {
      this.speed = 0;
      this.pitTimer -= dt;
      this.pitStatusText = `PIT STOP... ${this.pitTimer.toFixed(1)}s`;
      if (this.pitTimer <= 0) {
        this.tireWear = 100;
        this.pitStatusText = '';
      }
    } else {
      if (this.goBannerTimer > 0) {
        this.pitStatusText = 'LARGADA! ACELERE!';
      } else {
        this.pitStatusText = inPitLane ? 'PIT LIMITER 80 KM/H' : '';
      }

      if (this.isAccelerating) {
        this.speed += CONFIG.ACCEL * dt;
      } else if (this.isBraking) {
        this.speed -= CONFIG.BRAKING * dt;
      } else {
        this.speed -= CONFIG.DECEL * dt;
      }
    }

    // 2. Limitador do Pit Lane (80 km/h) ou lentidão na grama
    const pitLimitSpeed = (80 / 280) * CONFIG.MAX_SPEED;
    if (inPitLane && this.speed > pitLimitSpeed) {
      this.speed -= CONFIG.BRAKING * dt;
    } else if (isOffroad && this.speed > CONFIG.OFFROAD_LIMIT) {
      this.speed -= CONFIG.OFFROAD_DECEL * dt;
    }

    // Dispara o Pit Stop ao reduzir sobre a marca amarela do Box
    if (inPitLane && currentSegment.isPitBox && this.speed < 1400 && this.tireWear < 95 && !this.pitDoneThisLap) {
      this.pitTimer = 2.5;
      this.pitDoneThisLap = true;
    }

    this.speed = Math.max(0, Math.min(CONFIG.MAX_SPEED, this.speed));

    // 3. Avança na pista e verifica cruzamento da linha de chegada
    this.position += this.speed * dt;
    if (this.position >= track.totalLength) {
      this.position -= track.totalLength;
      this.completeLap();
    }

    // 4. Desgaste gradual dos pneus
    const speedRatio = this.speed / CONFIG.MAX_SPEED;
    const wearMultiplier = isOffroad ? 2.5 : 1.1;
    this.tireWear = Math.max(15, this.tireWear - speedRatio * wearMultiplier * dt);

    // 5. Direção e Força Centrífuga
    const gripFactor = 0.65 + (this.tireWear / 100) * 0.35;
    this.steerDirection = 0;

    if (this.pitTimer <= 0) {
      if (turnLeft) {
        this.x -= CONFIG.STEER_SPEED * gripFactor * speedRatio * dt;
        this.steerDirection = -1;
      }
      if (turnRight) {
        this.x += CONFIG.STEER_SPEED * gripFactor * speedRatio * dt;
        this.steerDirection = 1;
      }
    }

    this.x -= (currentSegment.curve * speedRatio * CONFIG.CENTRIFUGAL / gripFactor) * dt;
    this.x = Math.max(-2.1, Math.min(2.1, this.x));

    this.updateTelemetry(speedRatio);
  }

  completeLap() {
    if (this.bestLapTime === null || this.currentLapTime < this.bestLapTime) {
      this.bestLapTime = this.currentLapTime;
    }

    this.pitDoneThisLap = false;

    if (this.lap >= this.totalLaps) {
      this.raceFinished = true;
    } else {
      this.lap += 1;
      this.currentLapTime = 0;
    }
  }

  updateTelemetry(speedRatio) {
    this.kmh = Math.floor(speedRatio * 280);

    if (this.speed === 0) {
      this.gear = 1;
      this.rpmRatio = 0;
      return;
    }

    const totalGears = CONFIG.TOTAL_GEARS;
    this.gear = Math.min(totalGears, Math.floor(speedRatio * totalGears) + 1);

    const gearSpan = 1 / totalGears;
    this.rpmRatio = Math.min(1, (speedRatio % gearSpan) / gearSpan);
  }
}