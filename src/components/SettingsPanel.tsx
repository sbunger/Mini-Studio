export function SettingsPanel({ isClosing, onClose }: {isClosing: boolean; onClose: () => void}) {
    return (
        <div className={`settings-panel ${isClosing ? 'settings-panel-closing' : ''}`}>
            <h3>Settings</h3>
            <p>Not Quite Ready...</p>
        </div>
    );
}