"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";

const RobotModel = ({ position, color }: { position: [number, number, number], color: string }) => (
    <mesh position={position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            toneMapped={false}
        />
    </mesh>
);

export const Scene3D = ({ robots }: { robots: any[] }) => {
    return (
        <div className="w-full h-screen bg-black">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 10, 20]} />
                <OrbitControls />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} />

                {/* The robot models as 3D spheres */}
                {robots.map((robot) => (
                    <RobotModel
                        key={robot.id}
                        // Convert 2D coordinates to 3D (divide by 40 for scaling)
                        position={[(robot.position.x - 400) / 40, 0, (robot.position.y - 300) / 40]}
                        color={robot.color}
                    />
                ))}

                {/* The grid helper for the arena */}
                <gridHelper args={[20, 20, "#1e293b", "#0f172a"]} />
            </Canvas>
        </div>
    );
};