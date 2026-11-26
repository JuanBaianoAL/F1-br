import { Track } from './track.js';
import { Player } from './player.js';
import { Renderer } from './renderer.js';
import { Background } from './background.js';
import { AudioEngine } from './audio.js';
import { Minimap } from './minimap.js';
import { RivalsManager } from './rivals.js';

const canvas = document.getElementById('gameCanvas');
const speedDisplay = document.getElementById('speed-display');
const gearDisplay = document.getElementById('gear-display');
const rpmFill = document.getElementById('rpm-fill');

const posDisplay = document.getElementById('pos-display');
const lapDisplay = document.getElementById('lap-display');
const timeDisplay = document.getElementById('time-display');
const bestDisplay = document.getElementById('best-display');
const tireFill = document.getElementById('tire-fill');
const pitBanner = document.getElementById('pit-banner');

const startLightsEl = document.getElementById('start-lights');
const lightBulbs = startLightsEl.querySelectorAll('.light');

const finishScreen = document.getElementById('finish-screen');
const finalPos = document.getElementById('final-pos');
const finalTotalTime = document.getElementById('final-total-time');
const finalBestTime = document.getElementById('final-best-time');
const restartBtn = document.getElementById('restart-btn');

const track = new Track();
const player = new Player();
const renderer = new Renderer(canvas);
const background = new Background();
const audio = new AudioEngine();
const minimap = new Minimap(track);
const rivals = new RivalsManager(track);

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  audio.start();
  if (e.code === 'KeyM') {
    audio.toggleMute();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function formatTime(seconds) {
  if (seconds === null) return '--:--.--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

restartBtn.addEventListener('click', () => {
  player.reset();
  rivals.reset(track);
  finishScreen.classList.add('hidden');
});

function updateHUD() {
  speedDisplay.textContent = String(player.kmh).padStart(3, '0');
  gearDisplay.textContent = player.gear;
  rpmFill.style.width = `${Math.round(player.rpmRatio * 100)}%`;

  // Semáforo de Largada
  if (!player.raceStarted) {
    startLightsEl.classList.remove('hidden');
    lightBulbs.forEach((bulb, idx) => {
      bulb.classList.toggle('on', idx < player.lightsCount);
    });
  } else {
    startLightsEl.classList.add('hidden');
  }

  // Posição, Voltas, Tempo e Desgaste de Pneus
  const rank = rivals.getPlayerRank(player, track);
  const totalCars = rivals.cars.length + 1;
  posDisplay.textContent = `${rank} / ${totalCars}`;
  lapDisplay.textContent = `${player.lap} / ${player.totalLaps}`;
  timeDisplay.textContent = formatTime(player.currentLapTime);
  bestDisplay.textContent = formatTime(player.bestLapTime);

  const wear = Math.round(player.tireWear);
  tireFill.style.width = `${wear}%`;
  tireFill.style.backgroundColor = wear > 50 ? '#00e676' : (wear > 25 ? '#ffcc00' : '#ff1744');

  if (player.pitStatusText) {
    pitBanner.textContent = player.pitStatusText;
    pitBanner.classList.remove('hidden');
  } else {
    pitBanner.classList.add('hidden');
  }

  if (player.raceFinished && finishScreen.classList.contains('hidden')) {
    finalPos.textContent = `${rank}º LUGAR`;
    finalTotalTime.textContent = formatTime(player.totalRaceTime);
    finalBestTime.textContent = formatTime(player.bestLapTime);
    finishScreen.classList.remove('hidden');
  }
}

let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  player.update(dt, keys, track);
  rivals.update(dt, track, player, player.raceStarted, audio);
  background.update(dt, track, player);
  audio.update(player);

  renderer.render(track, player, background, minimap, rivals);
  updateHUD();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);