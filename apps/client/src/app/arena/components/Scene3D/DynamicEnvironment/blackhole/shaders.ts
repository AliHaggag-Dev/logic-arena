/**
 * Schwarzschild ray tracer.
 *
 * Every fragment of a back-faced bounding sphere launches a photon backwards
 * from the camera and integrates its null geodesic. In Cartesian form the
 * exact Schwarzschild photon orbit equation  d²u/dφ² + u = 3Mu²  is equivalent
 * to the central-force ODE
 *
 *     d²x/dλ² = −(3/2) r_s h² x / r⁵ ,   h = |x × dx/dλ|  (conserved)
 *
 * which is integrated with adaptive velocity-Verlet. Crossings of the y = 0
 * plane are shaded as a thin Novikov–Thorne accretion disk with the full
 * relativistic redshift factor g; escaping rays sample a captured cubemap of
 * the real scene in their *bent* direction (gravitational lensing).
 */

export const LENSING_VERTEX_SHADER = /* glsl */ `
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LENSING_FRAGMENT_SHADER = /* glsl */ `
  #define R_S 2.0
  #define PHOTON_FORCE (1.5 * R_S)
  #define MIN_STEP 0.02
  #define OPAQUE_THRESHOLD 0.995
  #define MIN_ALPHA 0.0001
  #define G_EPSILON 0.001
  #define FLOW_PERIOD 60.0
  #define AZIMUTHAL_SCALE 1.6
  #define RADIAL_SCALE 2.4
  #define INNER_EDGE_SOFTNESS 0.06
  #define OUTER_FADE_FRACTION 0.35
  #define DENSITY_FLOOR 0.18
  #define DISK_OPACITY 0.92
  #define TURBULENCE_BRIGHTNESS 0.9
  #define PLANCK_MIN_K 1667.0
  #define PLANCK_MAX_K 25000.0
  #define PLANCK_MID_K 4000.0
  #define PLANCK_LOW_K 2222.0

  uniform vec3 uCamPos;
  uniform float uCamRedshift;
  uniform float uObserverBoost;
  uniform float uTime;
  uniform samplerCube uEnvMap;
  uniform float uEnvReady;
  uniform mat3 uEnvRotation;
  uniform float uBeaming;
  uniform float uZeroTorque;
  uniform float uPeakTemperature;
  uniform float uTempNorm;
  uniform float uExposure;
  uniform float uDiskInner;
  uniform float uDiskOuter;
  uniform float uBoundRadius;
  uniform float uFadeStart;
  uniform float uStepScale;

  varying vec3 vLocalPos;

  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float n000 = hash13(i);
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
      mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
      u.z
    );
  }

  float fbm(vec3 p) {
    float amplitude = 0.5;
    float sum = 0.0;
    for (int i = 0; i < FBM_OCTAVES; i++) {
      sum += amplitude * valueNoise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.4);
      amplitude *= 0.5;
    }
    return sum;
  }

  // Sampling noise on a circle keeps it 2π-periodic in azimuth; the high radial
  // frequency produces the concentric streaks of a sheared plasma disk.
  float streakNoise(float r, float angle, float seed) {
    return fbm(vec3(cos(angle) * AZIMUTHAL_SCALE, sin(angle) * AZIMUTHAL_SCALE, r * RADIAL_SCALE + seed));
  }

  // Keplerian differential rotation Ω(r) = √(M/r³) (coordinate time).
  // Two flow layers half a period apart are cross-faded so the infinite shear
  // of differential rotation never visibly accumulates.
  float diskTurbulence(float r, float phi) {
    float omega = inversesqrt(r * r * r);
    float cycle = uTime / FLOW_PERIOD;
    float phase0 = fract(cycle);
    float phase1 = fract(cycle + 0.5);
    float blend = abs(2.0 * phase0 - 1.0);
    float n0 = streakNoise(r, phi + omega * phase0 * FLOW_PERIOD, 0.0);
    float n1 = streakNoise(r, phi + omega * phase1 * FLOW_PERIOD, 17.0);
    return mix(n0, n1, blend);
  }

  // Planckian locus (Kim et al. 2002) → CIE XYZ → linear sRGB, max = 1.
  vec3 blackbody(float temperature) {
    float t = clamp(temperature, PLANCK_MIN_K, PLANCK_MAX_K);
    float u = 1000.0 / t;
    float u2 = u * u;
    float u3 = u2 * u;
    float x = t <= PLANCK_MID_K
      ? -0.2661239 * u3 - 0.2343589 * u2 + 0.8776956 * u + 0.17991
      : -3.0258469 * u3 + 2.1070379 * u2 + 0.2226347 * u + 0.24039;
    float x2 = x * x;
    float x3 = x2 * x;
    float y;
    if (t <= PLANCK_LOW_K) y = -1.1063814 * x3 - 1.3481102 * x2 + 2.18555832 * x - 0.20219683;
    else if (t <= PLANCK_MID_K) y = -0.9549476 * x3 - 1.37418593 * x2 + 2.09137015 * x - 0.16748867;
    else y = 3.081758 * x3 - 5.8733867 * x2 + 3.75112997 * x - 0.37001483;
    vec3 xyz = vec3(x / y, 1.0, (1.0 - x - y) / y);
    vec3 rgb = max(mat3(
      3.2406, -0.9689, 0.0557,
      -1.5372, 1.8758, -0.2040,
      -0.4986, 0.0415, 1.0570
    ) * xyz, 0.0);
    return rgb / max(max(rgb.r, rgb.g), max(rgb.b, MIN_ALPHA));
  }

  // lambda = L_z / E of the photon (conserved). Returns premultiplied-ready
  // emission (rgb) and absorption (a).
  vec4 sampleDisk(vec3 hit, float lambda) {
    float r = length(hit.xz);
    if (r < uDiskInner * (1.0 - INNER_EDGE_SOFTNESS) || r > uDiskOuter) return vec4(0.0);

    float phi = atan(hit.z, hit.x);
    float innerEdge = smoothstep(uDiskInner * (1.0 - INNER_EDGE_SOFTNESS), uDiskInner * (1.0 + INNER_EDGE_SOFTNESS), r);
    float outerEdge = 1.0 - smoothstep(mix(uDiskInner, uDiskOuter, OUTER_FADE_FRACTION), uDiskOuter, r);
    float turbulence = diskTurbulence(r, phi);
    float density = innerEdge * outerEdge * mix(DENSITY_FLOOR, 1.0, smoothstep(0.2, 0.8, turbulence));

    // Thin-disk temperature with optional Novikov–Thorne zero-torque term.
    float x = uDiskInner / max(r, uDiskInner);
    float torque = pow(max(1.0 - sqrt(x), MIN_ALPHA), 0.25 * uZeroTorque);
    float tRel = pow(x, 0.75) * torque * uTempNorm;

    // g = E_obs / E_emit for a circular Keplerian emitter:
    //   g∞ = √(1 − 3M/r) / (1 − Ω λ),   then boosted for a static observer
    //   deep in the potential by 1/√(1 − r_s/r_cam).
    float omega = inversesqrt(r * r * r);
    float gInf = sqrt(max(1.0 - 3.0 / r, MIN_ALPHA)) / max(1.0 - omega * lambda, G_EPSILON);
    float g = exp(uBeaming * log(gInf / uCamRedshift));

    // Liouville: I_ν/ν³ invariant ⇒ bolometric I_obs = g⁴ I_emit, T_obs = g T.
    float tObserved = uPeakTemperature * tRel * g;
    float g2 = g * g;
    float t2 = tRel * tRel;
    float flux = t2 * t2 * g2 * g2;
    vec3 emission = blackbody(tObserved) * flux * uExposure * mix(1.0 - TURBULENCE_BRIGHTNESS * 0.5, 1.0 + TURBULENCE_BRIGHTNESS * 0.5, turbulence);

    return vec4(emission, clamp(density * DISK_OPACITY, 0.0, 1.0));
  }

  vec3 photonAcceleration(vec3 p, float h2) {
    float r2 = dot(p, p);
    return -PHOTON_FORCE * h2 * p / (r2 * r2 * sqrt(r2));
  }

  void main() {
    vec3 viewDir = normalize(vLocalPos - uCamPos);
    float rCam = length(uCamPos);
    vec3 rHat = uCamPos / rCam;

    // Static-observer local frame → Schwarzschild coordinate direction:
    // e_r̂ = √(1 − r_s/r) ∂_r, so the radial component is contracted.
    float radial = dot(viewDir, rHat);
    vec3 v = normalize(viewDir - (1.0 - uCamRedshift) * radial * rHat);

    // Photon specific angular momentum ℓ = r sinα / √(1 − r_s/r) (sign: arriving photon).
    float lambda = -cross(uCamPos, viewDir).y / uCamRedshift;

    vec3 p = uCamPos;
    float edgeWeight = 1.0;
    if (rCam > uBoundRadius) {
      float tca = -dot(uCamPos, v);
      float d2 = rCam * rCam - tca * tca;
      float bound2 = uBoundRadius * uBoundRadius;
      if (tca < 0.0 || d2 > bound2) discard;
      p = uCamPos + v * (tca - sqrt(bound2 - d2));
      edgeWeight = 1.0 - smoothstep(uFadeStart, uBoundRadius, sqrt(d2));
    }

    vec3 hVec = cross(p, v);
    float h2 = dot(hVec, hVec);
    vec3 acc = photonAcceleration(p, h2);

    vec3 color = vec3(0.0);
    float alpha = 0.0;
    bool escaped = false;

    for (int i = 0; i < MAX_STEPS; i++) {
      float r = length(p);
      float stepSize = max(uStepScale * r / length(v), MIN_STEP);

      vec3 pNext = p + v * stepSize + 0.5 * acc * stepSize * stepSize;
      vec3 accNext = photonAcceleration(pNext, h2);
      v += 0.5 * (acc + accNext) * stepSize;

      if (p.y * pNext.y < 0.0) {
        vec3 hit = mix(p, pNext, p.y / (p.y - pNext.y));
        vec4 disk = sampleDisk(hit, lambda);
        color += (1.0 - alpha) * disk.rgb * disk.a;
        alpha += (1.0 - alpha) * disk.a;
        if (alpha > OPAQUE_THRESHOLD) break;
      }

      p = pNext;
      acc = accNext;
      float rNext = length(p);
      if (rNext < R_S) break;
      if (rNext > uBoundRadius && dot(p, v) > 0.0) {
        escaped = true;
        break;
      }
    }

    float remaining = 1.0 - alpha;
    float backgroundAlpha = escaped ? edgeWeight * uEnvReady : 1.0;
    vec3 background = escaped
      ? textureCube(uEnvMap, uEnvRotation * normalize(v)).rgb * uObserverBoost * uEnvReady
      : vec3(0.0);

    color += remaining * background * backgroundAlpha;
    alpha += remaining * backgroundAlpha;
    if (alpha < MIN_ALPHA) discard;

    gl_FragColor = vec4(color / alpha, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb *= gl_FragColor.a;
  }
`;
