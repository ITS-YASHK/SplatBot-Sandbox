/* ==========================================================================
   LEVEL CONFIGURATION
   Y-coordinates are absolute pixels from the BOTTOM of the scroll area.
   X-coordinates are percentages for responsiveness.
   ========================================================================== */
const LEVELS = [
    // Theme 1: Normal Day (Bottom)
    { id: 1, x: 50, y: 150,  biome: "day" },
    { id: 2, x: 25, y: 450,  biome: "day" },
    
    // Theme 2: Desert
    { id: 3, x: 75, y: 800,  biome: "desert" },
    { id: 4, x: 35, y: 1150, biome: "desert" },
    
    // Theme 3: Forest
    { id: 5, x: 80, y: 1500, biome: "forest" },
    { id: 6, x: 25, y: 1850, biome: "forest" },
    
    // Theme 4: Ice World
    { id: 7, x: 65, y: 2200, biome: "ice" },
    { id: 8, x: 30, y: 2550, biome: "ice" },
    
    // Theme 5: Night World (Top)
    { id: 9, x: 75, y: 2900, biome: "night" },
    { id: 10, x: 50, y: 3250, biome: "night" }
];

/* ==========================================================================
   LEVEL ROUTING REGISTRY
   Update the '#' with your HTML file names as you build new levels.
   ========================================================================== */
const LEVEL_URLS = {
    1: "game.html", // Your completed Level 1 file
    2: "#",         // Add your link here later (e.g., "level2.html")
    3: "#",
    4: "#",
    5: "#",
    6: "#",
    7: "#",
    8: "#",
    9: "#",
    10: "#"
};

/* Biome specific emoji decorations for data-driven populating */
const DECORATIONS = {
    day:    { props: ["🌲", "🌼", "🏠", "🚜", "🌉"], clouds: "☁️" },
    desert: { props: ["🌵", "🐪", "🏜️", "🛖", "🏺"], clouds: "⛅" },
    forest: { props: ["🌳", "🍄", "🏕️", "🪵", "🛖"], clouds: "☁️" },
    ice:    { props: ["❄️", "🧊", "⛄", "🏔️", "🌲"], clouds: "🌨️" },
    night:  { props: ["🏰", "🔮", "🦇", "📡", "🗼"], clouds: "🌩️" }
};

/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */
let gameState = {
    coins: 2450,
    metal: 152,
    highestLevel: 1,
    selectedLevel: 1,
    settings: { music: true, sound: true }
};

function initGame() {
    loadState();
    buildMap();
    updateHUD();
    
    // Small delay ensures DOM paints before calculating exact coordinates for SVG and Camera
    setTimeout(() => {
        drawSVGPath();
        scrollToNode(gameState.selectedLevel);
    }, 100);
}

function loadState() {
    const saved = localStorage.getItem("splatbot_sandbox_data");
    if (saved) {
        // Merge to preserve structural updates
        gameState = { ...gameState, ...JSON.parse(saved) };
    }
    // Auto-select their current frontier
    gameState.selectedLevel = gameState.highestLevel;
}

function saveState() {
    localStorage.setItem("splatbot_sandbox_data", JSON.stringify(gameState));
}

function hardReset() {
    if (confirm("Reset all map progress back to Level 1?")) {
        localStorage.removeItem("splatbot_sandbox_data");
        location.reload();
    }
}

/* ==========================================================================
   DOM GENERATION (Nodes & Decorations)
   ========================================================================== */
function buildMap() {
    const nodesLayer = document.getElementById('nodes-layer');
    const decoLayer = document.getElementById('decorations-layer');
    
    nodesLayer.innerHTML = '';
    decoLayer.innerHTML = '';

    LEVELS.forEach(level => {
        // --- 1. Build Level Pin ---
        const pin = document.createElement('button');
        pin.id = `pin-${level.id}`;
        pin.style.left = `${level.x}%`;
        pin.style.bottom = `${level.y}px`;
        
        let stateClass = 'pin-locked';
        let content = '🔒';

        if (level.id < gameState.highestLevel) {
            stateClass = 'pin-completed';
            content = '✔';
        } else if (level.id === gameState.highestLevel) {
            stateClass = 'pin-current';
            content = level.id;
        }

        pin.className = `level-pin ${stateClass} ${level.id === gameState.selectedLevel ? 'pin-selected' : ''}`;
        pin.innerHTML = content;
        pin.onclick = () => selectLevel(level.id);
        
        nodesLayer.appendChild(pin);

        // --- 2. Build Decorations ---
        const themeData = DECORATIONS[level.biome];
        const numDecos = Math.floor(Math.random() * 4) + 4; // 4 to 7 decos per level

        for (let i = 0; i < numDecos; i++) {
            const deco = document.createElement('div');
            
            // Scatter randomly around the node, avoiding the dead center
            const offsetX = (Math.random() - 0.5) * 60; 
            const offsetY = (Math.random() - 0.5) * 200; 
            
            deco.style.left = `clamp(5%, ${level.x + offsetX}%, 90%)`;
            deco.style.bottom = `${level.y + offsetY}px`;
            
            // Distribute Props vs Clouds
            if (Math.random() > 0.8) {
                deco.innerText = themeData.clouds;
                deco.className = 'deco-item deco-animate-float';
                deco.style.fontSize = '60px';
                deco.style.zIndex = "8"; // Clouds float above road
            } else {
                deco.innerText = themeData.props[Math.floor(Math.random() * themeData.props.length)];
                deco.className = `deco-item ${Math.random() > 0.5 ? 'deco-animate-sway' : ''}`;
            }

            decoLayer.appendChild(deco);
        }
    });
}

/* ==========================================================================
   INTERACTION & HUD
   ========================================================================== */
function selectLevel(id) {
    if (id > gameState.highestLevel) return; // Cannot select locked
    
    gameState.selectedLevel = id;
    
    // Refresh DOM classes
    document.querySelectorAll('.level-pin').forEach(pin => pin.classList.remove('pin-selected'));
    document.getElementById(`pin-${id}`).classList.add('pin-selected');
    
    updateHUD();
    scrollToNode(id);
}

function updateHUD() {
    document.getElementById('ui-coins').innerText = gameState.coins.toLocaleString();
    document.getElementById('ui-metal').innerText = gameState.metal.toLocaleString();
    
    const playBtn = document.getElementById('play-button');
    const badge = document.getElementById('ui-level-badge');
    const playText = playBtn.querySelector('.play-text');

    if (gameState.selectedLevel <= gameState.highestLevel) {
        playBtn.classList.remove('locked');
        badge.innerText = gameState.selectedLevel === gameState.highestLevel ? `CURRENT MISSION` : `REPLAY LEVEL ${gameState.selectedLevel}`;
        playText.innerText = "PLAY";
    } else {
        playBtn.classList.add('locked');
        badge.innerText = `LOCKED`;
        playText.innerText = "🔒";
    }

    // Update Settings UI
    document.getElementById('setting-music').innerText = `Music: ${gameState.settings.music ? 'ON' : 'OFF'}`;
    document.getElementById('setting-music').className = `toggle-btn ${gameState.settings.music ? 'on' : ''}`;
    
    document.getElementById('setting-sound').innerText = `Sound: ${gameState.settings.sound ? 'ON' : 'OFF'}`;
    document.getElementById('setting-sound').className = `toggle-btn ${gameState.settings.sound ? 'on' : ''}`;
}

/* ==========================================================================
   SVG ROAD MATH & DRAWING
   ========================================================================== */
function drawSVGPath() {
    const svg = document.getElementById('svg-road-layer');
    const scrollArea = document.getElementById('map-scroll-area');
    
    const mapW = scrollArea.clientWidth;
    const mapH = scrollArea.clientHeight;
    
    let pathData = "";

    LEVELS.forEach((level, index) => {
        // Convert bottom-based CSS logic to top-based SVG coordinate system
        const pxX = (level.x / 100) * mapW;
        const pxY = mapH - level.y;

        if (index === 0) {
            pathData += `M ${pxX},${pxY} `;
        } else {
            const prev = LEVELS[index - 1];
            const prevX = (prev.x / 100) * mapW;
            const prevY = mapH - prev.y;
            
            // Create a smooth curve by anchoring a control point perfectly between the Y axis
            const controlY = prevY - Math.abs(prevY - pxY) / 2;
            pathData += `S ${pxX},${controlY} ${pxX},${pxY} `;
        }
    });

    // Draw three layers of the stroke to create a bordered, dashed road
    svg.innerHTML = `
        <path class="map-path-base" d="${pathData}"></path>
        <path class="map-path-center" d="${pathData}"></path>
        <path class="map-path-dashes" d="${pathData}"></path>
    `;
}

/* ==========================================================================
   CAMERA MOVEMENT
   ========================================================================== */
function scrollToNode(id) {
    const level = LEVELS.find(l => l.id === id);
    if (!level) return;
    
    const viewport = document.getElementById('map-viewport');
    const mapH = document.getElementById('map-scroll-area').clientHeight;
    
    // Target pixel from top
    const targetY = mapH - level.y;
    // Offset to center the node vertically in the screen
    const centerOffset = window.innerHeight / 2;
    
    viewport.scrollTo({
        top: Math.max(0, targetY - centerOffset),
        behavior: 'smooth'
    });
}

/* ==========================================================================
   SYSTEM ACTIONS & PAGE TRANSITIONS
   ========================================================================== */
function startGame() {
    if (gameState.selectedLevel > gameState.highestLevel) return; // Block locked levels
    
    const playBtn = document.getElementById('play-button');
    playBtn.style.transform = "scale(0.9)"; // Button press effect
    
    // Step 1: Wait for the button bounce to finish
    setTimeout(() => {
        playBtn.style.transform = "none"; // Release button
        
        // Step 2: Trigger the smooth screen fade out animation
        const overlay = document.getElementById('transition-overlay');
        if (overlay) overlay.classList.add('active');
        
        // Step 3: Wait for the animation to cover the screen, then load the game
        setTimeout(() => {
            const targetUrl = LEVEL_URLS[gameState.selectedLevel];
            
            if (targetUrl && targetUrl !== "#") {
                // If a real link is provided, navigate to that level
                window.location.href = targetUrl;
            } else {
                // FALLBACK: If the user selects a level you haven't built yet
                alert(`Level ${gameState.selectedLevel} is under construction!`);
                overlay.classList.remove('active'); // Remove fade so they can keep using the map
            }
        }, 600); // 600ms perfectly matches the CSS transition timer
        
    }, 150);
}

function goHome() {
    // Button press sound (if you added the audio function to the map)
    // playClickSound(); 
    
    // Trigger smooth fade transition
    const overlay = document.getElementById('transition-overlay');
    if (overlay) overlay.classList.add('active');
    
    setTimeout(() => {
        // Change "index.html" if your actual home screen file is named something else!
        window.location.href = "home.html"; 
    }, 600);
}

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('hidden');
}

function toggleOption(opt) {
    gameState.settings[opt] = !gameState.settings[opt];
    saveState();
    updateHUD();
}

// Redraw SVG road when screen rotates or resizes
window.addEventListener('resize', drawSVGPath);

// Initialize
window.onload = initGame;