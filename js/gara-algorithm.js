// La Gara dei Numeri - Adaptive Algorithm Engine
// Faithful port of the original NumCompAlgManager & GameTurn logic
// Original game by A. Wilson, S. Dehaene, P. Pinel, D. Dubois (INSERM-CEA)
// Web adaptation for CCNL - University of Padova
class GaraAlgorithm {
    constructor() {
        this.difficulty = GARA_CONFIG.DIFFICULTY.START;
        this.meanSuccess = 0;
        this.turnCount = 0;
        this.totalCorrect = 0;
        this.notationLevel = 0; // 0=dots, 1=digits+dots, 2=arabic
        this.level = 1; // 1=base(1-9), 7+=advanced(sums)
        this.streakCorrect = 0;
        this.streakWrong = 0;
        // Weber fraction estimate (w = JND / mean_n); initialised at staircase start value
        this.weberEstimate = parseFloat((Math.max(1, Math.round((1 - GARA_CONFIG.DIFFICULTY.START) * 7)) / 5.0).toFixed(3));
    }

    setLevel(lvl) {
        this.level = lvl;
        if (lvl >= 7) this.notationLevel = 2;
    }

    generateTurn() {
        this.turnCount++;
        const maxNum = 9;
        let left, right, notation;

        // Determine notation based on difficulty and level
        if (this.level >= 7) {
            notation = 'sum';
        } else if (this.difficulty > 0.85) {
            const r = Math.random();
            notation = r < 0.33 ? 'dots' : r < 0.66 ? 'digits' : 'arabic';
        } else if (this.difficulty > 0.6) {
            notation = Math.random() < 0.5 ? 'dots' : 'digits';
        } else {
            notation = 'dots';
        }

        // Generate numbers based on difficulty
        if (notation === 'sum') {
            // Advanced: generate addition problems
            const a1 = Math.floor(Math.random() * 5) + 1;
            const b1 = Math.floor(Math.random() * 5) + 1;
            let a2 = Math.floor(Math.random() * 5) + 1;
            let b2 = Math.floor(Math.random() * 5) + 1;
            left = { type: 'sum', a: a1, b: b1, total: a1 + b1 };
            right = { type: 'sum', a: a2, b: b2, total: a2 + b2 };
            // Ensure totals differ
            let attempts = 0;
            while (left.total === right.total && attempts < 20) {
                right.a = Math.floor(Math.random() * 5) + 1;
                right.b = Math.floor(Math.random() * 5) + 1;
                right.total = right.a + right.b;
                attempts++;
            }
            if (left.total === right.total) {
                right.b = (right.b % 5) + 1;
                right.total = right.a + right.b;
            }
        } else {
            // Adaptive distance: higher difficulty = closer numbers
            const minDist = Math.max(1, Math.round((1 - this.difficulty) * 7));
            const maxDist = Math.max(minDist, Math.round((1 - this.difficulty) * 9));
            const dist = minDist + Math.floor(Math.random() * (maxDist - minDist + 1));
            const bigger = Math.max(dist + 1, Math.min(maxNum, Math.floor(Math.random() * (maxNum - dist)) + dist + 1));
            const smaller = bigger - dist;
            left = { type: notation, value: 0 };
            right = { type: notation, value: 0 };
            if (Math.random() < 0.5) {
                left.value = bigger; right.value = smaller;
            } else {
                left.value = smaller; right.value = bigger;
            }
            // Clamp values to valid range
            left.value = Math.max(1, Math.min(9, left.value));
            right.value = Math.max(1, Math.min(9, right.value));
            // Guarantee they differ
            if (left.value === right.value) {
                if (right.value < 9) right.value += 1;
                else right.value -= 1;
            }
        }

        // Generate dot properties for dot notation
        if (notation === 'dots' || notation === 'digits') {
            /**
             * Grid-Jitter placement (Wilson & Dehaene 2006 protocol).
             *
             * The container's usable area (after PADDING) is divided into a
             * virtual grid of cols × rows cells.  Each cell is larger than one
             * dot diameter, so occupying different cells guarantees zero overlap.
             * val cells are chosen at random (Fisher-Yates shuffle); each dot is
             * placed at its cell centre plus a bounded random jitter that is
             * strictly less than the safety margin — so no dot ever touches a
             * neighbour or the container wall.
             *
             *   Cell size  > dot diameter   →  zero overlap (by construction)
             *   jitter     < (cell − dot) / 2 − BUFFER  →  zero clipping
             *
             * Dot colour: #000000 (pure black) per the original protocol.
             * Maximum contrast against the game's coloured backgrounds.
             */
            const dotProps = (val, areaW, areaH) => {
                const PADDING = 10;  // px — minimum gap from container wall to dot edge
                const BUFFER  =  3;  // px — extra safety margin between neighbours

                const usableW = areaW - 2 * PADDING;
                const usableH = areaH - 2 * PADDING;

                // Grid: aspect-ratio-preserving, always enough cells for val dots
                const cols = Math.max(1, Math.ceil(Math.sqrt(val * usableW / usableH)));
                const rows = Math.max(1, Math.ceil(val / cols));

                const cellW = usableW / cols;
                const cellH = usableH / rows;

                // Dot radius: 35% of the shorter cell dimension, clamped for legibility
                const r = Math.max(5, Math.min(24, Math.floor(Math.min(cellW, cellH) * 0.35)));

                // Max jitter: dot centre may shift at most this far from cell centre.
                // Bounded so the dot surface never exits its cell (minus BUFFER gap).
                const jx = Math.max(0, (cellW / 2) - r - BUFFER);
                const jy = Math.max(0, (cellH / 2) - r - BUFFER);

                // Build all cell indices, shuffle (Fisher-Yates), take first val
                const cells = [];
                for (let row = 0; row < rows; row++)
                    for (let col = 0; col < cols; col++)
                        cells.push({ col, row });

                for (let i = cells.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [cells[i], cells[j]] = [cells[j], cells[i]];
                }

                // Place one dot per selected cell with bounded jitter
                return cells.slice(0, val).map(({ col, row }) => {
                    const cx = PADDING + (col + 0.5) * cellW + (Math.random() * 2 - 1) * jx;
                    const cy = PADDING + (row + 0.5) * cellH + (Math.random() * 2 - 1) * jy;
                    return {
                        x:    cx - r,
                        y:    cy - r,
                        size: r * 2,
                        color: '#000000'   // original protocol: max contrast
                    };
                });
            };

            // Use responsive dimensions so dots fit on mobile without overflow.
            // Three tiers must match the CSS breakpoints exactly.
            const vw = typeof window !== 'undefined' ? window.innerWidth : 900;
            const isSmall  = vw < 480;  // very small phones — vertical stack layout
            const isMobile = vw < 640;  // regular mobile
            const mainW = isSmall ? 148 : (isMobile ? 170 : 220);
            const mainH = isSmall ? 125 : (isMobile ? 145 : 185);
            const miniW = isSmall ? 100 : (isMobile ? 116 : 148);
            const miniH = isSmall ?  80 : (isMobile ?  92 : 118);

            const useMini = (notation === 'digits');
            const [aw, ah] = useMini ? [miniW, miniH] : [mainW, mainH];

            if (left.value  !== undefined) left.dots  = dotProps(left.value,  aw, ah);
            if (right.value !== undefined) right.dots = dotProps(right.value, aw, ah);
        }

        // Determine correct side
        const leftVal = left.total !== undefined ? left.total : left.value;
        const rightVal = right.total !== undefined ? right.total : right.value;
        const correctSide = leftVal > rightVal ? 'left' : 'right';

        // Determine deadline (speed pressure) based on difficulty
        const deadline = Math.max(3000, 8000 - (this.difficulty * 4000));

        return { left, right, correctSide, notation, deadline, turnNumber: this.turnCount };
    }

    processResponse(correct, turn) {
        if (correct) {
            this.totalCorrect++;
            this.streakCorrect++;
            this.streakWrong = 0;
            this.difficulty = Math.min(GARA_CONFIG.DIFFICULTY.MAX,
                this.difficulty + GARA_CONFIG.DIFFICULTY.STEP_UP);
        } else {
            this.streakCorrect = 0;
            this.streakWrong++;
            this.difficulty = Math.max(GARA_CONFIG.DIFFICULTY.MIN,
                this.difficulty - GARA_CONFIG.DIFFICULTY.STEP_DOWN);
        }
        this.meanSuccess = this.totalCorrect / this.turnCount;

        // Weber fraction estimate: w ≈ JND / mean_n
        // The staircase converges to the threshold distance; mean numerosity is ~5 (range 1–9).
        // Matches Weber's Law: Δn/n ≈ constant at threshold performance (~75% correct).
        const jnd = Math.max(1, Math.round((1 - this.difficulty) * 7));
        this.weberEstimate = parseFloat((jnd / 5.0).toFixed(3));

        // Export live state for inspector polling
        window._ccnl_gara_state = {
            difficulty:    parseFloat(this.difficulty.toFixed(3)),
            weberEstimate: this.weberEstimate,
            accuracy:      parseFloat((this.meanSuccess * 100).toFixed(1)),
            trial:         this.turnCount,
            jnd,
            streakCorrect: this.streakCorrect,
            streakWrong:   this.streakWrong,
            lastCorrect:   correct
        };

        // Calculate movement from the turn data
        const leftVal = turn.left.total !== undefined ? turn.left.total : (turn.left.value || 0);
        const rightVal = turn.right.total !== undefined ? turn.right.total : (turn.right.value || 0);
        const biggerVal = Math.max(leftVal, rightVal);
        const smallerVal = Math.min(leftVal, rightVal);

        return {
            playerMove: correct ? biggerVal : 0,
            enemyMove: correct ? smallerVal : biggerVal,
            playerBack: correct ? 0 : smallerVal,
            enemyBack: 0
        };
    }
}
