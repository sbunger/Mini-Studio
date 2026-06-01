import * as Tone from 'tone';
import { InstrumentType, Effects } from './types';

export function createSynth(type: InstrumentType): Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth {
    switch (type) {
        case 'kick':
            return new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 6,
                envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
            }).toDestination();

        case 'snare':
            return new Tone.NoiseSynth({
                noise: { type: 'white' },
                    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
            }).toDestination();

        case 'hat':
            return new Tone.MetalSynth({
                envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
                harmonicity: 5.1,
                modulationIndex: 32,
                resonance: 4000,
                octaves: 1.5,
            }).toDestination();

        case 'tom':
            return new Tone.MembraneSynth({
                pitchDecay: 0.08,
                octaves: 4,
                envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
            }).toDestination();

        case 'openhat':
            return new Tone.MetalSynth({
                envelope: { attack: 0.001, decay: 0.8, release: 0.2 },
                harmonicity: 5.1,
                modulationIndex: 16,
                resonance: 3500,
                octaves: 0.5,
            }).toDestination();

        default:
            return new Tone.MembraneSynth().toDestination();
    }
}

export function triggerSynth(synth: any, type: InstrumentType, time: number) {
    switch (type) {
        case 'kick': synth.triggerAttackRelease("C2", "8n", time); break;
        case 'tom': synth.triggerAttackRelease('G2', '8n', time); break;
        case 'snare': synth.triggerAttackRelease("8n", time); break;
        case 'hat': synth.triggerAttackRelease("16n", time); break;
        case 'openhat': synth.triggerAttackRelease("8n", time); break;
        default: synth.triggerAttackRelease('C2', '8n', time);
    }
}

export function addEffects(fx: Effects) {
    const reverb = new Tone.Reverb({ decay: 2, wet: fx.reverb / 100});
    const distortion = new Tone.Distortion({ distortion: fx.distortion / 100, wet: fx.distortion > 0 ? 1 : 0});
    const delay = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.3, wet: fx.delay / 100});
    reverb.toDestination();
    distortion.connect(reverb);
    delay.connect(distortion);
    return { reverb, distortion, delay };
}

export function sliderToDb(val: number) {
  return (val / 100) * 30 - 30;
}