// ---------------------------------------------------------------------------
// GALAXY STARS SHADER (Soft Gaussian Glow Particles with Scintillation)
// ---------------------------------------------------------------------------
export const GALAXY_STAR_VERT = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec2 aTwinkle; // x: frequency, y: phase

  uniform float uTime;
  uniform float uSizeMultiplier;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;

    // Organic micro-twinkling on individual stellar emitters
    float twinkle = 0.88 + 0.12 * sin(uTime * aTwinkle.x + aTwinkle.y);
    vAlpha = aAlpha * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Size attenuation with soft clamping
    float pointSize = aSize * uSizeMultiplier * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(pointSize, 1.5, 36.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const GALAXY_STAR_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distSq = dot(coord, coord);
    if (distSq > 0.25) discard;

    // Dual-lobe Gaussian profile: intense stellar nucleus + soft expansive corona
    float core = exp(-distSq * 45.0) * 0.95;
    float corona = exp(-distSq * 10.0) * 0.45;
    float totalIntensity = core + corona;

    // Shift the hottest core center toward brilliant white
    vec3 finalColor = vColor + vec3(core * 0.8);

    gl_FragColor = vec4(finalColor, totalIntensity * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// INTERSTELLAR DUST LANES SHADER (Dark Absorption Silhouettes)
// ---------------------------------------------------------------------------
export const GALAXY_DUST_VERT = `
  attribute float aSize;
  attribute float aAlpha;

  uniform float uSizeMultiplier;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vAlpha = aAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float pointSize = aSize * uSizeMultiplier * (280.0 / -mvPosition.z);
    gl_PointSize = clamp(pointSize, 6.0, 75.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const GALAXY_DUST_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distSq = dot(coord, coord);
    if (distSq > 0.25) discard;

    // Soft smoky falloff for interstellar gas/dust filaments
    float smoke = smoothstep(0.25, 0.0, distSq);
    gl_FragColor = vec4(vColor, smoke * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// VOLUMETRIC GASEOUS SPIRAL DISK (Smooth Continuous Nebular Haze)
// ---------------------------------------------------------------------------
export const GALAXY_HAZE_VERT = `
  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GALAXY_HAZE_FRAG = `
  uniform vec3 uColorCore;
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform float uTime;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vPos;

  void main() {
    vec2 uvCentered = vUv - vec2(0.5);
    float r = length(uvCentered) * 2.0; // 0.0 at center, 1.0 at outer disk edge
    if (r > 1.0) discard;

    float angle = atan(uvCentered.y, uvCentered.x);

    // Grand-design dual logarithmic spiral density wave
    float spiralArm1 = cos(angle * 2.0 - log(r + 0.04) * 3.8);
    float spiralArm2 = cos(angle * 2.0 - log(r + 0.04) * 3.8 + 3.14159);
    float arms = max(spiralArm1, spiralArm2);
    arms = smoothstep(0.1, 0.95, arms);

    // Radial exponential falloff
    float radialFade = pow(1.0 - r, 1.6);

    // Core bulge intensity
    float coreGlow = exp(-r * r * 16.0) * 1.5;

    // Combine diffuse arm haze with core emission
    float armHaze = arms * radialFade * 0.45;
    float totalDensity = (coreGlow + armHaze) * uOpacity;

    // Radial chromatic transition: core -> inner arms -> outer diffuse envelope
    vec3 col = mix(uColorCore, uColorInner, smoothstep(0.0, 0.35, r));
    col = mix(col, uColorOuter, smoothstep(0.35, 0.95, r));

    gl_FragColor = vec4(col, totalDensity);
  }
`;
