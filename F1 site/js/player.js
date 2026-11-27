import { CONFIG } from './config.js';

export class Player {
  constructor() {
    this.livery = { body: '#d91e18', wing: '#b01510', accent: '#ffcc00' };
    this.reset();
  }

  setLivery(livery) {
    this.livery = livery;
  }

  reset() {
    this.position = 0;
    this.x = -0.42;
    this.speed = 0;
    this.lateralVelocity = 0;
    this.shakeTimer = 0;
    this.steerDirection = 0;
    this.isBraking = false;
    this.isAccelerating = false;
    this.inSlipstream = false;

    // Telemetria
    this.kmh = 0;
    this.gear = 1;
    this.rpmRatio = 0;

    // Semáforo de Largada F1
    this.startTimer = 0;
    this.lightsCount = 1;
    this.lastBeepLight = 0;
    this.raceStarted = false;
    this.goBannerTimer = 0;

    // Corrida (3 Voltas)
    this.lap = 1;
    this.totalLaps = 3;
    this.currentLapTime = 0;
    this.totalRaceTime = 0;
    this.bestLapTime = null;
    this.raceFinished = false;
    this.finalRank = null;

    // Pneus e Pit Lane
    this.tireWear = 100;
    this.pitTimer = 0;
    this.pitDoneThisLap = false;
    this.pitStatusText = '';
  }

  update(dt, keys, track, rivals = null, audio = null) {
    if (this.raceFinished) {
      this.speed = Math.max(0, this.speed - CONFIG.DECEL * dt);
      this.position = (this.position + this.speed * dt) % track.totalLength;
      this.updateTelemetry(this.speed / CONFIG.MAX_SPEED);
      return;
    }

    this.isAccelerating = Boolean(keys.ArrowUp || keys.KeyW);
    this.isBraking = Boolean(keys.ArrowDown || keys.KeyS);
    const turnLeft = Boolean(keys.ArrowLeft || keys.KeyA);
    const turnRight = Boolean(keys.ArrowRight || keys.KeyD);

    // Sequência do Semáforo com bipes sincronizados
    if (!this.raceStarted) {
      this.startTimer += dt;
      if (this.startTimer < 4.0) {
        this.lightsCount = Math.min(5, Math.floor(this.startTimer / 0.8) + 1);
        if (this.lightsCount > this.lastBeepLight) {
          this.lastBeepLight = this.lightsCount;
          if (audio) audio.playStartBeep(false);
        }
      } else {
        this.lightsCount = 0;
        this.raceStarted = true;
        this.goBannerTimer = 1.2;
        if (audio) audio.playStartBeep(true);
      }

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
    const pitSide = currentSegment.pitSide ?? -1;
    const inPitLane = Boolean(
      currentSegment.hasPit &&
      ((pitSide < 0 && this.x <= -1.20 && this.x >= -2.42) ||
       (pitSide > 0 && this.x >= 1.20 && this.x <= 2.42))
    );
    const isOffroad = !inPitLane && Math.abs(this.x) > 1.05;

    // Verifica Vácuo (Slipstream) atrás de algum rival
    this.inSlipstream = false;
    if (rivals && this.speed > CONFIG.MAX_SPEED * 0.55 && !inPitLane) {
      for (const car of rivals.cars) {
        const dz = rivals.getRelativeZ(car.z, this.position, track.totalLength);
        if (dz > 260 && dz < 1650 && Math.abs(car.x - this.x) < 0.30) {
          this.inSlipstream = true;
          break;
        }
      }
    }

    // 1. Pit Stop ou Aceleração/Freio
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
      } else if (inPitLane) {
        this.pitStatusText = 'PIT LIMITER 80 KM/H';
      } else if (this.inSlipstream) {
        this.pitStatusText = 'VÁCUO ATIVO! (+22 KM/H)';
      } else {
        this.pitStatusText = '';
      }

      const accelBoost = this.inSlipstream ? 1.25 : 1.0;
      const brakePower = Math.abs(CONFIG.BRAKING || 14500);
      const pitLimitSpeed = ((80 / (CONFIG.MAX_KMH || 360)) * CONFIG.MAX_SPEED);

      if (this.isAccelerating) {
        // Dentro do box, não deixa acelerar além de 80 km/h
        if (!inPitLane || this.speed < pitLimitSpeed) {
          this.speed += CONFIG.ACCEL * accelBoost * dt;
        }
      } else if (this.isBraking) {
        this.speed -= brakePower * dt;
      } else {
        this.speed -= CONFIG.DECEL * dt;
      }
    }

    // 2. Limites de velocidade (Pit, Grama ou Vácuo)
    const effectiveMaxSpeed = this.inSlipstream ? CONFIG.MAX_SPEED * 1.08 : CONFIG.MAX_SPEED;
    const pitLimitSpeed = ((80 / (CONFIG.MAX_KMH || 360)) * CONFIG.MAX_SPEED);
    const brakePower = Math.abs(CONFIG.BRAKING || 14500);

    if (inPitLane) {
      if (this.speed > pitLimitSpeed) {
        // Freia forte ao entrar rápido no pit e crava em 80 km/h quando atingir o limite
        this.speed = Math.max(pitLimitSpeed, this.speed - brakePower * 1.6 * dt);
      }
    } else if (isOffroad && this.speed > CONFIG.OFFROAD_LIMIT) {
      this.speed -= CONFIG.OFFROAD_DECEL * dt;
    }

    // Dispara Pit Stop + som da chave pneumática
    if (inPitLane && currentSegment.isPitBox && this.speed < 1400 && this.tireWear < 95 && !this.pitDoneThisLap) {
      this.pitTimer = 2.5;
      this.pitDoneThisLap = true;
      if (audio) audio.playPitDrill();
    }

    this.speed = Math.max(0, Math.min(effectiveMaxSpeed, this.speed));

    // 3. Avança na pista e calcula posição final ANTES de zerar position
    this.position += this.speed * dt;
    if (this.position >= track.totalLength) {
      if (this.lap >= this.totalLaps && rivals) {
        this.finalRank = rivals.getPlayerRank(this, track);
      }
      this.completeLap(audio);
      this.position -= track.totalLength;
    }

    // 4. Desgaste gradual dos pneus (~25% por volta limpa = dura a corrida toda de 3 voltas)
    const speedRatio = Math.min(1, this.speed / CONFIG.MAX_SPEED);
    const wearMultiplier = isOffroad ? 1.15 : 0.34;
    this.tireWear = Math.max(15, this.tireWear - speedRatio * wearMultiplier * dt);

    // 5. Direção, Força Centrífuga e Rebote Lateral
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
    this.x += this.lateralVelocity * dt;
    this.lateralVelocity *= Math.pow(0.04, dt);

    const maxLat = inPitLane ? 2.35 : 2.1;
    this.x = Math.max(-maxLat, Math.min(maxLat, this.x));

    this.updateTelemetry(this.speed / CONFIG.MAX_SPEED);
  }

  completeLap(audio = null) {
    if (this.bestLapTime === null || this.currentLapTime < this.bestLapTime) {
      this.bestLapTime = this.currentLapTime;
    }

    this.pitDoneThisLap = false;

    if (this.lap >= this.totalLaps) {
      this.raceFinished = true;
      if (audio) audio.playVictoryFanfare();
    } else {
      this.lap += 1;
      this.currentLapTime = 0;
    }
  }

  updateTelemetry(rawSpeedRatio) {
    const maxKmh = CONFIG.MAX_KMH || 360;
    this.kmh = Math.round(rawSpeedRatio * maxKmh);

    if (this.speed === 0) {
      this.gear = 1;
      this.rpmRatio = 0;
      return;
    }

    const clampedRatio = Math.min(0.999, rawSpeedRatio);
    const totalGears = CONFIG.TOTAL_GEARS;
    this.gear = Math.min(totalGears, Math.floor(clampedRatio * totalGears) + 1);

    const gearSpan = 1 / totalGears;
    this.rpmRatio = Math.min(1, (clampedRatio % gearSpan) / gearSpan);
  }
}