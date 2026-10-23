
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
