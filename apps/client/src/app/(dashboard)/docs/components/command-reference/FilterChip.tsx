interface FilterChipProps {
    label: string;
    active: boolean;
    color: string;
    onClick: () => void;
}

export function FilterChip({ label, active, color, onClick }: FilterChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                padding: '5px 14px',
                borderRadius: '4px',
                backgroundColor: active ? `color-mix(in srgb, ${color} 9%, transparent)` : 'transparent',
                border: active
                    ? `1px solid color-mix(in srgb, ${color} 33%, transparent)`
                    : '1px solid rgba(var(--accent-rgb),0.12)',
                color: active ? color : 'rgba(var(--accent-rgb),0.35)',
                textShadow: active ? `0 0 8px color-mix(in srgb, ${color} 40%, transparent)` : 'none',
                transition: 'all 0.15s',
            }}
            className="text-[9px] font-bold tracking-[0.2em] cursor-pointer font-mono hover:opacity-80 shrink-0"
        >
            {label}
        </button>
    );
}
