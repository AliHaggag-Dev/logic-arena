"use client";
import React from "react";
import { Html } from "@react-three/drei";
import { SpeechBubbleProps } from "../../../types";

export const SpeechBubble = ({ position, message }: SpeechBubbleProps) => {
    return (
        <Html position={[position[0], position[1] + 1, position[2]]} center>
            <div
                style={{
                    background: "rgba(var(--arena-black-rgb),0.7)",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    color: "var(--arena-finish)",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    border: "1px solid var(--arena-finish)",
                    pointerEvents: "none",
                    transform: "translateY(-100%)"
                }}
            >
                {message}
            </div>
        </Html>
    );
};
