/**
 * AudioSystem — Reino em Conflito Remaster
 * Sistema de áudio completo usando exclusivamente Web Audio API.
 * Sons sintetizados medievais, graves e médios, agradáveis ao ouvido.
 */

export default class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.masterVolume = null;
    this.musicVolume = null;
    this.sfxVolume = null;
    this.isMuted = false;
    this.isMusicPlaying = false;

    // Estado interno da música
    this._musicNodes = [];
    this._musicSchedulerHandle = null;
    this._battleSchedulerHandle = null;
    this._musicType = null; // 'menu' | 'battle' | null

    this._init();
  }

  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------

  _init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Hierarquia de ganho: sfxVolume e musicVolume → masterVolume → destination
      this.masterVolume = this.audioContext.createGain();
      this.masterVolume.gain.value = 1.0;
      this.masterVolume.connect(this.audioContext.destination);

      this.musicVolume = this.audioContext.createGain();
      this.musicVolume.gain.value = 0.1;
      this.musicVolume.connect(this.masterVolume);

      this.sfxVolume = this.audioContext.createGain();
      this.sfxVolume.gain.value = 0.3;
      this.sfxVolume.connect(this.masterVolume);
    } catch (e) {
      console.warn('[AudioSystem] Falha ao inicializar AudioContext:', e);
    }
  }

  /** Garante que o AudioContext está resumido (política de autoplay). */
  _resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  /** Retorna o tempo atual do contexto (atalho seguro). */
  _now() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  // ---------------------------------------------------------------------------
  // Helpers de síntese
  // ---------------------------------------------------------------------------

  /**
   * Cria um oscillator simples já conectado ao sfxVolume e o retorna.
   * @param {string} type  — waveform
   * @param {number} freq  — frequência inicial
   * @returns {{ osc: OscillatorNode, gain: GainNode }}
   */
  _makeOsc(type, freq) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.sfxVolume);
    return { osc, gain };
  }

  /**
   * Aplica envelope ADSR a um GainNode.
   * @param {GainNode} gainNode
   * @param {number} startTime
   * @param {number} peakValue    — pico após ataque
   * @param {number} attack       — duração do ataque (s)
   * @param {number} decay        — duração do decay até sustain (s)
   * @param {number} sustainValue — valor de sustain
   * @param {number} sustainTime  — duração do sustain (s)
   * @param {number} release      — duração do release (s)
   */
  _adsr(gainNode, startTime, peakValue, attack, decay, sustainValue, sustainTime, release) {
    const g = gainNode.gain;
    g.setValueAtTime(0, startTime);
    g.linearRampToValueAtTime(peakValue, startTime + attack);
    g.linearRampToValueAtTime(sustainValue, startTime + attack + decay);
    g.setValueAtTime(sustainValue, startTime + attack + decay + sustainTime);
    g.linearRampToValueAtTime(0, startTime + attack + decay + sustainTime + release);
  }

  /**
   * Cria um buffer de ruído branco.
   * @param {number} duration — duração em segundos
   * @returns {AudioBuffer}
   */
  _makeNoiseBuffer(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Cria um buffer de ruído browniano (mais grave que o branco).
   * @param {number} duration — duração em segundos
   * @returns {AudioBuffer}
   */
  _makeBrownNoiseBuffer(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5; // normalização aproximada
    }
    return buffer;
  }

  /**
   * Reproduz um buffer de ruído com um filtro e envelope de ganho.
   * @param {AudioBuffer} buffer
   * @param {string}  filterType — tipo do BiquadFilter
   * @param {number}  filterFreq — frequência do filtro
   * @param {number}  filterQ
   * @param {number}  startTime
   * @param {number}  peak
   * @param {number}  attack
   * @param {number}  decay
   * @param {number}  sustain
   * @param {number}  sustainTime
   * @param {number}  release
   * @returns {{ source: AudioBufferSourceNode, gain: GainNode }}
   */
  _playNoise(buffer, filterType, filterFreq, filterQ, startTime, peak, attack, decay, sustain, sustainTime, release) {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    const gain = this.audioContext.createGain();
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    this._adsr(gain, startTime, peak, attack, decay, sustain, sustainTime, release);
    source.start(startTime);
    const total = startTime + attack + decay + sustainTime + release + 0.05;
    source.stop(total);
    return { source, gain };
  }

  // ---------------------------------------------------------------------------
  // SFX
  // ---------------------------------------------------------------------------

  /** 1 — Picareta em pedra */
  playMine() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      // Impacto grave — sine 150 Hz, decay rápido
      const { osc: o1, gain: g1 } = this._makeOsc('sine', 150);
      this._adsr(g1, t, 0.7, 0.005, 0.09, 0.0, 0.0, 0.01);
      o1.start(t);
      o1.stop(t + 0.12);

      // Tinido metálico suave — triangle 600 Hz, volume baixo
      const { osc: o2, gain: g2 } = this._makeOsc('triangle', 600);
      this._adsr(g2, t, 0.15, 0.005, 0.14, 0.0, 0.0, 0.01);
      o2.start(t);
      o2.stop(t + 0.17);
    } catch (e) {
      console.warn('[AudioSystem] playMine:', e);
    }
  }

  /** 2 — Trombeta/horn medieval de convocação */
  playRecruit() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      const osc = this.audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.linearRampToValueAtTime(400, t + 0.3);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;

      const gain = this.audioContext.createGain();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxVolume);

      this._adsr(gain, t, 0.5, 0.02, 0.1, 0.35, 0.15, 0.08);
      osc.start(t);
      osc.stop(t + 0.38);
    } catch (e) {
      console.warn('[AudioSystem] playRecruit:', e);
    }
  }

  /** 3 — Construção em pedra */
  playFortify() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      // Ruído browniano grave — lowpass 300 Hz
      const brownBuf = this._makeBrownNoiseBuffer(0.3);
      this._playNoise(brownBuf, 'lowpass', 300, 1, t, 0.5, 0.01, 0.1, 0.1, 0.05, 0.09);

      // Impacto de martelo suave — sine 120 Hz
      const { osc: o2, gain: g2 } = this._makeOsc('sine', 120);
      this._adsr(g2, t + 0.05, 0.6, 0.005, 0.08, 0.0, 0.0, 0.01);
      o2.start(t + 0.05);
      o2.stop(t + 0.15);
    } catch (e) {
      console.warn('[AudioSystem] playFortify:', e);
    }
  }

  /** 4 — Clash de espadas */
  playWar() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      // Ruído branco bandpass — centro 2000 Hz, Q alto
      const noiseBuf = this._makeNoiseBuffer(0.25);
      this._playNoise(noiseBuf, 'bandpass', 2000, 12, t, 0.4, 0.003, 0.14, 0.0, 0.0, 0.01);

      // Impacto grave — sine 80 Hz
      const { osc, gain } = this._makeOsc('sine', 80);
      this._adsr(gain, t, 0.7, 0.003, 0.08, 0.0, 0.0, 0.02);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {
      console.warn('[AudioSystem] playWar:', e);
    }
  }

  /** 5 — Papel/pergaminho (compra de carta) */
  playCardBuy() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      // Ruído highpass suave — volume bem baixo
      const noiseBuf = this._makeNoiseBuffer(0.15);
      this._playNoise(noiseBuf, 'highpass', 3000, 0.5, t, 0.12, 0.005, 0.07, 0.0, 0.0, 0.03);

      // Click suave — sine 400 Hz rapidíssimo
      const { osc, gain } = this._makeOsc('sine', 400);
      this._adsr(gain, t, 0.2, 0.003, 0.015, 0.0, 0.0, 0.005);
      osc.start(t);
      osc.stop(t + 0.025);
    } catch (e) {
      console.warn('[AudioSystem] playCardBuy:', e);
    }
  }

  /** 6 — Selo/stamp (jogar carta) */
  playCardPlay() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      // Impacto médio — sine 300 Hz
      const { osc: o1, gain: g1 } = this._makeOsc('sine', 300);
      this._adsr(g1, t, 0.55, 0.003, 0.07, 0.05, 0.02, 0.05);
      o1.start(t);
      o1.stop(t + 0.15);

      // Ressonância curta — triangle 600 Hz
      const { osc: o2, gain: g2 } = this._makeOsc('triangle', 600);
      this._adsr(g2, t + 0.04, 0.15, 0.005, 0.08, 0.0, 0.0, 0.04);
      o2.start(t + 0.04);
      o2.stop(t + 0.17);
    } catch (e) {
      console.warn('[AudioSystem] playCardPlay:', e);
    }
  }

  /** 7 — Sino medieval suave (fim de turno) */
  playTurnEnd() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      // Fundamental — sine 440 Hz
      const { osc: o1, gain: g1 } = this._makeOsc('sine', 440);
      this._adsr(g1, t, 0.35, 0.005, 0.05, 0.2, 0.2, 0.25);
      o1.start(t);
      o1.stop(t + 0.75);

      // Harmônico — sine 880 Hz, mais suave
      const { osc: o2, gain: g2 } = this._makeOsc('sine', 880);
      this._adsr(g2, t, 0.12, 0.005, 0.04, 0.05, 0.1, 0.3);
      o2.start(t);
      o2.stop(t + 0.75);
    } catch (e) {
      console.warn('[AudioSystem] playTurnEnd:', e);
    }
  }

  /** 8 — Fanfarra de vitória (3 notas ascendentes) */
  playVictory() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();
      const notes = [300, 400, 500];
      const noteDur = 0.15;

      // Reverb simples via delay+feedback
      const convolver = this._makeSimpleReverb(0.6);

      notes.forEach((freq, i) => {
        const start = t + i * noteDur;
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.sfxVolume);
        if (convolver) gain.connect(convolver);

        this._adsr(gain, start, 0.45, 0.01, 0.05, 0.25, 0.06, 0.05);
        osc.start(start);
        osc.stop(start + noteDur + 0.1);
      });
    } catch (e) {
      console.warn('[AudioSystem] playVictory:', e);
    }
  }

  /** 9 — Tambor grave descendente (derrota) */
  playDefeat() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.5);

      // Tremolo (LFO de amplitude)
      const lfo = this.audioContext.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 5;
      const lfoGain = this.audioContext.createGain();
      lfoGain.gain.value = 0.08;
      lfo.connect(lfoGain);

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0;
      lfoGain.connect(gainNode.gain);

      osc.connect(gainNode);
      gainNode.connect(this.sfxVolume);

      this._adsr(gainNode, t, 0.55, 0.02, 0.1, 0.35, 0.2, 0.2);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + 0.6);
      lfo.stop(t + 0.6);
    } catch (e) {
      console.warn('[AudioSystem] playDefeat:', e);
    }
  }

  /** 10 — Impacto orquestral (ultimate) */
  playUltimate() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();
      const impactStart = t + 0.3; // silêncio de 0.3s

      const layers = [80, 160, 240];
      layers.forEach((freq) => {
        const { osc, gain } = this._makeOsc('sine', freq);
        this._adsr(gain, impactStart, 0.6, 0.02, 0.2, 0.3, 0.4, 0.4);
        osc.start(impactStart);
        osc.stop(impactStart + 1.1);
      });
    } catch (e) {
      console.warn('[AudioSystem] playUltimate:', e);
    }
  }

  /** 11 — Click suave de interface */
  playClick() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();
      const { osc, gain } = this._makeOsc('sine', 800);
      this._adsr(gain, t, 0.18, 0.002, 0.015, 0.0, 0.0, 0.005);
      osc.start(t);
      osc.stop(t + 0.025);
    } catch (e) {
      console.warn('[AudioSystem] playClick:', e);
    }
  }

  /** 12 — Hover sutil */
  playHover() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();
      const { osc, gain } = this._makeOsc('sine', 600);
      this._adsr(gain, t, 0.07, 0.002, 0.007, 0.0, 0.0, 0.003);
      osc.start(t);
      osc.stop(t + 0.015);
    } catch (e) {
      console.warn('[AudioSystem] playHover:', e);
    }
  }

  /** 13 — Chime mágico (achievement) */
  playAchievement() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();
      const notes = [400, 500, 600, 800];
      notes.forEach((freq, i) => {
        const start = t + i * 0.06;
        const { osc, gain } = this._makeOsc('sine', freq);
        this._adsr(gain, start, 0.3, 0.005, 0.03, 0.1, 0.01, 0.02);
        osc.start(start);
        osc.stop(start + 0.08);
      });
    } catch (e) {
      console.warn('[AudioSystem] playAchievement:', e);
    }
  }

  /** 14 — Grito de guerra medieval */
  playWarCry() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      const osc = this.audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 150;

      // LFO de vibrato — 6 Hz
      const lfo = this.audioContext.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 6;
      const lfoGain = this.audioContext.createGain();
      lfoGain.gain.value = 6; // ±6 Hz de vibrato
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Filter sweep up: começa em 300, vai a 1200
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.linearRampToValueAtTime(1200, t + 0.4);
      filter.Q.value = 2;

      const gain = this.audioContext.createGain();
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxVolume);

      this._adsr(gain, t, 0.45, 0.03, 0.1, 0.3, 0.2, 0.1);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + 0.5);
      lfo.stop(t + 0.5);
    } catch (e) {
      console.warn('[AudioSystem] playWarCry:', e);
    }
  }

  /** 15 — Mudança de estação (vento + sino) */
  playSeasonChange() {
    if (!this.audioContext) return;
    this._resume();
    try {
      const t = this._now();

      // Vento — noise bandpass 400 Hz
      const noiseBuf = this._makeNoiseBuffer(0.5);
      this._playNoise(noiseBuf, 'bandpass', 400, 3, t, 0.2, 0.05, 0.15, 0.1, 0.1, 0.15);

      // Sino — sine 523 Hz (C5) com decay longo
      const { osc, gain } = this._makeOsc('sine', 523);
      this._adsr(gain, t + 0.1, 0.3, 0.005, 0.08, 0.12, 0.2, 0.35);
      osc.start(t + 0.1);
      osc.stop(t + 0.8);
    } catch (e) {
      console.warn('[AudioSystem] playSeasonChange:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Música de fundo
  // ---------------------------------------------------------------------------

  /**
   * Escala D minor natural:
   * D2=73.4, E2=82.4, F2=87.3, G2=98.0, A2=110.0, Bb2=116.5, C3=130.8
   * Oitava acima para melodia (×2).
   */
  get _dMinorScale() {
    // [D3, E3, F3, G3, A3, Bb3, C4]
    return [146.8, 164.8, 174.6, 196.0, 220.0, 233.1, 261.6];
  }

  /** 16 — Música ambiente do menu */
  startMenuMusic() {
    if (!this.audioContext) return;
    this._resume();
    if (this.isMusicPlaying) this.stopMusic();

    try {
      this._musicType = 'menu';
      this.isMusicPlaying = true;

      const scale = this._dMinorScale;
      // Melodia de 8 notas (índices da escala)
      const melody = [0, 2, 3, 5, 4, 2, 0, 1];
      const noteDur = 0.8; // 1 nota a cada 0.8s
      let noteIndex = 0;

      // Drone de fundo — D2 e A2 levemente desafinados
      const droneFreqs = [73.4, 73.6, 110.0, 110.15]; // dois pares levemente desafinados
      droneFreqs.forEach((freq) => {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(this.musicVolume);
        osc.start();
        this._musicNodes.push(osc, gain);
      });

      // Scheduler de melodia usando setInterval
      const scheduleMelody = () => {
        if (!this.isMusicPlaying || this._musicType !== 'menu') return;
        const t = this._now();

        const freq = scale[melody[noteIndex % melody.length]];
        noteIndex++;

        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gain = this.audioContext.createGain();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicVolume);

        // Envelope suave
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.05);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.2);
        gain.gain.linearRampToValueAtTime(0, t + noteDur - 0.05);

        osc.start(t);
        osc.stop(t + noteDur);
      };

      scheduleMelody();
      this._musicSchedulerHandle = setInterval(scheduleMelody, noteDur * 1000);
    } catch (e) {
      console.warn('[AudioSystem] startMenuMusic:', e);
    }
  }

  /** 17 — Música de batalha */
  startBattleMusic() {
    if (!this.audioContext) return;
    this._resume();
    if (this.isMusicPlaying) this.stopMusic();

    try {
      this._musicType = 'battle';
      this.isMusicPlaying = true;

      const scale = this._dMinorScale;
      // Melodia mais intensa e ritmada
      const melody = [0, 3, 4, 6, 5, 3, 4, 2];
      const noteDur = 0.45;
      let noteIndex = 0;

      // Drone mais intenso — com sawtooth suave
      const droneFreqs = [73.4, 110.0];
      droneFreqs.forEach((freq) => {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.06;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicVolume);
        osc.start();
        this._musicNodes.push(osc, filter, gain);
      });

      // Melodia de batalha
      const scheduleMelody = () => {
        if (!this.isMusicPlaying || this._musicType !== 'battle') return;
        const t = this._now();

        const freq = scale[melody[noteIndex % melody.length]];
        noteIndex++;

        const osc = this.audioContext.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;

        const gain = this.audioContext.createGain();
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicVolume);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + noteDur - 0.03);

        osc.start(t);
        osc.stop(t + noteDur);
      };

      scheduleMelody();
      this._musicSchedulerHandle = setInterval(scheduleMelody, noteDur * 1000);

      // Kick drum sintético a cada 0.5s
      const scheduleKick = () => {
        if (!this.isMusicPlaying || this._musicType !== 'battle') return;
        const t = this._now();

        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.08);

        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.musicVolume);

        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.start(t);
        osc.stop(t + 0.13);
      };

      scheduleKick();
      this._battleSchedulerHandle = setInterval(scheduleKick, 500);
    } catch (e) {
      console.warn('[AudioSystem] startBattleMusic:', e);
    }
  }

  /** 18 — Fade out e parar a música */
  stopMusic() {
    if (!this.audioContext) return;
    try {
      // Limpa intervalos
      if (this._musicSchedulerHandle !== null) {
        clearInterval(this._musicSchedulerHandle);
        this._musicSchedulerHandle = null;
      }
      if (this._battleSchedulerHandle !== null) {
        clearInterval(this._battleSchedulerHandle);
        this._battleSchedulerHandle = null;
      }

      // Fade out do musicVolume em 1s
      const gain = this.musicVolume.gain;
      const currentValue = gain.value;
      const t = this._now();
      gain.setValueAtTime(currentValue, t);
      gain.linearRampToValueAtTime(0, t + 1.0);

      // Para os oscillators do drone após o fade
      const nodesToStop = [...this._musicNodes];
      this._musicNodes = [];
      setTimeout(() => {
        nodesToStop.forEach((node) => {
          try {
            if (typeof node.stop === 'function') node.stop();
            node.disconnect();
          } catch (_) {}
        });
        // Restaura o volume da música para o valor original
        if (!this.isMuted) {
          this.musicVolume.gain.setValueAtTime(0.1, this._now());
        }
      }, 1100);

      this.isMusicPlaying = false;
      this._musicType = null;
    } catch (e) {
      console.warn('[AudioSystem] stopMusic:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Controles de volume
  // ---------------------------------------------------------------------------

  /** 19 — Volume geral (0–1) */
  setMasterVolume(value) {
    if (!this.audioContext) return;
    const v = Math.max(0, Math.min(1, value));
    this.masterVolume.gain.setValueAtTime(v, this._now());
  }

  /** 20 — Volume da música (0–1) */
  setMusicVolume(value) {
    if (!this.audioContext) return;
    const v = Math.max(0, Math.min(1, value));
    this.musicVolume.gain.setValueAtTime(v, this._now());
  }

  /** 21 — Volume dos SFX (0–1) */
  setSfxVolume(value) {
    if (!this.audioContext) return;
    const v = Math.max(0, Math.min(1, value));
    this.sfxVolume.gain.setValueAtTime(v, this._now());
  }

  /** 22 — Alterna mute geral */
  toggleMute() {
    if (!this.audioContext) return;
    this.isMuted = !this.isMuted;
    this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 1, this._now());
  }

  // ---------------------------------------------------------------------------
  // Utilitários internos
  // ---------------------------------------------------------------------------

  /**
   * Cria um reverb sintético simples usando ConvolverNode com impulso gerado.
   * Retorna o nó de entrada do reverb já conectado ao sfxVolume,
   * ou null em caso de erro.
   * @param {number} duration — duração do impulso em segundos
   * @returns {ConvolverNode|null}
   */
  _makeSimpleReverb(duration) {
    try {
      const sampleRate = this.audioContext.sampleRate;
      const length = Math.ceil(sampleRate * duration);
      const impulse = this.audioContext.createBuffer(2, length, sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
      }

      const convolver = this.audioContext.createConvolver();
      convolver.buffer = impulse;

      const wetGain = this.audioContext.createGain();
      wetGain.gain.value = 0.25;
      convolver.connect(wetGain);
      wetGain.connect(this.sfxVolume);

      return convolver;
    } catch (e) {
      return null;
    }
  }
}
