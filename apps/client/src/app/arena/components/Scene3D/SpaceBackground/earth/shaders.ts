// ---------------------------------------------------------------------------
// GLSL SHADERS: EARTH SURFACE (Direct Sun, Specular Glint, City Lights & Haze)
// ---------------------------------------------------------------------------
export const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const EARTH_FRAG = `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D oceanMask;
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  uniform float cloudOffset;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    // 1. Direct Sun Lighting (N · L)
    float NdotL = dot(vWorldNormal, sunDirection);
    float dayLight = clamp(NdotL * 1.15 + 0.05, 0.0, 1.0);
    float nightLight = smoothstep(0.06, -0.18, NdotL);

    // 2. Sample Maps
    vec3 dayColor = texture2D(dayMap, vUv).rgb;
    vec3 nightColor = texture2D(nightMap, vUv).rgb;
    float isWater = texture2D(oceanMask, vUv).r;

    // 3. Cloud Shadows on the Earth Surface
    vec2 shadowUv = vec2(vUv.x + cloudOffset + sunDirection.x * 0.005, vUv.y + sunDirection.y * 0.005);
    float cloudAlpha = texture2D(cloudMap, shadowUv).a;
    float cloudShadow = 1.0 - (cloudAlpha * 0.42 * clamp(NdotL + 0.1, 0.0, 1.0));

    // 4. Blinding Ocean Specular Sun Glint
    vec3 halfVec = normalize(sunDirection + vViewDir);
    float NdotH = max(dot(vWorldNormal, halfVec), 0.0);
    float specGlint = pow(NdotH, 64.0) * isWater * clamp(NdotL * 2.0, 0.0, 1.0) * 1.6;

    // 5. Atmospheric Rayleigh Limb Haze on the Surface
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    vec3 atmoColor = vec3(0.18, 0.55, 1.0);
    vec3 sunsetColor = vec3(1.0, 0.58, 0.22);
    float sunsetFactor = smoothstep(0.25, -0.05, NdotL) * smoothstep(-0.25, 0.05, NdotL);
    vec3 rimColor = mix(atmoColor, sunsetColor, sunsetFactor * 0.85);
    vec3 surfaceHaze = rimColor * pow(rim, 3.8) * clamp(NdotL + 0.25, 0.0, 1.0) * 0.65;

    // 6. Combine: Daylit Terrain + Sun Glint + City Lights + Surface Haze
    vec3 terrainLit = dayColor * dayLight * cloudShadow + vec3(specGlint * 0.95, specGlint * 0.98, specGlint);
    vec3 cities = nightColor * nightLight * 2.6;
    vec3 finalColor = terrainLit + cities + surfaceHaze;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// GLSL SHADERS: ATMOSPHERIC RAYLEIGH SCATTERING OUTER SHELL (Razor-thin, BackSide)
// ---------------------------------------------------------------------------
export const ATMO_OUTER_VERT = `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const ATMO_OUTER_FRAG = `
  uniform vec3 sunDirection;

  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;

  void main() {
    // Sharp exponential rim falloff hugging the curved horizon
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    float intensity = pow(fresnel, 5.2);

    // Illuminated predominantly on the sunlit limb
    float sunFacing = dot(vWorldNormal, sunDirection);
    float sunVisibility = smoothstep(-0.35, 0.45, sunFacing);

    // Warm golden sunset glow at the terminator
    float sunsetBand = smoothstep(0.3, -0.05, sunFacing) * smoothstep(-0.4, 0.05, sunFacing);
    vec3 azureSky = vec3(0.15, 0.52, 1.0);
    vec3 twilightOrange = vec3(1.0, 0.60, 0.25);
    vec3 scatterColor = mix(azureSky, twilightOrange, sunsetBand * 0.85);

    gl_FragColor = vec4(scatterColor, intensity * sunVisibility * 0.88);
  }
`;

// ---------------------------------------------------------------------------
// GLSL SHADERS: VOLUMETRIC CLOUDS WITH DIRECT SUN & TWILIGHT EDGES
// ---------------------------------------------------------------------------
export const CLOUD_VERT = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const CLOUD_FRAG = `
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  uniform float cloudAlphaMul;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    float NdotL = dot(vWorldNormal, sunDirection);
    float dayLight = clamp(NdotL * 1.2 + 0.08, 0.0, 1.0);

    // Sunset tint on cloud edges
    float sunsetBand = smoothstep(0.25, -0.08, NdotL) * smoothstep(-0.25, 0.05, NdotL);
    vec3 cloudDay = vec3(1.0, 1.0, 1.0);
    vec3 cloudSunset = vec3(1.0, 0.65, 0.38);
    vec3 cloudColor = mix(cloudDay, cloudSunset, sunsetBand * 0.75) * dayLight;

    vec4 tex = texture2D(cloudMap, vUv);
    gl_FragColor = vec4(cloudColor, tex.a * cloudAlphaMul);
  }
`;

// ---------------------------------------------------------------------------
// GLSL SHADERS: MOON (High-Contrast Basalt & Highlands with Sharp Terminator)
// ---------------------------------------------------------------------------
export const MOON_VERT = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const MOON_FRAG = `
  uniform sampler2D moonMap;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    float NdotL = dot(vWorldNormal, sunDirection);
    // Deep space contrast: harsh, razor-sharp terminator with zero atmospheric softening
    float diffuse = clamp(NdotL * 1.3, 0.0, 1.0);

    vec3 albedo = texture2D(moonMap, vUv).rgb;
    // Faint earthshine illumination on the dark side (0.015)
    vec3 finalMoon = albedo * (diffuse + 0.015);

    gl_FragColor = vec4(finalMoon, 1.0);
  }
`;
