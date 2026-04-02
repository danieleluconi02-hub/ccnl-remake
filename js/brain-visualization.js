/**
 * NeuralArchitectureVis
 * ═══════════════════════════════════════════════════════════════════════
 * Interactive HTML5 Canvas — Real Neural Architecture Topologies
 * Computational Cognitive Neuroscience Lab · University of Padova
 *
 * Six architectures rendered with mathematical precision:
 *   SLP · MLP · Autoencoder · RNN · Hopfield · CNN
 *
 * Design axioms:
 *  1. Nodes are STATIC — absolute geometric precision, zero wobble.
 *  2. Cursor = excitation beam — activation propagates along weighted
 *     synapses with exponential decay and travels as visible pulses.
 *  3. Retina-ready (devicePixelRatio scaling).
 *  4. Pure Vanilla JS, single rAF loop, zero dependencies.
 * ═══════════════════════════════════════════════════════════════════════
 */

class NeuralArchitectureVis {

    // ─── Architecture Catalogue — Desktop ───────────────────────────
    static ARCHITECTURES = [
        {
            id: 'slp',
            name: 'Single-Layer Perceptron',
            desc: 'Rosenblatt, 1957 — Direct input → output linear classifier.',
            structure: [12, 1],
            type: 'feedforward'
        },
        {
            id: 'mlp',
            name: 'Multi-Layer Perceptron',
            desc: 'Deep feed-forward network with hierarchical hidden representations.',
            structure: [6, 10, 12, 10, 4],
            type: 'feedforward'
        },
        {
            id: 'autoencoder',
            name: 'Autoencoder',
            desc: 'Symmetric bottleneck — learns compressed latent representations.',
            structure: [10, 7, 3, 7, 10],
            type: 'feedforward'
        },
        {
            id: 'rnn',
            name: 'Recurrent Neural Network',
            desc: 'Temporal dynamics via feedback loops within hidden layers.',
            structure: [6, 8, 8, 4],
            type: 'recurrent'
        },
        {
            id: 'hopfield',
            name: 'Hopfield Network',
            desc: 'Fully connected associative memory with symmetric weights.',
            structure: [16],
            type: 'hopfield'
        },
        {
            id: 'cnn',
            name: 'Convolutional Neural Network',
            desc: 'Hierarchical feature extraction via local receptive fields.',
            structure: [16, 12, 8, 4, 2],
            type: 'cnn'
        }
    ];

    // ─── Architecture Catalogue — Mobile (reduced node density) ─────
    static MOBILE_ARCHITECTURES = [
        {
            id: 'slp',
            name: 'Single-Layer Perceptron',
            desc: 'Rosenblatt, 1957 — Direct input → output linear classifier.',
            structure: [8, 1],
            type: 'feedforward'
        },
        {
            id: 'mlp',
            name: 'Multi-Layer Perceptron',
            desc: 'Hierarchical hidden representations.',
            structure: [4, 6, 6, 3],
            type: 'feedforward'
        },
        {
            id: 'autoencoder',
            name: 'Autoencoder',
            desc: 'Symmetric bottleneck — compressed latent representations.',
            structure: [6, 4, 2, 4, 6],
            type: 'feedforward'
        },
        {
            id: 'hopfield',
            name: 'Hopfield Network',
            desc: 'Fully connected associative memory.',
            structure: [10],
            type: 'hopfield'
        },
    ];

    // ─── Visual Constants ───────────────────────────────────────────
    static S = {
        // Node
        nodeRadius:      4.0,
        nodeColorRest:   [178, 8, 57],    // #b20839 — Padova Red (always red)
        nodeAlphaRest:   0.90,

        // Accent palette — Padova Red (brighter on activation)
        accent:          [178, 8, 57],     // #b20839 — Padova Red
        accentAlt:       [210, 30, 80],    // slightly lighter for recurrent
        gold:            [178, 8, 57],     // canonical CCNL red

        // Edge resting — faint red connections
        edgeColor:       [178, 8, 57],    // #b20839 — Padova Red
        edgeAlphaMin:    0.12,
        edgeAlphaWeight: 0.18,
        edgeWidthMin:    0.3,
        edgeWidthWeight: 1.0,

        // Spotlight interaction — tighter, more precise beam
        spotRadius:      85,
        actRise:         0.12,
        actDecay:        0.04,

        // Active edge
        activeAlpha:     0.85,
        activeWidth:     3.0,

        // Node glow
        glowBlur:        16,

        // Layout padding (fraction of canvas dim)
        padX:            0.10,
        padY:            0.10,

        // Signal pulse
        pulseSpeed:      0.018,
        pulseDecay:      0.015,

        // Draw-in animation
        drawInDuration:  1200, // ms
    };

    // ─── Constructor ────────────────────────────────────────────────
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.container.style.position = 'relative';

        // Detect mobile once, reuse everywhere
        this.isMobile = window.matchMedia('(max-width: 768px)').matches;

        // Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Label
        this._makeLabel();

        // State
        this.nodes  = [];
        this.edges  = [];
        this.pulses = [];
        this.mouse  = { x: null, y: null };
        this.dpr    = Math.min(window.devicePixelRatio || 1, 2);
        this._raf   = null;
        this._t0    = performance.now();

        // Pick random architecture (smaller pool on mobile for performance)
        const pool = this.isMobile
            ? NeuralArchitectureVis.MOBILE_ARCHITECTURES
            : NeuralArchitectureVis.ARCHITECTURES;
        this.arch = pool[Math.floor(Math.random() * pool.length)];

        this._resize();
        this._build();
        this._setLabel();
        this._positionLabel();
        this._bind();
        this._loop();
    }

    // ─── Label ──────────────────────────────────────────────────────
    _makeLabel() {
        this.label = document.createElement('div');

        if (this.isMobile) {
            // On mobile: in-flow block below the canvas, centered, no overlap
            Object.assign(this.label.style, {
                position: 'relative',
                marginTop: '1.5rem',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '13px', lineHeight: '1.5',
                textAlign: 'center', pointerEvents: 'none',
                userSelect: 'none', width: '100%', zIndex: '10',
                opacity: '0',
                transition: 'opacity 0.35s ease',
            });
            // Append inside the flex column so it flows below #neural-network-bg
            const parent = this.container.parentElement || this.container;
            parent.appendChild(this.label);
        } else {
            // Desktop: absolute overlay at the bottom of the parent
            Object.assign(this.label.style, {
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '13px', lineHeight: '1.5',
                textAlign: 'center', pointerEvents: 'none',
                userSelect: 'none', maxWidth: '340px', zIndex: '10',
                opacity: '0',
                transition: 'opacity 0.35s ease',
                whiteSpace: 'nowrap',
            });
            const parent = this.container.parentElement || this.container;
            parent.style.position = 'relative';
            parent.appendChild(this.label);
        }
    }

    _setLabel() {
        const a = this.arch;
        this.label.innerHTML =
            `<span style="display:block;font-weight:700;font-size:14px;` +
            `color:#b20839;letter-spacing:.01em;margin-bottom:3px">${a.name}</span>` +
            `<span style="display:block;font-family:'JetBrains Mono','Courier New',monospace;` +
            `font-size:10px;color:#6B7280;letter-spacing:.04em">${a.desc}</span>`;
    }

    // Position label centred on the actual network centre within the parent element
    _positionLabel() {
        // On mobile the label is in-flow (position: relative) — no JS positioning needed
        if (this.isMobile) return;
        const parent = this.container.parentElement;
        if (!parent) return;
        const containerRect = this.container.getBoundingClientRect();
        const parentRect    = parent.getBoundingClientRect();
        // All architectures are horizontally symmetric: centroid X = W/2 within canvas
        const centreX = (containerRect.left - parentRect.left) + this.W / 2;
        this.label.style.left      = centreX + 'px';
        this.label.style.transform = 'translateX(-50%)';
    }

    // ─── Canvas Sizing ──────────────────────────────────────────────
    _resize() {
        const r = this.container.getBoundingClientRect();
        this.W = r.width;
        this.H = r.height;
        // On mobile the container may not yet be laid out — retry once after a frame
        if ((this.W === 0 || this.H === 0) && !this._resizeRetried) {
            this._resizeRetried = true;
            requestAnimationFrame(() => this._resize());
            return;
        }
        this._resizeRetried = false;
        this.canvas.width  = Math.round(this.W * this.dpr);
        this.canvas.height = Math.round(this.H * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        if (this.nodes.length) this._reposition();
        this._positionLabel();
    }

    // ─── Build Network ──────────────────────────────────────────────
    _build() {
        const type = this.arch.type;
        if (type === 'hopfield')       this._buildHopfield();
        else if (type === 'cnn')       this._buildCNN();
        else if (type === 'recurrent') this._buildRecurrent();
        else                           this._buildFF();
    }

    /* Feed-forward (SLP, MLP, Autoencoder) */
    _buildFF() {
        this.nodes = [];
        this.edges = [];
        const layers = this.arch.structure;
        this._layerPositions(layers);
        this._ffEdges(layers);
    }

    /* Recurrent — FF + lateral recurrence arrows in hidden layers */
    _buildRecurrent() {
        this.nodes = [];
        this.edges = [];
        const layers = this.arch.structure;
        this._layerPositions(layers);
        this._ffEdges(layers);
        // Add recurrent (intra-layer) connections in hidden layers
        for (let li = 1; li < layers.length - 1; li++) {
            const layerNodes = this.nodes.filter(n => n.layer === li);
            for (let i = 0; i < layerNodes.length; i++) {
                for (let j = i + 1; j < layerNodes.length; j++) {
                    this.edges.push({
                        src: layerNodes[i], tgt: layerNodes[j],
                        weight: 0.2 + Math.random() * 0.5,
                        recurrent: true
                    });
                }
            }
        }
    }

    /* Hopfield — single layer, fully connected */
    _buildHopfield() {
        this.nodes = [];
        this.edges = [];
        const S = NeuralArchitectureVis.S;
        const count = this.arch.structure[0];
        const cx = this.W / 2, cy = this.H / 2;
        const radius = Math.min(this.W, this.H) * 0.38;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
            this.nodes.push({
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                layer: 0, index: i, activation: 0,
                angle  // for repositioning
            });
        }

        // Fully connected (symmetric)
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                this.edges.push({
                    src: this.nodes[i], tgt: this.nodes[j],
                    weight: 0.1 + Math.random() * 0.9,
                    recurrent: false
                });
            }
        }
    }

    /* CNN — sparse local connections */
    _buildCNN() {
        this.nodes = [];
        this.edges = [];
        const layers = this.arch.structure;
        this._layerPositions(layers);

        // Local receptive fields: each node connects to ~3 nearest in next layer
        const byLayer = this._byLayer();
        for (let li = 0; li < layers.length - 1; li++) {
            const srcs = byLayer[li], tgts = byLayer[li + 1];
            for (const src of srcs) {
                // Connect to nearest neighbors by vertical proximity
                const sorted = [...tgts].sort(
                    (a, b) => Math.abs(a.y - src.y) - Math.abs(b.y - src.y)
                );
                const k = Math.min(3, sorted.length);
                for (let j = 0; j < k; j++) {
                    this.edges.push({
                        src, tgt: sorted[j],
                        weight: 0.3 + Math.random() * 0.7,
                        recurrent: false
                    });
                }
            }
        }
    }

    /* Shared: lay out nodes in vertical columns */
    _layerPositions(layers) {
        const S = NeuralArchitectureVis.S;
        const uW = this.W * (1 - 2 * S.padX);
        const uH = this.H * (1 - 2 * S.padY);
        const oX = this.W * S.padX;
        const oY = this.H * S.padY;
        const colStep = layers.length > 1 ? uW / (layers.length - 1) : 0;

        layers.forEach((count, li) => {
            const x = oX + li * colStep;
            for (let ni = 0; ni < count; ni++) {
                const y = count > 1
                    ? oY + ni * (uH / (count - 1))
                    : this.H / 2;
                this.nodes.push({
                    x, y, layer: li, index: ni, activation: 0
                });
            }
        });
    }

    /* Shared: dense feed-forward edges */
    _ffEdges(layers) {
        const byLayer = this._byLayer();
        for (let li = 0; li < layers.length - 1; li++) {
            for (const src of byLayer[li]) {
                for (const tgt of byLayer[li + 1]) {
                    this.edges.push({
                        src, tgt,
                        weight: 0.12 + Math.random() * 0.88,
                        recurrent: false
                    });
                }
            }
        }
    }

    _byLayer() {
        const map = {};
        for (const n of this.nodes) {
            (map[n.layer] || (map[n.layer] = [])).push(n);
        }
        return map;
    }

    /* Reposition when canvas resizes */
    _reposition() {
        if (this.arch.type === 'hopfield') {
            const cx = this.W / 2, cy = this.H / 2;
            const radius = Math.min(this.W, this.H) * 0.38;
            for (const n of this.nodes) {
                n.x = cx + Math.cos(n.angle) * radius;
                n.y = cy + Math.sin(n.angle) * radius;
            }
            return;
        }
        const S = NeuralArchitectureVis.S;
        const layers = this.arch.structure;
        const uW = this.W * (1 - 2 * S.padX);
        const uH = this.H * (1 - 2 * S.padY);
        const oX = this.W * S.padX;
        const oY = this.H * S.padY;
        const colStep = layers.length > 1 ? uW / (layers.length - 1) : 0;

        for (const n of this.nodes) {
            const count = layers[n.layer];
            n.x = oX + n.layer * colStep;
            n.y = count > 1 ? oY + n.index * (uH / (count - 1)) : this.H / 2;
        }
    }

    // ─── Events ─────────────────────────────────────────────────────
    _bind() {
        const loc = (cx, cy) => {
            const r = this.container.getBoundingClientRect();
            this.mouse.x = cx - r.left;
            this.mouse.y = cy - r.top;
        };

        // ── Desktop: continuous mousemove spotlight (unchanged) ──
        this.container.addEventListener('mousemove', e => loc(e.clientX, e.clientY));
        this.container.addEventListener('mouseleave', () => { this.mouse.x = null; });

        if (this.isMobile) {
            // ── Mobile: pointerdown tap → pulse, no continuous tracking ──
            this.container.addEventListener('pointerdown', e => {
                const r = this.container.getBoundingClientRect();
                this._tapPulse(e.clientX - r.left, e.clientY - r.top);
            });
        } else {
            // ── Non-mobile touch (e.g. touch-screen laptop): spotlight tracking ──
            this.container.addEventListener('touchstart', e => {
                loc(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            this.container.addEventListener('touchmove', e => {
                loc(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            this.container.addEventListener('touchend', () => { this.mouse.x = null; });
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this._resize(), 100);
        });

        // Hover to reveal label — desktop (≥1024px) on hover; mobile auto-cycles
        const mq = window.matchMedia('(min-width: 1024px)');
        const showLabel = () => {
            if (mq.matches) {
                this.label.style.opacity = '1';
                this.label.style.pointerEvents = 'auto';
            }
        };
        const hideLabel = () => {
            this.label.style.opacity = '0';
            this.label.style.pointerEvents = 'none';
        };
        this.container.addEventListener('mouseenter', showLabel);
        this.container.addEventListener('mouseleave', hideLabel);
        mq.addEventListener('change', () => {
            if (!mq.matches) this._startMobileCycle();
            else { this._stopMobileCycle(); hideLabel(); }
        });

        // Mobile: show label, auto-cycle every 4 s (tap now triggers pulse, not cycle)
        if (!mq.matches) this._startMobileCycle();
    }

    // ─── Tap Pulse (mobile only) ─────────────────────────────────────
    _tapPulse(tapX, tapY) {
        // Find node nearest to tap coordinates
        let nearest = null, bestD2 = Infinity;
        for (const n of this.nodes) {
            const dx = tapX - n.x, dy = tapY - n.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) { bestD2 = d2; nearest = n; }
        }
        if (!nearest) return;

        // Highlight tapped node immediately
        nearest.activation = 1;

        // First wave: spawn pulses along all outgoing edges from nearest node
        const outEdges = this.edges.filter(e => e.src === nearest);
        for (const edge of outEdges) this._spawnPulse(edge);

        // Second wave: propagate to next layer after 350 ms
        const nextNodes = [...new Set(outEdges.map(e => e.tgt))];
        const wave2 = setTimeout(() => {
            for (const n of nextNodes) {
                n.activation = 0.7;
                for (const edge of this.edges.filter(e => e.src === n)) {
                    this._spawnPulse(edge);
                }
            }
        }, 350);

        // Decay — activation already decays naturally via actDecay in the loop,
        // but force-clear after max pulse duration (800 ms) as a safety net
        setTimeout(() => { nearest.activation = 0; }, 700);
        setTimeout(() => { for (const n of nextNodes) n.activation = 0; }, 1000);
    }

    _startMobileCycle() {
        // Show label — auto-cycle disabled on mobile: architecture
        // is fixed at load time and only refreshes on full page reload.
        this.label.style.opacity = '1';
        this.label.style.pointerEvents = 'none';
    }

    _stopMobileCycle() {
        // No-op: interval was removed; kept for API compatibility.
    }

    _cycleArch() {
        const pool = this.isMobile
            ? NeuralArchitectureVis.MOBILE_ARCHITECTURES
            : NeuralArchitectureVis.ARCHITECTURES;
        const idx  = pool.indexOf(this.arch);
        this.arch  = pool[(idx + 1) % pool.length];
        this.nodes = [];
        this.edges = [];
        this.pulses = [];
        this._build();
        this._setLabel();
        this._positionLabel();
    }

    // ─── Helpers ────────────────────────────────────────────────────
    _rgba(rgb, a) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }

    _lerpColor(c1, c2, t) {
        return [
            c1[0] + (c2[0] - c1[0]) * t,
            c1[1] + (c2[1] - c1[1]) * t,
            c1[2] + (c2[2] - c1[2]) * t,
        ];
    }

    // ─── Signal Pulses ──────────────────────────────────────────────
    _spawnPulse(edge) {
        // Limit active pulses — tighter cap on mobile for battery/performance
        const maxPulses = this.isMobile ? 30 : 60;
        if (this.pulses.length > maxPulses) return;
        this.pulses.push({ edge, t: 0, alive: true });
    }

    _tickPulses() {
        const S = NeuralArchitectureVis.S;
        for (const p of this.pulses) {
            p.t += S.pulseSpeed + p.edge.weight * 0.008;
            if (p.t > 1) p.alive = false;
        }
        this.pulses = this.pulses.filter(p => p.alive);
    }

    // ─── Render Loop ────────────────────────────────────────────────
    _loop() {
        const C   = NeuralArchitectureVis.S;
        const ctx = this.ctx;
        const accent = C.accent;

        const frame = () => {
            this._raf = requestAnimationFrame(frame);
            const now = performance.now();
            const drawInProgress = Math.min(1, (now - this._t0) / C.drawInDuration);
            const drawFrac = this._easeOutCubic(drawInProgress);

            ctx.clearRect(0, 0, this.W, this.H);

            // ── 1. Activation Update ──
            const mx = this.mouse.x, my = this.mouse.y;
            const hasPtr = mx !== null;
            const r2 = C.spotRadius * C.spotRadius;

            for (const node of this.nodes) {
                if (hasPtr) {
                    const dx = mx - node.x, dy = my - node.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < r2) {
                        const prox = 1 - Math.sqrt(d2) / C.spotRadius;
                        node.activation = Math.min(1, node.activation + C.actRise * prox);
                    } else {
                        node.activation = Math.max(0, node.activation - C.actDecay);
                    }
                } else {
                    node.activation = Math.max(0, node.activation - C.actDecay);
                }
            }

            // ── 2. Spawn Pulses on activated edges ──
            for (const e of this.edges) {
                const af = (e.src.activation + e.tgt.activation) * 0.5;
                if (af > 0.3 && Math.random() < 0.04 * af * e.weight) {
                    this._spawnPulse(e);
                }
            }
            this._tickPulses();

            // ── 3. Draw edges ──
            ctx.lineCap = 'round';
            ctx.shadowBlur = 0;

            const edgeCount = this.edges.length;
            const edgesToDraw = Math.ceil(edgeCount * drawFrac);

            for (let i = 0; i < edgesToDraw; i++) {
                const e = this.edges[i];
                const s = e.src, t = e.tgt;
                const af = (s.activation + t.activation) * 0.5;

                let alpha, width, color;

                if (af > 0.005) {
                    const gated = af * e.weight;
                    alpha = 0.08 + gated * C.activeAlpha;
                    width = C.edgeWidthMin + gated * C.activeWidth;
                    color = e.recurrent ? C.accentAlt : accent;
                } else {
                    alpha = C.edgeAlphaMin + e.weight * C.edgeAlphaWeight;
                    width = C.edgeWidthMin + e.weight * C.edgeWidthWeight;
                    color = C.edgeColor;
                }

                // Draw-in fade
                if (drawInProgress < 1) alpha *= drawFrac;

                ctx.beginPath();

                if (e.recurrent && this.arch.type === 'recurrent') {
                    // Curved line for recurrence
                    const midX = (s.x + t.x) / 2 + (t.y - s.y) * 0.15;
                    const midY = (s.y + t.y) / 2 - (t.x - s.x) * 0.15;
                    ctx.moveTo(s.x, s.y);
                    ctx.quadraticCurveTo(midX, midY, t.x, t.y);
                } else {
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(t.x, t.y);
                }

                ctx.strokeStyle = this._rgba(color, alpha);
                ctx.lineWidth = width;
                ctx.stroke();
            }

            // ── 4. Draw pulses (bright gold pops) ──
            for (const p of this.pulses) {
                const e = p.edge;
                const s = e.src, t = e.tgt;
                const px = s.x + (t.x - s.x) * p.t;
                const py = s.y + (t.y - s.y) * p.t;
                const pulseAlpha = Math.min(1, (1 - p.t) * e.weight * 1.3);
                const pulseR = 2.5 + e.weight * 3;

                ctx.beginPath();
                ctx.arc(px, py, pulseR, 0, Math.PI * 2);

                // Radial gradient for bright gold glow
                const grad = ctx.createRadialGradient(px, py, 0, px, py, pulseR * 2.8);
                const col = e.recurrent ? C.accentAlt : accent;
                grad.addColorStop(0, this._rgba(col, pulseAlpha));
                grad.addColorStop(0.4, this._rgba(col, pulseAlpha * 0.6));
                grad.addColorStop(1, this._rgba(col, 0));
                ctx.fillStyle = grad;
                ctx.fill();
            }

            // ── 5. Draw nodes ──
            ctx.shadowColor = this._rgba(accent, 1);

            const nodeFrac = drawFrac;

            for (const node of this.nodes) {
                const act = node.activation;
                const r = C.nodeRadius + act * 3;

                // Draw-in: scale from 0
                const drawR = r * nodeFrac;
                if (drawR < 0.3) continue;

                ctx.beginPath();
                ctx.arc(node.x, node.y, drawR, 0, Math.PI * 2);

                if (act > 0.02) {
                    ctx.shadowBlur = C.glowBlur * act;
                    const col = this._lerpColor(C.nodeColorRest, accent, act);
                    ctx.fillStyle = this._rgba(col, 0.5 + act * 0.5);
                } else {
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = this._rgba(C.nodeColorRest, C.nodeAlphaRest * nodeFrac);
                }

                ctx.fill();
            }

            ctx.shadowBlur = 0;

            // ── 6. Technical hover labels ──
            if (hasPtr) this._drawTechLabels(ctx, mx, my);
        };

        frame();
    }

    // ─── Technical Labels on Hover ──────────────────────────────────
    _drawTechLabels(ctx, mx, my) {
        const FONT     = '"JetBrains Mono","Courier New",monospace';
        const RED      = [178, 8, 57];
        const SUB      = ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'];
        const NEAR     = 60;   // full opacity within this px radius
        const FAR      = 150;  // fades to 0 at this px radius
        const type     = this.arch.type;
        const maxLayer = this.nodes.reduce((m, n) => Math.max(m, n.layer), 0);

        const fadeAlpha = (dist, maxAlpha = 0.88) => {
            if (dist < NEAR) return maxAlpha;
            if (dist > FAR)  return 0;
            return maxAlpha * (1 - (dist - NEAR) / (FAR - NEAR));
        };

        // ── Node labels ──
        for (const n of this.nodes) {
            const dx = mx - n.x, dy = my - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const alpha = fadeAlpha(dist);
            if (alpha < 0.01) continue;

            const i1  = n.index + 1;
            const sub = i1 < SUB.length ? SUB[i1] : String(i1);
            let label;

            if (type === 'hopfield') {
                label = 's' + sub;
            } else if (type === 'cnn') {
                if (n.layer === 0)        label = 'x' + sub;
                else if (n.layer === maxLayer) label = 'f' + sub;
                else                      label = 'ReLU';
            } else if (type === 'recurrent') {
                if (n.layer === 0)        label = 'x' + sub;
                else if (n.layer === maxLayer) label = 'ŷ' + sub;
                else                      label = 'hₜ';
            } else {
                // feedforward / autoencoder
                if (n.layer === 0)        label = 'x' + sub;
                else if (n.layer === maxLayer) label = 'ŷ' + sub;
                else                      label = 'σ(·)';
            }

            // Flip to left side near right edge
            const offX = n.x > this.W * 0.78 ? -(ctx.measureText(label).width + 10) : 10;
            const offY = n.y < 18 ? 12 : -8;

            ctx.save();
            ctx.font = `10px ${FONT}`;
            ctx.fillStyle = this._rgba(RED, alpha);
            ctx.textBaseline = 'middle';
            ctx.fillText(label, n.x + offX, n.y + offY);
            ctx.restore();
        }

        // ── Nearest-edge weight label ──
        let nearestEdge = null, nearestDist = 72, nearestT = 0;
        for (const e of this.edges) {
            const sx = e.src.x, sy = e.src.y;
            const tx = e.tgt.x, ty = e.tgt.y;
            const len2 = (tx - sx) ** 2 + (ty - sy) ** 2;
            if (len2 < 1) continue;
            const t  = Math.max(0, Math.min(1,
                ((mx - sx) * (tx - sx) + (my - sy) * (ty - sy)) / len2));
            const px = sx + t * (tx - sx);
            const py = sy + t * (ty - sy);
            const d  = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
            if (d < nearestDist) { nearestDist = d; nearestEdge = e; nearestT = t; }
        }

        if (nearestEdge) {
            const e  = nearestEdge;
            const px = e.src.x + nearestT * (e.tgt.x - e.src.x);
            const py = e.src.y + nearestT * (e.tgt.y - e.src.y);
            const alpha = fadeAlpha(nearestDist, 0.80);
            const wLabel = 'w=' + e.weight.toFixed(2);

            ctx.save();
            ctx.font = `9px ${FONT}`;
            ctx.fillStyle = this._rgba(RED, alpha);
            ctx.textBaseline = 'middle';
            ctx.fillText(wLabel, px + 7, py - 7);
            ctx.restore();
        }
    }

    _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
}

// ─── Mount ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => new NeuralArchitectureVis('neural-network-bg'), 60);
});