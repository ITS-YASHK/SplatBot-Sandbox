// Safely locate viewport layer nodes
const d = document.getElementById('disclaimer');
const s = document.getElementById('splash');
const g = document.getElementById('game');
const f = document.getElementById('fill');
const p = document.getElementById('pct');

window.addEventListener('DOMContentLoaded', () => {
    // Stage 1: Transition Disclaimer out, introduce Loader Splash frame
    setTimeout(() => {
        if (d && s) {
            d.classList.remove('show');
            s.classList.add('show');
            
            // Clean up node visibility completely once opacity finishes fading
            d.addEventListener('transitionend', function cb() {
                d.style.display = 'none';
                d.removeEventListener('transitionend', cb);
            });
            
            beginSplashingSequence();
        }
    }, 2500);
});

function beginSplashingSequence() {
    let progress = 0;
    // Ultra smooth interval steps matching modern high refresh-rate mobile viewports
    const progressInterval = setInterval(() => {
        progress++;
        if (f) f.style.width = progress + '%';
        if (p) p.textContent = progress + '%';
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            
            setTimeout(() => {
                if (s && g) {
                    s.classList.remove('show');
                    g.classList.add('show');
                    g.style.display = 'block';
                    
                    s.addEventListener('transitionend', function cb() {
                        s.style.display = 'none';
                        s.removeEventListener('transitionend', cb);
                        
                        // Focus into the game iframe sandbox context to allow instant keybinding catches
                        g.focus();
                    });
                }
            }, 400);
        }
    }, 15);
}