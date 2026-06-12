"use client";
import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Float, Cloud, Clouds, Billboard, Instances, Instance } from "@react-three/drei";
import { Group, Mesh, MeshBasicMaterial, Vector3, Quaternion, AdditiveBlending, DoubleSide, InstancedMesh, Matrix4, Color, Euler, Object3D } from "three";
import { MapTheme } from "../../types";
import { getGlobalAudioContext, getGlobalMasterGain } from "../../../../context/SoundContext";

interface DynamicEnvironmentProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

export function getAmbientCtx() {
  return getGlobalAudioContext();
}

function getAmbientMasterGain() {
  return getGlobalMasterGain();
}

interface AmbientSynthesizerProps {
  position?: [number, number, number];
  distanceFunc?: (camPos: Vector3) => number;
  type: 'blackhole' | 'lava' | 'crystal' | 'meteor' | 'asteroid' | 'cybership' | 'moon' | 'datacube';
  maxDistance?: number;
  maxVol?: number;
}

const AmbientSynthesizer = ({ position, distanceFunc, type, maxDistance = 350, maxVol }: AmbientSynthesizerProps) => {
  const { camera } = useThree();
  const gainNodeRef = useRef<GainNode | null>(null);
  const targetPos = useMemo(() => position ? new Vector3(...position) : new Vector3(), [position]);
  const objRef = useRef<Group>(null);
  const worldPosRef = useRef(new Vector3());

  React.useEffect(() => {
    const ctx = getAmbientCtx();
    if (!ctx) return;
    
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    // Connect directly to destination to avoid volume collapse from global master gain
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    const nodesToDisconnect: AudioNode[] = [];

    if (type === 'blackhole') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 45;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(masterGain);
      osc.start(); lfo.start();
      nodesToDisconnect.push(osc, lfo, lfoGain);
    } else if (type === 'lava' || type === 'meteor') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; 
        b6 = white * 0.115926;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'lava' ? 'lowpass' : 'bandpass';
      filter.frequency.value = type === 'lava' ? 150 : 800;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = type === 'lava' ? 0.2 : 2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = type === 'lava' ? 50 : 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      noiseSource.connect(filter);
      filter.connect(masterGain);
      noiseSource.start(); lfo.start();
      nodesToDisconnect.push(noiseSource, filter, lfo, lfoGain);
    } else if (type === 'crystal') {
      const freqs = [800, 1200, 1600, 2400];
      const compGain = ctx.createGain();
      compGain.gain.value = 0.08;
      masterGain.connect(compGain);
      compGain.connect(ctx.destination);
      masterGain.disconnect(ctx.destination);
      nodesToDisconnect.push(compGain);
      freqs.forEach(f => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = Math.random() * 0.5 + 0.1;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0;
        lfo.connect(oscGain.gain); 
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(); lfo.start();
        nodesToDisconnect.push(osc, lfo, oscGain);
      });
    } else if (type === 'asteroid' || type === 'moon') {
      const osc = ctx.createOscillator();
      osc.type = type === 'asteroid' ? 'triangle' : 'sine';
      osc.frequency.value = type === 'asteroid' ? 60 : 150;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = type === 'asteroid' ? 0.2 : 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = type === 'asteroid' ? 20 : 50;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(masterGain);
      osc.start(); lfo.start();
      nodesToDisconnect.push(osc, lfo, lfoGain);
    } else if (type === 'cybership') {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 150;
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.value = 75; // Sub-octave

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 2; // slow engine throb
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 10;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      osc1.connect(masterGain);
      osc2.connect(masterGain);
      osc1.start(); osc2.start(); lfo.start();
      nodesToDisconnect.push(osc1, osc2, lfo, lfoGain);
    } else if (type === 'datacube') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate for volume drop
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300; // Deep wind

      // Modulate the filter frequency to sound like howling wind
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // Very slow howl
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 150;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start(); lfo.start();
      nodesToDisconnect.push(noise, filter, lfo, lfoGain);
    }

    const resumeIfSuspended = () => {
      if (ctx.state === "suspended") void ctx.resume();
    };
    document.addEventListener("click", resumeIfSuspended, { once: true });

    return () => {
      document.removeEventListener("click", resumeIfSuspended);
      masterGain.gain.value = 0;
      try { masterGain.disconnect(); } catch (e) {}
      nodesToDisconnect.forEach(n => {
        try { n.disconnect(); } catch(e){}
        if ((n as OscillatorNode).stop) {
          try { (n as OscillatorNode).stop(); } catch(e){}
        }
      });
    };
  }, [type]);

  useFrame(() => {
    if (!gainNodeRef.current) return;
    const ctx = getAmbientCtx();
    if (!ctx || ctx.state !== "running") return;

    let dist = Infinity;
    if (distanceFunc) {
      dist = distanceFunc(camera.position);
    } else if (position) {
      dist = camera.position.distanceTo(targetPos);
    } else if (objRef.current) {
      objRef.current.getWorldPosition(worldPosRef.current);
      dist = camera.position.distanceTo(worldPosRef.current);
    }

    let vol = 1.0 - Math.min(dist / maxDistance, 1.0);
    vol = Math.pow(vol, 2); 
    
    let defaultVol = 0.15;
    if (type === 'blackhole') defaultVol = 0.8;
    else if (type === 'lava') defaultVol = 0.5;
    else if (type === 'meteor') defaultVol = 0.35;
    else if (type === 'asteroid') defaultVol = 0.3;
    else if (type === 'moon') defaultVol = 0.25;
    else if (type === 'cybership') defaultVol = 0.15;
    else if (type === 'datacube') defaultVol = 0.1;
    
    gainNodeRef.current.gain.setTargetAtTime(vol * (maxVol ?? defaultVol), ctx.currentTime, 0.1);
  });

  if (position || distanceFunc) return null;
  return <group ref={objRef} />;
};

// ---------------------------------------------------------------------------
// CYBER THEME (NEO-CYBER)
// ---------------------------------------------------------------------------

// Helper to generate random 360 positions
const getRandomPos = (minRadius: number, maxRadius: number, minY: number, maxY: number): [number, number, number] => {
  const angle = Math.random() * Math.PI * 2;
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = minY + Math.random() * (maxY - minY);
  return [x, y, z];
};

// ---------------------------------------------------------------------------
// CYBER THEME (NEO-CYBER)
// ---------------------------------------------------------------------------
const CyberShip = ({ startPos, speed, color, axis = 'x' }: { startPos: [number, number, number], speed: number, color: string, axis?: 'x'|'z' }) => {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position[axis] += speed * delta;
      if (groupRef.current.position[axis] > 400) groupRef.current.position[axis] = -400;
      if (groupRef.current.position[axis] < -400) groupRef.current.position[axis] = 400;
    }
  });
  
  const rotY = axis === 'x' ? (speed > 0 ? -Math.PI / 2 : Math.PI / 2) : (speed > 0 ? 0 : Math.PI);

  return (
    <group ref={groupRef} position={startPos} rotation={[0, rotY, 0]}>
      <AmbientSynthesizer type="cybership" maxDistance={400} maxVol={0.4} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[2, 10, 4]} />
        <meshStandardMaterial color="#111" emissive={color} emissiveIntensity={0.8} wireframe />
      </mesh>
      <mesh position={[0, 0, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 2, 4, 8]} />
        <meshStandardMaterial color="#0a0a2a" emissive="#000" />
      </mesh>
    </group>
  );
};

interface GlowingDiskProps {
  minRadius: number;
  maxRadius: number;
  opacityMultiplier?: number;
  rot?: [number, number, number];
}

const DISK_VERT = `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAG = `
  uniform vec3 colorIn;
  uniform vec3 colorOut;
  uniform float minR;
  uniform float maxR;
  uniform float mult;
  varying vec2 vPos;
  void main() {
    float dist = length(vPos);
    float t = clamp((dist - minR) / (maxR - minR), 0.0, 1.0);
    float alpha = pow(1.0 - t, 2.0) * mult;
    vec3 color = mix(colorIn, colorOut, t);
    gl_FragColor = vec4(color, alpha);
  }
`;

const GlowingDisk = ({ minRadius, maxRadius, opacityMultiplier = 1, rot = [0, 0, 0] }: GlowingDiskProps) => {
  const uniforms = useRef({
    colorIn: { value: new Vector3(1.0, 0.8, 0.2) }, // Golden/White core
    colorOut: { value: new Vector3(0.4, 0.0, 0.2) }, // Deep purple edge
    minR: { value: minRadius },
    maxR: { value: maxRadius },
    mult: { value: opacityMultiplier }
  });

  return (
    <mesh rotation={rot}>
      <ringGeometry args={[minRadius, maxRadius, 64]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        uniforms={uniforms.current}
        vertexShader={DISK_VERT}
        fragmentShader={DISK_FRAG}
      />
    </mesh>
  );
};

const BlackHole = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => {
  const ringsRef = useRef<Group>(null);
  
  const count = 60;
  const debrisMeshRef = useRef<InstancedMesh>(null);
  const _dummy = useMemo(() => new Object3D(), []);

  const debrisData = useMemo(() => [...Array(count)].map(() => ({
    pos: new Vector3(
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 150
    ),
    resetPos: new Vector3(
      (Math.random() - 0.5) * 150,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 150
    ),
    color: new Color(Math.random() > 0.5 ? "#ff8800" : "#ff00ff"),
    scale: 0.5 + Math.random() * 1.5
  })), []);

  React.useLayoutEffect(() => {
    if (!debrisMeshRef.current) return;
    debrisData.forEach((d, i) => debrisMeshRef.current!.setColorAt(i, d.color));
    debrisMeshRef.current.instanceColor!.needsUpdate = true;
  }, [debrisData]);

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z -= delta * 0.2;
    }
    
    if (debrisMeshRef.current) {
      debrisMeshRef.current.rotation.y -= delta * 0.2;
      
      debrisData.forEach((d, i) => {
        const distSq = d.pos.lengthSq();
        if (distSq < 225) {
          d.pos.copy(d.resetPos);
        } else {
          const dist = Math.sqrt(distSq);
          const speed = 250 / (dist + 1);
          d.pos.multiplyScalar(1 - delta * speed * 0.01);
          
          const s = Math.max(0.01, dist / 150) * d.scale;
          _dummy.position.copy(d.pos);
          _dummy.scale.setScalar(s);
          _dummy.updateMatrix();
          debrisMeshRef.current!.setMatrixAt(i, _dummy.matrix);
        }
      });
      debrisMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Event Horizon (Pure Black Sphere) */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[15, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Gravitational Lensing Halo (Billboarded to perfectly frame the black hole from any camera angle) */}
      <Billboard>
        <GlowingDisk minRadius={15} maxRadius={35} opacityMultiplier={0.8} />
      </Billboard>

      {/* Main Equatorial Accretion Disk (Slightly tilted) */}
      <group ref={ringsRef} rotation={[0.2, 0, -0.1]}>
        {/* Core Volumetric Blazing Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[16.5, 1.5, 16, 100]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[19, 2.5, 16, 100]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Smooth Extended Gradient Disk */}
        <GlowingDisk minRadius={15.5} maxRadius={65} opacityMultiplier={1.0} rot={[-Math.PI / 2, 0, 0]} />
      </group>

      {/* Matter/Debris getting sucked in */}
      <instancedMesh ref={debrisMeshRef} args={[undefined as any, undefined as any, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0.8} blending={AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  );
};

const CYBER_SHIPS = [
  { startPos: [100, 100, -100] as [number, number, number], speed: 100, color: "#00ffff", axis: "z" as const },
  { startPos: [-200, 150, 100] as [number, number, number], speed: 150, color: "#ff00ff", axis: "x" as const },
  { startPos: [50, 50, 150] as [number, number, number], speed: 80, color: "#00ffff", axis: "z" as const },
  { startPos: [200, 200, 0] as [number, number, number], speed: -120, color: "#ff00ff", axis: "y" as const },
  { startPos: [-250, 150, 50] as [number, number, number], speed: 50, color: "#ffffff", axis: "x" as const }
];

const CyberEnvironment = ({ isHighQuality }: { isHighQuality: boolean }) => {
  const planet1Ref = useRef<Object3D>(null);
  const planet2Ref = useRef<Object3D>(null);
  const planet3Ref = useRef<Object3D>(null);
  const cubesRef = useRef<Group>(null);
  const shipsRef = useRef<(Group | null)[]>([]);
  
  useFrame((_, delta) => {
    if (planet1Ref.current) planet1Ref.current.rotation.y += delta * 0.05;
    if (planet2Ref.current) planet2Ref.current.rotation.x += delta * 0.02;
    if (planet3Ref.current) planet3Ref.current.rotation.z -= delta * 0.03;
    if (cubesRef.current) {
      cubesRef.current.rotation.x += delta * 0.02;
      cubesRef.current.rotation.y += delta * 0.05;
    }
    
    CYBER_SHIPS.forEach((config, i) => {
      const ship = shipsRef.current[i];
      if (ship) {
        ship.position[config.axis] += config.speed * delta;
        if (config.axis === 'z' && ship.position.z > 300) ship.position.z = -300;
        else if (config.axis === 'z' && ship.position.z < -300) ship.position.z = 300;
        else if (config.axis === 'x' && ship.position.x > 300) ship.position.x = -300;
        else if (config.axis === 'x' && ship.position.x < -300) ship.position.x = 300;
        else if (config.axis === 'y' && ship.position.y > 300) ship.position.y = -300;
        else if (config.axis === 'y' && ship.position.y < -300) ship.position.y = 300;
      }
    });
  });

  const cubeCount = 25;
  const cubeMeshRef = useRef<InstancedMesh>(null);
  const _cubeDummy = useMemo(() => new Object3D(), []);

  const cubeData = useMemo(() => [...Array(cubeCount)].map(() => ({
    size: Math.random() * 8 + 2,
    pos: getRandomPos(100, 300, -20, 150),
    color: Math.random() > 0.5 ? "#00ffff" : "#ff00ff",
    rot: new Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
  })), []);

  React.useLayoutEffect(() => {
    if (!cubeMeshRef.current) return;
    const colorA = new Color("#00ffff");
    const colorB = new Color("#ff00ff");
    cubeData.forEach((d, i) => {
      _cubeDummy.position.set(d.pos[0], d.pos[1], d.pos[2]);
      _cubeDummy.rotation.copy(d.rot);
      _cubeDummy.scale.setScalar(d.size);
      _cubeDummy.updateMatrix();
      cubeMeshRef.current!.setMatrixAt(i, _cubeDummy.matrix);
      cubeMeshRef.current!.setColorAt(i, d.color === "#00ffff" ? colorA : colorB);
    });
    cubeMeshRef.current.instanceMatrix.needsUpdate = true;
    cubeMeshRef.current.instanceColor!.needsUpdate = true;
  }, [cubeData, _cubeDummy]);

  const getCubeDist = React.useCallback((camPos: Vector3) => {
    if (!cubesRef.current) return Infinity;
    const localCam = cubesRef.current.worldToLocal(camPos.clone());
    let minD = Infinity;
    for (let i = 0; i < cubeData.length; i++) {
      const d = localCam.distanceTo(new Vector3(cubeData[i].pos[0], cubeData[i].pos[1], cubeData[i].pos[2]));
      if (d < minD) minD = d;
    }
    return minD;
  }, [cubeData]);

  const cloudData = useMemo(() => [...Array(12)].map((_, i) => ({
    pos: getRandomPos(120, 250, 20, 80),
    color: i % 2 === 0 ? "#05051a" : "#00ffff",
    seed: i
  })), []);

  return (
    <>
      <Sparkles count={isHighQuality ? 600 : 150} scale={[150, 50, 150]} position={[0, 20, 0]} size={2} speed={0.4} opacity={0.5} color="#00ffff" />

      {isHighQuality && (
        <group>
          <AmbientSynthesizer type="blackhole" position={[200, 80, -250]} maxDistance={550} />
          {/* Massive Interstellar Black Hole */}
          <BlackHole position={[200, 80, -250]} scale={2.5} />

          {/* Planet 2: Small dense data-sphere on the opposite side */}
          <mesh ref={planet2Ref as any} position={[-150, 40, 180]}>
            <AmbientSynthesizer type="moon" position={[-150, 40, 180]} maxDistance={200} />
            <sphereGeometry args={[30, 16, 16]} />
            <meshBasicMaterial color="#ff00ff" wireframe transparent opacity={0.2} />
          </mesh>

          {/* Planet 3: High altitude geometric moon */}
          <mesh ref={planet3Ref as any} position={[-100, 180, -100]}>
            <AmbientSynthesizer type="moon" position={[-100, 180, -100]} maxDistance={200} />
            <octahedronGeometry args={[40, 1]} />
            <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.1} />
          </mesh>

          {/* Distant Cyber Ships */}
          {CYBER_SHIPS.map((ship, i) => {
            const rotY = ship.axis === 'z' ? (ship.speed > 0 ? 0 : Math.PI) : ship.axis === 'x' ? (ship.speed > 0 ? -Math.PI / 2 : Math.PI / 2) : (ship.speed > 0 ? 0 : Math.PI);
            return (
              <group key={`ship-${i}`} ref={(el) => { shipsRef.current[i] = el; }} position={ship.startPos} rotation={[0, rotY, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[2, 10, 4]} />
                  <meshStandardMaterial color="#111" emissive={ship.color} emissiveIntensity={0.8} wireframe />
                </mesh>
                <mesh position={[0, 0, -4]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[1, 2, 4, 8]} />
                  <meshStandardMaterial color="#111" emissive={ship.color} emissiveIntensity={2} />
                </mesh>
              </group>
            );
          })}

          {/* Random floating data cubes around the entire map */}
          <group ref={cubesRef}>
            <AmbientSynthesizer type="datacube" distanceFunc={getCubeDist} maxDistance={80} />
            <instancedMesh ref={cubeMeshRef} args={[undefined as any, undefined as any, cubeCount]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial wireframe transparent opacity={0.3} />
            </instancedMesh>
          </group>

          {/* 360 Dark Clouds */}
          <Clouds material={MeshBasicMaterial} limit={100}>
            {cloudData.map((data, i) => (
              <Cloud key={i} position={data.pos} speed={0.1} opacity={0.05} bounds={[80, 30, 80]} color={data.color} seed={data.seed} />
            ))}
          </Clouds>
        </group>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// LAVA THEME (MAGMA CORE)
// ---------------------------------------------------------------------------
const UP = new Vector3(0, 1, 0);

const LavaMeteor = ({ startPos, speed, dir }: { startPos: [number, number, number], speed: number, dir: [number, number, number] }) => {
  const groupRef = useRef<Group>(null);

  const { velocity, quaternion } = useMemo(() => {
    const d = new Vector3(...dir).normalize();
    const q = new Quaternion().setFromUnitVectors(UP, d);
    const v = d.multiplyScalar(speed);
    return { velocity: v, quaternion: q };
  }, [dir[0], dir[1], dir[2], speed]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += velocity.x * delta;
      groupRef.current.position.y += velocity.y * delta;
      groupRef.current.position.z += velocity.z * delta;
      if (groupRef.current.position.lengthSq() > 250000) {
        groupRef.current.position.set(...startPos);
      }
    }
  });

  return (
    <group ref={groupRef} position={startPos} quaternion={quaternion}>
      <AmbientSynthesizer type="meteor" maxDistance={400} maxVol={0.5} />
      <mesh>
        <dodecahedronGeometry args={[3, 1]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff3300" emissiveIntensity={2} flatShading />
      </mesh>
      <mesh position={[0, -4, 0]}>
        <coneGeometry args={[2.5, 12, 8]} />
        <meshBasicMaterial color="#ff5500" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

const LavaEnvironment = ({ isHighQuality }: { isHighQuality: boolean }) => {
  const rocksRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const deadStarRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (rocksRef.current) {
      rocksRef.current.rotation.y += delta * 0.005;
      rocksRef.current.rotation.z -= delta * 0.002;
    }
    if (coreRef.current) coreRef.current.rotation.z -= delta * 0.02;
    if (deadStarRef.current) deadStarRef.current.rotation.x += delta * 0.01;
  });

  const cloudData = useMemo(() => [...Array(12)].map((_, i) => ({
    pos: getRandomPos(100, 250, 40, 120),
    color: i % 3 === 0 ? "#ff2200" : (i % 3 === 1 ? "#440000" : "#220000"),
    seed: i
  })), []);

  const rockCount = 40;
  const rockMeshRef = useRef<InstancedMesh>(null);
  const _rockDummy = useMemo(() => new Mesh(), []);

  const rockData = useMemo(() => [...Array(rockCount)].map(() => {
    const s = 2 + Math.random() * 20;
    return {
      pos: new Vector3(...getRandomPos(100, 350, -50, 100)),
      scale: new Vector3(s, s, s),
      rot: new Quaternion().setFromEuler(new Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI))
    };
  }), []);

  React.useLayoutEffect(() => {
    if (!rockMeshRef.current) return;
    rockData.forEach((d, i) => {
      _rockDummy.position.copy(d.pos);
      _rockDummy.quaternion.copy(d.rot);
      _rockDummy.scale.copy(d.scale);
      _rockDummy.updateMatrix();
      rockMeshRef.current!.setMatrixAt(i, _rockDummy.matrix);
    });
    rockMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [rockData, _rockDummy]);

  const getRockDist = React.useCallback((camPos: Vector3) => {
    if (!rocksRef.current) return Infinity;
    const localCam = rocksRef.current.worldToLocal(camPos.clone());
    let minD = Infinity;
    for (let i = 0; i < rockData.length; i++) {
      const d = localCam.distanceTo(rockData[i].pos);
      if (d < minD) minD = d;
    }
    return minD;
  }, [rockData]);

  return (
    <>
      <Sparkles count={isHighQuality ? 500 : 150} scale={[80, 20, 80]} position={[0, 10, 0]} size={6} speed={1.5} opacity={1} color="#ff5500" />
      
      {isHighQuality && (
        <group>
          <AmbientSynthesizer type="lava" position={[-200, 80, -200]} maxDistance={450} />
          {/* Main Magma Core (Sun) in the distance */}
          <mesh ref={coreRef} position={[-200, 80, -200]}>
            <sphereGeometry args={[90, 32, 32]} />
            <meshStandardMaterial color="#ff1100" emissive="#ff4400" emissiveIntensity={2} wireframe />
          </mesh>
          {/* Directional light acting as the sun's illumination (no decay over distance) */}
          <directionalLight position={[-200, 80, -200]} intensity={3} color="#ff4400" />

          {/* Secondary dead star on the other side */}
          <mesh ref={deadStarRef} position={[250, 40, 150]}>
            <AmbientSynthesizer type="moon" position={[250, 40, 150]} maxDistance={250} />
            <sphereGeometry args={[50, 16, 16]} />
            <meshStandardMaterial color="#220000" emissive="#440000" emissiveIntensity={0.5} wireframe />
          </mesh>

          {/* 360 Clouds of Ash */}
          <Clouds material={MeshBasicMaterial} limit={40}>
            {cloudData.map((data, i) => (
              <Cloud key={i} position={data.pos} speed={0.3} opacity={0.3} bounds={[100, 40, 100]} color={data.color} seed={data.seed} />
            ))}
          </Clouds>

          {/* Meteors falling from everywhere */}
          <LavaMeteor startPos={[150, 250, -100]} speed={60} dir={[-1, -1, 0]} />
          <LavaMeteor startPos={[-100, 200, 150]} speed={80} dir={[1, -1.5, -0.5]} />
          <LavaMeteor startPos={[200, 300, 200]} speed={90} dir={[-1.5, -2, -1]} />
          <LavaMeteor startPos={[-250, 220, -200]} speed={70} dir={[2, -1, 1]} />
          <LavaMeteor startPos={[50, 280, 300]} speed={100} dir={[0, -2, -1]} />

          {/* 360 massive asteroid belt with varied sizes */}
          <group ref={rocksRef}>
            <AmbientSynthesizer type="asteroid" distanceFunc={getRockDist} maxDistance={120} />
            <instancedMesh ref={rockMeshRef} args={[undefined as any, undefined as any, rockCount]}>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#330000" emissive="#220000" emissiveIntensity={0.5} roughness={0.9} flatShading />
            </instancedMesh>
          </group>
        </group>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// ICE THEME (GLACIAL TUNDRA)
// ---------------------------------------------------------------------------
const CRYSTAL_MAT_PROPS = {
  color: "#e0f2fe",
  emissive: "#022c4a",
  emissiveIntensity: 0.8,
  roughness: 0.1,
  metalness: 0.6,
  transparent: true,
  opacity: 0.85,
  flatShading: true,
} as const;

const IceEnvironment = ({ isHighQuality }: { isHighQuality: boolean }) => {
  const crystalsRef = useRef<Group>(null);
  const auroraRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const halfT = t * 0.5;
    if (crystalsRef.current) {
      crystalsRef.current.rotation.y -= delta * 0.002;
      crystalsRef.current.position.y = Math.sin(halfT) * 10;
    }
    if (auroraRef.current) {
      auroraRef.current.rotation.y += delta * 0.005;
      auroraRef.current.rotation.x = Math.sin(halfT) * 0.075;
      auroraRef.current.position.y = 100 + Math.sin(t / 3) * 15 + Math.sin(halfT) * 4;
    }
  });

  const cloudData = useMemo(() => [...Array(14)].map((_, i) => ({
    pos: getRandomPos(80, 250, -30, 0),
    color: i % 2 === 0 ? "#ffffff" : "#aaddff",
    seed: i
  })), []);

  const crystalData = useMemo(() => [...Array(35)].map(() => ({
    pos: getRandomPos(100, 300, -20, 100),
    scale: 1 + Math.random() * 4,
    rot: new Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
  })), []);

  const getCrystalDist = React.useCallback((camPos: Vector3) => {
    if (!crystalsRef.current) return Infinity;
    const localCam = crystalsRef.current.worldToLocal(camPos.clone());
    let minD = Infinity;
    for (let i = 0; i < crystalData.length; i++) {
      const d = localCam.distanceTo(new Vector3(...crystalData[i].pos));
      if (d < minD) minD = d;
    }
    return minD;
  }, [crystalData]);

  return (
    <>
      <Sparkles count={isHighQuality ? 800 : 200} scale={[120, 30, 120]} position={[0, 15, 0]} size={4} speed={0.5} opacity={0.8} color="#ffffff" />
      
      {isHighQuality && (
        <group>
          <AmbientSynthesizer type="crystal" position={[180, 150, -200]} maxDistance={200} />
          {/* A cool directional light specifically for the ice crystals to glint */}
          <directionalLight position={[100, 150, -100]} intensity={2} color="#aaddff" />
          
          {/* Moons scattered 360 */}
          <mesh position={[180, 150, -200]}>
            <AmbientSynthesizer type="moon" position={[180, 150, -200]} maxDistance={250} />
            <sphereGeometry args={[60, 32, 32]} />
            <meshStandardMaterial color="#ffffff" emissive="#002244" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[-200, 100, 150]}>
            <AmbientSynthesizer type="moon" position={[-200, 100, 150]} maxDistance={200} />
            <sphereGeometry args={[25, 32, 32]} />
            <meshStandardMaterial color="#aaddff" emissive="#001133" emissiveIntensity={0.8} roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[50, 200, 250]}>
            <AmbientSynthesizer type="moon" position={[50, 200, 250]} maxDistance={150} />
            <sphereGeometry args={[15, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#0044aa" emissiveIntensity={0.4} roughness={0.5} />
          </mesh>

          {/* Massive enveloping Aurora Borealis */}
          <group ref={auroraRef}>
            <mesh position={[0, -20, 0]} rotation={[Math.PI / 1.9, -0.1, 0.1]}>
              <torusGeometry args={[280, 40, 8, 48]} />
              <meshBasicMaterial color="#00ccff" transparent opacity={0.08} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
            </mesh>
          </group>

          {/* 360 Ground Mist Clouds */}
          <Clouds material={MeshBasicMaterial} limit={40}>
            {cloudData.map((data, i) => (
              <Cloud key={i} position={data.pos} speed={0.1} opacity={0.15} bounds={[100, 20, 100]} color={data.color} seed={data.seed} />
            ))}
          </Clouds>

          {/* 360 Luxurious Crystal Clusters */}
          <group ref={crystalsRef}>
            <AmbientSynthesizer type="crystal" distanceFunc={getCrystalDist} maxDistance={100} maxVol={0.2} />
            <Instances limit={105} range={105}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial {...CRYSTAL_MAT_PROPS} />
              {crystalData.map((data, i) => (
                <group key={`cgroup-${i}`} position={data.pos} rotation={data.rot} scale={data.scale}>
                  <Instance scale={[1 * 2, 2.5 * 2, 1 * 2]} />
                  <Instance position={[1.5, -1, 0]} rotation={[0, 0, Math.PI / 6]} scale={[0.8 * 1.5, 2 * 1.5, 0.8 * 1.5]} color="#bae6fd" />
                  <Instance position={[-1.2, 1, 1]} rotation={[Math.PI / 8, 0, -Math.PI / 6]} scale={[0.6 * 1.2, 1.5 * 1.2, 0.6 * 1.2]} color="#ffffff" />
                </group>
              ))}
            </Instances>
          </group>
        </group>
      )}
    </>
  );
};

export const DynamicEnvironment = React.memo(({ mapTheme, graphicsQuality }: DynamicEnvironmentProps) => {
  const isHighQuality = graphicsQuality !== 'low';

  if (mapTheme === 'LAVA') return <LavaEnvironment isHighQuality={isHighQuality} />;
  if (mapTheme === 'ICE') return <IceEnvironment isHighQuality={isHighQuality} />;
  return <CyberEnvironment isHighQuality={isHighQuality} />;
});

DynamicEnvironment.displayName = 'DynamicEnvironment';
