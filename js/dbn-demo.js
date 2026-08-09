/**
 * Deep Belief Networks Explorer
 * Interactive visualization of unsupervised deep learning
 * Based on CCNL research: Stoianov & Zorzi (2012), Testolin et al. (2013)
 *
 * Scientific improvements (v2):
 *  - CD-k with momentum and L2 weight decay (Hinton et al. 2006)
 *  - Correct update of BOTH visible and hidden biases
 *  - Gaussian weight init (σ=0.01); visible biases init from data statistics
 *  - Layer-wise unsupervised pre-training: RBM1 → freeze → RBM2 → backprop fine-tune
 *  - True pixel-wise MSE reconstruction error
 *  - Reconstruction preview panel
 *  - Weight distribution histogram
 *  - User controls: learning rate η, momentum, CD-k steps
 */

class DBNDemo {
    constructor(container) {
        this.container = container;

        // Architecture
        this.gridSize  = 10;
        this.layers    = [100, 50, 20];
        this.inputPixels  = new Float32Array(this.gridSize * this.gridSize);

        // Weights: weights[l] = W between layer l and l+1; biasV = visible bias, biasH = hidden bias
        this.weights  = [];   // [w01, w12]
        this.biasV    = [];   // visible bias per RBM
        this.biasH    = [];   // hidden bias per RBM
        this.wDelta   = [];   // momentum accumulator for weights
        this.bVDelta  = [];
        this.bHDelta  = [];

        this.activations = [[], [], []];

        // Training state
        this.isTraining   = false;
        this.epoch        = 0;
        this.maxEpochs    = 300;
        this.trainingPhase = 'rbm1'; // 'rbm1' | 'rbm2' | 'finetune' | 'done'
        this.recon        = 0;       // MSE reconstruction error
        this.energy       = null;     // Boltzmann energy (null until first forward pass)
        this.animFrame    = null;
        this.trainingData = [];

        // Hyperparameters (user-controlled)
        this.learningRate = 0.05;
        this.momentum     = 0.5;
        this.weightDecay  = 0.0001;
        this.cdK          = 1;

        // Drawing
        this.isDrawing = false;
        this.drawMode  = 1;
        this.gridCanvas = null;
        this.gridCtx    = null;

        this._initWeights();
        this._buildUI();
        this._bindEvents();
        this._generateTrainingData();
        this._initVisibleBiases();
        this._forwardPass();
        this._renderAll();
    }

    // ─── Weight Initialisation ────────────────────────────────────────────────

    _gaussian(sigma) {
        // Box-Muller transform
        const u = 1 - Math.random();
        const v = 1 - Math.random();
        return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    _initWeights() {
        this.weights = []; this.biasV = []; this.biasH = [];
        this.wDelta  = []; this.bVDelta = []; this.bHDelta = [];

        for (let l = 0; l < this.layers.length - 1; l++) {
            const nV = this.layers[l];
            const nH = this.layers[l + 1];
            const w  = new Float32Array(nV * nH);
            const bv = new Float32Array(nV);   // visible biases
            const bh = new Float32Array(nH);   // hidden biases

            // Gaussian initialisation σ=0.01 (Hinton 2006 §4)
            for (let i = 0; i < w.length; i++) w[i] = this._gaussian(0.01);

            this.weights.push(w);
            this.biasV.push(bv);
            this.biasH.push(bh);
            this.wDelta.push(new Float32Array(nV * nH));
            this.bVDelta.push(new Float32Array(nV));
            this.bHDelta.push(new Float32Array(nH));
        }
    }

    _initVisibleBiases() {
        if (!this.trainingData.length) return;
        const nV = this.layers[0];
        const bv = this.biasV[0];
        const p  = new Float32Array(nV);
        for (const sample of this.trainingData) {
            for (let i = 0; i < nV; i++) p[i] += sample[i];
        }
        const n = this.trainingData.length;
        for (let i = 0; i < nV; i++) {
            const pi = Math.max(0.01, Math.min(0.99, p[i] / n));
            bv[i] = Math.log(pi / (1 - pi)); // log-odds prior (Hinton 2006)
        }
    }

    // ─── Activation ──────────────────────────────────────────────────────────

    _sigmoid(x) {
        return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x))));
    }

    // ─── Forward Pass ─────────────────────────────────────────────────────────

    _forwardPass() {
        this.activations[0] = Array.from(this.inputPixels);
        for (let l = 0; l < this.weights.length; l++) {
            const nV = this.layers[l];
            const nH = this.layers[l + 1];
            const w  = this.weights[l];
            const bh = this.biasH[l];
            const act = new Array(nH);
            for (let j = 0; j < nH; j++) {
                let s = bh[j];
                for (let i = 0; i < nV; i++) s += this.activations[l][i] * w[i * nH + j];
                act[j] = this._sigmoid(s);
            }
            this.activations[l + 1] = act;
        }
        // Always recompute reconstruction and energy — no training needed
        this._computeReconstruction();
        this._computeEnergy();
    }

    // ─── Reconstruction v → h → v' (mean-field, always live) ───────────────

    _computeReconstruction() {
        const nV = this.layers[0];
        const nH = this.layers[1];
        const w  = this.weights[0];
        const bv = this.biasV[0];
        const bh = this.biasH[0];
        const v  = this.activations[0];

        // v → h (mean-field probabilities, no sampling — deterministic & smooth)
        const hProb = new Float32Array(nH);
        for (let j = 0; j < nH; j++) {
            let s = bh[j];
            for (let i = 0; i < nV; i++) s += v[i] * w[i * nH + j];
            hProb[j] = this._sigmoid(s);
        }

        // h → v' (reconstruction probabilities)
        const vRecon = new Float32Array(nV);
        for (let i = 0; i < nV; i++) {
            let s = bv[i];
            for (let j = 0; j < nH; j++) s += hProb[j] * w[i * nH + j];
            vRecon[i] = this._sigmoid(s);
        }
        this._lastVRecon = vRecon;

        // Pixel-wise MSE
        let mse = 0;
        for (let i = 0; i < nV; i++) { const d = v[i] - vRecon[i]; mse += d * d; }
        this.recon = mse / nV;
    }

    // ─── Boltzmann Energy E(v,h) ─────────────────────────────────────────────
    //
    //   E(v, h) = −Σᵢ aᵢvᵢ  −  Σⱼ bⱼĥⱼ  −  Σᵢⱼ vᵢwᵢⱼĥⱼ
    //
    // ĥ = mean-field hidden probabilities from the last forward pass.
    // Lower is better (more probable configurations have lower energy).

    _computeEnergy() {
        const v  = this.activations[0];
        const h  = this.activations[1];  // ĥⱼ = σ(bⱼ + Σᵢ vᵢwᵢⱼ)
        if (!h || !h.length) { this.energy = 0; return; }
        const w  = this.weights[0];
        const bv = this.biasV[0];
        const bh = this.biasH[0];
        const nV = this.layers[0];
        const nH = this.layers[1];
        let e = 0;
        for (let i = 0; i < nV; i++) e -= bv[i] * v[i];           // −Σ aᵢvᵢ
        for (let j = 0; j < nH; j++) e -= bh[j] * h[j];           // −Σ bⱼĥⱼ
        for (let i = 0; i < nV; i++)                               // −Σᵢⱼ vᵢwᵢⱼĥⱼ
            for (let j = 0; j < nH; j++) e -= v[i] * w[i * nH + j] * h[j];
        this.energy = e;
    }

    // ─── Contrastive Divergence (CD-k) ────────────────────────────────────────

    _contrastiveDivergence(visible, rbmLayer) {
        const nV = this.layers[rbmLayer];
        const nH = this.layers[rbmLayer + 1];
        const w  = this.weights[rbmLayer];
        const bv = this.biasV[rbmLayer];
        const bh = this.biasH[rbmLayer];
        const wd = this.wDelta[rbmLayer];
        const bvd = this.bVDelta[rbmLayer];
        const bhd = this.bHDelta[rbmLayer];

        const lr  = this.learningRate;
        const mom = this.momentum;
        const wd2 = this.weightDecay;

        // ── Positive phase ──────────────────────────────────────────────
        const hProb0 = new Float32Array(nH);
        for (let j = 0; j < nH; j++) {
            let s = bh[j];
            for (let i = 0; i < nV; i++) s += visible[i] * w[i * nH + j];
            hProb0[j] = this._sigmoid(s);
        }
        // Sample hidden states
        let hSample = hProb0.map(p => Math.random() < p ? 1 : 0);

        // ── Negative phase (k Gibbs steps) ──────────────────────────────
        let vRecon = new Float32Array(nV);
        let hProbK = new Float32Array(nH);

        for (let step = 0; step < this.cdK; step++) {
            // Reconstruct visible from hidden sample
            for (let i = 0; i < nV; i++) {
                let s = bv[i];
                for (let j = 0; j < nH; j++) s += hSample[j] * w[i * nH + j];
                vRecon[i] = this._sigmoid(s);
            }
            // Recompute hidden from reconstructed visible
            for (let j = 0; j < nH; j++) {
                let s = bh[j];
                for (let i = 0; i < nV; i++) s += vRecon[i] * w[i * nH + j];
                hProbK[j] = this._sigmoid(s);
            }
            if (step < this.cdK - 1) {
                hSample = Array.from(hProbK).map(p => Math.random() < p ? 1 : 0);
            }
        }

        // ── Weight update with momentum and L2 decay ────────────────────
        for (let i = 0; i < nV; i++) {
            for (let j = 0; j < nH; j++) {
                const posGrad = visible[i] * hProb0[j];
                const negGrad = vRecon[i]  * hProbK[j];
                const grad    = posGrad - negGrad;
                const idx     = i * nH + j;
                wd[idx] = mom * wd[idx] + lr * (grad - wd2 * w[idx]);
                w[idx] += wd[idx];
            }
        }

        // Visible bias update
        for (let i = 0; i < nV; i++) {
            bvd[i] = mom * bvd[i] + lr * (visible[i] - vRecon[i]);
            bv[i] += bvd[i];
        }

        // Hidden bias update
        for (let j = 0; j < nH; j++) {
            bhd[j] = mom * bhd[j] + lr * (hProb0[j] - hProbK[j]);
            bh[j] += bhd[j];
        }

        // ── Reconstruction MSE ───────────────────────────────────────────
        if (rbmLayer === 0) {
            let mse = 0;
            for (let i = 0; i < nV; i++) {
                const d = visible[i] - vRecon[i];
                mse += d * d;
            }
            this.recon = mse / nV;
            this._lastVRecon = vRecon; // for preview
        }
    }

    // ─── Supervised Fine-Tuning — Tied-Weights Autoencoder ──────────────────
    //
    // Architecture: v(100) →[W0,bH0]→ a1(50) →[W1,bH1]→ a2(20)   [encoder]
    //               a2(20) →[W1ᵀ,bV1]→ a1d(50)→[W0ᵀ,bV0]→ vp(100) [decoder]
    //
    // Weights W0 and W1 are shared (tied) between encoder and decoder.
    // The gradient accumulates contributions from both paths before updating.

    _backpropStep(visible, target) {
        const nV  = this.layers[0];  // 100
        const nH1 = this.layers[1];  // 50
        const nH2 = this.layers[2];  // 20
        const W0  = this.weights[0], W1  = this.weights[1];
        const bH0 = this.biasH[0],  bH1 = this.biasH[1];
        const bV0 = this.biasV[0],  bV1 = this.biasV[1];
        const lr  = this.learningRate * 0.1;

        // ── Encoder ──────────────────────────────────────────────────────────
        const a1 = new Float32Array(nH1);
        for (let j = 0; j < nH1; j++) {
            let s = bH0[j];
            for (let i = 0; i < nV; i++) s += visible[i] * W0[i * nH1 + j];
            a1[j] = this._sigmoid(s);
        }
        const a2 = new Float32Array(nH2);
        for (let k = 0; k < nH2; k++) {
            let s = bH1[k];
            for (let j = 0; j < nH1; j++) s += a1[j] * W1[j * nH2 + k];
            a2[k] = this._sigmoid(s);
        }

        // ── Decoder (transposed weights) ─────────────────────────────────────
        const a1d = new Float32Array(nH1);   // decoded h1'
        for (let j = 0; j < nH1; j++) {
            let s = bV1[j];                   // bV of RBM2 = visible biases for h1
            for (let k = 0; k < nH2; k++) s += a2[k] * W1[j * nH2 + k]; // W1ᵀ
            a1d[j] = this._sigmoid(s);
        }
        const vp = new Float32Array(nV);      // reconstructed visible v'
        for (let i = 0; i < nV; i++) {
            let s = bV0[i];
            for (let j = 0; j < nH1; j++) s += a1d[j] * W0[i * nH1 + j]; // W0ᵀ
            vp[i] = this._sigmoid(s);
        }

        // ── Reconstruction MSE ────────────────────────────────────────────────
        let mse = 0;
        const dVp = new Float32Array(nV);
        for (let i = 0; i < nV; i++) {
            const err = target[i] - vp[i];
            mse += err * err;
            dVp[i] = err * vp[i] * (1 - vp[i]);  // δ at output
        }
        this.recon = mse / nV;
        this._lastVRecon = vp;   // update reconstruction preview

        // ── Backprop through decoder ──────────────────────────────────────────
        const dA1d = new Float32Array(nH1);
        for (let j = 0; j < nH1; j++) {
            let s = 0;
            for (let i = 0; i < nV; i++) s += dVp[i] * W0[i * nH1 + j];
            dA1d[j] = s * a1d[j] * (1 - a1d[j]);
        }
        const dA2 = new Float32Array(nH2);
        for (let k = 0; k < nH2; k++) {
            let s = 0;
            for (let j = 0; j < nH1; j++) s += dA1d[j] * W1[j * nH2 + k];
            dA2[k] = s * a2[k] * (1 - a2[k]);
        }

        // ── Backprop through encoder ──────────────────────────────────────────
        const dA1 = new Float32Array(nH1);
        for (let j = 0; j < nH1; j++) {
            let s = 0;
            for (let k = 0; k < nH2; k++) s += dA2[k] * W1[j * nH2 + k];
            dA1[j] = s * a1[j] * (1 - a1[j]);
        }

        // ── Weight + bias updates (tied: sum both path gradients) ─────────────
        for (let i = 0; i < nV; i++) {
            bV0[i] += lr * dVp[i];
            for (let j = 0; j < nH1; j++) {
                // W0 gradient: decoder (dVp · a1dᵀ) + encoder (dA1 · visibleᵀ)
                W0[i * nH1 + j] += lr * (dVp[i] * a1d[j] + dA1[j] * visible[i]);
            }
        }
        for (let j = 0; j < nH1; j++) {
            bV1[j]  += lr * dA1d[j];
            bH0[j]  += lr * dA1[j];
            for (let k = 0; k < nH2; k++) {
                // W1 gradient: decoder (dA1d · a2ᵀ) + encoder (dA2 · a1ᵀ)
                W1[j * nH2 + k] += lr * (dA1d[j] * a2[k] + dA2[k] * a1[j]);
            }
        }
        for (let k = 0; k < nH2; k++) {
            bH1[k] += lr * dA2[k];
        }
    }

    // ─── Training Data ────────────────────────────────────────────────────────

    _generateTrainingData() {
        this.trainingData = [];
        for (let n = 1; n <= 9; n++) {
            for (let s = 0; s < 14; s++) {
                const pattern = new Float32Array(this.gridSize * this.gridSize);
                for (let d = 0; d < n; d++) {
                    let placed = false;
                    for (let att = 0; att < 50 && !placed; att++) {
                        const cx = 1 + Math.floor(Math.random() * (this.gridSize - 2));
                        const cy = 1 + Math.floor(Math.random() * (this.gridSize - 2));
                        if (!pattern[cy * this.gridSize + cx]) {
                            pattern[cy * this.gridSize + cx] = 1;
                            placed = true;
                        }
                    }
                }
                this.trainingData.push(pattern);
            }
        }
    }

    // ─── Training Steps ───────────────────────────────────────────────────────

    _trainStep() {
        const phaseEpochLimit = { rbm1: 150, rbm2: 100, finetune: 50 };

        if (this.trainingPhase === 'rbm1') {
            // Train first RBM
            const batchSize = 10;
            for (let b = 0; b < batchSize; b++) {
                const idx = Math.floor(Math.random() * this.trainingData.length);
                this._contrastiveDivergence(this.trainingData[idx], 0);
            }
            this.epoch++;
            if (this.epoch >= phaseEpochLimit.rbm1) {
                this.trainingPhase = 'rbm2';
                this.epoch = 0;
                this.momentum = 0.9; // Increase momentum for 2nd phase
                this._updatePhaseLabel();
            }
        } else if (this.trainingPhase === 'rbm2') {
            // Train second RBM using RBM1 hidden activations as visible layer
            const batchSize = 10;
            for (let b = 0; b < batchSize; b++) {
                const idx = Math.floor(Math.random() * this.trainingData.length);
                const sample = this.trainingData[idx];
                // Pass through frozen RBM1 to get hidden activations
                const h1 = new Float32Array(this.layers[1]);
                for (let j = 0; j < this.layers[1]; j++) {
                    let s = this.biasH[0][j];
                    for (let i = 0; i < this.layers[0]; i++) s += sample[i] * this.weights[0][i * this.layers[1] + j];
                    h1[j] = this._sigmoid(s) > Math.random() ? 1 : 0;
                }
                this._contrastiveDivergence(h1, 1);
            }
            this.epoch++;
            if (this.epoch >= phaseEpochLimit.rbm2) {
                this.trainingPhase = 'finetune';
                this.epoch = 0;
                this._updatePhaseLabel();
            }
        } else if (this.trainingPhase === 'finetune') {
            // Supervised fine-tuning via backpropagation
            const batchSize = 10;
            for (let b = 0; b < batchSize; b++) {
                const idx = Math.floor(Math.random() * this.trainingData.length);
                // Auto-encoder target: reconstruct the input
                this._backpropStep(this.trainingData[idx], this.trainingData[idx]);
            }
            this.epoch++;
            if (this.epoch >= phaseEpochLimit.finetune) {
                this.trainingPhase = 'done';
                this._updatePhaseLabel();
                return false; // Signal done
            }
        }
        return true; // Continue
    }

    _startTraining() {
        if (this.isTraining) return;
        this.isTraining   = true;
        this.epoch        = 0;
        this.trainingPhase = 'rbm1';
        this.momentum     = 0.5;
        this._updatePhaseLabel();

        /* Training is the point of the demo, so it still runs — but under
           reduced motion the visualisation is repainted ~4x/s instead of every
           frame, which removes the flicker without removing the information. */
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let lastPaint = 0;

        const step = () => {
            if (!this.isTraining) return;
            // Multiple train steps per animation frame for speed
            let cont = true;
            for (let i = 0; i < 5 && cont; i++) cont = this._trainStep();
            this._forwardPass();
            const now = performance.now();
            if (!reduceMotion || now - lastPaint > 250 || !cont) {
                lastPaint = now;
                this._renderAll();
            }
            if (!cont || this.trainingPhase === 'done') {
                this.isTraining = false;
                this._setTrainBtnState(false);
                this._updatePhaseLabel();
                return;
            }
            this.animFrame = requestAnimationFrame(step);
        };
        step();
    }

    _stopTraining() {
        this.isTraining = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }

    _resetWeights() {
        this._stopTraining();
        this.epoch = 0;
        this.trainingPhase = 'rbm1';
        this.recon = 0;
        this._initWeights();
        this._initVisibleBiases();
        this._setTrainBtnState(false);
        this._forwardPass();
        this._renderAll();
        this._updatePhaseLabel();
    }

    // ─── Presets ─────────────────────────────────────────────────────────────

    _loadPreset(num) {
        this.inputPixels.fill(0);
        const positions = [];
        for (let attempt = 0; attempt < 300 && positions.length < num; attempt++) {
            const x = Math.floor(1 + Math.random() * (this.gridSize - 2));
            const y = Math.floor(1 + Math.random() * (this.gridSize - 2));
            if (!positions.some(p => Math.abs(p[0] - x) <= 1 && Math.abs(p[1] - y) <= 1)) {
                this.inputPixels[y * this.gridSize + x] = 1;
                positions.push([x, y]);
            }
        }
        this._forwardPass();
        this._renderAll();
    }

    // ─── UI Build ─────────────────────────────────────────────────────────────

    _buildUI() {
        this.container.innerHTML = `
        <div class="dbn-demo">
            <div class="dbn-container">
                <div class="dbn-header">
                    <div class="dbn-layer-tabs">
                        <button class="dbn-layer-tab active" data-view="network">Network</button>
                        <button class="dbn-layer-tab" data-view="receptive">Receptive Fields</button>
                        <button class="dbn-layer-tab" data-view="histogram">Weights</button>
                    </div>
                    <div class="dbn-controls">
                        <button class="dbn-btn dbn-btn-primary" id="dbn-train-btn">Train Network</button>
                        <button class="dbn-btn" id="dbn-reset-btn">Reset</button>
                        <button class="dbn-btn" id="dbn-clear-btn">Clear Input</button>
                    </div>
                </div>

                <!-- Phase Indicator -->
                <div class="dbn-phase-bar">
                    <span class="dbn-phase-label">Training Phase:</span>
                    <span class="dbn-phase-badge" id="dbn-phase-badge">Untrained</span>
                    <div class="dbn-phase-steps">
                        <span class="dbn-phase-step" id="dbn-pstep-rbm1">① RBM 1 Pre-train</span>
                        <span class="dbn-phase-arrow">→</span>
                        <span class="dbn-phase-step" id="dbn-pstep-rbm2">② RBM 2 Pre-train</span>
                        <span class="dbn-phase-arrow">→</span>
                        <span class="dbn-phase-step" id="dbn-pstep-ft">③ Fine-tune (BP)</span>
                    </div>
                </div>

                <!-- Hyperparameter Sliders -->
                <div class="dbn-sliders-panel">
                    <div class="dbn-slider-row">
                        <label class="dbn-slider-label" for="dbn-lr">Learning rate η</label>
                        <input type="range" class="dbn-slider" id="dbn-lr" aria-describedby="dbn-lr-val" min="0.001" max="0.3" step="0.001" value="0.05">
                        <span class="dbn-slider-val" id="dbn-lr-val">0.050</span>
                    </div>
                    <div class="dbn-slider-row">
                        <label class="dbn-slider-label" for="dbn-mom">Momentum</label>
                        <input type="range" class="dbn-slider" id="dbn-mom" aria-describedby="dbn-mom-val" min="0" max="0.95" step="0.05" value="0.5">
                        <span class="dbn-slider-val" id="dbn-mom-val">0.50</span>
                    </div>
                    <div class="dbn-slider-row">
                        <label class="dbn-slider-label" for="dbn-cdk">CD-k steps</label>
                        <input type="range" class="dbn-slider" id="dbn-cdk" aria-describedby="dbn-cdk-val" min="1" max="10" step="1" value="1">
                        <span class="dbn-slider-val" id="dbn-cdk-val">1</span>
                    </div>
                    <div class="dbn-slider-row">
                        <label class="dbn-slider-label" for="dbn-wd">Weight decay λ</label>
                        <input type="range" class="dbn-slider" id="dbn-wd" aria-describedby="dbn-wd-val" min="0" max="0.001" step="0.00005" value="0.0001">
                        <span class="dbn-slider-val" id="dbn-wd-val">0.0001</span>
                    </div>
                </div>

                <div class="dbn-main">
                    <!-- Input + Reconstruction panels -->
                    <div class="dbn-input-panel">
                        <span class="dbn-input-label">Input (10×10)</span>
                        <canvas class="dbn-grid-canvas" id="dbn-grid" width="150" height="150"></canvas>
                        <span class="dbn-input-label" style="margin-top:8px">Reconstruction</span>
                        <canvas class="dbn-grid-canvas" id="dbn-recon" width="150" height="150" style="opacity:0.85"></canvas>
                        <div class="dbn-presets">
                            ${[1,2,3,4,5,6,7,8,9].map(n =>
                                `<button class="dbn-preset-btn" data-num="${n}">${n}</button>`
                            ).join('')}
                        </div>
                        <span class="dbn-input-label">Draw or pick a number</span>
                    </div>
                    <div class="dbn-network-panel">
                        <canvas class="dbn-network-canvas" id="dbn-network" width="520" height="320"></canvas>
                        <div id="dbn-rf-view" style="display:none">
                            <span class="dbn-input-label" style="margin-bottom:8px;display:block">Layer 1 Receptive Fields (learned features)</span>
                            <div class="dbn-rf-grid" id="dbn-rf-grid"></div>
                        </div>
                        <div id="dbn-hist-view" style="display:none">
                            <span class="dbn-input-label" style="margin-bottom:8px;display:block">Weight Distribution Histogram (RBM 1)</span>
                            <canvas id="dbn-hist-canvas" width="480" height="200" style="width:100%;border-radius:8px;background:rgba(0,0,0,0.3)"></canvas>
                        </div>
                    </div>
                </div>

                <div class="dbn-info-panel">
                    <div class="dbn-info-card">
                        <div class="dbn-info-label">Epoch</div>
                        <div class="dbn-info-value" id="dbn-epoch">0</div>
                        <div class="dbn-progress-bar"><div class="dbn-progress-fill" id="dbn-progress"></div></div>
                    </div>
                    <div class="dbn-info-card">
                        <div class="dbn-info-label">Recon. Error (MSE)</div>
                        <div class="dbn-info-value" id="dbn-energy">—</div>
                        <div class="dbn-info-desc">&#x2016;v &#x2212; v'&#x2016;&#xB2; / n  (live, every keystroke)</div>
                    </div>
                    <div class="dbn-info-card">
                        <div class="dbn-info-label">Boltzmann Energy E(v,h)</div>
                        <div class="dbn-info-value" id="dbn-boltzmann" style="font-size:1rem">—</div>
                        <div class="dbn-info-desc">&#x2212;&#x03A3;a&#x1D62;v&#x1D62; &#x2212; &#x03A3;b&#x2C7C;&#x0125;&#x2C7C; &#x2212; &#x03A3;v&#x1D62;w&#x1D62;&#x2C7C;&#x0125;&#x2C7C;</div>
                    </div>
                    <div class="dbn-info-card">
                        <div class="dbn-info-label">Top Hidden Unit</div>
                        <div class="dbn-info-value" id="dbn-top-unit">—</div>
                        <div class="dbn-info-desc">Most active neuron (Layer 1)</div>
                    </div>
                    <div class="dbn-info-card">
                        <div class="dbn-info-label">Architecture</div>
                        <div class="dbn-info-value" style="font-size:0.9rem">100&#x2192;50&#x2192;20</div>
                        <div class="dbn-info-desc">RBM&#x2081; &middot; RBM&#x2082; hierarchy</div>
                    </div>
                </div>

                <div class="dbn-explanation">
                    <strong>How it works:</strong> This DBN uses <strong>layer-wise unsupervised pre-training</strong>
                    (Hinton, Osindero &amp; Teh, 2006): first RBM₁ learns features from pixel patterns via
                    <strong>Contrastive Divergence (CD-k)</strong>, then its activations become the "visible" layer for
                    RBM₂. Finally, <strong>backpropagation</strong> fine-tunes the full network. The model mirrors
                    the architecture used by the CCNL to show that a "visual number sense" emerges without supervision.
                    <br><br>
                    <strong>References:</strong> Stoianov &amp; Zorzi (2012), <em>Nature Neuroscience, 15</em>, 194–196.
                    Hinton, Osindero &amp; Teh (2006), <em>Neural Computation, 18</em>, 1527–1554.
                </div>
            </div>
        </div>`;
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    _bindEvents() {
        const grid = this.container.querySelector('#dbn-grid');
        this.gridCanvas = grid;
        this.gridCtx    = grid.getContext('2d');

        const getCell = (e) => {
            const rect = grid.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const x  = Math.max(0, Math.min(this.gridSize - 1, Math.floor((cx - rect.left)  / (rect.width  / this.gridSize))));
            const y  = Math.max(0, Math.min(this.gridSize - 1, Math.floor((cy - rect.top)   / (rect.height / this.gridSize))));
            return { x, y };
        };

        const paint = (e) => {
            if (!this.isDrawing) return;
            const { x, y } = getCell(e);
            this.inputPixels[y * this.gridSize + x] = this.drawMode;
            this._forwardPass();
            this._renderAll();
        };

        grid.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            const { x, y } = getCell(e);
            this.drawMode = this.inputPixels[y * this.gridSize + x] > 0.5 ? 0 : 1;
            paint(e);
        });
        grid.addEventListener('mousemove', paint);
        grid.addEventListener('mouseup',    () => this.isDrawing = false);
        grid.addEventListener('mouseleave', () => this.isDrawing = false);
        grid.addEventListener('touchstart', (e) => { e.preventDefault(); this.isDrawing = true; const { x, y } = getCell(e); this.drawMode = this.inputPixels[y * this.gridSize + x] > 0.5 ? 0 : 1; paint(e); }, { passive: false });
        grid.addEventListener('touchmove',  (e) => { e.preventDefault(); paint(e); }, { passive: false });
        grid.addEventListener('touchend',   () => this.isDrawing = false);

        // Buttons
        this.container.querySelector('#dbn-train-btn').addEventListener('click', () => {
            if (this.isTraining) {
                this._stopTraining();
                this._setTrainBtnState(false);
            } else {
                this._startTraining();
                this._setTrainBtnState(true);
            }
        });
        this.container.querySelector('#dbn-reset-btn').addEventListener('click', () => {
            this._resetWeights();
        });
        this.container.querySelector('#dbn-clear-btn').addEventListener('click', () => {
            this.inputPixels.fill(0);
            this._forwardPass();
            this._renderAll();
        });

        // Presets
        this.container.querySelectorAll('.dbn-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => this._loadPreset(parseInt(btn.dataset.num)));
        });

        // View tabs
        this.container.querySelectorAll('.dbn-layer-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.container.querySelectorAll('.dbn-layer-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const view = tab.dataset.view;
                this.container.querySelector('#dbn-network').style.display   = view === 'network'   ? '' : 'none';
                this.container.querySelector('#dbn-rf-view').style.display   = view === 'receptive' ? '' : 'none';
                this.container.querySelector('#dbn-hist-view').style.display = view === 'histogram' ? '' : 'none';
                if (view === 'receptive') this._renderReceptiveFields();
                if (view === 'histogram') this._renderHistogram();
            });
        });

        // Sliders
        const bindSlider = (id, valId, prop, fmt) => {
            const sl  = this.container.querySelector(`#${id}`);
            const val = this.container.querySelector(`#${valId}`);
            sl.addEventListener('input', () => {
                this[prop] = parseFloat(sl.value);
                val.textContent = fmt(this[prop]);
            });
        };
        bindSlider('dbn-lr',  'dbn-lr-val',  'learningRate', v => v.toFixed(3));
        bindSlider('dbn-mom', 'dbn-mom-val', 'momentum',     v => v.toFixed(2));
        bindSlider('dbn-cdk', 'dbn-cdk-val', 'cdK',          v => v.toFixed(0));
        bindSlider('dbn-wd',  'dbn-wd-val',  'weightDecay',  v => v.toFixed(4));
    }

    _setTrainBtnState(running) {
        const btn = this.container.querySelector('#dbn-train-btn');
        if (!btn) return;
        btn.textContent = running ? 'Stop Training' : 'Train Network';
    }

    _updatePhaseLabel() {
        const badge = this.container.querySelector('#dbn-phase-badge');
        const steps = {
            rbm1:    { label: 'Phase 1: RBM₁ Pre-training', step: 'rbm1' },
            rbm2:    { label: 'Phase 2: RBM₂ Pre-training', step: 'rbm2' },
            finetune:{ label: 'Phase 3: Supervised Fine-tune (BP)', step: 'ft' },
            done:    { label: 'Done ✓', step: 'ft' },
        };
        const info = steps[this.trainingPhase];
        if (badge && info) badge.textContent = info.label;

        // Highlight active step
        ['rbm1', 'rbm2', 'ft'].forEach(s => {
            const el = this.container.querySelector(`#dbn-pstep-${s}`);
            if (el) el.classList.toggle('active', info && info.step === s);
        });
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    _renderAll() {
        this._renderGrid();
        this._renderReconPreview();
        const netCanvas = this.container.querySelector('#dbn-network');
        const rfView    = this.container.querySelector('#dbn-rf-view');
        const histView  = this.container.querySelector('#dbn-hist-view');
        if (netCanvas && netCanvas.style.display !== 'none') this._renderNetwork();
        if (rfView    && rfView.style.display    !== 'none') this._renderReceptiveFields();
        if (histView  && histView.style.display  !== 'none') this._renderHistogram();
        this._updateUI();
    }

    /* Every canvas here drew at CSS-pixel resolution on a 2x display, and
       #dbn-network was additionally squeezed by a non-integer 0.747 factor,
       which put its layer labels at ~7px effective. Size the backing store to
       devicePixelRatio, map the fixed design box onto the real one, and return
       the design-unit -> CSS-pixel scale so text can be sized in screen px. */
    _fitCanvas(canvas, designW, designH, pinCss) {
        const dpr  = Math.min(window.devicePixelRatio || 1, 2);
        /* The two drawing grids take their layout size from the width/height
           attributes, so raising the backing store would otherwise double their
           on-screen size. Pin the CSS box for those; the fluid canvases
           (network, histogram) keep their own width rules. */
        if (pinCss) {
            canvas.style.width  = pinCss + 'px';
            canvas.style.height = pinCss + 'px';
        }
        const cssW = canvas.clientWidth  || designW;   // excludes borders
        const cssH = canvas.clientHeight || designH;
        const bw = Math.round(cssW * dpr), bh = Math.round(cssH * dpr);
        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw; canvas.height = bh;
        }
        const s = Math.min(cssW / designW, cssH / designH);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr * s, 0, 0, dpr * s,
                         dpr * (cssW - designW * s) / 2,
                         dpr * (cssH - designH * s) / 2);
        return s;
    }

    _renderGrid() {
        const ctx  = this.gridCtx;
        if (!ctx) return;
        const size = 150;
        this._fitCanvas(this.gridCanvas, size, size, 154);
        const cell = size / this.gridSize;
        ctx.clearRect(0, 0, size, size);

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const v = this.inputPixels[y * this.gridSize + x];
                if (v > 0.01) {
                    // Input: crimson ramp (dark crimson -> bright tint).
                    const t = Math.min(1, v);
                    ctx.fillStyle = `rgb(${Math.round(90 + 165 * t)}, ${Math.round(10 + 102 * t)}, ${Math.round(30 + 108 * t)})`;
                } else {
                    ctx.fillStyle = 'rgba(255,255,255,0.03)';
                }
                ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
            }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath(); ctx.moveTo(i * cell, 0);    ctx.lineTo(i * cell, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * cell);    ctx.lineTo(size, i * cell); ctx.stroke();
        }
    }

    _renderReconPreview() {
        const canvas = this.container.querySelector('#dbn-recon');
        if (!canvas) return;
        const size = 150;
        this._fitCanvas(canvas, size, size, 154);
        const ctx  = canvas.getContext('2d');
        const cell = size / this.gridSize;
        ctx.clearRect(0, 0, size, size);

        const vr = this._lastVRecon;
        if (!vr) {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '11px Manrope, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Train to see reconstruction', size / 2, size / 2);
            return;
        }

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const v = vr[y * this.gridSize + x];
                // Reconstruction: neutral ramp — same shape, no second hue.
                const t = Math.min(1, v);
                const g = Math.round(38 + 200 * t);
                ctx.fillStyle = `rgb(${g}, ${g}, ${Math.round(g * 0.99)})`;
                ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
            }
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath(); ctx.moveTo(i * cell, 0);    ctx.lineTo(i * cell, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * cell);    ctx.lineTo(size, i * cell); ctx.stroke();
        }
    }

    _renderNetwork() {
        const canvas = this.container.querySelector('#dbn-network');
        if (!canvas || canvas.style.display === 'none') return;
        const W = 520, H = 320;                       // design box
        const scale = this._fitCanvas(canvas, W, H);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        const layerX   = [100, 260, 420];
        const maxShow  = [20, 20, 20];
        const labels   = ['Visible\n(100)', 'Hidden 1\n(50)', 'Hidden 2\n(20)'];

        // Connections
        for (let l = 0; l < this.layers.length - 1; l++) {
            const n1 = Math.min(this.layers[l],     maxShow[l]);
            const n2 = Math.min(this.layers[l + 1], maxShow[l + 1]);
            const y1s = (H - n1 * 13) / 2;
            const y2s = (H - n2 * 13) / 2;
            for (let i = 0; i < n1; i += 2) {
                for (let j = 0; j < n2; j += 2) {
                    const wVal  = this.weights[l] ? (this.weights[l][i * this.layers[l+1] + j] || 0) : 0;
                    const alpha = Math.min(0.5, Math.abs(wVal) * 3);
                    if (alpha < 0.02) continue;
                    // Positive weights: Padova Red; negative: slate gray
                    ctx.strokeStyle = wVal > 0 ? `rgba(178,8,57,${alpha})` : `rgba(100,116,139,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(layerX[l] + 6,     y1s + i * 13 + 6);
                    ctx.lineTo(layerX[l + 1] - 6, y2s + j * 13 + 6);
                    ctx.stroke();
                }
            }
        }

        // Neurons
        for (let l = 0; l < this.layers.length; l++) {
            const n    = Math.min(this.layers[l], maxShow[l]);
            const yStart = (H - n * 13) / 2;
            for (let i = 0; i < n; i++) {
                const act = this.activations[l]?.[i] || 0;
                const x = layerX[l], y = yStart + i * 13 + 6;
                if (act > 0.3) {
                    const grad = ctx.createRadialGradient(x, y, 0, x, y, 15);
                    grad.addColorStop(0, `rgba(178,8,57,${act * 0.3})`);
                    grad.addColorStop(1, 'rgba(178,8,57,0)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(x - 15, y - 15, 30, 30);
                }
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                // Inactive neutral -> active crimson. One ramp, no hue jump.
                const t = Math.min(1, act);
                ctx.fillStyle = `rgb(${Math.round(70 + 172 * t)},${Math.round(70 + 42 * t)},${Math.round(70 + 68 * t)})`;
                ctx.fill();
                ctx.strokeStyle = act > 0.5 ? `rgba(178,8,57,${act})` : 'rgba(255,255,255,0.15)';
                ctx.lineWidth = act > 0.5 ? 1.5 : 0.5;
                ctx.stroke();
            }
            if (this.layers[l] > maxShow[l]) {
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.font = `${(11 / scale).toFixed(1)}px Manrope, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(`+${this.layers[l] - maxShow[l]} more`, layerX[l], yStart + n * 13 + 8);
            }
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = `600 ${(12 / scale).toFixed(1)}px Manrope, sans-serif`;
            ctx.textAlign = 'center';
            const lines = labels[l].split('\n');
            ctx.fillText(lines[0], layerX[l], 18);
            if (lines[1]) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `${(11 / scale).toFixed(1)}px Manrope, sans-serif`; ctx.fillText(lines[1], layerX[l], 32); }
        }

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = `600 ${(11 / scale).toFixed(1)}px Manrope, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('RBM₁  (CD-k)', (layerX[0] + layerX[1]) / 2, H - 10);
        ctx.fillText('RBM₂  (CD-k)', (layerX[1] + layerX[2]) / 2, H - 10);
    }

    _renderReceptiveFields() {
        const grid = this.container.querySelector('#dbn-rf-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const nH = this.layers[1];
        const nV = this.layers[0];
        const w  = this.weights[0];

        for (let j = 0; j < nH; j++) {
            const cv = document.createElement('canvas');
            cv.width = cv.height = this.gridSize;
            cv.className = 'dbn-rf-cell';
            cv.style.cssText = 'width:28px;height:28px';
            const ctx = cv.getContext('2d');
            let minW = Infinity, maxW = -Infinity;
            for (let i = 0; i < nV; i++) {
                const wv = w[i * nH + j];
                if (wv < minW) minW = wv;
                if (wv > maxW) maxW = wv;
            }
            const range = maxW - minW || 1;
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const wv   = w[(y * this.gridSize + x) * nH + j];
                    const norm = (wv - minW) / range;
                    /* Signed diverging ramp on the site palette:
                       near-black (negative) -> mid grey (zero) -> crimson
                       (positive). Lightness carries the magnitude, so it stays
                       readable without a second hue. */
                    if (norm < 0.5) {
                        const t = norm * 2;
                        const g = Math.round(22 + 98 * t);
                        ctx.fillStyle = `rgb(${g},${g},${g + 4})`;
                    } else {
                        const t = (norm - 0.5) * 2;
                        ctx.fillStyle = `rgb(${Math.round(120 + 122*t)},${Math.round(124 - 12*t)},${Math.round(124 + 14*t)})`;
                    }
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            grid.appendChild(cv);
        }
    }

    _renderHistogram() {
        const canvas = this.container.querySelector('#dbn-hist-canvas');
        if (!canvas) return;
        const W = 480, H = 200;                       // design box
        this._fitCanvas(canvas, W, H);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        const w    = this.weights[0];
        const bins = 40;

        // ── Dynamic axis range based on actual weight distribution ────────────
        let rawMin = Infinity, rawMax = -Infinity;
        for (let i = 0; i < w.length; i++) {
            if (w[i] < rawMin) rawMin = w[i];
            if (w[i] > rawMax) rawMax = w[i];
        }
        // Pad by 10% and round to a clean value; fallback to ±0.5 if untrained
        const pad  = Math.max((rawMax - rawMin) * 0.1, 0.01);
        const minW = Math.min(-0.5, rawMin - pad);
        const maxW = Math.max( 0.5, rawMax + pad);
        const zero = (0 - minW) / (maxW - minW); // normalised position of zero

        // Build bins
        const counts = new Array(bins).fill(0);
        for (let i = 0; i < w.length; i++) {
            const bin = Math.floor(((w[i] - minW) / (maxW - minW)) * bins);
            if (bin >= 0 && bin < bins) counts[bin]++;
        }
        const maxCount = Math.max(...counts, 1); // guard against all-zero
        const bw = (W - 60) / bins;
        const plotTop = 24, plotBot = H - 22;
        const plotH   = plotBot - plotTop;

        // ── Title ─────────────────────────────────────────────────────────────
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '600 10px Manrope, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Weight distribution (RBM₁) — grey = negative, crimson = positive', W / 2, 14);

        // ── Grid lines + Y-axis labels ────────────────────────────────────────
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = plotTop + plotH * (1 - i / 4);
            ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 10, y); ctx.stroke();
            ctx.fillStyle  = 'rgba(255,255,255,0.3)';
            ctx.font       = '9px Manrope, sans-serif';
            ctx.textAlign  = 'right';
            ctx.fillText(Math.floor(maxCount * i / 4), 28, y + 3);
        }

        // ── Zero line ────────────────────────────────────────────────────────
        const zeroX = 30 + zero * bins * bw;
        ctx.strokeStyle = 'rgba(255,255,255,0.20)';
        ctx.lineWidth   = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(zeroX, plotTop); ctx.lineTo(zeroX, plotBot); ctx.stroke();
        ctx.setLineDash([]);

        // ── Bars ──────────────────────────────────────────────────────────────
        for (let i = 0; i < bins; i++) {
            const x     = 30 + i * bw;
            const barH  = (counts[i] / maxCount) * plotH;
            const y     = plotBot - barH;
            const t     = (i + 0.5) / bins;          // 0 = far-left bin, 1 = far-right bin
            const isNeg = (t < zero);
            ctx.fillStyle = isNeg
                ? `rgba(100,116,139,${0.35 + t * 0.65})`
                : `rgba(178,8,57,${0.25 + (t - zero) / (1 - zero) * 0.75})`;
            ctx.fillRect(x + 1, y, bw - 2, barH);
        }

        // ── X-axis labels ─────────────────────────────────────────────────────
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font      = '9px Manrope, sans-serif';

        // Left label — align left so it doesn't clip into the Y-axis margin
        ctx.textAlign = 'left';
        ctx.fillText(minW.toFixed(2), 30, H - 6);

        // Centre label (zero) — centred on the zero line
        ctx.textAlign = 'center';
        ctx.fillText('0.00', zeroX, H - 6);

        // Right label — align right so it doesn't overflow the canvas
        ctx.textAlign = 'right';
        ctx.fillText(maxW.toFixed(2), 30 + bins * bw, H - 6);
    }

    _updateUI() {
        const el = (id) => this.container.querySelector('#' + id);
        const phaseMax = { rbm1: 150, rbm2: 100, finetune: 50 };
        const currentMax = phaseMax[this.trainingPhase] || 300;

        if (el('dbn-epoch')) el('dbn-epoch').textContent = this.epoch;
        if (el('dbn-progress')) el('dbn-progress').style.width = `${Math.min(100, (this.epoch / currentMax) * 100)}%`;
        // MSE reconstruction error (shown in info card)
        if (el('dbn-energy'))
            el('dbn-energy').textContent = this.recon > 0 ? this.recon.toFixed(4) : '—';
        // Full Boltzmann energy E(v,h) displayed in a separate element if present
        if (el('dbn-boltzmann'))
            el('dbn-boltzmann').textContent = this.energy !== null
                ? this.energy.toFixed(2)
                : '—';

        if (this.activations[1]?.length > 0) {
            let maxIdx = 0, maxVal = 0;
            this.activations[1].forEach((v, i) => { if (v > maxVal) { maxVal = v; maxIdx = i; } });
            if (el('dbn-top-unit')) el('dbn-top-unit').textContent = maxVal > 0.1 ? `#${maxIdx} (${(maxVal * 100).toFixed(0)}%)` : '—';
        }

        // Export state for playground inspector panel
        window._ccnl_dbn_state = {
            reconErr:    this.recon,
            freeEnergy:  this.energy,
            epoch:       this.epoch,
            hiddenUnits: this.layers[1],
            phase:       this.trainingPhase,
            lr:          this.learningRate,
            cdK:         this.cdK
        };
    }

    destroy() {
        this._stopTraining();
    }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const dbnContainer = document.getElementById('dbn-container');
    if (dbnContainer) new DBNDemo(dbnContainer);
});
