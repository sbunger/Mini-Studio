import React, { useRef } from 'react';
import { MusicNoteSolid } from 'iconoir-react';

export function BpmDrag({ value, onChange }: {
    value: number;
    onChange: (v: number) => void;
}) {
    const startX = useRef(0);
    const startVal = useRef(120);

    const isDragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        startVal.current = value;
    
        const move = (e: MouseEvent) => {
            if (!isDragging.current) return;
            e.preventDefault();
            const delta = Math.round((e.clientX - startX.current) * 0.3);
            onChange(Math.min(240, Math.max(60, startVal.current + delta)));
        };
    
        const up = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };
    
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };
    
    return (
        <div className='bpm-label'>
            <div className='note-container'><MusicNoteSolid color="currentColor" width={24}/>:</div>
            <span className='bpm-drag' onMouseDown={handleMouseDown}>{value}</span>
        </div>
    );
}