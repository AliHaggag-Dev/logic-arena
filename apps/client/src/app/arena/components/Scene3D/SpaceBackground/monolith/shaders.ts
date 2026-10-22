// ---------------------------------------------------------------------------
// ADVANCED GLSL SHADERS FOR THE QUANTUM MONOLITH
// ---------------------------------------------------------------------------

export const MONOLITH_CORE_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    
    // Transform normals into world and view space
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const MONOLITH_CORE_FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uCameraPosition;
  uniform float uObserverProximity;
  uniform float uObserverAlignment;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uSubsurfaceColor;
  uniform vec3 uDimensions;
  uniform vec3 uTesseractVertices[16];
  uniform float uSubsurfaceDensity;
  uniform float uDispersiveIndex;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  // -------------------------------------------------------------------------
  // PROCEDURAL NOISE & CELLULAR AUTOMATA
  // -------------------------------------------------------------------------
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float hash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  // 3D Worley / Cellular Noise for alien photonic crystalline microstructure
  vec2 cellular3D(vec3 p) {
    vec3 pi = floor(p);
    vec3 pf = fract(p);
    float d1 = 1.0;
    float d2 = 1.0;

    for (int k = -1; k <= 1; k++) {
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec3 b = vec3(float(i), float(j), float(k));
          vec3 r = vec3(b) - pf + hash3(pi + b);
          float d = dot(r, r);
          if (d < d1) {
            d2 = d1;
            d1 = d;
          } else if (d < d2) {
            d2 = d;
          }
        }
      }
    }
    return vec2(sqrt(d1), sqrt(d2));
  }

  // Procedural alien quantum glyph synthesis: integrated holographic lattice
  float quantumPhotonicTraces(vec2 uv, float time, float excitation) {
    // Multi-scale grid mapping
    vec2 grid1 = uv * vec2(8.0, 24.0);
    vec2 id1 = floor(grid1);
    vec2 f1 = fract(grid1);

    float h = hash(id1);
    
    // Laser waveguide channels
    float channelX = smoothstep(0.06, 0.02, abs(f1.x - 0.5));
    float channelY = smoothstep(0.06, 0.02, abs(f1.y - 0.5));
    float nodeJunction = smoothstep(0.22, 0.12, length(f1 - 0.5));

    // Phase interference modulation along channels
    float carrierWave = sin(f1.y * 18.0 - time * (2.4 + excitation * 3.5) + h * 6.28);
    float solitonPulse = smoothstep(0.7, 0.99, carrierWave);

    // Alien geometric sigils generated via phase interference
    float sigil = 0.0;
    if (h > 0.45) {
      // Concentric quantum ring resonator
      float r = length(f1 - 0.5);
      sigil += smoothstep(0.04, 0.01, abs(r - 0.28));
      sigil += smoothstep(0.04, 0.01, abs(r - 0.14));
      // Cross-connectors
      sigil += smoothstep(0.03, 0.01, abs(f1.x - f1.y)) * step(r, 0.35);
    } else if (h > 0.2) {
      // Hexagonal / diagonal routing
      float diag = abs(fract(f1.x + f1.y) - 0.5);
      sigil += smoothstep(0.04, 0.01, diag);
      float diag2 = abs(fract(f1.x - f1.y) - 0.5);
      sigil += smoothstep(0.04, 0.01, diag2);
    } else {
      // High-density optical storage fringes
      float fringes = sin(f1.x * 45.0) * sin(f1.y * 45.0);
      sigil += smoothstep(0.6, 0.95, fringes) * 0.7;
    }

    float network = mix(channelX + channelY, nodeJunction + sigil, 0.65);
    return network * (0.4 + 0.6 * solitonPulse);
  }

  // Thin-film optical interference iridescence
  vec3 thinFilmIridescence(float cosTheta, float thickness, vec3 baseColor) {
    // Multiple reflection phase shift across optical spectrum
    vec3 waveLengths = vec3(0.65, 0.53, 0.44); // R, G, B in micrometers
    vec3 phase = 2.0 * 3.14159 * 1.54 * thickness * cosTheta / waveLengths;
    vec3 interference = 0.5 + 0.5 * cos(phase);
    return mix(baseColor, interference, 0.45);
  }

  void main() {
    // -----------------------------------------------------------------------
    // 1. DIELECTRIC OBSIDIAN PBR SURFACE
    // -----------------------------------------------------------------------
    // Pure mirror-black non-reflective exotic substrate
    vec3 obsidianBase = vec3(0.003, 0.003, 0.006);

    // Fresnel reflectance with Schlick approximation (n = 1.74)
    float NdotV = max(dot(vNormal, vViewDir), 0.0);
    float F0 = 0.073; // ( (1.74 - 1) / (1.74 + 1) )^2
    float fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);

    // Subtle glancing thin-film iridescence
    vec3 iridColor = thinFilmIridescence(NdotV, 0.38, uSecondaryColor);
    vec3 specularRim = iridColor * fresnel * 2.2;

    // -----------------------------------------------------------------------
    // 2. SUBSURFACE SCATTERING & DEEP INTERNAL DIFFUSION
    // -----------------------------------------------------------------------
    // Distance from center of the monolith box
    vec3 normLocal = abs(vLocalPos) / (uDimensions * 0.5);
    float edgeProximity = max(normLocal.x, max(normLocal.y, normLocal.z));
    
    // Internal light absorption (Beer-Lambert attenuation)
    float depthAbsorption = exp(-edgeProximity * uSubsurfaceDensity);
    vec3 sssGlow = uSubsurfaceColor * depthAbsorption * 1.8;

    // -----------------------------------------------------------------------
    // 3. PROCEDURAL QUANTUM CIRCUITRY & PHOTONIC TRACES
    // -----------------------------------------------------------------------
    float excitation = clamp(uObserverProximity * 1.4 + uObserverAlignment * 0.6, 0.0, 1.0);
    float photonics = quantumPhotonicTraces(vUv, uTime, excitation);

    // Traveling vertical energy soliton wave
    float waveFront = sin(vUv.y * 14.0 - uTime * (1.8 + excitation * 2.2));
    float pulseMod = 0.65 + 0.35 * sin(uTime * 2.5);
    
    vec3 photonicsEmission = mix(uPrimaryColor, uSecondaryColor, 0.35 + 0.3 * waveFront)
      * photonics
      * pulseMod
      * (1.2 + excitation * 2.0);

    // -----------------------------------------------------------------------
    // 4. RAYMARCHED 4D TESSERACT HYPERCUBE SUSPENSION
    // -----------------------------------------------------------------------
    // Evaluate proximity of internal ray to the 16 projected 4D vertices
    float tesseractGlow = 0.0;
    for (int i = 0; i < 16; i++) {
      float d = length(vLocalPos - uTesseractVertices[i]);
      // Concentrated inverse-square quantum field around each 4D vertex
      tesseractGlow += 0.018 / (d * d + 0.12);
    }
    tesseractGlow = clamp(tesseractGlow, 0.0, 2.5);
    vec3 tesseractEmission = mix(uSecondaryColor, uPrimaryColor, 0.5 + 0.5 * sin(uTime)) * tesseractGlow;

    // -----------------------------------------------------------------------
    // 5. OBSERVER EFFECT FLUX
    // -----------------------------------------------------------------------
    float observerRim = pow(1.0 - NdotV, 3.0) * excitation * 1.5;
    vec3 observerField = uPrimaryColor * observerRim;

    // -----------------------------------------------------------------------
    // COMPOSITION
    // -----------------------------------------------------------------------
    vec3 finalColor = obsidianBase 
                    + specularRim 
                    + sssGlow 
                    + photonicsEmission 
                    + tesseractEmission 
                    + observerField;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// SPACETIME GRAVITATIONAL LENSING & WARP ENVELOPE
// ---------------------------------------------------------------------------

export const SPACETIME_LENSING_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const SPACETIME_LENSING_FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uCameraPosition;
  uniform float uGravitationalRadius;
  uniform float uChromaDispersion;
  uniform float uWaveAmplitude;
  uniform vec3 uPrimaryGlow;
  uniform vec3 uSecondaryGlow;
  uniform float uObserverFactor;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    float NdotV = max(dot(vNormal, vViewDir), 0.0);
    float rim = pow(1.0 - NdotV, 3.5);

    // Quadrupole gravitational wave metric oscillations
    float radialDist = length(vLocalPos);
    float wavePhase = radialDist * 0.85 - uTime * 2.8;
    float gravityWave = sin(wavePhase) * exp(-radialDist * 0.06) * uWaveAmplitude;

    // Relativistic gravitational deflection field
    float deflection = (uGravitationalRadius / (radialDist + 2.0)) * (1.0 + gravityWave);

    // Chromatic dispersion around event horizon perimeter
    float chromaR = deflection * (1.0 + uChromaDispersion);
    float chromaG = deflection;
    float chromaB = deflection * (1.0 - uChromaDispersion);

    vec3 warpColor = vec3(
      uPrimaryGlow.r * chromaR,
      uSecondaryGlow.g * chromaG,
      uPrimaryGlow.b * chromaB
    );

    // Interference fringes on the outer spacetime sheath
    float fringe = sin(vUv.y * 32.0 + uTime * 3.0) * 0.5 + 0.5;
    float alpha = rim * (0.35 + 0.45 * uObserverFactor) + fringe * 0.08 * rim;

    gl_FragColor = vec4(warpColor * 2.8, clamp(alpha, 0.0, 0.85));
  }
`;

// ---------------------------------------------------------------------------
// RELATIVISTIC QUANTUM FILAMENTS (QED ARCS ALONG THE 12 EDGES)
// ---------------------------------------------------------------------------

export const QUANTUM_FILAMENT_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const QUANTUM_FILAMENT_FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uBeamColor;
  uniform float uPulseRate;
  uniform float uTurbulence;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vLocalPos;

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  void main() {
    // High-frequency electromagnetic breakdown arc
    float arcSpeed = uTime * uPulseRate;
    float jitter = hash(floor(vUv.y * 40.0 + arcSpeed * 12.0)) * uTurbulence;
    
    // Core beam profile
    float distFromCenter = abs(vUv.x - 0.5 + jitter * 0.15);
    float beamCore = smoothstep(0.48, 0.02, distFromCenter);
    float halo = smoothstep(0.5, 0.0, distFromCenter) * 0.6;

    // Traveling quantum wave packets
    float packet = sin(vUv.y * 24.0 - arcSpeed * 4.0) * 0.5 + 0.5;
    float intensity = (beamCore * 2.0 + halo) * (0.7 + 0.6 * packet);

    vec3 finalColor = uBeamColor * intensity;
    float alpha = clamp(intensity * 0.9, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
