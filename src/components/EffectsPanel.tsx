import { Effects } from '../types';
import { Dial } from './Dial';

export function EffectsPanel({ fx, onChange, isClosing }: { 
    fx: Effects; 
    onChange: (k: keyof Effects, v: number) => void; 
    onClose: () => void, 
    isClosing: boolean 
}) {
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