import { Track } from './track.js';
import { Player } from './player.js';
import { Renderer } from './renderer.js';
import { Background } from './background.js';
import { AudioEngine } from './audio.js';
import { Minimap } from './minimap.js';
import { RivalsManager } from './rivals.js';
import { CHAMPIONSHIP_TRACKS } from './tracks-data.js';

const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4];
const STORAGE_KEY = 'f1_16bit_championship_v1';

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
const lightBulbs = startLightsEl ? startLightsEl.querySelectorAll('.light') : [];

const startMenu = document.getElementById('start-menu');
const menuTrackBadge = document.getElementById('menu-track-badge');
const trackButtons = document.querySelectorAll('#track-options .opt-btn');
const teamButtons = document.querySelectorAll('#team-options .opt-btn');
const diffButtons = document.querySelectorAll('#diff-options .opt-btn');
const startRaceBtn = document.getElementById('start-race-btn');
const viewStandingsBtn = document.getElementById('view-standings-btn');

const finishScreen = document.getElementById('finish-screen');
const finishTitle = document.getElementById('finish-title');
const finishSubtitle = document.getElementById('finish-subtitle');
const raceSummaryStats = document.getElementById('race-summary-stats');
const finalPos = document.getElementById('final-pos');
const finalTotalTime = document.getElementById('final-total-time');
const finalBestTime = document.getElementById('final-best-time');
const racesCompletedEl = document.getElementById('races-completed');
const standingsListEl = document.getElementById('standings-list');

const nextGpBtn = document.getElementById('next-gp-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const resetChampBtn = document.getElementById('reset-champ-btn');

let selectedTrackId = 'monza';
let selectedTeamName = 'FERRARI';
let selectedLivery = { body: '#d91e18', wing: '#b01510', accent: '#ffcc00' };
let selectedDifficulty = 1.0;
let inMenu = true;
let pointsAwardedThisRace = false;

const track = new Track(selectedTrackId);
const player = new Player();
const renderer = new Renderer(canvas);
const background = new Background();
background.setTheme(track.theme);
const audio = new AudioEngine();
const minimap = new Minimap(track);
const rivals = new RivalsManager(track);

function loadChampionship() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.points) return saved;
  } catch (e) {}
  return createFreshChampionship();
}

function createFreshChampionship() {
  const points = { player: 0 };
  for (const car of rivals.cars) {
    points[car.name] = 0;
  }
  return { racesCompleted: 0, points };
}

let championship = loadChampionship();

function saveChampionship() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(championship));
  } catch (e) {}
}

function selectTrack(trackId) {
  selectedTrackId = trackId;
  track.loadTrack(trackId);
  background.setTheme(track.theme);
  minimap.buildPoints(track);

  trackButtons.forEach((b) => {
    b.classList.toggle('selected', b.dataset.track === trackId);
  });
  if (menuTrackBadge) {
    menuTrackBadge.textContent = track.fullName;
  }
}

trackButtons.forEach((btn) => {
  btn.addEventListener('click', () => selectTrack(btn.dataset.track));
});

teamButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    teamButtons.forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTeamName = btn.dataset.team;
    selectedLivery = {
      body: btn.dataset.body,
      wing: btn.dataset.wing,
      accent: btn.dataset.accent
    };
    player.setLivery(selectedLivery);
  });
});

diffButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    diffButtons.forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedDifficulty = parseFloat(btn.dataset.diff);
  });
});

function startNewRace() {
  audio.start();
  selectTrack(selectedTrackId);
  player.setLivery(selectedLivery);
  rivals.setDifficulty(selectedDifficulty);
  player.reset();
  rivals.reset(track);
  pointsAwardedThisRace = false;

  startMenu.classList.add('hidden');
  finishScreen.classList.add('hidden');
  inMenu = false;
}

startRaceBtn.addEventListener('click', startNewRace);

viewStandingsBtn.addEventListener('click', () => {
  finishTitle.textContent = 'CAMPEONATO MUNDIAL F1';
  finishSubtitle.textContent = 'PONTUAÇÃO ACUMULADA DA TEMPORADA';
  raceSummaryStats.classList.add('hidden');
  restartBtn.classList.add('hidden');
  renderStandingsTable(null);
  finishScreen.classList.remove('hidden');
});

nextGpBtn.addEventListener('click', () => {
  const currentIdx = CHAMPIONSHIP_TRACKS.findIndex((t) => t.id === selectedTrackId);
  const nextIdx = (currentIdx + 1) % CHAMPIONSHIP_TRACKS.length;
  selectTrack(CHAMPIONSHIP_TRACKS[nextIdx].id);
  startNewRace();
});

restartBtn.addEventListener('click', startNewRace);

menuBtn.addEventListener('click', () => {
  finishScreen.classList.add('hidden');
  startLightsEl.classList.add('hidden');
  pitBanner.classList.add('hidden');
  startMenu.classList.remove('hidden');
  inMenu = true;
});

resetChampBtn.addEventListener('click', () => {
  championship = createFreshChampionship();
  saveChampionship();
  renderStandingsTable(null);
});

function renderStandingsTable(lastRaceGains) {
  racesCompletedEl.textContent = championship.racesCompleted;

  const rows = [
    {
      id: 'player',
      name: `${selectedTeamName} (VOCÊ)`,
      pts: championship.points.player || 0,
      isPlayer: true
    }
  ];

  for (const car of rivals.cars) {
    rows.push({
      id: car.name,
      name: car.name,
      pts: championship.points[car.name] || 0,
      isPlayer: false
    });
  }

  rows.sort((a, b) => b.pts - a.pts);

  standingsListEl.innerHTML = rows
    .map((r, idx) => {
      const gain = lastRaceGains && lastRaceGains[r.id] ? ` (+${lastRaceGains[r.id]})` : '';
      return `
        <div class="standing-row ${r.isPlayer ? 'player-row' : ''}">
          <span>${idx + 1}º ${r.name}</span>
          <span>${r.pts} PTS${gain}</span>
        </div>
      `;
    })
    .join('');
}

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!inMenu) audio.start();
  if (e.code === 'KeyM') audio.toggleMute();
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--:--.--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

function updateHUD() {
  speedDisplay.textContent = String(player.kmh).padStart(3, '0');
  gearDisplay.textContent = player.gear;
  rpmFill.style.width = `${Math.round(player.rpmRatio * 100)}%`;

  if (!inMenu && !player.raceStarted) {
    startLightsEl.classList.remove('hidden');
    lightBulbs.forEach((bulb, idx) => {
      bulb.classList.toggle('on', idx < player.lightsCount);
    });
  } else {
    startLightsEl.classList.add('hidden');
  }

  const rank = (typeof player.finalRank === 'number' && player.finalRank > 0)
    ? player.finalRank
    : rivals.getPlayerRank(player, track);
  const totalCars = rivals.cars.length + 1;

  posDisplay.textContent = `${rank} / ${totalCars}`;
  lapDisplay.textContent = `${player.lap} / ${player.totalLaps}`;
  timeDisplay.textContent = formatTime(player.currentLapTime);
  bestDisplay.textContent = formatTime(player.bestLapTime);

  const wear = Math.round(player.tireWear);
  tireFill.style.width = `${wear}%`;
  tireFill.style.backgroundColor = wear > 50 ? '#00e676' : (wear > 25 ? '#ffcc00' : '#ff1744');

  if (!inMenu && player.pitStatusText) {
    pitBanner.textContent = player.pitStatusText;
    pitBanner.classList.remove('hidden');
  } else {
    pitBanner.classList.add('hidden');
  }

  if (!inMenu && player.raceFinished && finishScreen.classList.contains('hidden')) {
    const gains = {};
    if (!pointsAwardedThisRace) {
      pointsAwardedThisRace = true;
      const order = rivals.getStandingsOrder(player, track, selectedTeamName);

      // Garante que a posição congelada do jogador na chegada seja respeitada
      const playerIdx = order.findIndex((e) => e.isPlayer);
      if (playerIdx !== -1 && rank - 1 !== playerIdx) {
        const [pEntry] = order.splice(playerIdx, 1);
        order.splice(rank - 1, 0, pEntry);
      }

      order.forEach((entry, idx) => {
        const pts = F1_POINTS[idx] || 0;
        championship.points[entry.id] = (championship.points[entry.id] || 0) + pts;
        gains[entry.id] = pts;
      });
      championship.racesCompleted += 1;
      saveChampionship();
    }

    finishTitle.textContent = 'BANDEIRADA FINAL!';
    finishSubtitle.textContent = `${track.fullName} • 3 VOLTAS`;
    raceSummaryStats.classList.remove('hidden');
    restartBtn.classList.remove('hidden');

    finalPos.textContent = `${rank}º LUGAR`;
    finalTotalTime.textContent = formatTime(player.totalRaceTime);
    finalBestTime.textContent = formatTime(player.bestLapTime);

    renderStandingsTable(gains);
    finishScreen.classList.remove('hidden');
  }
}

let lastTime = performance.now();

function gameLoop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (!inMenu) {
    player.update(dt, keys, track, rivals, audio);
    rivals.update(dt, track, player, player.raceStarted, audio);
    background.update(dt, track, player);
  }

  audio.update(player, inMenu);
  renderer.render(track, player, background, minimap, rivals);
  updateHUD();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

function fitGameToScreen() {
  const container = document.getElementById('game-container');
  if (!container) return;

  const scaleX = window.innerWidth / 960;
  const scaleY = window.innerHeight / 540;
  const scale = Math.min(scaleX, scaleY);

  container.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', fitGameToScreen);
window.addEventListener('load', fitGameToScreen);
fitGameToScreen();

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF') {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
});