// Game state
const game = {
    resources: 0,
    rate: 0,
    totalClicks: 0,
    playTime: 0,
    upgrades: {
        autoClicker: {
            cost: 10,
            owned: 0,
            value: 1
        },
        megaClicker: {
            cost: 50,
            owned: 0,
            value: 2
        },
        spaceMine: {
            cost: 200,
            owned: 0,
            value: 5
        }
    },
    clickValue: 1,
    resourcesHistory: [],
    timeHistory: []
};

// DOM elements
const elements = {
    resources: document.getElementById('resources'),
    rate: document.getElementById('rate'),
    clicker: document.getElementById('clicker'),
    totalClicks: document.getElementById('totalClicks'),
    playTime: document.getElementById('playTime'),
    upgrades: {
        autoClicker: document.getElementById('auto-clicker'),
        megaClicker: document.getElementById('mega-clicker'),
        spaceMine: document.getElementById('space-mine')
    }
};

// Confetti setup
const confettiSettings = { target: 'confetti-canvas', max: 150, size: 1.5 };
const confetti = new ConfettiGenerator(confettiSettings);
confetti.render();

// Chart setup
const ctx = document.getElementById('statsChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Resources Over Time',
            data: [],
            borderColor: '#4af2fd',
            backgroundColor: 'rgba(74, 242, 253, 0.1)',
            tension: 0.1,
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(160, 160, 255, 0.1)'
                },
                ticks: {
                    color: '#e0e0ff'
                }
            },
            x: {
                grid: {
                    color: 'rgba(160, 160, 255, 0.1)'
                },
                ticks: {
                    color: '#e0e0ff'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#e0e0ff'
                }
            }
        }
    }
});

// Initialize the game
function init() {
    loadGame();
    updateUI();
    setupEventListeners();
    startGameLoop();
}

// Load game from localStorage
function loadGame() {
    const savedGame = localStorage.getItem('spaceClickerSave');
    if (savedGame) {
        const parsed = JSON.parse(savedGame);
        Object.assign(game, parsed);
        
        // Update chart with loaded data
        if (game.resourcesHistory && game.timeHistory) {
            chart.data.labels = game.timeHistory;
            chart.data.datasets[0].data = game.resourcesHistory;
            chart.update();
        }
    }
}

// Save game to localStorage
function saveGame() {
    localStorage.setItem('spaceClickerSave', JSON.stringify(game));
}

// Update all UI elements
function updateUI() {
    elements.resources.textContent = Math.floor(game.resources);
    elements.rate.textContent = game.rate;
    elements.totalClicks.textContent = game.totalClicks;
    elements.playTime.textContent = game.playTime;
    
    // Update upgrades
    updateUpgradeUI('autoClicker');
    updateUpgradeUI('megaClicker');
    updateUpgradeUI('spaceMine');
}

// Update a specific upgrade UI
function updateUpgradeUI(upgradeId) {
    const upgrade = game.upgrades[upgradeId];
    const element = elements.upgrades[upgradeId];
    
    element.querySelector('.cost').textContent = upgrade.cost;
    element.querySelector('.owned').textContent = upgrade.owned;
    
    const button = element.querySelector('.buy-btn');
    button.disabled = game.resources < upgrade.cost;
}

// Handle click event
function handleClick() {
    // Add click effect
    elements.clicker.classList.add('clicked');
    setTimeout(() => {
        elements.clicker.classList.remove('clicked');
    }, 300);
    
    // Add resources
    game.resources += game.clickValue;
    game.totalClicks++;
    
    // Random chance for critical click
    if (Math.random() < 0.05) {
        const criticalAmount = game.clickValue * 5;
        game.resources += criticalAmount;
        showFloatingText(`CRITICAL! +${criticalAmount}`, '#ff5555');
    } else {
        showFloatingText(`+${game.clickValue}`, '#4af2fd');
    }
    
    updateUI();
    saveGame();
}

// Show floating text animation
function showFloatingText(text, color) {
    const floatingText = document.createElement('div');
    floatingText.textContent = text;
    floatingText.style.position = 'absolute';
    floatingText.style.color = color;
    floatingText.style.fontWeight = 'bold';
    floatingText.style.fontSize = '1.2rem';
    floatingText.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
    floatingText.style.animation = 'floatUp 1s forwards';
    floatingText.style.pointerEvents = 'none';
    floatingText.style.zIndex = '100';
    
    // Random position near the clicker
    const clickerRect = elements.clicker.getBoundingClientRect();
    const x = clickerRect.left + (Math.random() * clickerRect.width * 0.8);
    const y = clickerRect.top + (Math.random() * clickerRect.height * 0.8);
    
    floatingText.style.left = `${x}px`;
    floatingText.style.top = `${y}px`;
    
    document.body.appendChild(floatingText);
    
    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

// Buy an upgrade
function buyUpgrade(upgradeId) {
    const upgrade = game.upgrades[upgradeId];
    
    if (game.resources >= upgrade.cost) {
        game.resources -= upgrade.cost;
        upgrade.owned++;
        
        // Increase cost for next purchase
        upgrade.cost = Math.floor(upgrade.cost * 1.15);
        
        // Update game rate if it's an auto-generator
        if (upgradeId === 'autoClicker' || upgradeId === 'spaceMine') {
            game.rate = game.upgrades.autoClicker.owned * game.upgrades.autoClicker.value + 
                        game.upgrades.spaceMine.owned * game.upgrades.spaceMine.value;
        }
        
        // Update click value if it's the mega clicker
        if (upgradeId === 'megaClicker') {
            game.clickValue = 1 + game.upgrades.megaClicker.owned;
        }
        
        // Celebrate every 5 purchases
        if (upgrade.owned % 5 === 0) {
            confetti.render();
            setTimeout(() => {
                confetti.clear();
            }, 3000);
        }
        
        updateUI();
        saveGame();
    }
}

// Game loop for passive income
function startGameLoop() {
    setInterval(() => {
        // Add passive income
        game.resources += game.rate / 10;
        game.playTime += 0.1;
        
        // Record data for chart (every 5 seconds)
        if (game.playTime % 5 < 0.1) {
            game.resourcesHistory.push(Math.floor(game.resources));
            game.timeHistory.push(Math.floor(game.playTime));
            
            // Keep only last 20 data points
            if (game.resourcesHistory.length > 20) {
                game.resourcesHistory.shift();
                game.timeHistory.shift();
            }
            
            // Update chart
            chart.data.labels = game.timeHistory;
            chart.data.datasets[0].data = game.resourcesHistory;
            chart.update();
        }
        
        updateUI();
        saveGame();
    }, 100);
}

// Set up event listeners
function setupEventListeners() {
    // Clicker
    elements.clicker.addEventListener('click', handleClick);
    
    // Upgrade buttons
    elements.upgrades.autoClicker.querySelector('.buy-btn').addEventListener('click', () => buyUpgrade('autoClicker'));
    elements.upgrades.megaClicker.querySelector('.buy-btn').addEventListener('click', () => buyUpgrade('megaClicker'));
    elements.upgrades.spaceMine.querySelector('.buy-btn').addEventListener('click', () => buyUpgrade('spaceMine'));
    
    // Keyboard shortcut (space for clicking)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleClick();
        }
    });
}

// Add float animation to styles
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateY(-50px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Start the game
init();