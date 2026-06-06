export function ActivityMeter({ triggered }: { triggered: boolean }) {
    return (
        <div className={`activity-meter ${triggered ? 'active' : ''}`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="activity-bar" />
            ))}
        </div>
    )
}