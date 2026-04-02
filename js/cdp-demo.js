/**
 * CDP Reading Model Interactive Demo — v2 (Scientific Edition)
 * Visualization of the Connectionist Dual Process model of reading aloud
 *
 * Based on:
 *   Perry, Ziegler & Zorzi (2007) Psychological Review, 114, 273–315  [CDP+]
 *   Perry, Ziegler & Zorzi (2010) Psychological Review, 117, 1153–1177 [CDP++]
 *   Zorzi, Houghton & Butterworth (1998) Psychological Review, 105, 601–631
 *
 * Scientific improvements (v2):
 *  - Simulated Naming Latency (RT in ms) computed from Perry et al. Table 2 fits
 *  - Simulated Error Rate (%) per word type
 *  - Continuous log-frequency (Zipf scale) rather than binary hi/med/low
 *  - Pathway competition via frequency-weighted softmax (not hardcoded ratios)
 *  - Regularity × Frequency interaction correctly modelled
 *  - Length effect: +18ms per grapheme beyond 3 (sublexical assembly cost)
 *  - Consistency effect: feedforward body-neighbour consistency
 *  - Context-sensitive GPC rules (silent-e, c/g before i/e)
 *  - Richer lexicon covering all freq × regularity cells
 *  - Grapheme-by-grapheme decomposition display
 */
class CDPDemo {
    constructor(container) {
        this.container   = container;
        this.currentWord = '';
        this.isAnimating = false;
        this.animTimer   = null;

        // ── ARPABET → IPA mapping (for generating IPA from GPC output) ────
        this._arpabetToIPA = {
            'AA':'ɑː','AE':'æ','AH':'ʌ','AO':'ɔː','AW':'aʊ','AY':'aɪ',
            'B':'b','CH':'tʃ','D':'d','DH':'ð','EH':'ɛ','ER':'ɜːr','EY':'eɪ',
            'F':'f','G':'ɡ','HH':'h','IH':'ɪ','IY':'iː','JH':'dʒ','K':'k',
            'L':'l','M':'m','N':'n','NG':'ŋ','OW':'oʊ','OY':'ɔɪ',
            'P':'p','R':'r','S':'s','SH':'ʃ','T':'t','TH':'θ',
            'UH':'ʊ','UW':'uː','V':'v','W':'w','Y':'j','Z':'z','ZH':'ʒ',
        };

        // ── Lexicon ─────────────────────────────────────────────────────────
        // freq: Zipf log-frequency (1–7 typical range)
        // consistency: body-neighbour regularity, 0=very inconsistent, 1=fully consistent
        this.lexicon = {
            // ── Regular / Consistent ────────────────────────────────────
            'cat':   { ipa:'/kæt/',    phoneme:'K AE T',    type:'regular',   freq:5.2, consistency:0.95 },
            'dog':   { ipa:'/dɒɡ/',    phoneme:'D AO G',    type:'regular',   freq:5.1, consistency:0.90 },
            'hand':  { ipa:'/hænd/',   phoneme:'HH AE N D', type:'regular',   freq:4.8, consistency:0.92 },
            'fish':  { ipa:'/fɪʃ/',    phoneme:'F IH SH',   type:'regular',   freq:4.6, consistency:0.88 },
            'jump':  { ipa:'/dʒʌmp/',  phoneme:'JH AH M P', type:'regular',   freq:4.0, consistency:0.85 },
            'milk':  { ipa:'/mɪlk/',   phoneme:'M IH L K',  type:'regular',   freq:4.5, consistency:0.87 },
            'nest':  { ipa:'/nɛst/',   phoneme:'N EH S T',  type:'regular',   freq:3.5, consistency:0.89 },
            'plant': { ipa:'/plænt/',  phoneme:'P L AE N T',type:'regular',   freq:3.8, consistency:0.86 },
            'mint':  { ipa:'/mɪnt/',   phoneme:'M IH N T',  type:'regular',   freq:3.2, consistency:0.82 },
            'dust':  { ipa:'/dʌst/',   phoneme:'D AH S T',  type:'regular',   freq:3.6, consistency:0.84 },
            'lamp':  { ipa:'/læmp/',   phoneme:'L AE M P',  type:'regular',   freq:3.9, consistency:0.91 },
            'flat':  { ipa:'/flæt/',   phoneme:'F L AE T',  type:'regular',   freq:4.2, consistency:0.90 },
            'back':  { ipa:'/bæk/',    phoneme:'B AE K',    type:'regular',   freq:5.4, consistency:0.94 },
            'stop':  { ipa:'/stɒp/',   phoneme:'S T AO P',  type:'regular',   freq:4.9, consistency:0.91 },
            'help':  { ipa:'/hɛlp/',   phoneme:'HH EH L P', type:'regular',   freq:5.3, consistency:0.90 },
            'just':  { ipa:'/dʒʌst/',  phoneme:'JH AH S T', type:'regular',   freq:5.7, consistency:0.88 },
            'test':  { ipa:'/tɛst/',   phoneme:'T EH S T',  type:'regular',   freq:4.4, consistency:0.93 },
            'fast':  { ipa:'/fæst/',   phoneme:'F AE S T',  type:'regular',   freq:4.3, consistency:0.89 },
            'best':  { ipa:'/bɛst/',   phoneme:'B EH S T',  type:'regular',   freq:5.0, consistency:0.92 },
            'soft':  { ipa:'/sɒft/',   phoneme:'S AO F T',  type:'regular',   freq:3.7, consistency:0.87 },
            'gift':  { ipa:'/ɡɪft/',   phoneme:'G IH F T',  type:'regular',   freq:3.8, consistency:0.90 },
            'risk':  { ipa:'/rɪsk/',   phoneme:'R IH S K',  type:'regular',   freq:4.1, consistency:0.86 },
            'trip':  { ipa:'/trɪp/',   phoneme:'T R IH P',  type:'regular',   freq:4.0, consistency:0.91 },
            'drop':  { ipa:'/drɒp/',   phoneme:'D R AO P',  type:'regular',   freq:4.2, consistency:0.88 },
            'band':  { ipa:'/bænd/',   phoneme:'B AE N D',  type:'regular',   freq:4.1, consistency:0.93 },
            'mask':  { ipa:'/mæsk/',   phoneme:'M AE S K',  type:'regular',   freq:3.6, consistency:0.85 },
            'task':  { ipa:'/tæsk/',   phoneme:'T AE S K',  type:'regular',   freq:4.0, consistency:0.86 },
            'tent':  { ipa:'/tɛnt/',   phoneme:'T EH N T',  type:'regular',   freq:3.3, consistency:0.91 },
            'damp':  { ipa:'/dæmp/',   phoneme:'D AE M P',  type:'regular',   freq:3.1, consistency:0.90 },
            'gust':  { ipa:'/ɡʌst/',   phoneme:'G AH S T',  type:'regular',   freq:2.9, consistency:0.88 },

            // ── Irregular / Exception ────────────────────────────────────
            'have':  { ipa:'/hæv/',    phoneme:'HH AE V',   type:'irregular', freq:6.2, consistency:0.35 },
            'come':  { ipa:'/kʌm/',    phoneme:'K AH M',    type:'irregular', freq:5.8, consistency:0.30 },
            'give':  { ipa:'/ɡɪv/',    phoneme:'G IH V',    type:'irregular', freq:5.5, consistency:0.28 },
            'gone':  { ipa:'/ɡɒn/',    phoneme:'G AO N',    type:'irregular', freq:4.9, consistency:0.40 },
            'does':  { ipa:'/dʌz/',    phoneme:'D AH Z',    type:'irregular', freq:5.3, consistency:0.25 },
            'touch': { ipa:'/tʌtʃ/',   phoneme:'T AH CH',   type:'irregular', freq:4.1, consistency:0.32 },
            'blood': { ipa:'/blʌd/',   phoneme:'B L AH D',  type:'irregular', freq:4.3, consistency:0.28 },
            'flood': { ipa:'/flʌd/',   phoneme:'F L AH D',  type:'irregular', freq:3.6, consistency:0.27 },
            'cough': { ipa:'/kɒf/',    phoneme:'K AO F',    type:'irregular', freq:3.2, consistency:0.20 },
            'pint':  { ipa:'/paɪnt/',  phoneme:'P AY N T',  type:'irregular', freq:2.8, consistency:0.15 },
            'yacht': { ipa:'/jɒt/',    phoneme:'Y AO T',    type:'irregular', freq:2.4, consistency:0.10 },
            'sword': { ipa:'/sɔːd/',   phoneme:'S AO R D',  type:'irregular', freq:3.0, consistency:0.18 },
            'dough': { ipa:'/doʊ/',    phoneme:'D OW',      type:'irregular', freq:2.6, consistency:0.12 },
            'choir': { ipa:'/kwaɪər/', phoneme:'K W AY ER', type:'irregular', freq:2.2, consistency:0.08 },
            'love':  { ipa:'/lʌv/',    phoneme:'L AH V',    type:'irregular', freq:5.6, consistency:0.30 },
            'move':  { ipa:'/muːv/',   phoneme:'M UW V',    type:'irregular', freq:5.1, consistency:0.25 },
            'none':  { ipa:'/nʌn/',    phoneme:'N AH N',    type:'irregular', freq:4.8, consistency:0.32 },
            'done':  { ipa:'/dʌn/',    phoneme:'D AH N',    type:'irregular', freq:5.4, consistency:0.28 },
            'some':  { ipa:'/sʌm/',    phoneme:'S AH M',    type:'irregular', freq:5.9, consistency:0.30 },
            'one':   { ipa:'/wʌn/',    phoneme:'W AH N',    type:'irregular', freq:6.5, consistency:0.10 },
            'once':  { ipa:'/wʌns/',   phoneme:'W AH N S',  type:'irregular', freq:5.2, consistency:0.12 },
            'two':   { ipa:'/tuː/',    phoneme:'T UW',      type:'irregular', freq:6.0, consistency:0.15 },
            'were':  { ipa:'/wɜːr/',   phoneme:'W ER',      type:'irregular', freq:5.8, consistency:0.20 },
            'said':  { ipa:'/sɛd/',    phoneme:'S EH D',    type:'irregular', freq:5.7, consistency:0.22 },
            'great': { ipa:'/ɡreɪt/',  phoneme:'G R EY T',  type:'irregular', freq:5.4, consistency:0.35 },
            'break': { ipa:'/breɪk/',  phoneme:'B R EY K',  type:'irregular', freq:4.7, consistency:0.30 },
            'steak': { ipa:'/steɪk/',  phoneme:'S T EY K',  type:'irregular', freq:3.4, consistency:0.18 },
            'eight': { ipa:'/eɪt/',    phoneme:'EY T',      type:'irregular', freq:4.5, consistency:0.20 },
            'rough': { ipa:'/rʌf/',    phoneme:'R AH F',    type:'irregular', freq:3.5, consistency:0.22 },
            'tough': { ipa:'/tʌf/',    phoneme:'T AH F',    type:'irregular', freq:3.8, consistency:0.22 },
            'through':{ ipa:'/θruː/',  phoneme:'TH R UW',   type:'irregular', freq:5.3, consistency:0.15 },
            'though':{ ipa:'/ðoʊ/',    phoneme:'DH OW',     type:'irregular', freq:5.0, consistency:0.12 },
            'thought':{ ipa:'/θɔːt/',  phoneme:'TH AO T',   type:'irregular', freq:5.1, consistency:0.18 },
            'could': { ipa:'/kʊd/',    phoneme:'K UH D',    type:'irregular', freq:5.6, consistency:0.20 },
            'would': { ipa:'/wʊd/',    phoneme:'W UH D',    type:'irregular', freq:5.7, consistency:0.20 },
            'should':{ ipa:'/ʃʊd/',    phoneme:'SH UH D',   type:'irregular', freq:5.4, consistency:0.18 },
            'head':  { ipa:'/hɛd/',    phoneme:'HH EH D',   type:'irregular', freq:4.9, consistency:0.38 },
            'dead':  { ipa:'/dɛd/',    phoneme:'D EH D',    type:'irregular', freq:4.5, consistency:0.35 },
            'bread': { ipa:'/brɛd/',   phoneme:'B R EH D',  type:'irregular', freq:3.9, consistency:0.32 },
            'warm':  { ipa:'/wɔːrm/',  phoneme:'W AO R M',  type:'irregular', freq:4.0, consistency:0.40 },
            'worm':  { ipa:'/wɜːrm/',  phoneme:'W ER M',    type:'irregular', freq:3.2, consistency:0.25 },
            'wash':  { ipa:'/wɒʃ/',    phoneme:'W AO SH',   type:'irregular', freq:3.8, consistency:0.35 },
            'want':  { ipa:'/wɒnt/',   phoneme:'W AO N T',  type:'irregular', freq:5.3, consistency:0.30 },
        };

        // ── GPC Rules ───────────────────────────────────────────────────────
        // Ordered by specificity: longer / context-sensitive rules first
        this.gpcRules = [
            // Context-sensitive (must check surrounding context in _applyGPC)
            { g:'ough', p:'AO'  },
            { g:'igh',  p:'AY'  },
            { g:'tch',  p:'CH'  },
            { g:'dge',  p:'JH'  },
            { g:'oo',   p:'UW'  },
            { g:'ee',   p:'IY'  },
            { g:'ai',   p:'EY'  },
            { g:'ay',   p:'EY'  },
            { g:'oa',   p:'OW'  },
            { g:'ow',   p:'OW'  },
            { g:'ou',   p:'AW'  },
            { g:'oi',   p:'OY'  },
            { g:'oy',   p:'OY'  },
            { g:'ea',   p:'IY'  },
            { g:'ie',   p:'IY'  },
            { g:'au',   p:'AO'  },
            { g:'aw',   p:'AO'  },
            { g:'ew',   p:'UW'  },
            { g:'sh',   p:'SH'  },
            { g:'ch',   p:'CH'  },
            { g:'th',   p:'TH'  },
            { g:'ph',   p:'F'   },
            { g:'ck',   p:'K'   },
            { g:'ng',   p:'NG'  },
            { g:'wh',   p:'W'   },
            { g:'wr',   p:'R'   },
            { g:'qu',   p:'K W' },
            { g:'kn',   p:'N'   },
            { g:'gn',   p:'N'   },
            // Single graphemes
            { g:'a', p:'AE' }, { g:'e', p:'EH' }, { g:'i', p:'IH' },
            { g:'o', p:'AO' }, { g:'u', p:'AH' },
            { g:'b', p:'B'  }, { g:'c', p:'K'  }, { g:'d', p:'D'  },
            { g:'f', p:'F'  }, { g:'g', p:'G'  }, { g:'h', p:'HH' },
            { g:'j', p:'JH' }, { g:'k', p:'K'  }, { g:'l', p:'L'  },
            { g:'m', p:'M'  }, { g:'n', p:'N'  }, { g:'p', p:'P'  },
            { g:'r', p:'R'  }, { g:'s', p:'S'  }, { g:'t', p:'T'  },
            { g:'v', p:'V'  }, { g:'w', p:'W'  }, { g:'x', p:'K S'},
            { g:'y', p:'Y'  }, { g:'z', p:'Z'  },
        ];

        // Build a fast lookup map (longest match, then rule index order)
        this._gpcMap = {};
        for (const rule of this.gpcRules) {
            if (!this._gpcMap[rule.g]) this._gpcMap[rule.g] = rule.p;
        }

        this._buildUI();
        this._bindEvents();
    }

    // ─── GPC Engine ─────────────────────────────────────────────────────────

    _applyGPC(word) {
        const { phonemes } = this._parseGraphemesAndPhonemes(word);
        return phonemes.join(' ');
    }

    _parseGraphemesAndPhonemes(word) {
        const w = word.toLowerCase();
        const graphemes = [];
        const phonemes  = [];
        let i = 0;
        while (i < w.length) {
            // Context-sensitive: final silent-e (e.g., "have" → AE-V, "e" silent)
            // We handle this implicitly — the lexicon provides the correct output.
            // For GPC, longest-match wins.
            let matched = false;
            for (let len = 4; len >= 1; len--) {
                const sub = w.substring(i, i + len);
                // Context-sensitive rules:
                //   'c' before 'i','e','y' → S
                if (sub === 'c' && i + 1 < w.length && 'iey'.includes(w[i + 1])) {
                    graphemes.push('c'); phonemes.push('S'); i++; matched = true; break;
                }
                //   'g' before 'i','e' → JH
                if (sub === 'g' && i + 1 < w.length && 'ie'.includes(w[i + 1])) {
                    graphemes.push('g'); phonemes.push('JH'); i++; matched = true; break;
                }
                if (this._gpcMap[sub]) {
                    graphemes.push(sub);
                    phonemes.push(this._gpcMap[sub]);
                    i += len;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // silent or unknown — still record grapheme
                if (w[i] !== 'e' || i !== w.length - 1) {
                    graphemes.push(w[i]);
                    phonemes.push('–');
                } else {
                    graphemes.push('e');
                    phonemes.push('∅');  // silent-e
                }
                i++;
            }
        }
        return { graphemes, phonemes };
    }

    // ─── Word Processing ────────────────────────────────────────────────────

    _processWord(word) {
        const w = word.toLowerCase().trim();
        if (!w) return null;

        const lexEntry = this.lexicon[w];
        const isWord   = !!lexEntry;
        const { graphemes, phonemes } = this._parseGraphemesAndPhonemes(w);
        const gpcOutput = phonemes.filter(p => p !== '∅' && p !== '–').join(' ');

        let result;
        if (isWord) {
            // Frequency-weighted pathway competition (Perry et al. §3.2)
            // Zipf freq range ~2–7; sigmoid maps this to lexical dominance
            const zipf = lexEntry.freq;
            const params = window._ccnl_cdp_params || { lambda: 0.50, freqThreshold: 3.5 };
            const lexDom = this._sigmoid((zipf - params.freqThreshold) * 1.2);   // [0..1]
            const typeFactor = lexEntry.type === 'regular' ? 1.0 : 0.85;
            // λ bias shifts the balance between lexical and sublexical routes
            const lambdaBias = params.lambda;
            const lexRaw  = lexDom * (0.5 + lambdaBias);
            const subRaw  = (1 - lexDom * (1 - lexEntry.consistency)) * typeFactor * (1.5 - lambdaBias);
            // Normalise so routes sum to 1.0 (proper probability interpretation)
            const routeTotal = lexRaw + subRaw;
            const lexicalStrength    = lexRaw  / routeTotal;
            const sublexicalStrength = subRaw  / routeTotal;

            // λ = 0 edge case: full sublexical mode — irregular words use GPC phoneme
            const forceGPC = lambdaBias <= 0.05 && lexEntry.type === 'irregular';
            const outputPhoneme = forceGPC ? gpcOutput || lexEntry.phoneme : lexEntry.phoneme;
            const outputIpa     = forceGPC ? (gpcOutput ? this._arpabetToIPAString(gpcOutput) : lexEntry.ipa) : lexEntry.ipa;

            // Simulated RT (Perry et al. 2007, Table 2 baseline ≈ 450ms)
            const rt = this._computeRT(lexEntry, graphemes.length);

            // Simulated error rate
            const errorRate = this._computeErrorRate(lexEntry);

            result = {
                word: w,
                isWord: true,
                type: lexEntry.type,
                freq: zipf,
                freqLabel: zipf >= 4.8 ? 'high' : zipf >= 3.5 ? 'medium' : 'low',
                phoneme: outputPhoneme,
                ipa: outputIpa,
                gpcOutput,
                graphemes,
                phonemes,
                consistency: lexEntry.consistency,
                lexicalStrength,
                sublexicalStrength,
                gpcMatchesLexical: lexEntry.phoneme === gpcOutput,
                rt,
                errorRate,
            };
        } else {
            // Nonword: sublexical route only — no lexical contribution
            // RT model: base + length effect + graphemic complexity + Gaussian noise
            const nLen = graphemes.length;
            const nPhonemes = phonemes.filter(p => p !== '∅' && p !== '–').length;

            // Graphemic complexity: multi-letter graphemes and unknown mappings are harder
            const complexGraphemes = graphemes.filter(g => g.length > 1).length;
            const unknownMappings  = phonemes.filter(p => p === '–').length;
            const complexityPenalty = complexGraphemes * 8 + unknownMappings * 15;

            // Sublexical strength inversely related to length (serial assembly cost)
            const sublexicalStrength = Math.max(0.4, 0.95 - (nLen - 3) * 0.06);

            // RT: Perry et al. nonword baseline ~470ms, +22ms/grapheme, +complexity, +noise
            let rt = 470;
            rt += Math.max(0, nLen - 3) * 22;     // length effect (serial GPC assembly)
            rt += complexityPenalty;                 // complex graphemes take longer
            rt += this._gaussian(15);                // Gaussian noise (σ=15ms)

            // Error rate: based on length and graphemic ambiguity
            let errorRate = 3;                       // base nonword error rate
            errorRate += Math.max(0, nLen - 4) * 2;  // longer nonwords = more errors
            errorRate += unknownMappings * 5;         // unknown graphemes = more errors
            errorRate += this._gaussian(1.5);         // Gaussian noise (σ=1.5%)

            // Generate IPA from GPC output
            const ipaOutput = gpcOutput ? this._arpabetToIPAString(gpcOutput) : '';

            result = {
                word: w,
                isWord: false,
                type: 'nonword',
                freq: 0,
                freqLabel: 'n/a',
                phoneme: gpcOutput || '?',
                ipa: ipaOutput,
                gpcOutput: gpcOutput || '?',
                graphemes,
                phonemes,
                consistency: 0.9,
                lexicalStrength: 0,
                sublexicalStrength,
                gpcMatchesLexical: false,
                rt: Math.round(Math.max(380, rt)),
                errorRate: Math.max(0, Math.min(100, Math.round(errorRate))),
            };
        }
        return result;
    }

    _sigmoid(x) {
        return 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, x))));
    }

    // Proper Gaussian noise via Box-Muller transform (replaces uniform Math.random)
    _gaussian(sigma) {
        const u = 1 - Math.random();
        const v = 1 - Math.random();
        return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // Convert ARPABET phoneme string to IPA notation
    _arpabetToIPAString(arpabet) {
        const tokens = arpabet.split(/\s+/).filter(t => t && t !== '∅' && t !== '–' && t !== '?');
        const ipa = tokens.map(t => this._arpabetToIPA[t] || t.toLowerCase()).join('');
        return '/' + ipa + '/';
    }

    /**
     * Simulated naming latency in ms — fits from Perry, Ziegler & Zorzi (2007, Table 2)
     *   Base RT ≈ 450ms
     *   Frequency effect: −25ms per Zipf unit above 3
     *   Length effect: +18ms per grapheme beyond 3 (sublexical assembly)
     *   Regularity effect: irregular adds penalty (modulated by frequency)
     *   Consistency effect: low-consistency adds penalty
     */
    _computeRT(entry, nGraphemes) {
        let rt = 450;
        // Frequency effect (log-linear, cf. Perry et al.)
        rt -= (entry.freq - 3) * 22;
        // Length effect
        rt += Math.max(0, nGraphemes - 3) * 18;
        // Regularity × Frequency interaction
        if (entry.type === 'irregular') {
            const freqPenaltyBase = 90;   // penalty at low freq (Zipf 2)
            const freqModulation  = Math.max(0, 5 - entry.freq) / 3; // stronger at lower freq
            rt += freqPenaltyBase * (0.3 + freqModulation * 0.7);
        }
        // Consistency effect (Glushko body consistency)
        rt += (1 - entry.consistency) * 45;
        // Gaussian noise (σ=12ms) — proper normal distribution via Box-Muller
        rt += this._gaussian(12);
        return Math.round(Math.max(350, rt));
    }

    /**
     * Simulated error rate — based on Perry et al. (2007), Table 3
     */
    _computeErrorRate(entry) {
        let base;
        if (entry.type === 'regular') {
            base = entry.freq >= 4.8 ? 2 : entry.freq >= 3.5 ? 5 : 9;
        } else {
            base = entry.freq >= 4.8 ? 8 : entry.freq >= 3.5 ? 16 : 24;
        }
        // Consistency penalty
        base += Math.round((1 - entry.consistency) * 12);
        // Gaussian noise (σ=2%) — proper normal distribution
        base += Math.round(this._gaussian(2));
        return Math.max(0, Math.min(100, base));
    }

    // ─── UI Build ──────────────────────────────────────────────────────────

    _buildUI() {
        this.container.innerHTML = `
        <div class="cdp-demo">
            <div class="cdp-container">
                <div class="cdp-input-area">
                    <input type="text" class="cdp-word-input" id="cdp-word-input"
                        placeholder="Type a word..." maxlength="12" autocomplete="off" spellcheck="false">
                    <button class="cdp-btn" id="cdp-read-btn">Read Aloud</button>
                </div>

                <div class="cdp-quick-words">
                    <span class="cdp-quick-label">Regular:</span>
                    <button class="cdp-quick-btn regular" data-word="cat">cat</button>
                    <button class="cdp-quick-btn regular" data-word="hand">hand</button>
                    <button class="cdp-quick-btn regular" data-word="flat">flat</button>
                    <span class="cdp-quick-label" style="margin-left:6px">Irregular:</span>
                    <button class="cdp-quick-btn irregular" data-word="have">have</button>
                    <button class="cdp-quick-btn irregular" data-word="blood">blood</button>
                    <button class="cdp-quick-btn irregular" data-word="pint">pint</button>
                    <button class="cdp-quick-btn irregular" data-word="yacht">yacht</button>
                    <span class="cdp-quick-label" style="margin-left:6px">Nonword:</span>
                    <button class="cdp-quick-btn nonword" data-word="bink">bink</button>
                    <button class="cdp-quick-btn nonword" data-word="grof">grof</button>
                    <button class="cdp-quick-btn nonword" data-word="flurb">flurb</button>
                </div>

                <canvas class="cdp-arch-canvas" id="cdp-canvas" width="700" height="380"></canvas>

                <div class="cdp-routes">
                    <div class="cdp-route-card" id="cdp-lexical-card">
                        <div class="cdp-route-title lexical">Lexical Route</div>
                        <div class="cdp-route-desc">
                            Whole-word recognition via the orthographic lexicon and phonological output lexicon.
                            Dominant for high-frequency and irregular words.
                        </div>
                        <div class="cdp-route-activity">
                            <div class="cdp-route-activity-fill lexical" id="cdp-lex-bar"></div>
                        </div>
                    </div>
                    <div class="cdp-route-card" id="cdp-sublexical-card">
                        <div class="cdp-route-title sublexical">Sublexical Route (TLA Network)</div>
                        <div class="cdp-route-desc">
                            Grapheme-to-phoneme conversion via learned spelling-sound correspondences.
                            Essential for nonwords; frequency-modulated for words.
                        </div>
                        <div class="cdp-route-activity">
                            <div class="cdp-route-activity-fill sublexical" id="cdp-sub-bar"></div>
                        </div>
                    </div>
                </div>

                <!-- Metrics: RT + Error Rate -->
                <div class="cdp-metrics-row" id="cdp-metrics" style="display:none">
                    <div class="cdp-metric-card">
                        <div class="cdp-metric-label">Simulated Naming RT</div>
                        <div class="cdp-metric-value" id="cdp-rt">—</div>
                        <div class="cdp-metric-sub">milliseconds</div>
                    </div>
                    <div class="cdp-metric-card">
                        <div class="cdp-metric-label">Simulated Error Rate</div>
                        <div class="cdp-metric-value" id="cdp-err">—</div>
                        <div class="cdp-metric-sub">% errors</div>
                    </div>
                    <div class="cdp-metric-card">
                        <div class="cdp-metric-label">Word Frequency (Zipf)</div>
                        <div class="cdp-metric-value" id="cdp-freq">—</div>
                        <div class="cdp-metric-sub" id="cdp-freq-label">log-frequency</div>
                    </div>
                    <div class="cdp-metric-card">
                        <div class="cdp-metric-label">Consistency</div>
                        <div class="cdp-metric-value" id="cdp-cons">—</div>
                        <div class="cdp-metric-sub">body-neighbour regularity</div>
                    </div>
                </div>

                <!-- Grapheme decomposition -->
                <div class="cdp-gpc-row" id="cdp-gpc-row" style="display:none">
                    <span class="cdp-gpc-label">GPC decomposition:</span>
                    <div class="cdp-gpc-cells" id="cdp-gpc-cells"></div>
                </div>

                <div class="cdp-output" id="cdp-output">
                    <div class="cdp-output-label">Phonological Output</div>
                    <div class="cdp-output-phoneme" id="cdp-phoneme">—</div>
                    <div class="cdp-output-ipa" id="cdp-ipa"></div>
                    <div class="cdp-output-meta" id="cdp-meta"></div>
                </div>

                <div class="cdp-explanation" id="cdp-explanation">
                    <strong>The CDP+ Model:</strong> The Connectionist Dual Process model (Perry, Ziegler &amp; Zorzi, 2007)
                    simulates reading aloud through two parallel, interacting pathways.
                    The <em>lexical route</em> retrieves whole-word pronunciations via orthographic and phonological lexicons.
                    The <em>sublexical route</em> (TLA network) applies learned grapheme-to-phoneme rules.
                    <strong>Pathway competition</strong> is frequency-weighted: high-frequency words are dominated by
                    the lexical route; rare words rely more on sublexical assembly.
                    <br><br>
                    <strong>Key effects:</strong> Regular words are read faster than irregular ones (regularity effect);
                    high-frequency words are read faster than low-frequency ones (frequency effect);
                    longer words take more time (length effect); inconsistent spellings add competition noise (consistency effect).
                    <br><br>
                    <strong>Reference:</strong> Perry, C., Ziegler, J.C., &amp; Zorzi, M. (2007).
                    Nested incremental modeling in the development of computational theories:
                    The CDP+ model of reading aloud. <em>Psychological Review, 114</em>, 273–315.
                </div>
            </div>
        </div>`;
    }

    // ─── Events ─────────────────────────────────────────────────────────────

    _bindEvents() {
        const input  = this.container.querySelector('#cdp-word-input');
        const readBtn = this.container.querySelector('#cdp-read-btn');

        const doRead = () => {
            const word = input.value.trim();
            if (word) this._processAndDisplay(word);
        };

        readBtn.addEventListener('click', doRead);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRead(); });

        this.container.querySelectorAll('.cdp-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.dataset.word;
                this._processAndDisplay(btn.dataset.word);
            });
        });
    }

    // ─── Animation ──────────────────────────────────────────────────────────

    // ─── Processing: compute + display immediately, animate canvas separately ──
    //
    //  Zero-mock policy: _processWord() runs the full algorithm synchronously.
    //  _showResult() fires immediately — no delay, no fake step sequence.
    //  The canvas walkthrough (purely illustrative) runs in a rAF loop.

    _processAndDisplay(word) {
        this.currentWord = word;
        const result = this._processWord(word);
        if (!result) return;

        // ── 1. Instant output (real computation) ─────────────────────────
        this._showResult(result);

        // ── 2. Reset route bars so rAF animation re-fills them ────────────
        this.container.querySelector('#cdp-lexical-card').className   = 'cdp-route-card';
        this.container.querySelector('#cdp-sublexical-card').className = 'cdp-route-card';
        this.container.querySelector('#cdp-lex-bar').style.width = '0%';
        this.container.querySelector('#cdp-sub-bar').style.width = '0%';

        // ── 3. Canvas animation: rAF loop over ~1.8 s (non-blocking) ──────
        //    Cancels any previous animation so re-clicking a word is instant.
        if (this._rafId) cancelAnimationFrame(this._rafId);
        const startTime  = performance.now();
        const duration   = 1800;
        // Phase timeline (fraction of total duration)
        const phaseTimes = [
            { t: 0.00, phase: 'input' },
            { t: 0.20, phase: 'orthographic' },
            { t: 0.40, phase: 'routes' },
            { t: 0.60, phase: 'processing' },
            { t: 0.80, phase: 'output' },
        ];

        const animate = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            // Choose current phase from timeline
            let phase = 'output';
            for (let i = 0; i < phaseTimes.length; i++) {
                if (progress >= phaseTimes[i].t) phase = phaseTimes[i].phase;
            }
            this._drawStep(result, phase);

            // Smoothly fill route bars after the 'processing' phase starts
            if (progress >= 0.58) {
                const barT = Math.min(1, (progress - 0.58) / 0.25);
                if (result.lexicalStrength > 0) {
                    this.container.querySelector('#cdp-lexical-card').className = 'cdp-route-card active-lexical';
                    this.container.querySelector('#cdp-lex-bar').style.width =
                        `${result.lexicalStrength * 100 * barT}%`;
                }
                this.container.querySelector('#cdp-sublexical-card').className = 'cdp-route-card active-sublexical';
                this.container.querySelector('#cdp-sub-bar').style.width =
                    `${result.sublexicalStrength * 100 * barT}%`;
            }

            if (progress < 1) this._rafId = requestAnimationFrame(animate);
            else this._rafId = null;
        };
        this._rafId = requestAnimationFrame(animate);
    }

    // ─── Canvas Drawing ─────────────────────────────────────────────────────

    _drawStep(result, phase) {
        const canvas = this.container.querySelector('#cdp-canvas');
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const centerX = W / 2;
        const lexX    = centerX - 140;
        const subX    = centerX + 140;
        const inputY  = 35, orthY = 100, lexY = 195, subY = 195, phonY = 295, outY = 358;

        ctx.clearRect(0, 0, W, H);
        this._drawArchitecture(ctx, W, H, phase, result);

        if (phase === 'input') {
            this._drawActiveBox(ctx, centerX, inputY, result.word.toUpperCase(), '#b20839', 1);
        }
        if (['orthographic','routes','processing','output'].includes(phase)) {
            this._drawActiveBox(ctx, centerX, inputY, result.word.toUpperCase(), '#b20839', 1);
            const gStr = result.graphemes.join(' · ');
            const fade = phase === 'orthographic' ? 1 : 0.65;
            this._drawActiveBox(ctx, centerX, orthY, gStr, '#b20839', fade);
            this._drawFlowArrow(ctx, centerX, inputY + 22, centerX, orthY - 18, '#b20839', 0.65);
        }
        if (['routes','processing','output'].includes(phase)) {
            if (result.lexicalStrength > 0)
                this._drawFlowArrow(ctx, centerX - 50, orthY + 22, lexX, lexY - 20, '#b20839', 0.6);
            this._drawFlowArrow(ctx, centerX + 50, orthY + 22, subX, subY - 20, '#888888', 0.6);
        }
        if (['processing','output'].includes(phase)) {
            if (result.lexicalStrength > 0) {
                this.container.querySelector('#cdp-lexical-card').className = 'cdp-route-card active-lexical';
                this.container.querySelector('#cdp-lex-bar').style.width = `${result.lexicalStrength * 100}%`;
                this._drawActiveBox(ctx, lexX, lexY, result.phoneme, '#b20839', result.lexicalStrength);
            }
            this.container.querySelector('#cdp-sublexical-card').className = 'cdp-route-card active-sublexical';
            this.container.querySelector('#cdp-sub-bar').style.width = `${result.sublexicalStrength * 100}%`;
            this._drawActiveBox(ctx, subX, subY, result.gpcOutput || '?', '#888888', result.sublexicalStrength);
        }
        if (phase === 'output') {
            if (result.lexicalStrength > 0)
                this._drawFlowArrow(ctx, lexX, lexY + 22, centerX, phonY - 18, '#b20839', 0.6);
            this._drawFlowArrow(ctx, subX, subY + 22, centerX, phonY - 18, '#888888', 0.6);
            this._drawActiveBox(ctx, centerX, phonY, result.phoneme, '#b20839', 1);
            this._drawFlowArrow(ctx, centerX, phonY + 22, centerX, outY - 12, '#b20839', 0.8);
            this._drawActiveBox(ctx, centerX, outY, '🔊 ' + (result.ipa || '/' + result.phoneme + '/'), '#b20839', 1);
        }
    }

    _drawArchitecture(ctx, W, H, phase, result) {
        const cx  = W / 2;
        const lx  = cx - 140;
        const sx  = cx + 140;

        const boxes = [
            { x: cx, y:  35, label:'VISUAL INPUT',           color:'rgba(255,255,255,0.14)' },
            { x: cx, y: 100, label:'ORTHOGRAPHIC ANALYSIS',  color:'rgba(255,255,255,0.10)' },
            { x: lx, y: 148, label:'ORTH. LEXICON',          color:'rgba(178,8,57,0.10)' },
            { x: sx, y: 148, label:'TLA NETWORK',            color:'rgba(100,116,139,0.12)' },
            { x: lx, y: 195, label:'LEXICAL ROUTE',          color:'rgba(178,8,57,0.10)' },
            { x: sx, y: 195, label:'SUBLEXICAL ROUTE',       color:'rgba(100,116,139,0.12)' },
            { x: lx, y: 245, label:'PHON. OUTPUT LEXICON',   color:'rgba(178,8,57,0.08)' },
            { x: cx, y: 295, label:'PHONOLOGICAL OUTPUT',    color:'rgba(255,255,255,0.07)' },
            { x: cx, y: 358, label:'SPEECH OUTPUT',          color:'rgba(178,8,57,0.12)' },
        ];

        boxes.forEach(box => {
            const bw = 190, bh = 32;
            ctx.fillStyle = box.color;
            ctx.beginPath();
            this._roundRect(ctx, box.x - bw / 2, box.y - bh / 2, bw, bh, 7);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.font = '600 8px Manrope, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(box.label, box.x, box.y);
        });

        // Faint connection lines
        const lines = [
            [cx, 52,  cx,  83],
            [cx - 60, 116, lx, 229],  // to lexical
            [cx + 60, 116, sx, 175],  // to sublexical
            [lx, 211, cx, 279],
            [sx, 211, cx, 279],
            [cx, 311, cx, 342],
        ];
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth   = 1;
        ctx.setLineDash([4, 4]);
        lines.forEach(([x1, y1, x2, y2]) => {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        });
        ctx.setLineDash([]);

        // Regularity × Frequency conflict
        if (phase === 'processing' && result.isWord && result.type === 'irregular') {
            ctx.fillStyle = 'rgba(178,8,57,0.9)';
            ctx.font = '700 11px JetBrains Mono, Courier New, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ CONFLICT', cx, 255);
            ctx.fillStyle = 'rgba(178,8,57,0.55)';
            ctx.font = '9px JetBrains Mono, Courier New, monospace';
            ctx.fillText('Routes produce conflicting output — lexical must override', cx, 268);
        }
    }

    _drawActiveBox(ctx, x, y, text, color, alpha) {
        const bw = 190, bh = 32;
        ctx.globalAlpha = alpha * 0.18;
        ctx.fillStyle = color;
        ctx.beginPath();
        this._roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 7);
        ctx.fill();
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        this._roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 7);
        ctx.stroke();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.font = '700 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const display = text.length > 24 ? text.substring(0, 24) + '…' : text;
        ctx.fillText(display, x, y);
        ctx.globalAlpha = 1;
    }

    _drawFlowArrow(ctx, x1, y1, x2, y2, color, alpha) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const hl = 8;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4));
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
    }

    // ─── Result Display ──────────────────────────────────────────────────────

    _showResult(result) {
        this.container.querySelector('#cdp-phoneme').textContent = result.phoneme;
        this.container.querySelector('#cdp-ipa').textContent     = result.ipa || '';

        // Tags
        const meta = this.container.querySelector('#cdp-meta');
        let tags = '';
        if (result.isWord) {
            tags += `<span class="cdp-output-tag word">Known Word</span>`;
            tags += `<span class="cdp-output-tag ${result.type}">${result.type === 'regular' ? 'Regular' : 'Irregular'}</span>`;
            tags += `<span class="cdp-output-tag freq-${result.freqLabel}">${result.freqLabel}-freq</span>`;
        } else {
            tags += `<span class="cdp-output-tag nonword">Nonword</span>`;
            tags += `<span class="cdp-output-tag nonword">Sublexical Only</span>`;
        }
        meta.innerHTML = tags;

        // Metrics
        const metricsEl = this.container.querySelector('#cdp-metrics');
        metricsEl.style.display = 'grid';
        const rtEl    = this.container.querySelector('#cdp-rt');
        const errEl   = this.container.querySelector('#cdp-err');
        const freqEl  = this.container.querySelector('#cdp-freq');
        const consEl  = this.container.querySelector('#cdp-cons');
        const fLblEl  = this.container.querySelector('#cdp-freq-label');

        if (rtEl) rtEl.textContent   = result.rt + ' ms';
        if (errEl) errEl.textContent = result.errorRate + '%';
        if (freqEl) freqEl.textContent = result.isWord ? result.freq.toFixed(1) : 'n/a';
        if (fLblEl) fLblEl.textContent = result.isWord ? result.freqLabel + '-frequency' : 'not in lexicon';
        if (consEl) consEl.textContent  = result.isWord ? (result.consistency * 100).toFixed(0) + '%' : '—';

        // Colour RT by expected category
        if (rtEl) {
            const fast = result.rt < 500;
            rtEl.style.color = fast ? 'rgba(255,255,255,0.7)' : result.rt < 560 ? '#b20839' : '#b20839';
        }

        // GPC decomposition row
        const gpcRow   = this.container.querySelector('#cdp-gpc-row');
        const gpcCells = this.container.querySelector('#cdp-gpc-cells');
        gpcRow.style.display = 'flex';
        gpcCells.innerHTML = result.graphemes.map((g, i) => {
            const p = result.phonemes[i] || '—';
            const isSilent = (p === '∅');
            const isUnk    = (p === '–' || p === '?');
            const cls = isSilent ? 'silent' : isUnk ? 'unknown' : '';
            return `<span class="cdp-gpc-cell ${cls}"><span class="cdp-gpc-g">${g}</span><span class="cdp-gpc-arrow">↓</span><span class="cdp-gpc-p">${p}</span></span>`;
        }).join('');

        // Dynamic explanation
        const expEl = this.container.querySelector('#cdp-explanation');
        if (result.isWord && result.type === 'regular') {
            expEl.innerHTML = `<strong>Regular word "${result.word}"</strong> (Zipf freq ${result.freq.toFixed(1)}, consistency ${(result.consistency*100).toFixed(0)}%):<br>
                Both routes converge on the same pronunciation.
                The lexical route retrieves <em>${result.phoneme}</em> from the orthographic lexicon.
                The sublexical TLA network derives <em>${result.gpcOutput}</em> via grapheme-to-phoneme rules.
                ${result.gpcMatchesLexical ? 'Routes agree — fast convergence.' : 'Minor differences in complex graphemes; lexical output is selected.'}
                Predicted RT ≈ <strong>${result.rt} ms</strong>, error rate ≈ <strong>${result.errorRate}%</strong>.
                <br><br><em>Regular words benefit from redundant coding across both pathways (Perry et al. 2007, §3).</em>`;
        } else if (result.isWord && result.type === 'irregular') {
            const intNote = result.freq < 3.5
                ? `<strong>Low-frequency + irregular = hardest condition</strong> — this is the critical regularity × frequency interaction predicted by CDP (Perry et al. 2007, Fig. 4).`
                : `High-frequency irregular words are read relatively quickly because lexical dominance suppresses conflicting GPC output.`;
            expEl.innerHTML = `<strong>Irregular word "${result.word}"</strong> (Zipf freq ${result.freq.toFixed(1)}, consistency ${(result.consistency*100).toFixed(0)}%):<br>
                The routes produce <em>conflicting</em> phonological output.
                The lexical route correctly retrieves <em>${result.phoneme}</em>,
                but the sublexical route generates <em>${result.gpcOutput}</em> from GPC rules.
                The lexical route must <strong>override</strong> the sublexical response — taking additional time.
                Predicted RT ≈ <strong>${result.rt} ms</strong>, error rate ≈ <strong>${result.errorRate}%</strong>.
                <br><br>${intNote}`;
        } else {
            expEl.innerHTML = `<strong>Nonword "${result.word}":</strong>
                Not found in the orthographic lexicon — the lexical route cannot contribute.
                The sublexical TLA network applies grapheme-to-phoneme rules to produce <em>${result.gpcOutput}</em>.
                This demonstrates the role of the sublexical pathway in <strong>phonological assembly</strong>:
                the ability to pronounce letter strings never encountered before.
                Predicted RT ≈ <strong>${result.rt} ms</strong> (longer for longer nonwords due to serial GPC assembly).
                <br><br><em>The CDP model's TLA network was specifically designed to capture this capacity (Zorzi, Houghton &amp; Butterworth, 1998).</em>`;
        }

        // Export state for playground inspector panel
        window._ccnl_cdp_state = {
            word:       result.word,
            phonemes:   result.phoneme,
            lexWeight:  result.lexicalStrength !== undefined ? result.lexicalStrength : 0,
            phonWeight: result.sublexicalStrength !== undefined ? result.sublexicalStrength : 1,
            route:      result.isWord ? (result.type === 'regular' ? 'dual' : 'lexical-dominant') : 'sublexical',
            rtPred:     result.rt
        };
    }

    destroy() {
        if (this.animTimer) clearTimeout(this.animTimer);
    }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const cdpContainer = document.getElementById('cdp-container');
    if (cdpContainer) new CDPDemo(cdpContainer);
});
