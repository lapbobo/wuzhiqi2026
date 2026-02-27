import { Game } from './game.js';
import { generateAvatars, createAvatarElement } from './avatars.js';

const avatars = generateAvatars();

const startScreen = document.getElementById('startScreen');
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');

let selectedMode = 'pvp';
let p1Avatar = avatars[0];
let p2Avatar = avatars[50];
let activeTab = 1; // 当前正在为哪位玩家选头像: 1 或 2
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
    if (!game) game = new Game();
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
    const avatarSection = document.querySelector('.avatar-section');

    if (selectedMode === 'pvp') {
        p2Section.style.display = '';
        aiSection.style.display = 'none';
        avatarSection.style.display = '';
    } else {
        p2Section.style.display = 'none';
        aiSection.style.display = '';
        avatarSection.style.display = '';
    }

    // 重置默认选择
    p1Avatar = avatars[0];
    p2Avatar = avatars[50];
    activeTab = 1;

    renderSharedAvatarGrid();
    updateTabs();
}

// =============== 头像标签页切换 ===============
document.getElementById('tabP1').addEventListener('click', () => {
    activeTab = 1;
    updateTabs();
});

document.getElementById('tabP2').addEventListener('click', () => {
    activeTab = 2;
    updateTabs();
});

function updateTabs() {
    const tab1 = document.getElementById('tabP1');
    const tab2 = document.getElementById('tabP2');
    tab1.classList.toggle('active', activeTab === 1);
    tab2.classList.toggle('active', activeTab === 2);

    // 显示预览 emoji
    document.getElementById('tabP1Preview').textContent = p1Avatar.emoji;
    document.getElementById('tabP2Preview').textContent = p2Avatar.emoji;

    // PvE 模式隐藏 P2 标签
    if (selectedMode === 'pve') {
        tab2.style.display = 'none';
        activeTab = 1;
        tab1.classList.add('active');
    } else {
        tab2.style.display = '';
    }

    refreshAvatarStates();
}

// =============== 共享头像库 ===============
function renderSharedAvatarGrid() {
    const container = document.getElementById('sharedAvatarGrid');
    container.innerHTML = '';

    avatars.forEach((av) => {
        const el = createAvatarElement(av, 40);
        el.classList.add('avatar-pick');

        el.addEventListener('click', () => {
            const clickedId = av.id;

            // 不可选择另一位玩家已选的头像
            if (activeTab === 1 && p2Avatar && p2Avatar.id === clickedId) return;
            if (activeTab === 2 && p1Avatar && p1Avatar.id === clickedId) return;

            if (activeTab === 1) {
                p1Avatar = av;
            } else {
                p2Avatar = av;
            }

            updateTabs();
        });

        container.appendChild(el);
    });

    refreshAvatarStates();
}

function refreshAvatarStates() {
    const container = document.getElementById('sharedAvatarGrid');
    const items = container.querySelectorAll('.avatar-pick');

    items.forEach((el, i) => {
        const av = avatars[i];
        const isP1 = p1Avatar && p1Avatar.id === av.id;
        const isP2 = p2Avatar && p2Avatar.id === av.id;

        el.classList.remove('selected-p1', 'selected-p2', 'disabled');

        if (isP1) {
            el.classList.add('selected-p1');
        } else if (isP2) {
            el.classList.add('selected-p2');
        }

        // PvP 模式下，另一方已选的头像标灰
        if (selectedMode === 'pvp') {
            if (activeTab === 1 && isP2) el.classList.add('disabled');
            if (activeTab === 2 && isP1) el.classList.add('disabled');
        }
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
