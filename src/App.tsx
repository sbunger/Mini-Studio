import React, { useState, useRef, useEffect } from 'react'
import * as Tone from "tone";
import { PlaySolid, PauseSolid, Xmark, Plus, Menu, IosSettings } from 'iconoir-react';
import "./App.css";

import { createSynth, triggerSynth, addEffects, sliderToDb } from './audio';
import { STEPS, initialEffects, emptyRow, InstrumentType, Effects } from './types';
import { Tooltip } from './components/Tooltip';
import { VolumeSlider } from './components/VolumeSlider';
import { Dial } from './components/Dial';
import { EffectsPanel } from './components/EffectsPanel';
import { InstrumentSelect } from './components/InstrumentSelect';


const initialPattern = [emptyRow(), emptyRow(), emptyRow()];
const initalInstruments: InstrumentType[] = ['kick', 'snare', 'hat'];


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

    const synth = createSynth(value);
    synth.disconnect();
    synth.connect(fxChainsRef.current[rowIndex].delay);
    synth.volume.value = sliderToDb(volumes[rowIndex]);
    synthsRef.current[rowIndex] = synth;

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
              <VolumeSlider value={volumes[rowIndex]} onChange={(v) => changeVolume(rowIndex, v)} />
              
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