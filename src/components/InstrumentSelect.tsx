import { useRef } from 'react';
import { NavArrowLeft, NavArrowRight } from 'iconoir-react';
import { InstrumentType, INSTRUMENT_OPTIONS } from '../types';

export function InstrumentSelect({ value, onChange }: {
    value: InstrumentType; 
    onChange: (v: InstrumentType) => void;
}) {
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
    };

    return (
        <div className='instrument-select'>
            <button onClick={prev}><NavArrowLeft/></button>
            <span key={value} data-dir={dirRef.current}>{INSTRUMENT_OPTIONS[currentIndex].label}</span>
            <button onClick={next}><NavArrowRight/></button>
        </div>
    )
}