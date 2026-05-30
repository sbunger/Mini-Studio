import React, { useState, useRef, useEffect } from 'react'
import * as Tone from "tone";
import { PlaySolid, PauseSolid, Xmark, Plus, SoundHighSolid, SoundLowSolid, SoundMinSolid, SoundOffSolid } from 'iconoir-react';
import "./App.css";

const STEPS = 8

const INSTRUMENT_OPTIONS = [
  { value: 'kick', label: 'Kick' },
  { value: 'snare', label: 'Snare' },
  { value: 'hat', label: 'Hihat' },
  { value: 'tom', label: 'Tom' },
  { value: 'openhat', label: 'Open Hat' },
];

type InstrumentType = 'kick' | 'snare' | 'hat' | 'tom' | 'openhat';

function createSynth(type: InstrumentType): Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth {
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


function triggerSynth(synth: any, type: InstrumentType, time: number) {
  switch (type) {
    case 'kick': synth.triggerAttackRelease("C2", "8n", time); break;
    case 'tom': synth.triggerAttackRelease('G2', '8n', time); break;
    case 'snare': synth.triggerAttackRelease("8n", time); break;
    case 'hat': synth.triggerAttackRelease("16n", time); break;
    case 'openhat': synth.triggerAttackRelease("8n", time); break;
    default: synth.triggerAttackRelease('C2', '8n', time);
  }
}

function sliderToDb(val: number) {
  return (val / 100) * 30 - 30;
}

const emptyRow = () => Array(STEPS).fill(0);

const initialPattern = [emptyRow(), emptyRow(), emptyRow()];
const initalInstruments: InstrumentType[] = ['kick', 'snare', 'hat'];


function useDrag(onChange: (val: number) => void) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    const calc = (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const { left, width } = track.getBoundingClientRect();
      const val = Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
      onChange(Math.round(val));
    };

    calc(e.clientX);

    const move = (e: MouseEvent) => calc(e.clientX);

    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  return { trackRef, handleMouseDown };
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { trackRef, handleMouseDown } = useDrag(onChange);
  const iconSize = 20;

  return (
    <div className='volume-control' ref={trackRef} onMouseDown={handleMouseDown}>
      <div className='volume-indicator' style={{ width: `${value}%` }} />
      {value > 60 ? <SoundHighSolid width={iconSize}/> : value > 25 ? <SoundLowSolid width={iconSize}/> : value > 0 ? <SoundMinSolid width={iconSize}/> : <SoundOffSolid width={iconSize}/>}
    </div>
  )
}


export default function App() {
  const [pattern, setPattern] = useState(initialPattern);
  const [instruments, setInstruments] = useState<InstrumentType[]>(initalInstruments);
  const [step, setStep] = useState(0);

  const [volumes, setVolumes] = useState<number[]>([80, 40, 60])
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);

  const stepRef = useRef(0);
  const patternRef = useRef(pattern);
  const startedRef = useRef(false);
  const instrumentsRef = useRef(instruments);
  const synthsRef = useRef<any[]>([]);

  useEffect(() => { patternRef.current = pattern; }, [pattern]);
  useEffect(() => { instrumentsRef.current = instruments; }, [instruments]);

  useEffect(() => {
    synthsRef.current = initalInstruments.map((inst) => createSynth(inst));

    synthsRef.current.forEach((s, i) => { s.volume.value = sliderToDb(volumes[i]); });

    Tone.Transport.scheduleRepeat((time) => {
      const currentStep = stepRef.current;
      const currentPattern = patternRef.current;
      const currentInstruments = instrumentsRef.current;

      currentPattern.forEach((row, rowIndex) => {
        if (row[currentStep]) {
          const synth = synthsRef.current[rowIndex];
          const type = currentInstruments[rowIndex];
          if (synth) triggerSynth(synth, type, time);
        }
      });

      requestAnimationFrame(() => { setStep(currentStep); });
      stepRef.current = (currentStep + 1) % STEPS;
    }, "8n");

    return () => {
      Tone.Transport.cancel();
      synthsRef.current.forEach((s) => s?.dispose());
    };
  }, []);

  const toggleStep = (row: number, col: number) => {
    setPattern((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[row][col] = copy[row][col] ? 0 : 1;
      return copy;
    });
  };

  const changeInstrument = (rowIndex: number, value: InstrumentType) => {
    const old = synthsRef.current[rowIndex]
    if (old) old.dispose();
    synthsRef.current[rowIndex] = createSynth(value);

    setInstruments((prev) => {
      const copy = [...prev];
      copy[rowIndex] = value;
      return copy;
    });
  };

  const changeVolume = (rowIndex: number, value: number) => {
    synthsRef.current[rowIndex].volume.value = sliderToDb(value);
    setVolumes((prev) => { const copy = [...prev]; copy[rowIndex] = value; return copy; });
  }

  const addTrack = () => {
    synthsRef.current = [...synthsRef.current, createSynth('kick')];
    setPattern((prev) => [...prev, emptyRow()]);
    setInstruments((prev) => [...prev, 'kick']);
    setVolumes((prev) => [...prev, 80]);
  };

  const removeTrack = (rowIndex: number) => {
    synthsRef.current[rowIndex]?.dispose();
    synthsRef.current = synthsRef.current.filter((_, i) => i !== rowIndex);
    setPattern((prev) => prev.filter((_, i) => i !== rowIndex));
    setInstruments((prev) => prev.filter((_, i) => i !== rowIndex));
    setVolumes((prev) => prev.filter((_, i) => i !== rowIndex));
  }

  const start = async () => {
    await Tone.start();
    if (!startedRef.current) {
      Tone.Transport.bpm.value = 120;
      startedRef.current = true;
    }
    Tone.Transport.start();
    setIsPlaying(true);
  };

  const stop = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  }


  return (
    <div className='app'>
      <div className="grid">
        {pattern.map((row, rowIndex) => {
          return (
            <div key={rowIndex} className="row">
              <VolumeSlider value={volumes[rowIndex]} onChange={(v) => changeVolume(rowIndex, v)} />
              <select
                className="instrument-select"
                value={instruments[rowIndex]}
                onChange={(e) => changeInstrument(rowIndex, e.target.value as InstrumentType)}
              >
                {INSTRUMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  onClick={() => toggleStep(rowIndex, colIndex)}
                  className={`cell ${cell ? 'active' : ''} ${colIndex === step ? 'playing' : ''}`}
                />
              ))}
              <button className='remove-track' onClick={() => removeTrack(rowIndex)}>
                <Xmark color="currentColor" width={24} />
              </button>

            </div>
          );
        })}

        <div className='end-container'>
          <div className='bpm-label'>
            <p>BPM:</p>
            <input
              type="number"
              value={bpm}
              onChange={(e) => {
                setBpm(+e.target.value);
              }}
              onBlur={(e) => {
                const val = Math.min(240, Math.max(60, +e.target.value));
                setBpm(val);
                Tone.Transport.bpm.value = val;
              }}
            />
          </div>
          
          <button className="new-track" onClick={() => addTrack()}>
            <Plus color="currentColor" width={24} />
          </button>

          <button className='play' onClick={isPlaying ? stop : start}>
            {isPlaying ? <PauseSolid color="currentColor" width={24} /> : <PlaySolid color="currentColor" width={24} />}
          </button>
        </div>
      </div>
    </div>
  )
}