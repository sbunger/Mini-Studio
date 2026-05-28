import { useState, useRef, useEffect } from 'react'
import * as Tone from "tone";
import "./App.css";

const initialPattern = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

const steps = 8

export default function App() {
  const [pattern, setPattern] = useState(initialPattern);
  const [step, setStep] = useState(0);
  const [bpm, setBpm] = useState(120);

  const stepRef = useRef(0);
  const patternRef = useRef(pattern);
  const startedRef = useRef(false);

  const kickRef = useRef<any>(null);
  const snareRef = useRef<any>(null);
  const hatRef = useRef<any>(null);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    kickRef.current = new Tone.MembraneSynth().toDestination();
    snareRef.current = new Tone.NoiseSynth().toDestination();
    hatRef.current = new Tone.MetalSynth().toDestination();

    Tone.Transport.scheduleRepeat((time) => {
      const currentStep = stepRef.current;
      const currentPattern = patternRef.current;

      currentPattern.forEach((row, rowIndex) => {
        if (row[currentStep]) {
          if (rowIndex === 0)
            kickRef.current.triggerAttackRelease("C2", "8n", time);

          if (rowIndex === 1)
            snareRef.current.triggerAttackRelease("8n", time);

          if (rowIndex === 2)
            hatRef.current.triggerAttackRelease("16n", time);
        }
      });

      requestAnimationFrame(() => {
        setStep(currentStep);
      });

      stepRef.current = (currentStep + 1) % steps;
    }, "8n");

    return () => {
      Tone.Transport.cancel();
    };
  }, [])

  const toggleStep = (row: number, col: number) => {
    setPattern((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[row][col] = copy[row][col] ? 0 : 1;
      return copy;
    });
  };

  const start = async () => {
    await Tone.start();
    if (!startedRef.current) {
      Tone.Transport.bpm.value = 120;
      startedRef.current = true;
    }
    Tone.Transport.start();
  };

  const stop = () => {
    Tone.Transport.stop();
  }

  return (
    <div className='app'>
      <h1>Seqencer</h1>

      <div className='grid'>
        {pattern.map((row, rowIndex) => (
          <div key={rowIndex} className='row'>
            {row.map((cell, colIndex) => (
              <button key={colIndex} onClick={() => toggleStep(rowIndex, colIndex)} className={`cell ${cell ? "active" : ""} ${colIndex === step ? "playing" : ""}`}/>
            ))}
          </div>
        ))}
      </div>

      <div className='controls'>
        <button onClick={start}>Play</button>
        <button onClick={stop}>Stop</button>

        <input type="range" min="60" max="200" value={bpm} onChange={e => {
          setBpm(+e.target.value);
          Tone.Transport.bpm.value = +e.target.value;
          }}
        />
      </div>
    </div>
  )
}