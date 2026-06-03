import React, { useRef } from 'react';
import { FloppyDiskArrowIn, FloppyDiskArrowOut } from 'iconoir-react';
import { Tooltip } from './Tooltip';

export function SettingsPanel({ isClosing, onSave, onLoad }: {
    isClosing: boolean;
    onSave: () => void;
    onLoad: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <div className={`settings-panel ${isClosing ? 'settings-panel-closing' : ''}`}>
            <div className='save-load'>
                <Tooltip text='Save' direction='left'>
                    <button onClick={onSave}>
                        <FloppyDiskArrowIn/>
                    </button>
                </Tooltip>

                <Tooltip text='Load' direction='right'>
                    <button onClick={() => fileRef.current?.click()}>
                        <FloppyDiskArrowOut/>
                    </button>
                </Tooltip>
                <input
                    ref={fileRef}
                    type='file'
                    accept='.json'
                    style={{ display: 'none' }}
                    onChange={onLoad}
                />
            </div>
        </div>
    );
}