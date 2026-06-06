import React, { useState, useRef, useEffect } from 'react'
import * as Tone from "tone";
import { MusicDoubleNote, PlaySolid, PauseSolid, Xmark, Plus, DownloadSquareSolid, Sparks, SparksSolid } from 'iconoir-react';
import "./App.css";

import { createSynth, triggerSynth, addEffects, sliderToDb } from './audio';
import { STEP_OPTIONS, initialEffects, emptyRow, InstrumentType, Effects, DEFAULT_STEPS, SaveState } from './types';
import { Tooltip } from './components/Tooltip';
import { VolumeSlider } from './components/VolumeSlider';
import { EffectsPanel } from './components/EffectsPanel';
import { InstrumentSelect } from './components/InstrumentSelect';
import { SettingsPanel } from './components/SettingsPanel';
import { BpmDrag } from './components/BpmDrag';
import { ActivityMeter } from './components/ActivityMeter';


const initialPattern = [emptyRow(), emptyRow(), emptyRow()];
const initalInstruments: InstrumentType[] = ['kick', 'snare', 'hat'];


export default function App() {
  const [pattern, setPattern] = useState(initialPattern);
  const [instruments, setInstruments] = useState<InstrumentType[]>(initalInstruments);
  const [steps, setSteps] = useState<number[]>([8, 8, 8]);
  const [step, setStep] = useState(0);

  const [triggered, setTriggered] = useState<boolean[]>([false, false, false]);

  const [effects, setEffects] = useState<Effects[]>([initialEffects, initialEffects, initialEffects]);

  const [openEffects, setOpenEffects] = useState<number | null>(null);
  const [closingEffects, setClosingEffects] = useState<number | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [closingSettings, setClosingSettings] = useState(false);

  const [volumes, setVolumes] = useState<number[]>([80, 40, 60])
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);

  const stepsRef = useRef(steps);
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
  useEffect(() => { stepsRef.current = steps; }, [steps]);

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
    const currentSteps = stepsRef.current;
    const currentPattern = patternRef.current;
    const currentInstruments = instrumentsRef.current;

    currentPattern.forEach((row, rowIndex) => {
      const trackSteps = currentSteps[rowIndex];
      const ratio = 16 / trackSteps;
      if (stepRef.current % ratio !== 0) return;
      const rowStep = Math.floor(stepRef.current / (16 / trackSteps)) % trackSteps;
      if (row[rowStep]) {
        const synth = synthsRef.current[rowIndex];
        const type = currentInstruments[rowIndex];
        if (synth) {
          triggerSynth(synth, type, time, steps[rowIndex]);
          requestAnimationFrame(() => {
            setTriggered(prev => {
              const copy = [...prev];
              copy[rowIndex] = true;
              return copy;
            });

            setTimeout(() => {
              setTriggered(prev => {
                const copy = [...prev];
                copy[rowIndex] = false;
                return copy;
              });
            }, 100)
          })
        };
      }
    });

    requestAnimationFrame(() => setStep(stepRef.current));
    stepRef.current = (stepRef.current + 1) % 16;
  }, "16n");

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

  const changeSteps = (rowIndex: number, newSteps: number) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[rowIndex] = newSteps;
      return copy;
    });
    setPattern((prev) => {
      const copy = [...prev];
      const row = copy[rowIndex];
      if (newSteps > row.length) {
        copy[rowIndex] = [...row, ...Array(newSteps - row.length).fill(0)];
      } else {
        copy[rowIndex] = row.slice(0, newSteps);
      }
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

  const closeSettings = () => {
    setClosingSettings(true);
    setTimeout(() => {
      setSettingsOpen(false);
      setClosingSettings(false);
    }, 150);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
    
      if (openEffects !== null && !target.closest('.effects-panel') && !target.closest('.track-settings')) {
        closeEffects();
      }
      if (settingsOpen && !target.closest('.settings-panel') && !target.closest('.settings')) {
        closeSettings();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openEffects, settingsOpen]);

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

    setSteps((prev) => [...prev, DEFAULT_STEPS]);
    setPattern((prev) => [...prev, emptyRow()]);
    setInstruments((prev) => [...prev, 'kick']);
    setVolumes((prev) => [...prev, 80]);
    setEffects((prev) => [...prev, initialEffects]);
    setTriggered((prev) => [...prev, false]);
  };

  const removeTrack = (rowIndex: number) => {
    const fx = fxChainsRef.current[rowIndex];

    if (fx) { fx.reverb.dispose(); fx.distortion.dispose(); fx.delay.dispose(); }
    fxChainsRef.current = fxChainsRef.current.filter((_, i) => i !== rowIndex);
    synthsRef.current[rowIndex]?.dispose();
    synthsRef.current = synthsRef.current.filter((_, i) => i !== rowIndex);

    setSteps((prev) => prev.filter((_, i) => i !== rowIndex));
    setPattern((prev) => prev.filter((_, i) => i !== rowIndex));
    setInstruments((prev) => prev.filter((_, i) => i !== rowIndex));
    setVolumes((prev) => prev.filter((_, i) => i !== rowIndex));
    setEffects((prev) => prev.filter((_, i) => i !== rowIndex));
    setTriggered((prev) => prev.filter((_, i) => i !== rowIndex));
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
  };

  const save = () => {
    const state: SaveState = { pattern, instruments, steps, volumes, effects, bpm};
    const json = JSON.stringify(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pattern.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const state: SaveState = JSON.parse(ev.target?.result as string);

        synthsRef.current.forEach(s => s?.dispose());
        fxChainsRef.current.forEach(fx => {
          if (fx) { fx.reverb.dispose(); fx.distortion.dispose(); fx.delay.dispose(); }
        });

        fxChainsRef.current = state.effects.map((fx) => {
          const chain = addEffects(fx);
          return chain;
        });

        synthsRef.current = state.instruments.map((inst, i) => {
          const synth = createSynth(inst);
          synth.disconnect();
          synth.connect(fxChainsRef.current[i].delay);
          synth.volume.value = sliderToDb(state.volumes[i]);
          return synth;
        });

        setPattern(state.pattern);
        setInstruments(state.instruments);
        setSteps(state.steps);
        setVolumes(state.volumes);
        setEffects(state.effects);
        setBpm(state.bpm);

        Tone.Transport.bpm.value = state.bpm;
      } catch {
        console.error('Invalid Save File');
      }
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? stop() : start();
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepRef.current = (stepRef.current + 2) % 16;
        setStep(stepRef.current);
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepRef.current = (stepRef.current - 2 + 16) % 16;
        setStep(stepRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying])

  return (
  <>
    <div className='app'>
      <div className="grid">
        {pattern.map((row, rowIndex) => {
          return (
            <div key={rowIndex} className="row">
              <VolumeSlider value={volumes[rowIndex]} onChange={(v) => changeVolume(rowIndex, v)} />
              <ActivityMeter triggered={triggered[rowIndex]}/>

              <InstrumentSelect
                value={instruments[rowIndex]}
                onChange={(v) => changeInstrument(rowIndex, v)}
              />

              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  onClick={() => toggleStep(rowIndex, colIndex)}
                  className={`cell ${cell ? 'active' : ''} ${colIndex === Math.floor(step / (16 / steps[rowIndex])) % steps[rowIndex] ? 'playing' : ''}`}
                  style={{ width: `${(520 - (steps[rowIndex] - 1) * 8) / steps[rowIndex]}px` }}
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
                    {(effects[rowIndex].delay != 0 || effects[rowIndex].reverb != 0 || effects[rowIndex].distortion != 0)
                      ? <SparksSolid color="currentColor" width={24} />
                      : <Sparks color="currentColor" width={24} />
                    }
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

              <Tooltip text='Beat Division'>
              <button className="steps-select" onClick={() => {
                const currentIndex = STEP_OPTIONS.indexOf(steps[rowIndex]);
                const nextIndex = (currentIndex + 1) % STEP_OPTIONS.length;
                changeSteps(rowIndex, STEP_OPTIONS[nextIndex]);
              }}>
                {steps[rowIndex]}
              </button>
              </Tooltip>

              <Tooltip text='Remove Track' direction='right'>
                <button className='remove-track' onClick={() => removeTrack(rowIndex)}>
                  <Xmark color="currentColor" width={24} />
                </button>
              </Tooltip>
            </div>
          );
        })}

        <div className='end-container'>
          <Tooltip text='BPM' direction='bottom'>
            <BpmDrag value={bpm} onChange={(v) => {
              setBpm(v);
              Tone.Transport.bpm.value = v;
            }} />
          </Tooltip>
          
          <Tooltip text='New Track' direction='bottom'>
            <button className="new-track" onClick={() => addTrack()}>
              <Plus color="currentColor" width={24} />
            </button>
          </Tooltip>

          <div style={{ position: 'relative' }}>
            <Tooltip text='Save + Load' direction='bottom'>
              <button className='settings' onClick={() => settingsOpen ? closeSettings() : setSettingsOpen(true)}>
                <DownloadSquareSolid color="currentColor" width={24} />
              </button>
            </Tooltip>
            {(settingsOpen || closingSettings) && (
              <SettingsPanel 
                isClosing={closingSettings}
                onSave={save}
                onLoad={load}
              />
            )}
          </div>

          <Tooltip text={isPlaying ? 'Pause' : 'Play'} direction='right'>
            <button className='play' onClick={isPlaying ? stop : start}>
              {isPlaying ? <PauseSolid color="currentColor" width={24} /> : <PlaySolid color="currentColor" width={24} />}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
    <div className='mobile-message'>
      <div className='mobile-cont'>
        <MusicDoubleNote />
        <h1>Mini Studio</h1>
      </div>
      <p>Please open on desktop to use.</p>
    </div>
  </>
  )
}