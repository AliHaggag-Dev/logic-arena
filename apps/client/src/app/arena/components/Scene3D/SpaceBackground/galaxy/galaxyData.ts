import { Color } from "three";
import { GALAXY_MAX_RADIUS, BULGE_RADIUS, CORE_BLACK_HOLE_RADIUS } from "./constants";
import { GalaxyBuffers, DustBuffers, GalaxyThemePalette } from "./types";

export const generateGalaxyData = (
  starCount: number,
  palette: GalaxyThemePalette
): GalaxyBuffers => {
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const alphas = new Float32Array(starCount);
  const twinkles = new Float32Array(starCount * 2);

  const {
    coreColor,
    coreHighlight,
    armColorInner,
    armColorOuter,
    starburstColor,
  } = palette;

  for (let i = 0; i < starCount; i++) {
    const p = Math.random();

    let x = 0;
    let y = 0;
    let z = 0;
    let starColor = new Color();
    let size = 3.5;
    let alpha = 0.85;

    // ─────────────────────────────────────────────────────────────
    // 1. CENTRAL BULGE & NUCLEUS (~22% of stars)
    // ─────────────────────────────────────────────────────────────
    if (p < 0.22) {
      // Exponential central concentration with a minimum clearance at the Event Horizon
      const rRatio = Math.pow(Math.random(), 1.7);
      const r = CORE_BLACK_HOLE_RADIUS + rRatio * (BULGE_RADIUS - CORE_BLACK_HOLE_RADIUS);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      // Oblique ellipsoidal flattening (thick core, but flattened along Y)
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.cos(phi) * 0.48; // 48% vertical axis
      z = r * Math.sin(phi) * Math.sin(theta);

      // Older Population II stars: warm golden core transitioning to creamy white
      const t = r / BULGE_RADIUS;
      starColor.copy(coreHighlight).lerp(coreColor, 1.0 - t);

      // Random stellar spectral variance
      const colorJitter = (Math.random() - 0.5) * 0.08;
      starColor.r = Math.max(0, Math.min(1, starColor.r + colorJitter));
      starColor.g = Math.max(0, Math.min(1, starColor.g + colorJitter * 0.6));
      starColor.b = Math.max(0, Math.min(1, starColor.b - colorJitter * 0.5));

      size = 2.2 + Math.random() * 3.8;
      alpha = 0.75 + Math.random() * 0.25;
    }
    // ─────────────────────────────────────────────────────────────
    // 2. PRIMARY LOGARITHMIC SPIRAL ARMS (~50% of stars)
    // ─────────────────────────────────────────────────────────────
    else if (p < 0.72) {
      // 2 grand-design logarithmic spiral arms
      const armIdx = Math.random() < 0.5 ? 0 : 1;
      const baseArmAngle = armIdx * Math.PI;

      // Distance distribution along the arms (from bulge rim to outer perimeter)
      const rT = Math.pow(Math.random(), 1.25);
      const r = BULGE_RADIUS * 0.8 + rT * (GALAXY_MAX_RADIUS - BULGE_RADIUS * 0.8);

      // Logarithmic spiral pitch formula: theta = theta_0 + b * ln(r / r_0)
      const bPitch = 0.23;
      const spiralTheta = (1.0 / bPitch) * Math.log(r / (BULGE_RADIUS * 0.75));

      // Gaussian bell-curve dispersion across the arm width (tighter in the center)
      const gaussian = (Math.random() + Math.random() + Math.random() - 1.5) * 0.38;
      const theta = baseArmAngle + spiralTheta + gaussian;

      // Exponential vertical tapering (thin disk, thinner at outer margins)
      const diskThickness = 32.0 * Math.exp(-r / 550.0);
      const yGaussian = (Math.random() + Math.random() - 1.0) * diskThickness;

      x = Math.cos(theta) * r;
      y = yGaussian;
      z = Math.sin(theta) * r;

      // Color gradient: Inner young blue-white -> outer cyan/purple
      const armFraction = (r - BULGE_RADIUS) / (GALAXY_MAX_RADIUS - BULGE_RADIUS);
      starColor.copy(armColorInner).lerp(armColorOuter, armFraction);

      // 8% of arm stars are luminous supergiant beacons
      if (Math.random() < 0.08) {
        size = 5.5 + Math.random() * 3.5;
        alpha = 1.0;
        starColor.lerp(new Color("#ffffff"), 0.5); // Brilliant core
      } else {
        size = 2.5 + Math.random() * 2.8;
        alpha = 0.7 + Math.random() * 0.3;
      }
    }
    // ─────────────────────────────────────────────────────────────
    // 3. H-II STARBURST REGIONS & SECONDARY SPURS (~18% of stars)
    // ─────────────────────────────────────────────────────────────
    else if (p < 0.90) {
      // 2 secondary branching arms + bridging spurs
      const spurIdx = Math.floor(Math.random() * 4);
      const baseAngle = (spurIdx * Math.PI) / 2 + 0.42;

      const rT = Math.pow(Math.random(), 1.1);
      const r = BULGE_RADIUS * 1.1 + rT * (GALAXY_MAX_RADIUS * 0.88 - BULGE_RADIUS);

      const bPitch = 0.28;
      const spiralTheta = (1.0 / bPitch) * Math.log(r / (BULGE_RADIUS * 0.9));
      const spread = (Math.random() + Math.random() - 1.0) * 0.55;
      const theta = baseAngle + spiralTheta + spread;

      const diskThickness = 24.0 * Math.exp(-r / 480.0);
      const yGaussian = (Math.random() - 0.5) * diskThickness;

      x = Math.cos(theta) * r;
      y = yGaussian;
      z = Math.sin(theta) * r;

      // 40% of these are active starburst knots (vibrant magenta/violet H-II ionization)
      if (Math.random() < 0.40) {
        starColor.copy(starburstColor).lerp(new Color("#ffffff"), Math.random() * 0.35);
        size = 4.2 + Math.random() * 3.2;
        alpha = 0.95;
      } else {
        starColor.copy(armColorOuter).lerp(armColorInner, Math.random() * 0.5);
        size = 2.4 + Math.random() * 2.0;
        alpha = 0.65 + Math.random() * 0.25;
      }
    }
    // ─────────────────────────────────────────────────────────────
    // 4. INTER-ARM DISK & OUTER STELLAR HALO (~10% of stars)
    // ─────────────────────────────────────────────────────────────
    else {
      // Diffuse stellar population between arms and surrounding the halo
      const r = Math.pow(Math.random(), 1.4) * (GALAXY_MAX_RADIUS * 1.05);
      const theta = Math.random() * Math.PI * 2;

      // Thicker spherical/ellipsoid halo distribution
      const haloThickness = 55.0 * Math.exp(-r / 600.0);
      const yGaussian = (Math.random() + Math.random() + Math.random() - 1.5) * haloThickness;

      x = Math.cos(theta) * r;
      y = yGaussian;
      z = Math.sin(theta) * r;

      // Soft faint stars
      const t = r / GALAXY_MAX_RADIUS;
      starColor.copy(coreColor).lerp(armColorOuter, t).multiplyScalar(0.75);

      size = 1.8 + Math.random() * 2.2;
      alpha = 0.45 + Math.random() * 0.35;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = starColor.r;
    colors[i * 3 + 1] = starColor.g;
    colors[i * 3 + 2] = starColor.b;

    sizes[i] = size;
    alphas[i] = alpha;

    // Twinkling parameters (frequency 1.5 - 6.0 Hz, phase 0 - 2PI)
    twinkles[i * 2] = 1.5 + Math.random() * 4.5;
    twinkles[i * 2 + 1] = Math.random() * Math.PI * 2;
  }

  return { positions, colors, sizes, alphas, twinkles };
};

// ---------------------------------------------------------------------------
// INTERSTELLAR DUST LANES GENERATOR (Dark Absorption Filaments)
// ---------------------------------------------------------------------------
export const generateDustData = (
  dustCount: number,
  palette: GalaxyThemePalette
): DustBuffers => {
  const positions = new Float32Array(dustCount * 3);
  const colors = new Float32Array(dustCount * 3);
  const sizes = new Float32Array(dustCount);
  const alphas = new Float32Array(dustCount);

  const { dustColor } = palette;

  for (let i = 0; i < dustCount; i++) {
    // Dust lanes trail along the inner concave edge of the 2 primary arms
    const armIdx = i % 2;
    const baseArmAngle = armIdx * Math.PI;

    // Dust runs from the outer bulge out to ~85% of galaxy radius
    const rT = Math.pow(Math.random(), 1.15);
    const r = BULGE_RADIUS * 0.95 + rT * (GALAXY_MAX_RADIUS * 0.85 - BULGE_RADIUS);

    const bPitch = 0.23;
    const spiralTheta = (1.0 / bPitch) * Math.log(r / (BULGE_RADIUS * 0.75));

    // Shift slightly inward (-0.18 rad) to sit on the inner edge of the star arms
    const inwardOffset = -0.16;
    const spread = (Math.random() + Math.random() - 1.0) * 0.18;
    const theta = baseArmAngle + spiralTheta + inwardOffset + spread;

    // Dust is very thin, strictly confined to the midplane
    const diskThickness = 12.0 * Math.exp(-r / 500.0);
    const y = (Math.random() - 0.5) * diskThickness;

    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * r;

    // Dark absorbing silhouetted tone
    const darkness = 0.85 + Math.random() * 0.15;
    colors[i * 3] = dustColor.r * darkness;
    colors[i * 3 + 1] = dustColor.g * darkness;
    colors[i * 3 + 2] = dustColor.b * darkness;

    // Wide, soft puffs of dust
    sizes[i] = 16.0 + Math.random() * 24.0;
    alphas[i] = 0.55 + Math.random() * 0.35;
  }

  return { positions, colors, sizes, alphas };
};
