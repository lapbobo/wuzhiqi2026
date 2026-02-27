import { Renderer } from './renderer.js';
import { AI } from './ai.js';

/**
 * Game — 五子棋核心状态机（支持双人对战 + 人机对战）
 */
export class Game {
    constructor() {
        this.renderer = new Renderer('wuzi');
        this.map = this.createEmptyMap();
        this.pace = [];
        this.isPlay = false;
        this.currentPlayer = 1; // 1 = 黑子(玩家1), -1 = 白子(玩家2/AI)
        this.mode = 'pvp';      // 'pvp' | 'pve'
        this.ai = null;
        this.regretCount = 3;
        this.animFrameId = null;

        // 玩家信息
        this.players = {
            1: { name: '甜大官', avatar: null },
            [-1]: { name: '万小布', avatar: null }
        };

        // DOM 缓存
        this.dom = {
            p1Name: document.getElementById('p1GameName'),
            p1Avatar: document.getElementById('p1GameAvatar'),
            p2Name: document.getElementById('p2GameName'),
            p2Avatar: document.getElementById('p2GameAvatar'),
            turnIndicator: document.getElementById('turnIndicator'),
            regret: document.getElementById('regretBtn'),
            clickAudio: document.getElementById('clickAudio'),
            selectAudio: document.getElementById('selectAudio'),
            modal: document.getElementById('resultModal'),
            modalTitle: document.getElementById('resultTitle'),
            modalDesc: document.getElementById('resultDesc'),
            modalAvatar: document.getElementById('resultAvatar'),
            p1Panel: document.getElementById('p1Panel'),
            p2Panel: document.getElementById('p2Panel'),
        };

        this.bindEvents();
        this.startRenderLoop();
    }

    createEmptyMap() {
        return Array.from({ length: 15 }, () => new Array(15).fill(0));
    }

    bindEvents() {
        this.renderer.canvas.addEventListener('click', (e) => this.onBoardClick(e));
        document.getElementById('modalCloseBtn').addEventListener('click', () => {
            this.dom.modal.classList.remove('active');
            // 返回主菜单
            document.getElementById('startScreen').classList.remove('hidden');
            document.getElementById('gameScreen').classList.add('hidden');
        });
    }

    startRenderLoop() {
        const loop = () => {
            const lastMove = this.pace.length > 0 ? this.pace[this.pace.length - 1] : null;
            this.renderer.render(this.map, lastMove, this.currentPlayer);
            this.animFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    setPlayers(p1, p2) {
        this.players[1] = p1;
        this.players[-1] = p2;
    }

    updateGameUI() {
        const p1 = this.players[1];
        const p2 = this.players[-1];

        this.dom.p1Name.textContent = p1.name;
        this.dom.p2Name.textContent = p2.name;

        if (p1.avatar) {
            this.dom.p1Avatar.style.background = p1.avatar.bg;
            this.dom.p1Avatar.textContent = p1.avatar.emoji;
        }
        if (p2.avatar) {
            this.dom.p2Avatar.style.background = p2.avatar.bg;
            this.dom.p2Avatar.textContent = p2.avatar.emoji;
        }

        this.updateTurnIndicator();
    }

    updateTurnIndicator() {
        const current = this.players[this.currentPlayer];
        const color = this.currentPlayer === 1 ? '●' : '○';
        this.dom.turnIndicator.textContent = `${color} ${current.name} 落子`;

        // 高亮当前玩家面板
        this.dom.p1Panel.classList.toggle('active-turn', this.currentPlayer === 1);
        this.dom.p2Panel.classList.toggle('active-turn', this.currentPlayer === -1);
    }

    start(mode, arg) {
        this.mode = mode;
        if (mode === 'pve') {
            this.ai = new AI(arg);
        }
        this.reset();
        this.isPlay = true;
        this.updateGameUI();
    }

    reset() {
        this.map = this.createEmptyMap();
        this.pace = [];
        this.currentPlayer = 1;
        this.regretCount = 3;
        this.isPlay = false;
        this.syncRegretBtn();
    }

    onBoardClick(e) {
        if (!this.isPlay) return;

        const { x, y } = this.renderer.getLogicalPos(e);
        if (this.map[y][x] !== 0) return;

        this.playAudio(this.dom.clickAudio);
        this.placePiece(x, y, this.currentPlayer);

        if (this.checkWin(x, y)) {
            this.endGame(this.currentPlayer);
            return;
        }

        if (this.checkDraw()) {
            this.endGame(0);
            return;
        }

        // 切换玩家
        this.currentPlayer = -this.currentPlayer;
        this.updateTurnIndicator();

        // PvE 模式: AI 回合
        if (this.mode === 'pve' && this.currentPlayer === -1) {
            this.isPlay = false;
            this.dom.turnIndicator.textContent = '🤖 AI 思考中...';
            const delay = Math.max(80, this.ai.arg.timer || 100);
            setTimeout(() => {
                const move = this.ai.calculate(this.map, this.ai.arg.depth, -1, x, y);
                if (move) {
                    this.playAudio(this.dom.selectAudio);
                    this.placePiece(move.x, move.y, -1);
                    if (this.checkWin(move.x, move.y)) {
                        this.endGame(-1);
                        return;
                    }
                }
                this.currentPlayer = 1;
                this.updateTurnIndicator();
                this.isPlay = true;
            }, delay);
        }
    }

    placePiece(x, y, player) {
        this.map[y][x] = player;
        this.pace.push({ x, y, player });
    }

    regret() {
        if (!this.regretCount || !this.isPlay || this.pace.length < 1) return;

        if (this.mode === 'pvp') {
            // PvP: 撤销上一手
            const last = this.pace.pop();
            this.map[last.y][last.x] = 0;
            this.currentPlayer = last.player; // 回到被撤销的那一方
        } else {
            // PvE: 撤销两步 (AI + 玩家)
            if (this.pace.length < 2) return;
            for (let i = 0; i < 2; i++) {
                const last = this.pace.pop();
                if (last) this.map[last.y][last.x] = 0;
            }
            this.currentPlayer = 1;
        }

        this.regretCount--;
        this.syncRegretBtn();
        this.updateTurnIndicator();
    }

    syncRegretBtn() {
        this.dom.regret.textContent = `悔棋 (${this.regretCount})`;
        this.dom.regret.disabled = this.regretCount <= 0;
    }

    playAudio(el) {
        if (!el) return;
        el.currentTime = 0;
        el.play().catch(() => { });
    }

    checkWin(x, y) {
        const p = this.map[y][x];
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (const [dx, dy] of dirs) {
            let n = 1;
            for (let s = -1; s <= 1; s += 2) {
                for (let i = 1; i < 5; i++) {
                    const nx = x + dx * i * s;
                    const ny = y + dy * i * s;
                    if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && this.map[ny][nx] === p) n++;
                    else break;
                }
            }
            if (n >= 5) return true;
        }
        return false;
    }

    checkDraw() {
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (this.map[i][j] === 0) return false;
            }
        }
        return true;
    }

    endGame(winner) {
        this.isPlay = false;
        const d = this.dom;

        setTimeout(() => {
            if (winner === 0) {
                d.modalTitle.textContent = '和棋！';
                d.modalDesc.textContent = '棋盘已满，双方握手言和。';
                d.modalAvatar.textContent = '🤝';
                d.modalAvatar.style.background = 'linear-gradient(135deg, #888, #555)';
            } else {
                const w = this.players[winner];
                const color = winner === 1 ? '黑棋' : '白棋';
                d.modalTitle.textContent = `${w.name} 获胜！`;
                d.modalDesc.textContent = `执${color}，精妙绝伦！`;
                if (w.avatar) {
                    d.modalAvatar.textContent = w.avatar.emoji;
                    d.modalAvatar.style.background = w.avatar.bg;
                } else {
                    d.modalAvatar.textContent = winner === 1 ? '⚫' : '⚪';
                    d.modalAvatar.style.background = 'linear-gradient(135deg, #888, #555)';
                }
            }
            d.modal.classList.add('active');
        }, 350);
    }
}
