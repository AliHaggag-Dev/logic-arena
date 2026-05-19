"use client";

import React from "react";
import { ColorPicker } from "../../components/ColorPicker";
import { RobotSpecs } from "../../components/RobotSpecs";
import type { RobotConfig } from "../../constants/robots.constants";
import { SaveButton } from "./SaveButton";

interface ControlsPanelProps {
    robot: RobotConfig;
    robotId: string;
    color: string;
    isMobile: boolean;
    isGuest: boolean;
    saving: boolean;
    saveButtonLabel: string;
    onColorChange: (color: string) => void;
    onSave: () => void;
}

export function ControlsPanel({
    robot,
    robotId,
    color,
    isMobile,
    isGuest,
    saving,
    saveButtonLabel,
    onColorChange,
    onSave,
}: ControlsPanelProps) {
    return (
        <div
            className={`flex flex-col ${isMobile ? "gap-5" : "gap-6"} border border-accent/10 rounded-xl ${isMobile ? "p-5" : "p-6"} bg-card/40 backdrop-blur-md h-fit garage-scrollbar`}
            style={{
                boxShadow: !isMobile ? "0 0 48px rgba(var(--accent-rgb),0.06)" : "none",
                animation: "garageGlowPulse 4s ease-in-out infinite",
            }}
        >
            <RobotSpecs robot={robot} robotId={robotId} color={color} />

            <div className={isMobile ? "pb-2" : "border-b border-accent/10 pb-5"}>
                <ColorPicker selected={color} onChange={onColorChange} isMobile={isMobile} />
            </div>

            {!isMobile && (
                <>
                    <p className="text-[9px] tracking-[0.18em] text-accent/25 leading-relaxed font-bold uppercase italic">
                        Orbit: Click+DRAG &middot; Zoom: Scroll &middot; Limit: 30&deg;&ndash;135&deg;
                    </p>

                    <SaveButton
                        onClick={onSave}
                        disabled={saving || isGuest}
                        label={saveButtonLabel}
                        isGuest={isGuest}
                        variant="desktop"
                    />

                    {isGuest && (
                        <p className="text-[8px] text-accent/30 tracking-widest uppercase text-center -mt-2">
                            Register to unlock customization
                        </p>
                    )}
                </>
            )}

            {isMobile && (
                <div className="border-t border-accent/10 pt-3 flex items-center justify-center gap-2 text-accent/25">
                    <span className="text-[8px] tracking-[0.18em] uppercase font-bold">
                        &darr; CONFIRM BELOW TO SAVE
                    </span>
                </div>
            )}
        </div>
    );
}
