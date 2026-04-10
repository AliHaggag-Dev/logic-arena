"use client";
import { Html } from "@react-three/drei";
import { SpeechBubbleState, RobotState } from "../../types";

/**
 * Renders 2D HTML elements on top of the 3D scene, such as speech bubbles.
 */
export const SceneOverlay = ({ speechBubble, robots }: { speechBubble: SpeechBubbleState | null; robots: RobotState[] }) => {
    return (
        <>
            {speechBubble &&
                robots.map(robot => {
                    if (robot.id === speechBubble.robotId) {
                        const pos = [(robot.position.x / 40) - 10, 0.375, (robot.position.y / 40) - 7.5] as [number, number, number];
                        return <SpeechBubble key={`bubble-${robot.id}`} position={pos} message={speechBubble.message} />;
                    }
                    return null;
                })}
        </>
    );
};

const SpeechBubble = ({ position, message }: { position: [number, number, number]; message: string }) => {
    return (
        <Html position={[position[0], position[1] + 1, position[2]]} center>
            <div
                style={{
                    background: "rgba(0, 0, 0, 0.7)",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    color: "#00FF00",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    border: "1px solid #00FF00",
                    pointerEvents: "none",
                    transform: "translateY(-100%)"
                }}
            >
                {message}
            </div>
        </Html>
    );
};

