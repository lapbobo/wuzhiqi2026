/**
 * Canvas 渲染器 — 传统木纹五子棋棋盘
 */
export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 600;
        this.height = 600;
        this.gridSize = 15;
        this.cellSize = 38;
        this.padding = 34;
        this.hoverPos = null;
        this.setupHiDPI();
        this.bindHover();
    }

    setupHiDPI() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
    }

    bindHover() {
        this.canvas.addEventListener('mousemove', (e) => {
            this.hoverPos = this.getLogicalPos(e);
        });
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverPos = null;
        });
    }

    /** 绘制木纹背景 */
    drawWoodBackground() {
        const ctx = this.ctx;
        // 底色
        const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
        bg.addColorStop(0, '#E8C88A');
        bg.addColorStop(0.3, '#D4A84B');
        bg.addColorStop(0.6, '#DEB866');
        bg.addColorStop(1, '#C8A04A');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // 模拟木纹纹理
        ctx.save();
        ctx.globalAlpha = 0.06;
        for (let i = 0; i < 60; i++) {
            const y = i * 10 + Math.sin(i * 0.5) * 3;
            ctx.strokeStyle = i % 3 === 0 ? '#8B6914' : '#A07828';
            ctx.lineWidth = Math.random() * 2 + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < this.width; x += 20) {
                ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 2);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    /** 绘制棋盘网格 */
    drawBoard() {
        const ctx = this.ctx;
        const p = this.padding;
        const c = this.cellSize;
        const end = p + (this.gridSize - 1) * c;

        ctx.strokeStyle = '#4A3520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < this.gridSize; i++) {
            const pos = p + i * c;
            ctx.moveTo(pos, p);
            ctx.lineTo(pos, end);
            ctx.moveTo(p, pos);
            ctx.lineTo(end, pos);
        }
        ctx.stroke();

        // 外框加粗
        ctx.strokeStyle = '#3A2510';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(p, p, (this.gridSize - 1) * c, (this.gridSize - 1) * c);

        // 星位
        const stars = [[3, 3], [11, 3], [3, 11], [11, 11], [7, 7]];
        ctx.fillStyle = '#3A2510';
        for (const [sx, sy] of stars) {
            ctx.beginPath();
            ctx.arc(p + sx * c, p + sy * c, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 坐标
        ctx.fillStyle = 'rgba(74, 53, 32, 0.5)';
        ctx.font = '10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < this.gridSize; i++) {
            ctx.fillText(String.fromCharCode(65 + i), p + i * c, p - 16);
            ctx.fillText(String(i + 1), p - 18, p + i * c);
        }
    }

    /** 绘制立体棋子 */
    drawPiece(x, y, isBlack, isLast = false) {
        const ctx = this.ctx;
        const cx = this.padding + x * this.cellSize;
        const cy = this.padding + y * this.cellSize;
        const r = this.cellSize * 0.42;

        ctx.save();

        // 棋子阴影
        ctx.beginPath();
        ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fill();

        // 棋子本体（径向渐变实现 3D 立体感）
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);

        if (isBlack) {
            const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
            grad.addColorStop(0, '#5A5A5A');
            grad.addColorStop(0.4, '#2A2A2A');
            grad.addColorStop(1, '#0A0A0A');
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.4, '#F0F0F0');
            grad.addColorStop(1, '#C0C0C0');
            ctx.fillStyle = grad;
        }
        ctx.fill();

        // 棋子轮廓
        ctx.strokeStyle = isBlack ? '#000' : '#999';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();

        // 最后一手标记 — 小红点
        if (isLast) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#E53E3E';
            ctx.fill();
            ctx.restore();
        }
    }

    /** 鼠标悬浮半透明预览棋子 */
    drawHover(map, currentPlayer) {
        if (!this.hoverPos) return;
        const { x, y } = this.hoverPos;
        if (map[y][x] !== 0) return;

        const cx = this.padding + x * this.cellSize;
        const cy = this.padding + y * this.cellSize;
        const r = this.cellSize * 0.38;

        this.ctx.save();
        this.ctx.globalAlpha = 0.35;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.fillStyle = currentPlayer === 1 ? '#1a1a1a' : '#e8e8e8';
        this.ctx.fill();
        this.ctx.restore();
    }

    getLogicalPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        const rx = (e.clientX - rect.left) * scaleX;
        const ry = (e.clientY - rect.top) * scaleY;
        return {
            x: Math.max(0, Math.min(14, Math.round((rx - this.padding) / this.cellSize))),
            y: Math.max(0, Math.min(14, Math.round((ry - this.padding) / this.cellSize)))
        };
    }

    /** 主渲染入口 */
    render(map, lastMove, currentPlayer) {
        this.drawWoodBackground();
        this.drawBoard();
        this.drawHover(map, currentPlayer);
        for (let i = 0; i < 15; i++) {
            for (let j = 0; j < 15; j++) {
                if (map[i][j] !== 0) {
                    const isBlack = map[i][j] === 1;
                    const isLast = lastMove && lastMove.x === j && lastMove.y === i;
                    this.drawPiece(j, i, isBlack, isLast);
                }
            }
        }
    }
}
