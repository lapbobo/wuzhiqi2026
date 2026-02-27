/**
 * AI Engine — Alpha-Beta Pruning with Minimax
 * 基于极小化极大算法 + Alpha-Beta 剪枝的五子棋 AI 引擎
 */
export class AI {
    constructor(arg) {
        this.arg = arg;
        this.count = 0;
    }

    /**
     * 计算 AI 最佳落子点
     * @param {number[][]} map  15x15 棋盘数组
     * @param {number} depth    搜索深度
     * @param {number} my       AI 身份标识 (-1)
     * @param {number} x        上一步落子 x
     * @param {number} y        上一步落子 y
     * @returns {{x: number, y: number}|false}
     */
    calculate(map, depth, my, x, y) {
        this.count = 0;
        this.searchDepth = depth;
        const t0 = performance.now();
        const result = this.alphaBeta(-999999, 999999, depth, map, my, x, y);
        const dt = (performance.now() - t0).toFixed(1);

        if (result) {
            console.log(
                `[AI] ${this.arg.rank} | 分支: ${this.count} | ` +
                `落点: (${result.x}, ${result.y}) | 评分: ${result.value} | ${dt}ms`
            );
        }
        return result ? { x: result.x, y: result.y } : false;
    }

    alphaBeta(alpha, beta, depth, map, my, x, y) {
        if (depth === 0) {
            this.count++;
            return { value: this.evaluate(map, my, x, y) };
        }

        const moves = this.generateMoves(map, x, y);
        if (moves.length === 0) {
            this.count++;
            return { value: this.evaluate(map, my, x, y) };
        }

        let bestMove = null;

        for (const move of moves) {
            map[move.y][move.x] = my;
            const val = -this.alphaBeta(-beta, -alpha, depth - 1, map, -my, move.x, move.y).value;
            map[move.y][move.x] = 0;

            if (val >= beta) {
                return { x: move.x, y: move.y, value: beta };
            }
            if (val > alpha) {
                alpha = val;
                if (depth === this.searchDepth) {
                    bestMove = { x: move.x, y: move.y, value: alpha };
                }
            }
        }

        if (depth === this.searchDepth) {
            return bestMove || false;
        }
        return { x, y, value: alpha };
    }

    /**
     * 生成候选走法：以上一步落点为中心，在 pur 范围内搜索空位
     */
    generateMoves(map, x, y) {
        const pur = this.arg.pur;
        const moves = [];
        const minX = Math.max(0, x - pur);
        const maxX = Math.min(14, x + pur);
        const minY = Math.max(0, y - pur);
        const maxY = Math.min(14, y + pur);

        for (let i = minY; i <= maxY; i++) {
            for (let j = minX; j <= maxX; j++) {
                if (map[i][j] === 0) {
                    moves.push({ x: j, y: i });
                }
            }
        }
        return moves;
    }

    /**
     * 局面评估 — 综合己方与对方的局势打分
     */
    evaluate(map, my, x, y) {
        return (this.getScore(map, my, x, y) + this.getScore(map, -my, x, y)) * -my;
    }

    /**
     * 单方向得分计算 — 统计四个方向上的连珠形态
     */
    getScore(map, my, x, y) {
        let score = Math.floor(Math.random() * this.arg.random);

        // 形态权重表：key = 连子数 * 10 + 开放端数
        const WEIGHT = {
            11: 1, 12: 2,
            21: 10, 22: 20,
            31: 30, 32: 50,
            41: 60, 42: 100,
            50: 88888, 51: 88888, 52: 88888
        };

        // 四个方向: 水平、垂直、左上-右下、右上-左下
        const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dx, dy] of DIRS) {
            let n = 1;   // 连子数 (含自身)
            let open = 0; // 开放端数

            // 正方向探测
            for (let i = 1; i < 15; i++) {
                const nx = x + dx * i, ny = y + dy * i;
                if (nx < 0 || nx > 14 || ny < 0 || ny > 14) break;
                if (map[ny][nx] === my) { n++; }
                else { if (map[ny][nx] === 0) open++; break; }
            }
            // 反方向探测
            for (let i = 1; i < 15; i++) {
                const nx = x - dx * i, ny = y - dy * i;
                if (nx < 0 || nx > 14 || ny < 0 || ny > 14) break;
                if (map[ny][nx] === my) { n++; }
                else { if (map[ny][nx] === 0) open++; break; }
            }

            if (n > 5) n = 5;
            score += WEIGHT[n * 10 + open] || 0;
        }

        return score;
    }
}
