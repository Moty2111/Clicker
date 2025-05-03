// Основные переменные
let score = 0;
let crystals = 0;
let clickPower = 1;
let autoClickerActive = false;
let autoClickerInterval;
const CRYSTAL_CHANCE = 0.1; // 10% шанс получить кристалл

// Элементы DOM
const scoreElement = document.getElementById("score");
const crystalsElement = document.getElementById("crystals");
const clickerButton = document.getElementById("clicker");
const upgrade1Button = document.getElementById("upgrade1");
const upgrade2Button = document.getElementById("upgrade2");
const superUpgrade1Button = document.getElementById("superUpgrade1");
const superUpgrade2Button = document.getElementById("superUpgrade2");
const clickSound = document.getElementById("clickSound");
const achievementSound = document.getElementById("achievementSound");

// Достижения
const achievements = {
    novice: { unlocked: false, condition: () => score >= 50 },
    autoclicker: { unlocked: false, condition: () => autoClickerActive },
    boss: { unlocked: false, condition: () => score >= 500 },
    crystalHunter: { unlocked: false, condition: () => crystals >= 10 },
};

// Клик по кнопке
clickerButton.addEventListener("click", () => {
    score += clickPower;
    clickSound.currentTime = 0;
    clickSound.play();
    
    // Шанс получить кристалл
    if (Math.random() < CRYSTAL_CHANCE) {
        crystals++;
        crystalsElement.textContent = crystals;
        
        // Эффект кристалла
        const crystalEffect = document.createElement("div");
        crystalEffect.textContent = "+1💎";
        crystalEffect.style.color = "#3a86ff";
        crystalEffect.style.position = "absolute";
        crystalEffect.style.left = `${Math.random() * 80 + 10}%`;
        crystalEffect.style.top = `${Math.random() * 50 + 20}%`;
        crystalEffect.style.animation = "floatUp 1s forwards";
        document.querySelector(".game-container").appendChild(crystalEffect);
        setTimeout(() => crystalEffect.remove(), 1000);
    }
    
    updateScore();
});

// Улучшения
upgrade1Button.addEventListener("click", () => {
    if (score >= 10 && !autoClickerActive) {
        score -= 10;
        autoClickerActive = true;
        upgrade1Button.disabled = true;
        upgrade1Button.textContent = "Автоклик активен!";
        
        autoClickerInterval = setInterval(() => {
            score += 1;
            updateScore();
        }, 1000);
        
        updateScore();
    }
});

upgrade2Button.addEventListener("click", () => {
    if (score >= 50) {
        score -= 50;
        clickPower *= 2;
        upgrade2Button.disabled = true;
        upgrade2Button.textContent = "Улучшение x2 куплено!";
        updateScore();
    }
});

// Супер-улучшения
superUpgrade1Button.addEventListener("click", () => {
    if (crystals >= 5) {
        crystals -= 5;
        clickPower += 10;
        updateScore();
    }
});

superUpgrade2Button.addEventListener("click", () => {
    if (crystals >= 20 && !autoClickerActive) {
        crystals -= 20;
        autoClickerActive = true;
        
        clearInterval(autoClickerInterval);
        autoClickerInterval = setInterval(() => {
            score += 5;
            updateScore();
        }, 1000);
        
        superUpgrade2Button.disabled = true;
        superUpgrade2Button.textContent = "Турбо-клик активен!";
        updateScore();
    }
});

// Проверка достижений
function checkAchievements() {
    const achievementElements = document.querySelectorAll(".achievement");
    
    achievementElements.forEach(achievementEl => {
        const id = achievementEl.getAttribute("data-id");
        const achievement = achievements[id];
        
        if (achievement.condition() && !achievement.unlocked) {
            achievement.unlocked = true;
            achievementEl.classList.add("unlocked");
            achievementSound.play();
            
            achievementEl.style.transform = "scale(1.05)";
            setTimeout(() => achievementEl.style.transform = "scale(1)", 300);
        }
    });
}

// Сохранение игры
function saveGame() {
    const gameData = {
        score,
        crystals,
        clickPower,
        autoClickerActive,
        achievements: Object.fromEntries(
            Object.entries(achievements).map(([id, ach]) => [id, ach.unlocked])
        ),
    };
    localStorage.setItem("clickerGameSave", JSON.stringify(gameData));
}

// Загрузка игры
function loadGame() {
    const savedData = localStorage.getItem("clickerGameSave");
    if (!savedData) return;

    const gameData = JSON.parse(savedData);
    score = gameData.score || 0;
    crystals = gameData.crystals || 0;
    clickPower = gameData.clickPower || 1;
    autoClickerActive = gameData.autoClickerActive || false;

    // Восстанавливаем достижения
    Object.keys(gameData.achievements || {}).forEach(id => {
        if (gameData.achievements[id]) {
            achievements[id].unlocked = true;
            document.querySelector(`.achievement[data-id="${id}"]`).classList.add("unlocked");
        }
    });

    // Восстанавливаем автокликер
    if (autoClickerActive) {
        clearInterval(autoClickerInterval);
        const intervalSpeed = clickPower >= 10 ? 200 : 1000; // Для турбо-автоклика
        autoClickerInterval = setInterval(() => {
            score += autoClickerActive ? (clickPower >= 10 ? 5 : 1) : 0;
            updateScore();
        }, intervalSpeed);
        
        upgrade1Button.disabled = true;
        upgrade1Button.textContent = "Автоклик активен!";
    }

    updateScore();
}

// Оффлайн-доход
function calculateOfflineProgress() {
    const lastPlayed = localStorage.getItem("lastPlayedTime");
    if (!lastPlayed) return;
    
    const offlineSeconds = Math.floor((Date.now() - lastPlayed) / 1000);
    if (offlineSeconds > 60) { // Минимум 1 минута
        const offlineCrystals = Math.floor(offlineSeconds / 600); // 1 кристалл за 10 минут
        if (offlineCrystals > 0) {
            crystals += offlineCrystals;
            alert(`За время вашего отсутствия получено: ${offlineCrystals}💎!`);
        }
    }
}

// Обновление счета
function updateScore() {
    scoreElement.textContent = score;
    crystalsElement.textContent = crystals;
    
    // Проверка улучшений
    upgrade1Button.disabled = score < 10 || autoClickerActive;
    upgrade2Button.disabled = score < 50;
    superUpgrade1Button.disabled = crystals < 5;
    superUpgrade2Button.disabled = crystals < 20 || autoClickerActive;
    
    checkAchievements();
    saveGame();
}

// Запуск игры
loadGame();
calculateOfflineProgress();

// Сохраняем время выхода
window.addEventListener("beforeunload", () => {
    localStorage.setItem("lastPlayedTime", Date.now());
});