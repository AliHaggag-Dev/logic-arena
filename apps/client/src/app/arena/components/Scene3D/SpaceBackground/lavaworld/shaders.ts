// ---------------------------------------------------------------------------
// ADVANCED GLSL SHADERS FOR THE HYPER-REALISTIC LAVA WORLD SYSTEM
// ---------------------------------------------------------------------------

// ═══════════════════════════════════════════════════════════════════════════
// PLANET SURFACE SHADER — Volcanic Mustafar-Style Planet
// Intricate Magma Fissures, Branching Veins, Calderas, and Detailed Basalt Crust
// ═══════════════════════════════════════════════════════════════════════════

export const LAVA_PLANET_VERT = `
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

export const LAVA_PLANET_FRAG = `
  precision highp float;

  uniform float uTime;
  uniform float uRotationAngle;
  uniform vec3 uPrimaryMagma;    // #cc1100 crimson
  uniform vec3 uSecondaryMagma;  // #ffaa00 golden core
  uniform vec3 uCrustColor;      // #0a0605 to #180e0c basalt
  uniform float uMagmaFlowSpeed;
  uniform float uTectonicScale;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  // -----------------------------------------------------------------------
  // 3D SIMPLEX-STYLE NOISE
  // -----------------------------------------------------------------------
  vec3 hash3(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return fract(sin(p) * 43758.5453123);
  }

  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float a = dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0));
    float b = dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0));
    float c = dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0));
    float d = dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0));
    float e = dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1));
    float g = dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1));
    float h = dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1));
    float k = dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1));

    return mix(
      mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
      mix(mix(e, g, u.x), mix(h, k, u.x), u.y),
      u.z
    ) * 0.5 + 0.5;
  }

  float fbm(vec3 p, int octaves) {
    float val = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      val += amp * noise3D(p * freq);
      freq *= 2.08;
      amp *= 0.48;
    }
    return val;
  }

  void main() {
    vec3 spherePos = normalize(vLocalPos);

    // Planetary rotation
    float cosR = cos(uRotationAngle);
    float sinR = sin(uRotationAngle);
    vec3 rotatedPos = vec3(
      spherePos.x * cosR + spherePos.z * sinR,
      spherePos.y,
      -spherePos.x * sinR + spherePos.z * cosR
    );

    // -----------------------------------------------------------------------
    // 1. MUSTAFAR-STYLE HIGH-DETAIL TECTONIC RIFT & MAGMA ARCHITECTURE
    // -----------------------------------------------------------------------
    float flowTime = uTime * uMagmaFlowSpeed;

    // Multi-scale organic domain warping for fluid magma rift chasms
    vec3 warp = vec3(
      fbm(rotatedPos * 2.2 + vec3(flowTime * 0.04, 0.0, 1.2), 3),
      fbm(rotatedPos * 2.2 + vec3(2.4, flowTime * 0.03, 0.0), 3),
      fbm(rotatedPos * 2.2 + vec3(0.0, 3.7, flowTime * 0.03), 3)
    ) * 0.35;

    vec3 warpedPos = rotatedPos + warp;

    // Primary tectonic plate boundaries (Major molten rivers)
    float n1 = noise3D(warpedPos * (uTectonicScale * 1.8));
    float crack1 = 1.0 - smoothstep(0.0, 0.038, abs(n1 - 0.50));

    // Secondary branching magma tributaries
    float n2 = noise3D(warpedPos.zxy * (uTectonicScale * 3.8) + flowTime * 0.03);
    float crack2 = (1.0 - smoothstep(0.0, 0.026, abs(n2 - 0.50))) * 0.75;

    // Tertiary fine glowing fracture veins (micro-cracks across basalt)
    float n3 = noise3D(warpedPos.yzx * (uTectonicScale * 8.5) + flowTime * 0.015);
    float crack3 = (1.0 - smoothstep(0.0, 0.018, abs(n3 - 0.50))) * 0.55;

    // Active volcanic caldera hotspots (bubbling magma basins)
    float calderas = smoothstep(0.68, 0.85, noise3D(rotatedPos * 2.5)) * 0.85;

    // Combine all magma fissures
    float fissure = max(crack1, max(crack2, max(crack3, calderas)));

    // -----------------------------------------------------------------------
    // 2. CRUST VS. LAVA RATIO: ~70% DARK BASALT CRUST, ~30% INTRICATE MAGMA
    // -----------------------------------------------------------------------
    float lavaMask = smoothstep(0.05, 0.28, fissure);

    // -----------------------------------------------------------------------
    // 3. COLORING: DETAILED BASALTIC CRUST ROCK (Rich mineral striations)
    // -----------------------------------------------------------------------
    vec3 basaltDark  = vec3(0.035, 0.020, 0.018); // deep cooled basalt
    vec3 basaltRock  = vec3(0.085, 0.050, 0.040); // volcanic rock plate
    vec3 basaltAsh   = vec3(0.130, 0.080, 0.065); // volcanic ash / regolith
    float crustNoise1 = fbm(rotatedPos * 8.0, 4);
    float crustNoise2 = fbm(rotatedPos * 28.0, 3);
    vec3 crustColor = mix(basaltDark, basaltRock, clamp(crustNoise1, 0.0, 1.0));
    crustColor = mix(crustColor, basaltAsh, clamp(crustNoise2 * 0.45, 0.0, 0.45));

    // Thermal crust glow (smoldering rock right next to magma rifts)
    float heatBleed = smoothstep(0.01, 0.16, fissure);
    crustColor = mix(crustColor, vec3(0.35, 0.07, 0.01), heatBleed * 0.40);

    // -----------------------------------------------------------------------
    // 4. COLORING: GLOWING MAGMA GRADIENT INSIDE FISSURES
    // -----------------------------------------------------------------------
    float crackCore = smoothstep(0.18, 0.80, fissure);

    vec3 crimsonEdge = vec3(0.75, 0.08, 0.00); // deep crimson margin
    vec3 fieryOrange = vec3(1.00, 0.32, 0.00); // fiery magma stream
    vec3 goldenCore  = vec3(1.00, 0.70, 0.04); // bright incandescent yellow
    vec3 whiteHot    = vec3(1.00, 0.90, 0.45); // hotspot core

    vec3 lavaColor;
    if (crackCore < 0.45) {
      lavaColor = mix(crimsonEdge, fieryOrange, crackCore / 0.45);
    } else if (crackCore < 0.85) {
      lavaColor = mix(fieryOrange, goldenCore, (crackCore - 0.45) / 0.40);
    } else {
      lavaColor = mix(goldenCore, whiteHot, (crackCore - 0.85) / 0.15);
    }

    // -----------------------------------------------------------------------
    // 5. COMBINE CRUST & MAGMA VIA STRICT MIX()
    // -----------------------------------------------------------------------
    vec3 surfaceColor = mix(crustColor, lavaColor, lavaMask);

    // -----------------------------------------------------------------------
    // 6. ATMOSPHERIC LIMB FRESNEL (Soft smoldering rim)
    // -----------------------------------------------------------------------
    float NdotV = max(dot(vNormal, vViewDir), 0.0);
    float limbFresnel = pow(1.0 - NdotV, 3.8);
    vec3 rimGlow = vec3(0.85, 0.20, 0.02);
    surfaceColor = mix(surfaceColor, rimGlow, limbFresnel * 0.40);

    // Tone map and clamp
    vec3 finalColor = clamp(surfaceColor, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// PLANET VOLUMETRIC ATMOSPHERE SHADER
// ═══════════════════════════════════════════════════════════════════════════

export const ATMOSPHERE_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const ATMOSPHERE_FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uAtmosphereColor;
  uniform float uGlowIntensity;
  uniform float uScatteringCoeff;
  uniform float uAbsorptionCoeff;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  void main() {
    float NdotV = max(dot(vNormal, vViewDir), 0.0);

    float opticalDepth = (1.0 - NdotV);
    float chapmanApprox = exp(-uAbsorptionCoeff * NdotV) * uScatteringCoeff;
    float scatter = pow(opticalDepth, 2.2) * chapmanApprox;

    // Fades to 0 across the center of planet
    float innerFade = 1.0 - smoothstep(0.12, 0.65, NdotV);
    scatter *= innerFade;

    float pulse = 1.0 + sin(uTime * 0.8) * 0.04;

    vec3 glowColor = uAtmosphereColor * scatter * uGlowIntensity * pulse;
    float alpha = clamp(scatter * 0.70, 0.0, 0.45);

    gl_FragColor = vec4(glowColor, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// PHOTOREALISTIC PROCEDURAL MOON SHADER (Clean, artifact-free, like Earth's Moon)
// ═══════════════════════════════════════════════════════════════════════════

export const MOON_VERT = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const MOON_FRAG = `
  precision highp float;

  uniform sampler2D uMoonMap;
  uniform vec3 uSunDirection;
  uniform vec3 uPlanetWorldPos;
  uniform vec3 uPlanetLightColor;
  uniform float uMoonType; // 0.0 = sulfur, 1.0 = lunar

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 albedo = texture2D(uMoonMap, vUv).rgb;

    // 1. Distant star/sun illumination
    float NdotSun = max(dot(vWorldNormal, uSunDirection), 0.0);
    float diffuse = clamp(NdotSun * 1.30, 0.0, 1.0);
    vec3 starlight = vec3(0.95, 0.95, 1.0) * diffuse * 0.90;

    // 2. Warm planetary volcanic illumination from the lava world
    vec3 planetDir = normalize(uPlanetWorldPos - vWorldPos);
    float NdotPlanet = max(dot(vWorldNormal, planetDir), 0.0);
    vec3 planetGlow = uPlanetLightColor * NdotPlanet * 1.6;

    // 3. Balanced ambient floor so the moon is never pitch black
    vec3 ambient = vec3(0.24, 0.24, 0.26);

    vec3 litColor = albedo * (ambient + starlight + planetGlow);
    gl_FragColor = vec4(clamp(litColor, 0.0, 1.0), 1.0);
  }
`;
