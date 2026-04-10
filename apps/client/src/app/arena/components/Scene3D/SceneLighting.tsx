"use client";
/**
 * Configures the lighting for the 3D scene.
 */
export const SceneLighting = () => {
    return (
        <>
            <ambientLight intensity={0.85} />
            <pointLight position={[10, 10, 10]} intensity={1.6} />
        </>
    );
};

