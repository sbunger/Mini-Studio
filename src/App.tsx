import React, { useState, useRef, useEffect } from 'react'
import * as Tone from "tone";
import { PlaySolid, PauseSolid, Xmark, Plus, SoundHighSolid, SoundLowSolid, SoundMinSolid, SoundOffSolid, NavArrowLeft, NavArrowRight, Menu, IosSettings } from 'iconoir-react';
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

type Effects = {
  reverb: number;
  distortion: number;
  delay: number;
};




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


function addEffects(fx: Effects) {
  const reverb = new Tone.Reverb({ decay: 2, wet: fx.reverb / 100});
  const distortion = new Tone.Distortion({ distortion: fx.distortion / 100, wet: fx.distortion > 0 ? 1 : 0});
  const delay = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.3, wet: fx.delay / 100});
  reverb.toDestination();
  distortion.connect(reverb);
  delay.connect(distortion);
  return { reverb, distortion, delay };
}




function sliderToDb(val: number) {
  return (val / 100) * 30 - 30;
}

const emptyRow = () => Array(STEPS).fill(0);

const initialPattern = [emptyRow(), emptyRow(), emptyRow()];
const initalInstruments: InstrumentType[] = ['kick', 'snare', 'hat'];
const initialEffects: Effects = { reverb: 0, distortion: 0, delay: 0 };


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

function Dial({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;

    const move = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const delta = (startY.current - e.clientY) * 1.2;
      onChange(Math.min(100, Math.max(0, Math.round(startVal.current + delta))));
    };

    const up = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const rotation = -135 + (value / 100) * 270;

  return (
    <div className='dial-wrap'>
      <Tooltip text={`${label}: ${value}`} direction='top'>
        <div className='dial' onMouseDown={handleMouseDown}>
          <div className='dial-indicator' style={{ transform: `rotate(${rotation}deg)` }}/>
        </div>
      </Tooltip>
    </div>
  )
}

function EffectsPanel({ fx, onChange, onClose, isClosing }: { fx: Effects; onChange: (k: keyof Effects, v: number) => void; onClose: () => void, isClosing: boolean }) {
  return (
    <div className={`effects-panel ${isClosing ? 'effects-panel-closing' : ''}`}>
      <div className="effects-dials">
        <Dial value={fx.reverb} onChange={v => onChange('reverb', v)} label="Reverb" />
        <Dial value={fx.distortion} onChange={v => onChange('distortion', v)} label="Distort" />
        <Dial value={fx.delay} onChange={v => onChange('delay', v)} label="Delay" />
      </div>
    </div>
  );
}

function InstrumentSelect({ value, onChange }: { value: InstrumentType; onChange: (v: InstrumentType) => void}) {
  const dirRef = useRef<'left' | 'right'>('right');
  const currentIndex = INSTRUMENT_OPTIONS.findIndex(o => o.value === value);
  
  const prev = () => {
    dirRef.current = 'left';
    const i = (currentIndex - 1 + INSTRUMENT_OPTIONS.length) % INSTRUMENT_OPTIONS.length;
    onChange(INSTRUMENT_OPTIONS[i].value as InstrumentType);
  };

  const next = () => {
    dirRef.current = 'right';
    const i = (currentIndex + 1) % INSTRUMENT_OPTIONS.length;
    onChange(INSTRUMENT_OPTIONS[i].value as InstrumentType);
  }

  return (
    <div className='instrument-select'>
      <button onClick={prev}><NavArrowLeft/></button>
        <span key={value} data-dir={dirRef.current}>{INSTRUMENT_OPTIONS[currentIndex].label}</span>
      <button onClick={next}><NavArrowRight/></button>
    </div>
  )
}

function Tooltip({ text, children, direction = 'top' }: { text: string; children: React.ReactNode; direction?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <div className='tooltip-wrap'>
      {children}
      <span className={`tooltip tooltip-${direction}`}>{text}</span>
    </div>
  );
}


export default function App() {
  const [pattern, setPattern] = useState(initialPattern);
  const [instruments, setInstruments] = useState<InstrumentType[]>(initalInstruments);
  const [step, setStep] = useState(0);

  const [effects, setEffects] = useState<Effects[]>([initialEffects, initialEffects, initialEffects]);
  const [openEffects, setOpenEffects] = useState<number | null>(null);
  const [closingEffects, setClosingEffects] = useState<number | null>(null);

  const [volumes, setVolumes] = useState<number[]>([80, 40, 60])
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);

  const stepRef = useRef(0);
  const patternRef = useRef(pattern);
  const startedRef = useRef(false);
  const instrumentsRef = useRef(instruments);
  const synthsRef = useRef<any[]>([]);
  const effectsRef = useRef<(Tone.Reverb | null)[][]>([]);
  const openEffectsRef = useRef(openEffects);
  const fxChainsRef = useRef<{ reverb: Tone.Reverb; distortion: Tone.Distortion; delay: Tone.FeedbackDelay }[]>([]);

  useEffect(() => { patternRef.current = pattern; }, [pattern]);
  useEffect(() => { instrumentsRef.current = instruments; }, [instruments]);
  useEffect(() => { openEffectsRef.current = openEffects; }, [openEffects]);

  useEffect(() => {
    synthsRef.current = initalInstruments.map((inst, i) => {
      const fx = addEffects(effects[i]);
      fxChainsRef.current[i] = fx;
      const synth = createSynth(inst);
      synth.disconnect();
      synth.connect(fx.delay);
      synth.volume.value = sliderToDb(volumes[i]);
      return synth;
    });

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

  const changeEffect = (rowIndex: number, key: keyof Effects, value: number) => {
    const fx = fxChainsRef.current[rowIndex];
    if (!fx) return;
    if (key === 'reverb') fx.reverb.wet.value = value / 100;
    if (key === 'distortion') { fx.distortion.wet.value = value > 0 ? 1 : 0; fx.distortion.distortion = value / 100; }
    if (key === 'delay') fx.delay.wet.value = value / 100;
    setEffects(prev => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], [key]: value };
      return copy;
    })
  };

  const closeEffects = () => {
    const current = openEffectsRef.current;
      if (current === null) return;
      setClosingEffects(current);
      setTimeout(() => {
        setOpenEffects(null);
        setClosingEffects(null);
      }, 150);
  };

  useEffect(() => {
    if (openEffects === null) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.effects-panel') && !target.closest('.track-settings')) {
        closeEffects();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openEffects]);

  const changeVolume = (rowIndex: number, value: number) => {
    synthsRef.current[rowIndex].volume.value = sliderToDb(value);
    setVolumes((prev) => { const copy = [...prev]; copy[rowIndex] = value; return copy; });
  };

  const addTrack = () => {
    const fx = addEffects(initialEffects);
    fxChainsRef.current = [...fxChainsRef.current, fx];
    const synth = createSynth('kick')
    synth.disconnect();
    synth.connect(fx.delay);
    synth.volume.value = sliderToDb(80);

    synthsRef.current = [...synthsRef.current, synth];
    setPattern((prev) => [...prev, emptyRow()]);
    setInstruments((prev) => [...prev, 'kick']);
    setVolumes((prev) => [...prev, 80]);
    setEffects((prev) => [...prev, initialEffects]);
  };

  const removeTrack = (rowIndex: number) => {
    const fx = fxChainsRef.current[rowIndex];
    if (fx) { fx.reverb.dispose(); fx.distortion.dispose(); fx.delay.dispose(); }
    fxChainsRef.current = fxChainsRef.current.filter((_, i) => i !== rowIndex);
    synthsRef.current[rowIndex]?.dispose();
    synthsRef.current = synthsRef.current.filter((_, i) => i !== rowIndex);
    setPattern((prev) => prev.filter((_, i) => i !== rowIndex));
    setInstruments((prev) => prev.filter((_, i) => i !== rowIndex));
    setVolumes((prev) => prev.filter((_, i) => i !== rowIndex));
    setEffects((prev) => prev.filter((_, i) => i !== rowIndex));
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? stop() : start();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying])

  return (
    <div className='app'>
      <div className="grid">
        {pattern.map((row, rowIndex) => {
          return (
            <div key={rowIndex} className="row">
              <Tooltip text={volumes[rowIndex] === 0 ? 'Muted' : `${volumes[rowIndex]}`} direction='left'>
              <VolumeSlider value={volumes[rowIndex]} onChange={(v) => changeVolume(rowIndex, v)} />
              </Tooltip>
              
              <InstrumentSelect
                value={instruments[rowIndex]}
                onChange={(v) => changeInstrument(rowIndex, v)}
              />

              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  onClick={() => toggleStep(rowIndex, colIndex)}
                  className={`cell ${cell ? 'active' : ''} ${colIndex === step ? 'playing' : ''}`}
                />
              ))}

              <div style={{ position: 'relative' }}>
                <Tooltip text='Effects' direction='left'>
                  <button className='track-settings' onClick={() => {
                    if (openEffects === rowIndex) {
                      closeEffects();
                    } else {
                      setOpenEffects(rowIndex);
                    }
                  }}>
                    <Menu color="currentColor" width={24} />
                  </button>
                </Tooltip>
                {(openEffects === rowIndex || closingEffects === rowIndex) &&  (
                  <EffectsPanel
                    fx={effects[rowIndex]}
                    onChange={(k, v) => changeEffect(rowIndex, k, v)}
                    onClose={() => closeEffects()}
                    isClosing={closingEffects === rowIndex}
                  />
                )}
              </div>

              <Tooltip text='Remove Track' direction='right'>
                <button className='remove-track' onClick={() => removeTrack(rowIndex)}>
                  <Xmark color="currentColor" width={24} />
                </button>
              </Tooltip>
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
          
          <Tooltip text='New Track' direction='bottom'>
            <button className="new-track" onClick={() => addTrack()}>
              <Plus color="currentColor" width={24} />
            </button>
          </Tooltip>

          <Tooltip text='Options' direction='bottom'>
            <button className='settings'>
              <IosSettings color="currentColor" width={24}/>
            </button>
          </Tooltip>

          <button className='play' onClick={isPlaying ? stop : start}>
            {isPlaying ? <PauseSolid color="currentColor" width={24} /> : <PlaySolid color="currentColor" width={24} />}
          </button>
        </div>
      </div>
    </div>
  )
}