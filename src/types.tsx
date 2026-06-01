export const STEPS = 8

export const INSTRUMENT_OPTIONS = [
  { value: 'kick', label: 'Kick' },
  { value: 'snare', label: 'Snare' },
  { value: 'hat', label: 'Hihat' },
  { value: 'tom', label: 'Tom' },
  { value: 'openhat', label: 'Open Hat' },
];

export type InstrumentType = 'kick' | 'snare' | 'hat' | 'tom' | 'openhat';

export type Effects = {
  reverb: number;
  distortion: number;
  delay: number;
};

export const initialEffects: Effects = { reverb: 0, distortion: 0, delay: 0 };
export const emptyRow = () => Array(STEPS).fill(0);