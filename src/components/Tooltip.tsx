import React from 'react';

type Direction = 'top' | 'bottom' | 'left' | 'right';

export function Tooltip({ text, children, direction = 'top'}: {
    text: string,
    children: React.ReactNode;
    direction?: Direction;
}) {
    return (
        <div className='tooltip-wrap'>
            {children}
            <span className={`tooltip tooltip-${direction}`}>{text}</span>
        </div>
    );
}