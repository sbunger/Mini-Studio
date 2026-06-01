import React, { useRef } from "react";
import { SoundHighSolid, SoundLowSolid, SoundMinSolid, SoundOffSolid } from 'iconoir-react';
import { Tooltip } from './Tooltip';

export function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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

    return (
        <Tooltip text={value === 0 ? 'Muted' : `${value}`} direction='left'>
            <div className='volume-control' ref={trackRef} onMouseDown={handleMouseDown}>
                <div className='volume-indicator' style={{ width: `${value}%` }} />
                {value > 60 ? <SoundHighSolid width={20}/> : value > 25 ? <SoundLowSolid width={20}/> : value > 0 ? <SoundMinSolid width={20}/> : <SoundOffSolid width={20}/>}
            </div>
        </Tooltip>
    );
}