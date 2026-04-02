// La Gara dei Numeri - Sound Manager
class GaraSoundManager {
    constructor() {
        this.sounds = {};
        this.musicTrack = null;
        this.muted = false;
        this.musicMuted = false;
        this.volume = 0.5;
        this.musicVolume = 0.3;
        this.ctx = null;
    }
    initContext() {
        if (!this.ctx) {
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        }
    }
    async load(key, url) {
        try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = url;
            this.sounds[key] = audio;
        } catch(e) { console.warn('Sound load failed:', key, e); }
    }
    play(key, opts = {}) {
        if (this.muted) return null;
        const src = this.sounds[key];
        if (!src) return null;
        this.initContext();
        const audio = src.cloneNode();
        audio.volume = opts.volume !== undefined ? opts.volume : this.volume;
        audio.loop = !!opts.loop;
        audio.play().catch(()=>{});
        return audio;
    }
    playMusic(key) {
        this.stopMusic();
        if (this.musicMuted) return;
        const src = this.sounds[key];
        if (!src) return;
        this.initContext();
        this.musicTrack = src.cloneNode();
        this.musicTrack.volume = this.musicVolume;
        this.musicTrack.loop = true;
        this.musicTrack.play().catch(()=>{});
    }
    stopMusic() {
        if (this.musicTrack) {
            this.musicTrack.pause();
            this.musicTrack.currentTime = 0;
            this.musicTrack = null;
        }
    }
    toggleMute() { this.muted = !this.muted; if (this.muted) this.stopMusic(); return this.muted; }
    toggleMusic() { this.musicMuted = !this.musicMuted; if (this.musicMuted) this.stopMusic(); return this.musicMuted; }
    async preloadAll() {
        const base = GARA_CONFIG.SOUNDS.base;
        const loads = [];
        for (const [cat, entries] of Object.entries(GARA_CONFIG.SOUNDS)) {
            if (cat === 'base') continue;
            for (const [id, path] of Object.entries(entries)) {
                loads.push(this.load(`${cat}.${id}`, base + path));
            }
        }
        await Promise.allSettled(loads);
    }
}
