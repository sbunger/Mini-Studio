import React, { useRef } from 'react';
import { Tooltip } from './Tooltip';

export function Dial({ value, onChange, label }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
}) {
    
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
                    <div className='dial-indicator' style={{ transform: `rotate(${rotation}deg)` }}>
                        <div className='dial-top'/>
                        <div className='dial-bottom'/>
                    </div>
                </div>
            </Tooltip>
        </div>
    );
}