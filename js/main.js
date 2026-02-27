import { Game } from './game.js';
import { generateAvatars, createAvatarElement } from './avatars.js';

// Module scripts are deferred — DOM is ready when this runs
const avatars = generateAvatars();

const startScreen = document.getElementById('startScreen');
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');

let selectedMode = 'pvp';
let p1Avatar = avatars[0];
let p2Avatar = avatars[50];
let game = null;

const DIFFICULTY = [
    { random: -60, timer: 80, pur: 5, rank: 'L1 入门', depth: 1 },
    { random: 3, timer: 200, pur: 6, rank: 'L2 进阶', depth: 1 },
    { random: 2, timer: 500, pur: 8, rank: 'L3 高手', depth: 2 }
];

function showScreen(screen) {
    startScreen.classList.add('hidden');
    setupScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

function ensureGame() {
    if (!game) {
        game = new Game();
    }
    return game;
}

// =============== 模式选择 ===============
document.getElementById('btnPvP').addEventListener('click', () => {
    selectedMode = 'pvp';
    showSetup();
});

document.getElementById('btnPvE').addEventListener('click', () => {
    selectedMode = 'pve';
    showSetup();
});

function showSetup() {
    showScreen(setupScreen);

    const p2Section = document.getElementById('p2SetupSection');
    const aiSection = document.getElementById('aiSetupSection');

    if (selectedMode === 'pvp') {
        p2Section.style.display = 'block';
        aiSection.style.display = 'none';
    } else {
        p2Section.style.display = 'none';
        aiSection.style.display = 'block';
    }

    renderAvatarPicker('p1AvatarGrid', (av) => { p1Avatar = av; }, 0);
    renderAvatarPicker('p2AvatarGrid', (av) => { p2Avatar = av; }, 50);
}

function renderAvatarPicker(containerId, onSelect, defaultIdx) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    avatars.forEach((av, i) => {
        const el = createAvatarElement(av, 40);
        el.classList.add('avatar-pick');
        if (i === defaultIdx) el.classList.add('selected');
        el.addEventListener('click', () => {
            container.querySelectorAll('.avatar-pick').forEach(a => a.classList.remove('selected'));
            el.classList.add('selected');
            onSelect(av);
        });
        container.appendChild(el);
    });
}

// =============== 设置确认 ===============
document.getElementById('btnStartGame').addEventListener('click', () => {
    const p1Name = document.getElementById('p1NameInput').value.trim() || '甜大官';
    const p2Name = document.getElementById('p2NameInput').value.trim() || '万小布';

    const g = ensureGame();

    g.setPlayers(
        { name: p1Name, avatar: p1Avatar },
        {
            name: selectedMode === 'pvp' ? p2Name : 'AI',
            avatar: selectedMode === 'pvp' ? p2Avatar : { emoji: '🤖', bg: 'linear-gradient(135deg, #666, #333)' }
        }
    );

    showScreen(gameScreen);

    if (selectedMode === 'pvp') {
        g.start('pvp');
    } else {
        const level = parseInt(document.querySelector('input[name="aiLevel"]:checked').value, 10);
        g.start('pve', DIFFICULTY[level]);
    }
});

document.getElementById('btnBackToStart').addEventListener('click', () => {
    showScreen(startScreen);
});

// =============== 游戏控制 ===============
document.getElementById('regretBtn').addEventListener('click', () => {
    if (game) game.regret();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    if (confirm('确定要重新开始吗？')) {
        showScreen(startScreen);
        if (game) game.reset();
    }
});

console.log('[五子棋] 模块加载完成');
