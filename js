/* ==========================================================================
   GAME ENGINE & STATE MANAGEMENT
   ========================================================================== */

// Replaceable Birthday Letter Text
const birthdayLetterText = `Dear Youba,

Happy Birthday to my favorite MVP! 🏀❤️

From your sharp basketball IQ to your endless kindness and humor, you light up every room (and court) you step into. Building this interactive experience was just a small way to show you how much you mean to me.

Thank you for being my comfort person, my best friend, and my biggest joy. I'll always be in your corner, supporting you through everything life throws your way.

Here's to another year of big wins, infinite laughs, and unforgettable moments together.

Love always,
Lyna ❤️`;

// State Variables
let currentScore = 0;
const targetScore = 15;
let gameLoopId = null;
let inspectedLockerItems = new Set();

// Audio Synth helper for Web Audio API sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq = 440, duration = 0.1, type = 'sine') {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Show Floating Popups
function showPopupMessage(text) {
  const container = document.getElementById('floating-popups');
  const popup = document.createElement('div');
  popup.className = 'popup-msg';
  popup.innerText = text;
  container.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}

// Navigation Helper
function switchScreen(hideId, showId) {
  document.getElementById(hideId).classList.add('hidden');
  const showEl = document.getElementById(showId);
  showEl.classList.remove('hidden');
}

/* ==========================================================================
   1. BOOT SEQUENCE
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  const bootText = document.getElementById('boot-text');
  const bootProgress = document.getElementById('boot-progress');

  const bootSteps = [
    { text: "CONNECTING TO ARENA...", time: 600, progress: "25%" },
    { text: "AUTHENTICATING PLAYER...", time: 1400, progress: "50%" },
    { text: "LOOKING FOR MVP...", time: 2200, progress: "75%" },
    { text: "MVP FOUND.", time: 3000, progress: "100%" }
  ];

  bootSteps.forEach(step => {
    setTimeout(() => {
      bootText.innerText = step.text;
      bootProgress.style.width = step.progress;
      playBeep(520, 0.08);
    }, step.time);
  });

  setTimeout(() => {
    switchScreen('boot-screen', 'intro-screen');
    playBeep(880, 0.2);
  }, 3800);
});

/* ==========================================================================
   2. INTRO & MAIN MENU NAVIGATION
   ========================================================================== */
document.getElementById('enter-court-btn').addEventListener('click', () => {
  playBeep(600, 0.1);
  switchScreen('intro-screen', 'menu-screen');
});

document.getElementById('credits-btn').addEventListener('click', () => {
  playBeep(400, 0.1);
  document.getElementById('credits-modal').classList.remove('hidden');
});

document.getElementById('close-credits-btn').addEventListener('click', () => {
  playBeep(300, 0.1);
  document.getElementById('credits-modal').classList.add('hidden');
});

document.getElementById('start-game-btn').addEventListener('click', () => {
  playBeep(700, 0.15);
  switchScreen('menu-screen', 'gameplay-screen');
  initCanvasGame();
});

/* ==========================================================================
   3. WARM-UP CANVAS MINI-GAME
   ========================================================================== */
function initCanvasGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set dimensions dynamically
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight * 0.8;

  let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 40,
    width: 50,
    height: 12,
    speed: 7
  };

  let items = [];
  let keys = {};

  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Touch / Drag Controls
  canvas.addEventListener('touchmove', e => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    player.x = touch.clientX - rect.left - player.width / 2;
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
  });

  function spawnItem() {
    const types = ['🏀', '❤️', '⭐'];
    const type = types[Math.floor(Math.random() * types.length)];
    items.push({
      x: Math.random() * (canvas.width - 30),
      y: -30,
      size: 24,
      speed: 2 + Math.random() * 2.5,
      type: type
    });
  }

  let spawnTimer = setInterval(spawnItem, 800);

  function update() {
    // Player Movement
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;

    // Keep inside bounds
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

    // Items update
    for (let i = items.length - 1; i >= 0; i--) {
      let item = items[i];
      item.y += item.speed;

      // Collision Detection
      if (
        item.y + item.size >= player.y &&
        item.x + item.size >= player.x &&
        item.x <= player.x + player.width
      ) {
        items.splice(i, 1);
        currentScore++;
        document.getElementById('score-display').innerText = currentScore;
        playBeep(600 + currentScore * 20, 0.08);

        // Loving Popups during gameplay
        if (currentScore === 3) showPopupMessage("Thank you for being my comfort person ❤️");
        if (currentScore === 7) showPopupMessage("You'll always be my favorite MVP 🏀");
        if (currentScore === 12) showPopupMessage("I'm proud of you my baby ✨");

        if (currentScore >= targetScore) {
          clearInterval(spawnTimer);
          cancelAnimationFrame(gameLoopId);
          setTimeout(transitionToLocker, 500);
          return;
        }
      } else if (item.y > canvas.height) {
        items.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player Paddle (Pixel style basket)
    ctx.fillStyle = '#ff6b00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#38b6ff';
    ctx.fillRect(player.x + 5, player.y + player.height, player.width - 10, 8);

    // Draw Falling Items
    ctx.font = '22px sans-serif';
    items.forEach(item => {
      ctx.fillText(item.type, item.x, item.y);
    });
  }

  function loop() {
    update();
    draw();
    gameLoopId = requestAnimationFrame(loop);
  }

  loop();
}

/* ==========================================================================
   4. LOCKER ROOM SECTION
   ========================================================================== */
function transitionToLocker() {
  switchScreen('gameplay-screen', 'locker-screen');
  showPopupMessage("Warm-up complete! Headed to locker room...");
}

const lockerItems = document.querySelectorAll('.locker-item');
const lockerDialogue = document.getElementById('locker-dialogue');
const finishLockerBtn = document.getElementById('finish-locker-btn');

lockerItems.forEach(item => {
  item.addEventListener('click', () => {
    const msg = item.getAttribute('data-msg');
    lockerDialogue.innerText = msg;
    inspectedLockerItems.add(item.id);
    playBeep(500, 0.1);

    if (inspectedLockerItems.size >= 3) {
      finishLockerBtn.classList.remove('hidden');
    }
  });
});

finishLockerBtn.addEventListener('click', () => {
  playBeep(750, 0.15);
  switchScreen('locker-screen', 'shot-screen');
  initShotMeter();
});

/* ==========================================================================
   5. SHOT METER MINI-GAME
   ========================================================================== */
function initShotMeter() {
  const indicator = document.getElementById('shot-meter-indicator');
  const shootBtn = document.getElementById('shoot-btn');
  const feedback = document.getElementById('shot-feedback');
  let pos = 0;
  let direction = 1;
  let meterInterval;

  meterInterval = setInterval(() => {
    pos += 2.5 * direction;
    if (pos >= 95 || pos <= 0) direction *= -1;
    indicator.style.left = pos + '%';
  }, 20);

  shootBtn.onclick = () => {
    clearInterval(meterInterval);
    playBeep(400, 0.1);

    // Target zone is ~70% to 85%
    if (pos >= 68 && pos <= 87) {
      feedback.innerText = "SPLASH! GREEN RELEASE! 🏀🔥";
      feedback.style.color = "#00ff66";
      playBeep(880, 0.3);
      setTimeout(transitionToLetter, 1200);
    } else {
      feedback.innerText = "Slightly Off! Try again!";
      feedback.style.color = "#ff6b00";
      setTimeout(() => {
        feedback.innerText = "";
        initShotMeter();
      }, 1000);
    }
  };
}

/* ==========================================================================
   6. BIRTHDAY LETTER & TYPEWRITER
   ========================================================================== */
function transitionToLetter() {
  switchScreen('shot-screen', 'letter-screen');
  startTypewriter(birthdayLetterText);
}

function startTypewriter(text) {
  const container = document.getElementById('typewriter-text');
  const nextBtn = document.getElementById('letter-next-btn');
  container.innerText = "";
  let i = 0;

  function type() {
    if (i < text.length) {
      container.innerText += text.charAt(i);
      i++;
      setTimeout(type, 35);
    } else {
      nextBtn.classList.remove('hidden');
    }
  }

  type();
}

document.getElementById('letter-next-btn').addEventListener('click', () => {
  playBeep(600, 0.2);
  switchScreen('letter-screen', 'outro-screen');
});