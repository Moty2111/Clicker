// Игровое состояние
const game = {
    resources: 0,
    rate: 0,
    totalClicks: 0,
    playTime: 0,
    lastUpdate: Date.now(),
    upgrades: {
        autoClicker: {
            cost: 10,
            owned: 0,
            value: 1,
            name: "Авто-Кликер"
        },
        megaClicker: {
            cost: 50,
            owned: 0,
            value: 2,
            name: "Мега-Кликер"
        },
        spaceMine: {
            cost: 200,
            owned: 0,
            value: 5,
            name: "Космическая Шахта"
        },
        spaceFarm: {
            cost: 150,
            owned: 0,
            value: 2,
            name: "Космическая Ферма"
        },
        quantumAccelerator: {
            cost: 300,
            owned: 0,
            multiplier: 0.2,
            name: "Квантовый Ускоритель"
        },
        planetBooster: {
            cost: 500,
            owned: 0,
            boost: 0.1,
            name: "Планетарный Бустер"
        }
    },
    clickValue: 1,
    resourcesHistory: [],
    timeHistory: [],
    lastSave: Date.now(),
    chartUpdated: false,
    totalUpgradesBought: 0,
    achievements: {
        novice: { unlocked: false, name: "Новичок", description: "Собери 100 кредитов", reward: 50, bonus: 0 },
        investor: { unlocked: false, name: "Инвестор", description: "Купи 5 улучшений", reward: 100, bonus: 0.05 },
        clickMaster: { unlocked: false, name: "Кликер-мастер", description: "Сделай 1000 кликов", reward: 200, bonus: 0 },
        spaceTycoon: { unlocked: false, name: "Космический магнат", description: "Достигни 10,000 кредитов", reward: 500, bonus: 0.1 }
    }
};

// DOM элементы
const elements = {
    resources: document.getElementById('resources'),
    rate: document.getElementById('rate'),
    clicker: document.getElementById('clicker'),
    totalClicks: document.getElementById('totalClicks'),
    playTime: document.getElementById('playTime'),
    totalUpgrades: document.getElementById('totalUpgrades'),
    upgrades: {},
    resetBtn: document.getElementById('reset-btn'),
    resetModal: document.getElementById('reset-modal'),
    confirmReset: document.getElementById('confirm-reset'),
    cancelReset: document.getElementById('cancel-reset'),
    achievementModal: document.getElementById('achievement-modal'),
    achievementTitle: document.querySelector('.achievement-title'),
    achievementDesc: document.querySelector('.achievement-desc'),
    achievementReward: document.querySelector('.achievement-reward'),
    achievementCloseBtn: document.querySelector('.achievement-close-btn')
};

// Инициализация элементов улучшений
Object.keys(game.upgrades).forEach(upgradeId => {
    const elementId = upgradeId.replace(/([A-Z])/g, '-$1').toLowerCase();
    elements.upgrades[upgradeId] = document.getElementById(elementId);
});

// Конфетти
let confetti = null;
if (typeof ConfettiGenerator !== 'undefined') {
    confetti = new ConfettiGenerator({
        target: 'confetti-canvas',
        max: 150,
        size: 1.5,
        props: ['circle', 'square', 'triangle']
    });
    confetti.render();
}

// График
let chart = null;
if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('statsChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Кредиты за время',
                data: [],
                borderColor: '#4af2fd',
                backgroundColor: 'rgba(74, 242, 253, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(160, 160, 255, 0.1)' },
                    ticks: { color: '#e0e0ff' }
                },
                x: {
                    grid: { color: 'rgba(160, 160, 255, 0.1)' },
                    ticks: { color: '#e0e0ff' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e0e0ff' }
                }
            }
        }
    });
}

// Основные функции игры
function calculateIncome() {
    const baseIncome = 
        game.upgrades.autoClicker.owned * game.upgrades.autoClicker.value +
        game.upgrades.spaceMine.owned * game.upgrades.spaceMine.value +
        game.upgrades.spaceFarm.owned * game.upgrades.spaceFarm.value;

    const quantumMultiplier = 1 + game.upgrades.quantumAccelerator.owned * game.upgrades.quantumAccelerator.multiplier;
    const planetBoost = 1 + game.upgrades.planetBooster.owned * game.upgrades.planetBooster.boost;

    game.rate = baseIncome * quantumMultiplier * planetBoost;
}

function updateUI() {
    elements.resources.textContent = Math.floor(game.resources).toLocaleString();
    elements.rate.textContent = game.rate.toFixed(1);
    elements.totalClicks.textContent = game.totalClicks.toLocaleString();
    elements.playTime.textContent = game.playTime.toFixed(1);
    elements.totalUpgrades.textContent = game.totalUpgradesBought;

    Object.keys(game.upgrades).forEach(upgradeId => {
        const upgrade = game.upgrades[upgradeId];
        const element = elements.upgrades[upgradeId];
        
        if (element) {
            element.querySelector('.cost').textContent = Math.floor(upgrade.cost).toLocaleString();
            element.querySelector('.owned').textContent = upgrade.owned;
            
            const button = element.querySelector('.buy-btn');
            if (button) {
                button.disabled = game.resources < upgrade.cost;
                button.textContent = game.resources >= upgrade.cost ? 
                    `Купить (${Math.floor(upgrade.cost)})` : 
                    `Нужно ${Math.floor(upgrade.cost)}`;
            }
        }
    });
    
    checkAchievements();
}

function buyUpgrade(upgradeId) {
    const upgrade = game.upgrades[upgradeId];
    
    if (game.resources >= upgrade.cost) {
        game.resources -= upgrade.cost;
        upgrade.owned++;
        upgrade.cost = Math.floor(upgrade.cost * 1.15);
        game.totalUpgradesBought++;
        
        if (upgradeId === 'megaClicker') {
            game.clickValue = 1 + game.upgrades.megaClicker.owned;
        }
        
        calculateIncome();
        
        showFloatingText(`${upgrade.name} улучшено!`, '#4af2fd');
        
        if (upgrade.owned % 5 === 0 && confetti) {
            confetti.render();
            setTimeout(() => {
                if (confetti) confetti.clear();
            }, 3000);
        }
        
        updateUI();
        saveGame();
    }
}

function handleClick(event) {
    if (event && event.button !== 0) return;
    
    elements.clicker.classList.add('clicked');
    setTimeout(() => {
        elements.clicker.classList.remove('clicked');
    }, 300);
    
    const isCritical = Math.random() < 0.05;
    const baseValue = game.clickValue;
    const finalValue = isCritical ? baseValue * 5 : baseValue;
    
    game.resources += finalValue;
    game.totalClicks++;
    
    showFloatingText(
        isCritical ? `КРИТ! +${finalValue}` : `+${finalValue}`,
        isCritical ? '#ff5555' : '#4af2fd'
    );
    
    updateUI();
    
    if (Date.now() - game.lastSave > 5000) {
        saveGame();
        game.lastSave = Date.now();
    }
}

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
    floatingText.style.userSelect = 'none';
    
    const clickerRect = elements.clicker.getBoundingClientRect();
    const x = clickerRect.left + (Math.random() * clickerRect.width * 0.6) + 20;
    const y = clickerRect.top + (Math.random() * clickerRect.height * 0.6) + 20;
    
    floatingText.style.left = `${x}px`;
    floatingText.style.top = `${y}px`;
    
    document.body.appendChild(floatingText);
    
    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

// Система достижений
function checkAchievements() {
    // Новичок - 100 кредитов
    if (!game.achievements.novice.unlocked && game.resources >= 100) {
        unlockAchievement('novice');
    }
    
    // Инвестор - 5 улучшений
    if (!game.achievements.investor.unlocked && game.totalUpgradesBought >= 5) {
        unlockAchievement('investor');
    }
    
    // Кликер-мастер - 1000 кликов
    if (!game.achievements.clickMaster.unlocked && game.totalClicks >= 1000) {
        unlockAchievement('clickMaster');
    }
    
    // Космический магнат - 10,000 кредитов
    if (!game.achievements.spaceTycoon.unlocked && game.resources >= 10000) {
        unlockAchievement('spaceTycoon');
    }
}

function unlockAchievement(achievementId) {
    const achievement = game.achievements[achievementId];
    achievement.unlocked = true;
    
    // Выдаем награду
    game.resources += achievement.reward;
    
    // Применяем бонус если есть
    if (achievement.bonus > 0) {
        game.rate *= (1 + achievement.bonus);
    }
    
    // Показываем уведомление
    showAchievementModal(achievement);
    
    // Обновляем UI
    updateUI();
    saveGame();
}

function showAchievementModal(achievement) {
    elements.achievementTitle.textContent = achievement.name;
    elements.achievementDesc.textContent = achievement.description;
    elements.achievementReward.textContent = 
        `Награда: ${achievement.reward} кредитов${achievement.bonus > 0 ? ` + ${achievement.bonus*100}% к доходу` : ''}`;
    
    elements.achievementModal.style.display = 'flex';
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        elements.achievementModal.style.display = 'none';
    }, 5000);
}

// Система сброса игры
function showResetModal() {
    elements.resetModal.classList.add('active');
}

function hideResetModal() {
    elements.resetModal.classList.remove('active');
}

function resetGame() {
    // Сброс значений
    game.resources = 0;
    game.rate = 0;
    game.totalClicks = 0;
    game.playTime = 0;
    game.clickValue = 1;
    game.resourcesHistory = [];
    game.timeHistory = [];
    game.totalUpgradesBought = 0;
    
    // Сброс улучшений
    Object.keys(game.upgrades).forEach(upgradeId => {
        const upgrade = game.upgrades[upgradeId];
        upgrade.owned = 0;
        if (upgradeId === 'autoClicker') upgrade.cost = 10;
        else if (upgradeId === 'megaClicker') upgrade.cost = 50;
        else if (upgradeId === 'spaceMine') upgrade.cost = 200;
        else if (upgradeId === 'spaceFarm') upgrade.cost = 150;
        else if (upgradeId === 'quantumAccelerator') upgrade.cost = 300;
        else if (upgradeId === 'planetBooster') upgrade.cost = 500;
    });
    
    // Сброс достижений
    Object.keys(game.achievements).forEach(achievementId => {
        game.achievements[achievementId].unlocked = false;
    });
    
    calculateIncome();
    updateUI();
    
    if (chart) {
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
    }
    
    localStorage.removeItem('spaceClickerSave');
    showFloatingText("Игра сброшена!", "#ff5555");
    hideResetModal();
}

// Сохранение/загрузка
function saveGame() {
    localStorage.setItem('spaceClickerSave', JSON.stringify({
        resources: game.resources,
        rate: game.rate,
        totalClicks: game.totalClicks,
        playTime: game.playTime,
        upgrades: game.upgrades,
        clickValue: game.clickValue,
        resourcesHistory: game.resourcesHistory.slice(-20),
        timeHistory: game.timeHistory.slice(-20),
        lastUpdate: Date.now(),
        totalUpgradesBought: game.totalUpgradesBought,
        achievements: game.achievements
    }));
}

function loadGame() {
    const savedGame = localStorage.getItem('spaceClickerSave');
    if (savedGame) {
        try {
            const parsed = JSON.parse(savedGame);
            
            game.resources = parsed.resources || 0;
            game.rate = parsed.rate || 0;
            game.totalClicks = parsed.totalClicks || 0;
            game.playTime = parsed.playTime || 0;
            game.clickValue = parsed.clickValue || 1;
            game.totalUpgradesBought = parsed.totalUpgradesBought || 0;
            
            Object.keys(game.upgrades).forEach(upgradeId => {
                if (parsed.upgrades && parsed.upgrades[upgradeId]) {
                    game.upgrades[upgradeId].owned = parsed.upgrades[upgradeId].owned || 0;
                    game.upgrades[upgradeId].cost = parsed.upgrades[upgradeId].cost || game.upgrades[upgradeId].cost;
                }
            });
            
            if (parsed.achievements) {
                Object.keys(game.achievements).forEach(achievementId => {
                    if (parsed.achievements[achievementId]) {
                        game.achievements[achievementId].unlocked = parsed.achievements[achievementId].unlocked || false;
                    }
                });
            }
            
            game.resourcesHistory = parsed.resourcesHistory || [];
            game.timeHistory = parsed.timeHistory || [];
            
            if (chart) {
                chart.data.labels = game.timeHistory;
                chart.data.datasets[0].data = game.resourcesHistory;
                chart.update();
            }
            
            if (parsed.lastUpdate) {
                const offlineTime = (Date.now() - parsed.lastUpdate) / 1000;
                if (offlineTime > 5) {
                    game.resources += game.rate * offlineTime;
                    game.playTime += offlineTime;
                }
            }
            
            calculateIncome();
        } catch (e) {
            console.error('Ошибка загрузки сохранения:', e);
        }
    }
}

// Игровой цикл
function gameLoop(timestamp) {
    const now = Date.now();
    const deltaTime = (now - game.lastUpdate) / 1000;
    game.lastUpdate = now;
    
    game.resources += game.rate * deltaTime;
    game.playTime += deltaTime;
    
    if (Math.floor(game.playTime) % 5 === 0 && !game.chartUpdated) {
        game.resourcesHistory.push(Math.floor(game.resources));
        game.timeHistory.push(Math.floor(game.playTime));
        
        if (game.resourcesHistory.length > 20) {
            game.resourcesHistory.shift();
            game.timeHistory.shift();
        }
        
        if (chart) {
            chart.data.labels = game.timeHistory;
            chart.data.datasets[0].data = game.resourcesHistory;
            chart.update();
        }
        
        game.chartUpdated = true;
    } else if (Math.floor(game.playTime) % 5 !== 0) {
        game.chartUpdated = false;
    }
    
    updateUI();
    requestAnimationFrame(gameLoop);
}

// Настройка обработчиков событий
function setupEventListeners() {
    elements.clicker.addEventListener('click', handleClick);
    elements.clicker.addEventListener('mousedown', (e) => e.preventDefault());
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleClick();
        }
    });
    
    Object.keys(game.upgrades).forEach(upgradeId => {
        const element = elements.upgrades[upgradeId];
        if (element) {
            const button = element.querySelector('.buy-btn');
            if (button) {
                button.addEventListener('click', () => buyUpgrade(upgradeId));
            }
        }
    });
    
    elements.resetBtn.addEventListener('click', showResetModal);
    elements.confirmReset.addEventListener('click', resetGame);
    elements.cancelReset.addEventListener('click', hideResetModal);
    
    elements.resetModal.addEventListener('click', function(e) {
        if (e.target === this) {
            hideResetModal();
        }
    });
    
    elements.achievementCloseBtn.addEventListener('click', () => {
        elements.achievementModal.style.display = 'none';
    });
    
    window.addEventListener('beforeunload', saveGame);
}

// Инициализация игры
function init() {
    loadGame();
    calculateIncome();
    updateUI();
    setupEventListeners();
    
    game.lastUpdate = Date.now();
    game.chartUpdated = false;
    requestAnimationFrame(gameLoop);
}

// Запуск игры
init();