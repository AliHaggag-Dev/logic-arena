
// ---------------------------------------------------------------------------
// 2. PHOTOREALISTIC COMET COMA & NUCLEUS SHADER (Soft Volumetric Glow)
// ---------------------------------------------------------------------------
export const COMET_COMA_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const COMET_COMA_FRAG = `
  uniform vec3 uColorHead;
  uniform vec3 uColorTail;
  uniform float uTime;
  uniform float uZoom;

  varying vec2 vUv;

  void main() {
    if (uZoom <= 0.001) discard;

    vec2 p = vUv - vec2(0.5);
    float r = length(p) * 2.0;
    if (r > 1.0) discard;

    // 1. Brilliant incandescent star nucleus (central stellar pinprick)
    float nucleus = exp(-r * r * 95.0) * 2.8;

    // 2. High-energy vaporous inner coma (sublimating icy gas)
    float innerComa = exp(-r * 4.2) * 0.95;

    // 3. Expansive diffuse outer coma halo (smooth organic fade)
    float outerHalo = exp(-r * 1.8) * 0.45 * smoothstep(1.0, 0.1, r);

    float totalGlow = nucleus + innerComa + outerHalo;

    // Nucleus is brilliant pure white, transitioning to glowing cyan/tail color
    vec3 col = mix(uColorTail, vec3(1.0), smoothstep(0.0, 0.35, nucleus));
    col = mix(col, uColorHead, innerComa * 0.6);

    float alpha = clamp(totalGlow, 0.0, 1.0) * uZoom * 0.92;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------------------------------------------------------------------------
// 3. PHOTOREALISTIC INTERSTELLAR COMET DUAL TAIL SHADER
// ---------------------------------------------------------------------------
export const COMET_TAIL_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const COMET_TAIL_FRAG = `
  uniform vec3 uColorHead;
  uniform vec3 uColorTail;
  uniform float uTime;
  uniform float uZoom;

  varying vec2 vUv;

  void main() {
    if (uZoom <= 0.001) discard;

    // x is length along the tail (0 = coma attachment, 1 = tail tip)
    // y is width across the tail (0 to 1)
    float distAlong = vUv.x;
    float lateral = abs(vUv.y - 0.5) * 2.0;

    // Tail expands naturally from the wide coma backwards
    float allowedWidth = 0.35 + distAlong * 0.65;
    if (lateral > allowedWidth) discard;

    float normLateral = lateral / allowedWidth;

    // 1. Narrow, intense fibrous ion stream (electric blue / cyan central spine)
    float ionCore = exp(-pow(normLateral * 2.4, 2.0) * 4.0);
    float ionRipples = sin(distAlong * 40.0 - uTime * 5.0 + lateral * 14.0) * 0.15;
    float ionStream = (ionCore + ionRipples * ionCore) * pow(1.0 - distAlong, 1.1);

    // 2. Broad, diffuse dust envelope trailing along the edges
    float dustEnvelope = exp(-pow(normLateral, 2.0) * 2.8) * pow(1.0 - distAlong, 1.8) * 0.65;

    float combinedDensity = ionStream * 0.95 + dustEnvelope * 0.55;

    // Color gradient: brilliant blue-white near coma, cooling to ethereal cyan/azure downstream
    vec3 col = mix(uColorHead, uColorTail, smoothstep(0.0, 0.75, distAlong));
    col += vec3(ionCore * 0.35); // intense bright ion core spine

    float alpha = clamp(combinedDensity, 0.0, 1.0) * uZoom * 0.88;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------------------------------------------------------------------------
// 3. GLOBULAR STAR CLUSTER M13 SHADERS (Plummer Potential & Core Attenuation)
// ---------------------------------------------------------------------------
export const GLOBULAR_POINTS_VERT = `
  attribute float aSize;
  attribute float aDist;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vDist;

  uniform float uZoom;

  void main() {
    vColor = aColor;
    vDist = aDist;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Core Attenuation: In the dense core (aDist close to 0), reduce point size so
    // hundreds of stars don't coalesce into a single solid white disk
    float coreSizeFactor = mix(0.40, 1.0, smoothstep(0.0, 0.42, aDist));
    gl_PointSize = aSize * coreSizeFactor * (320.0 / -mvPosition.z) * uZoom;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const GLOBULAR_POINTS_FRAG = `
  varying vec3 vColor;
  varying float vDist;

  uniform float uZoom;

  void main() {
    if (uZoom <= 0.001) discard;

    // Perfect Gaussian Circular Point Sprite (NO square pixels)
    vec2 p = gl_PointCoord - vec2(0.5);
    float r2 = dot(p, p);
    if (r2 > 0.25) discard;

    float gaussian = exp(-r2 * 14.0);

    // Core Alpha Attenuation: Heavily reduce individual star alpha in the crowded core
    // so 50 overlapping stars sum to ~0.85 radiance instead of blowing out to 5.0 solid white!
    float alphaFactor = mix(0.18, 0.88, smoothstep(0.0, 0.45, vDist));
    float alpha = gaussian * alphaFactor * uZoom;

    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const GLOBULAR_HAZE_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GLOBULAR_HAZE_FRAG = `
  uniform float uZoom;
  varying vec2 vUv;

  void main() {
    if (uZoom <= 0.001) discard;

    vec2 p = vUv - vec2(0.5);
    float r = length(p) * 2.0;
    if (r > 1.0) discard;

    // Unresolved stellar background glow: smooth, warm golden haze
    float haze = exp(-r * r * 8.5) * 0.38 * smoothstep(1.0, 0.15, r);
    vec3 col = vec3(1.0, 0.84, 0.58);

    float alpha = haze * uZoom * 0.75;
    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------------------------------------------------------------------------
// 4. GRAVITATIONAL LENSING EINSTEIN RING (Cosmic Horseshoe LRG 3-757)
// ---------------------------------------------------------------------------
export const EINSTEIN_RING_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const EINSTEIN_RING_FRAG = `
  uniform float uTime;
  uniform float uZoom;

  varying vec2 vUv;

  void main() {
    if (uZoom <= 0.001) discard;

    vec2 uv = vUv - vec2(0.5);
    float rawDist = length(uv);

    // Zero Box Borders: Alpha strictly reaches 0.0 before billboard edge
    float boundaryFade = smoothstep(0.48, 0.20, rawDist);
    if (boundaryFade <= 0.001) discard;

    // Elliptical coordinate system tilted by ~18 degrees
    float cosT = 0.951;
    float sinT = 0.309;
    vec2 pRot = vec2(uv.x * cosT - uv.y * sinT, uv.x * sinT + uv.y * cosT);
    vec2 pEllip = vec2(pRot.x / 1.15, pRot.y);
    float r = length(pEllip);
    float theta = atan(pEllip.y, pEllip.x);

    // 1. Cosmic Horseshoe Asymmetric Lensed Arc (continuous angular distance, NO branch-cut knife cut!)
    // Main arc centered at theta ~ 1.15 rad (~66°), smoothly tapering at both ends
    float dThetaMain = abs(atan(sin(theta - 1.15), cos(theta - 1.15)));
    float arcAngle = smoothstep(1.95, 1.40, dThetaMain);

    // Einstein Ring radius rE ~ 0.23 with narrow Gaussian width
    float arcRadial = exp(-pow((r - 0.23) / 0.024, 2.0));

    // Magnification Knots: Caustic brightness peaks of lensed star-forming regions
    float knots = pow(cos(dThetaMain * 3.8 + 0.3) * 0.5 + 0.5, 2.2) * 0.75 + 0.35;
    float mainArc = arcRadial * arcAngle * knots;

    // 2. Faint secondary counter-arc in the opposite lower-left region (theta ~ -1.99 rad)
    float dThetaCounter = abs(atan(sin(theta - (-1.99)), cos(theta - (-1.99))));
    float counterAngle = smoothstep(0.60, 0.20, dThetaCounter);
    float counterRadial = exp(-pow((r - 0.215) / 0.020, 2.0));
    float counterArc = counterRadial * counterAngle * 0.38;

    // 3. Foreground Lensing Elliptical Galaxy (faint, warm golden core at the center)
    float lensCore = exp(-r * r * 480.0) * 0.85;
    float lensHalo = exp(-r * r * 45.0) * 0.30;
    vec3 colLens = vec3(0.98, 0.70, 0.40) * (lensCore + lensHalo);

    // 4. Color of the lensed background galaxy: electric sky-blue / cyan / white
    vec3 colArc = mix(vec3(0.38, 0.82, 1.0), vec3(0.92, 0.97, 1.0), knots * 0.65);

    // 5. Subtle gravitational shimmer
    float shimmer = 1.0 + sin(uTime * 0.5 + dThetaMain * 2.5) * 0.04;

    vec3 col = colLens + colArc * (mainArc + counterArc) * shimmer;
    float totalIntensity = (mainArc + counterArc) * 1.35 + lensCore * 1.0 + lensHalo * 0.5;

    float alpha = clamp(totalIntensity, 0.0, 1.0) * boundaryFade * uZoom;
    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------------------------------------------------------------------------
// 5. JWST DEEP FIELD 8-SPIKE REFERENCE GUIDE STARS
// ---------------------------------------------------------------------------
export const JWST_STAR_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const JWST_STAR_FRAG = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uBloom;        // View-Angle Optical Bloom (0.38 at periphery -> 1.0 at center)
  uniform float uAngleOffset;  // Subtle Optical Lens Rotation from camera movement

  varying vec2 vUv;

  // Single radial ray spike with independent asynchronous breathing and outward radiant wave
  float getRaySpike(vec2 p, float angleRad, float width, float lengthDecay, float timePhase, float bloom) {
    float c = cos(angleRad);
    float s = sin(angleRad);
    // Rotate coordinate system so ray points along positive x-axis
    vec2 pr = vec2(p.x * c + p.y * s, -p.x * s + p.y * c);

    // Only radiate forward in positive direction (half-line ray)
    if (pr.x < -0.005) return 0.0;

    float lateral = abs(pr.y);
    float along = max(0.0, pr.x);

    // 1. Asymmetric independent breathing (15% - 25%) per ray
    float breath = 1.0 + sin(uTime * 2.2 + timePhase) * 0.18 + cos(uTime * 1.3 + timePhase * 1.7) * 0.08;

    // 2. Radiant micro-wave rippling from center towards ray tip
    float wave = 1.0 + sin(along * 42.0 - uTime * 6.0 + timePhase) * 0.16;

    // 3. View-Angle Bloom modulation:
    // When bloom is lower (edges of screen), rays become shorter (higher decay) and slightly thinner
    float effectiveDecay = lengthDecay / (bloom * breath);
    float effectiveWidth = width * (0.88 + 0.12 / bloom);

    float profile = exp(-lateral * effectiveWidth) * exp(-along * effectiveDecay);

    return profile * wave * breath;
  }

  void main() {
    vec2 uv = vUv - vec2(0.5);
    float dist = length(uv);

    // Spike Clipping Prevention: Smooth, wide taper strictly fading to 0.0 before billboard edge
    float boundaryFade = smoothstep(0.46, 0.08, dist);
    if (boundaryFade <= 0.001) discard;

    // Apply Subtle Camera-Linked Optical Rotation
    float baseAngle = uAngleOffset;

    // 6 Primary Hexagonal Diffraction Spikes (at 30°, 90°, 150°, 210°, 270°, 330°)
    // Each ray has an independent prime-derived time phase for organic asynchronous breathing
    float r1 = getRaySpike(uv, baseAngle + 0.523599, 150.0, 3.6, 0.00, uBloom); // 30 deg
    float r2 = getRaySpike(uv, baseAngle + 1.570796, 150.0, 3.6, 2.14, uBloom); // 90 deg
    float r3 = getRaySpike(uv, baseAngle + 2.617994, 150.0, 3.6, 4.28, uBloom); // 150 deg
    float r4 = getRaySpike(uv, baseAngle + 3.665191, 150.0, 3.6, 6.42, uBloom); // 210 deg
    float r5 = getRaySpike(uv, baseAngle + 4.712389, 150.0, 3.6, 1.57, uBloom); // 270 deg
    float r6 = getRaySpike(uv, baseAngle + 5.759587, 150.0, 3.6, 3.71, uBloom); // 330 deg
    float primarySpikes = r1 + r2 + r3 + r4 + r5 + r6;

    // 2 Faint Horizontal Secondary Strut Spikes at 0° and 180° (~35% intensity, shorter)
    float h1 = getRaySpike(uv, baseAngle + 0.000000, 200.0, 5.8, 5.23, uBloom) * 0.35; // 0 deg
    float h2 = getRaySpike(uv, baseAngle + 3.141593, 200.0, 5.8, 2.87, uBloom) * 0.35; // 180 deg
    float horizontalSpikes = h1 + h2;

    float totalSpikes = (primarySpikes + horizontalSpikes) * uBloom;

    // Diamond pinpoint incandescent core (tight, crystalline point source, NO fat blob)
    float core = exp(-dist * dist * 12000.0) * (3.5 + 0.8 * uBloom);
    vec3 whiteCore = vec3(1.0, 1.0, 1.0) * core;

    // Elegant compact chromatic halo surrounding the pinpoint core
    float innerHalo = exp(-dist * dist * 1400.0) * (1.1 + 0.3 * uBloom);
    float outerHalo = exp(-dist * dist * 140.0) * (0.32 + 0.12 * uBloom);
    vec3 haloCol = uColor * (innerHalo + outerHalo);

    // Chromatic aberration on diffraction spikes: pure white near center, stellar color outward
    vec3 spikeCol = mix(vec3(1.0), uColor, smoothstep(0.015, 0.22, dist));
    spikeCol.r *= 1.0 + smoothstep(0.06, 0.38, dist) * 0.20;
    spikeCol.b *= 1.0 - smoothstep(0.06, 0.38, dist) * 0.15;

    // Micro-twinkling
    float twinkle = 1.0 + sin(uTime * 1.8 + vUv.x * 20.0) * 0.05;

    vec3 col = whiteCore + haloCol + spikeCol * totalSpikes * 1.7 * twinkle;
    float totalIntensity = core * 1.6 + innerHalo * 1.2 + totalSpikes * 1.4 + outerHalo * 0.6;

    float alpha = clamp(totalIntensity, 0.0, 1.0) * boundaryFade;
    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

