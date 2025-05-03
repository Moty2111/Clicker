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
            multiplier: 0.2, // +20% за каждое улучшение
            name: "Квантовый Ускоритель"
        },
        planetBooster: {
            cost: 500,
            owned: 0,
            boost: 0.1, // +10% за каждое улучшение
            name: "Планетарный Бустер"
        }
    },
    clickValue: 1,
    resourcesHistory: [],
    timeHistory: [],
    lastSave: Date.now()
};

// DOM элементы
const elements = {
    resources: document.getElementById('resources'),
    rate: document.getElementById('rate'),
    clicker: document.getElementById('clicker'),
    totalClicks: document.getElementById('totalClicks'),
    playTime: document.getElementById('playTime'),
    upgrades: {}
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

// Основные функции
function calculateIncome() {
    // Базовый доход от генераторов
    const baseIncome = 
        game.upgrades.autoClicker.owned * game.upgrades.autoClicker.value +
        game.upgrades.spaceMine.owned * game.upgrades.spaceMine.value +
        game.upgrades.spaceFarm.owned * game.upgrades.spaceFarm.value;

    // Множители от улучшений
    const quantumMultiplier = 1 + game.upgrades.quantumAccelerator.owned * game.upgrades.quantumAccelerator.multiplier;
    const planetBoost = 1 + game.upgrades.planetBooster.owned * game.upgrades.planetBooster.boost;

    // Итоговый доход в секунду
    game.rate = baseIncome * quantumMultiplier * planetBoost;
}

function updateUI() {
    // Обновляем основные показатели
    elements.resources.textContent = Math.floor(game.resources).toLocaleString();
    elements.rate.textContent = game.rate.toFixed(1);
    elements.totalClicks.textContent = game.totalClicks.toLocaleString();
    elements.playTime.textContent = game.playTime.toFixed(1);

    // Обновляем информацию об улучшениях
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
}

function buyUpgrade(upgradeId) {
    const upgrade = game.upgrades[upgradeId];
    
    if (game.resources >= upgrade.cost) {
        game.resources -= upgrade.cost;
        upgrade.owned++;
        upgrade.cost = Math.floor(upgrade.cost * 1.15);
        
        // Особые эффекты улучшений
        if (upgradeId === 'megaClicker') {
            game.clickValue = 1 + game.upgrades.megaClicker.owned;
        }
        
        // Пересчитываем доход
        calculateIncome();
        
        // Эффект при покупке
        showFloatingText(`${upgrade.name} улучшено!`, '#4af2fd');
        
        // Конфетти каждые 5 уровней
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
    // Только левая кнопка мыши
    if (event && event.button !== 0) return;
    
    // Анимация клика
    elements.clicker.classList.add('clicked');
    setTimeout(() => {
        elements.clicker.classList.remove('clicked');
    }, 300);
    
    // Критический удар (5% шанс)
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
    
    // Автосохранение не чаще чем раз в 5 секунд
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
        lastUpdate: Date.now()
    }));
}

function loadGame() {
    const savedGame = localStorage.getItem('spaceClickerSave');
    if (savedGame) {
        try {
            const parsed = JSON.parse(savedGame);
            
            // Основные данные
            game.resources = parsed.resources || 0;
            game.rate = parsed.rate || 0;
            game.totalClicks = parsed.totalClicks || 0;
            game.playTime = parsed.playTime || 0;
            game.clickValue = parsed.clickValue || 1;
            
            // Улучшения
            Object.keys(game.upgrades).forEach(upgradeId => {
                if (parsed.upgrades && parsed.upgrades[upgradeId]) {
                    game.upgrades[upgradeId].owned = parsed.upgrades[upgradeId].owned || 0;
                    game.upgrades[upgradeId].cost = parsed.upgrades[upgradeId].cost || game.upgrades[upgradeId].cost;
                }
            });
            
            // График
            game.resourcesHistory = parsed.resourcesHistory || [];
            game.timeHistory = parsed.timeHistory || [];
            
            if (chart) {
                chart.data.labels = game.timeHistory;
                chart.data.datasets[0].data = game.resourcesHistory;
                chart.update();
            }
            
            // Восстановление оффлайн-прогресса
            if (parsed.lastUpdate) {
                const offlineTime = (Date.now() - parsed.lastUpdate) / 1000; // в секундах
                if (offlineTime > 5) { // Минимум 5 секунд
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
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - game.lastUpdate) / 1000; // В секундах
    game.lastUpdate = now;
    
    // Добавляем ресурсы пропорционально прошедшему времени
    game.resources += game.rate * deltaTime;
    game.playTime += deltaTime;
    
    // Обновление графика каждые 5 секунд
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

// Инициализация
function init() {
    loadGame();
    calculateIncome();
    updateUI();
    setupEventListeners();
    
    // Запуск игрового цикла
    game.lastUpdate = Date.now();
    game.chartUpdated = false;
    requestAnimationFrame(gameLoop);
}

function setupEventListeners() {
    // Клик мышкой
    elements.clicker.addEventListener('click', handleClick);
    elements.clicker.addEventListener('mousedown', (e) => e.preventDefault());
    
    // Клик пробелом
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleClick();
        }
    });
    
    // Кнопки улучшений
    Object.keys(game.upgrades).forEach(upgradeId => {
        const element = elements.upgrades[upgradeId];
        if (element) {
            const button = element.querySelector('.buy-btn');
            if (button) {
                button.addEventListener('click', () => buyUpgrade(upgradeId));
            }
        }
    });
    // Функция сброса игры
function resetGame() {
    if (confirm("Вы точно хотите сбросить весь прогресс? Это действие нельзя отменить!")) {
        // Сброс значений
        game.resources = 0;
        game.rate = 0;
        game.totalClicks = 0;
        game.playTime = 0;
        game.clickValue = 1;
        game.resourcesHistory = [];
        game.timeHistory = [];
        
        // Сброс улучшений
        Object.keys(game.upgrades).forEach(upgradeId => {
            const upgrade = game.upgrades[upgradeId];
            upgrade.owned = 0;
            // Восстановление базовой стоимости
            if (upgradeId === 'autoClicker') upgrade.cost = 10;
            else if (upgradeId === 'megaClicker') upgrade.cost = 50;
            else if (upgradeId === 'spaceMine') upgrade.cost = 200;
            else if (upgradeId === 'spaceFarm') upgrade.cost = 150;
            else if (upgradeId === 'quantumAccelerator') upgrade.cost = 300;
            else if (upgradeId === 'planetBooster') upgrade.cost = 500;
        });
        
        // Обновление интерфейса
        calculateIncome();
        updateUI();
        
        // Сброс графика
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.update();
        }
        
        // Удаление сохранения
        localStorage.removeItem('spaceClickerSave');
        
        // Визуальный эффект
        showFloatingText("Игра сброшена!", "#ff5555");
    }
}

// В setupEventListeners добавить:
document.getElementById('reset-btn').addEventListener('click', resetGame);
    
    // Сохранение при закрытии
    window.addEventListener('beforeunload', saveGame);
}

// Запуск игры
init();