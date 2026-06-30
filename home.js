/* ==========================================================================
   GAME DATA REGISTRIES (Easy to Expand)
   ========================================================================== */
const WORLD_REGISTRY = [
    { id: "scrapyard", name: "Scrapyard", icon: "🏭", price: 0 },
    { id: "forest", name: "Forest", icon: "🌲", price: 500 },
    { id: "snow", name: "Snow", icon: "❄️", price: 1000 },
    { id: "desert", name: "Desert", icon: "🏜️", price: 1500 },
    { id: "volcano", name: "Volcano", icon: "🌋", price: 2500 },
    { id: "moon", name: "Moon", icon: "🌕", price: 4000 },
    { id: "cybercity", name: "Cyber City", icon: "🏙️", price: 6000 },
    { id: "candyland", name: "Candy Land", icon: "🍭", price: 8500 },
    { id: "alienplanet", name: "Alien Planet", icon: "👽", price: 12000 }
];

const STYLE_REGISTRY = [
    { id: "none", name: "No Hat", icon: "", price: 0 },
    { id: "construction", name: "Builder", icon: "👷", price: 100 },
    { id: "cowboy", name: "Cowboy", icon: "🤠", price: 250 },
    { id: "pirate", name: "Pirate", icon: "🏴‍☠️", price: 400 },
    { id: "chef", name: "Chef", icon: "👨‍🍳", price: 600 },
    { id: "police", name: "Police Cap", icon: "👮", price: 800 },
    { id: "viking", name: "Viking", icon: "🪖", price: 1200 },
    { id: "space", name: "Spacer", icon: "👩‍🚀", price: 2000 },
    { id: "crown", name: "Robot Crown", icon: "👑", price: 5000 },
    { id: "alien", name: "Antenna", icon: "👽", price: 8000 }
];

/* ==========================================================================
   STATE MANAGEMENT (LocalStorage)
   ========================================================================== */
let gameState = {
    coins: 2450, // Starting demo value
    metal: 152,  // Starting demo value
    unlockedWorlds: ["scrapyard"],
    currentWorld: "scrapyard",
    unlockedStyles: ["none"],
    currentStyle: "none",
    settings: { music: true, sound: true }
};

function initGame() {
    loadState();
    updateHUD();
    updateRobotAppearance();
    initSparks();
}

function loadState() {
    const saved = localStorage.getItem("splatbot_sandbox_save");
    if (saved) {
        // Merge saved data with default object structure to handle updates smoothly
        gameState = { ...gameState, ...JSON.parse(saved) };
    } else {
        saveState();
    }
}

function saveState() {
    localStorage.setItem("splatbot_sandbox_save", JSON.stringify(gameState));
}

function resetProgress() {
    if (confirm("WARNING: Are you sure you want to reset all progress? This cannot be undone!")) {
        playClickSound();
        localStorage.removeItem("splatbot_sandbox_save");
        location.reload();
    }
}

/* ==========================================================================
   UI CONTROLLERS & RENDERING
   ========================================================================== */
function updateHUD() {
    document.getElementById('coin-counter').innerText = gameState.coins.toLocaleString();
    document.getElementById('metal-counter').innerText = gameState.metal.toLocaleString();
    
    // Update Settings UI
    const musicBtn = document.getElementById('toggle-music');
    const soundBtn = document.getElementById('toggle-sound');
    
    musicBtn.innerText = `Music: ${gameState.settings.music ? 'ON' : 'OFF'}`;
    musicBtn.className = `toggle-btn ${gameState.settings.music ? 'on' : ''}`;
    
    soundBtn.innerText = `Sound: ${gameState.settings.sound ? 'ON' : 'OFF'}`;
    soundBtn.className = `toggle-btn ${gameState.settings.sound ? 'on' : ''}`;
}

function updateRobotAppearance() {
    const hatDisplay = document.getElementById('equipped-hat-display');
    const styleObj = STYLE_REGISTRY.find(s => s.id === gameState.currentStyle);
    hatDisplay.innerText = styleObj ? styleObj.icon : "";
    
    // Slight pop animation when changing hats
    hatDisplay.style.transform = "translateX(-50%) scale(1.3)";
    setTimeout(() => hatDisplay.style.transform = "translateX(-50%) scale(1)", 200);
}

/* Modal Management */
function openModal(modalId) {
    playClickSound();
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    
    // Dynamic population based on modal
    if (modalId === 'worlds-modal') renderWorlds();
    if (modalId === 'styles-modal') renderStyles();
}

function closeModal(modalId) {
    playClickSound();
    document.getElementById(modalId).classList.add('hidden');
}

function toggleSetting(type) {
    playClickSound();
    gameState.settings[type] = !gameState.settings[type];
    saveState();
    updateHUD();
}

/* ==========================================================================
   SHOPS (WORLDS & STYLES)
   ========================================================================== */
function renderWorlds() {
    const grid = document.getElementById('worlds-grid');
    grid.innerHTML = '';

    WORLD_REGISTRY.forEach(world => {
        const isUnlocked = gameState.unlockedWorlds.includes(world.id);
        const isEquipped = gameState.currentWorld === world.id;
        
        const card = document.createElement('div');
        card.className = `card ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        let btnHTML = '';
        if (isEquipped) {
            btnHTML = `<button class="card-btn btn-equipped">SELECTED</button>`;
        } else if (isUnlocked) {
            btnHTML = `<button class="card-btn btn-equip" onclick="equipWorld('${world.id}')">SELECT</button>`;
        } else {
            const canAfford = gameState.coins >= world.price;
            btnHTML = `<button class="card-btn ${canAfford ? 'btn-buy' : 'btn-locked'}" 
                       ${canAfford ? `onclick="buyWorld('${world.id}', ${world.price})"` : 'disabled'}>
                       BUY 🪙 ${world.price}</button>`;
        }

        card.innerHTML = `
            <div class="card-icon">${isUnlocked ? world.icon : '🔒'}</div>
            <div class="card-title">${world.name}</div>
            ${btnHTML}
        `;
        grid.appendChild(card);
    });
}

function buyWorld(id, price) {
    if (gameState.coins >= price) {
        playClickSound();
        gameState.coins -= price;
        gameState.unlockedWorlds.push(id);
        saveState();
        updateHUD();
        renderWorlds();
    }
}

function equipWorld(id) {
    playClickSound();
    gameState.currentWorld = id;
    saveState();
    renderWorlds();
    // In a real game, this might change background colors/music.
}

function renderStyles() {
    const grid = document.getElementById('styles-grid');
    grid.innerHTML = '';

    STYLE_REGISTRY.forEach(style => {
        // Skip 'none' from showing in the shop directly, or handle specially
        if (style.id === 'none') return;

        const isUnlocked = gameState.unlockedStyles.includes(style.id);
        const isEquipped = gameState.currentStyle === style.id;
        
        const card = document.createElement('div');
        card.className = `card ${isUnlocked ? 'unlocked' : ''} ${isEquipped ? 'equipped' : ''}`;
        
        let btnHTML = '';
        if (isEquipped) {
            btnHTML = `<button class="card-btn btn-equipped">EQUIPPED</button>`;
        } else if (isUnlocked) {
            btnHTML = `<button class="card-btn btn-equip" onclick="equipStyle('${style.id}')">EQUIP</button>`;
        } else {
            const canAfford = gameState.coins >= style.price;
            btnHTML = `<button class="card-btn ${canAfford ? 'btn-buy' : 'btn-locked'}" 
                       ${canAfford ? `onclick="buyStyle('${style.id}', ${style.price})"` : 'disabled'}>
                       BUY 🪙 ${style.price}</button>`;
        }

        card.innerHTML = `
            <div class="card-icon">${style.icon}</div>
            <div class="card-title">${style.name}</div>
            ${btnHTML}
        `;
        grid.appendChild(card);
    });

    // Add a button to unequip hat
    const unequipBtn = document.createElement('button');
    unequipBtn.className = "toggle-btn on";
    unequipBtn.style.gridColumn = "1 / span 2";
    unequipBtn.innerText = "Remove Hat";
    unequipBtn.onclick = () => equipStyle('none');
    grid.appendChild(unequipBtn);
}

function buyStyle(id, price) {
    if (gameState.coins >= price) {
        playClickSound();
        gameState.coins -= price;
        gameState.unlockedStyles.push(id);
        equipStyle(id); // Auto equip on buy
        saveState();
        updateHUD();
        renderStyles();
    }
}

function equipStyle(id) {
    playClickSound();
    gameState.currentStyle = id;
    saveState();
    updateRobotAppearance();
    renderStyles();
}

/* ==========================================================================
   UTILITY & EFFECTS
   ========================================================================== */
function goToGame() {
    playClickSound();
    // Bounce effect delay
    setTimeout(() => {
        window.location.href = "map.html";
    }, 150);
}

function playClickSound() {
    if (!gameState.settings.sound) return;
    
    // Web Audio API placeholder click (Simple oscillator beep)
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // Fallback or ignore if AudioContext not allowed without interaction yet
    }
}

// Procedural Sparks generation
function initSparks() {
    const container = document.getElementById('sparks-container');
    setInterval(() => {
        const spark = document.createElement('div');
        spark.className = 'spark';
        // Random start position near the top center
        spark.style.left = 30 + Math.random() * 40 + '%';
        spark.style.top = Math.random() * 20 + '%';
        spark.style.animationDuration = 0.5 + Math.random() * 0.5 + 's';
        
        container.appendChild(spark);
        
        // Cleanup DOM
        setTimeout(() => spark.remove(), 1000);
    }, 800);
}

// Boot sequence
window.onload = initGame;