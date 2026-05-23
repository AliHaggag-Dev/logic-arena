export function CampaignLayoutStyles() {
  return (
    <style>{`
      /* ── Scrollbar suppression ────────────────────────────────────────── */
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      /* ── Animations ───────────────────────────────────────────────────── */
      @keyframes shimmer {
        0%   { transform: translateX(-100%) skewX(-12deg); }
        100% { transform: translateX(300%)  skewX(-12deg); }
      }
      @keyframes scanLine {
        0%   { top: -2px; }
        100% { top: 100%; }
      }
      @keyframes campaignFadeIn {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes progressFill {
        from { transform: scaleX(0); }
      }
      @keyframes tabUnderlineIn {
        from { transform: scaleX(0); }
        to   { transform: scaleX(1); }
      }
      @keyframes cardGlowPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0); }
        50%      { box-shadow: 0 0 18px 2px rgba(var(--accent-rgb), 0.18); }
      }

      /* ════════════════════════════════════════════════════════════════════
         DESKTOP LAYOUT
         ════════════════════════════════════════════════════════════════════ */
      .desktop-layout {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 32px 120px;
        position: relative;
        z-index: 10;
        animation: campaignFadeIn 0.4s ease;
      }

      /* ── Hero ─────────────────────────────────────────────────────────── */
      .desktop-layout__hero {
        margin-bottom: 36px;
        padding: 28px 32px;
        border-radius: 20px;
        border: 1px solid rgba(var(--accent-rgb), 0.18);
        background: linear-gradient(
          135deg,
          rgba(var(--accent-rgb), 0.07) 0%,
          rgba(var(--accent-rgb), 0.02) 100%
        );
        box-shadow: 0 0 40px rgba(var(--accent-rgb), 0.08), inset 0 0 40px rgba(var(--accent-rgb), 0.03);
      }
      .desktop-layout__hero-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .desktop-layout__hero-icon {
        width: 22px;
        height: 22px;
        color: rgba(var(--accent-rgb), 0.7);
        flex-shrink: 0;
      }
      .desktop-layout__hero-title {
        font-size: 26px;
        font-weight: 900;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--accent);
        text-shadow: 0 0 18px rgba(var(--accent-rgb), 0.7), 0 0 40px rgba(var(--accent-rgb), 0.35);
        line-height: 1;
      }

      .desktop-layout__hero-stats {
        display: flex;
        align-items: center;
        gap: 32px;
        flex-wrap: wrap;
      }
      .desktop-layout__stat-block {
        flex: 1;
        min-width: 200px;
        max-width: 400px;
      }
      .desktop-layout__stat-label-row {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: rgba(var(--accent-rgb), 0.5);
        margin-bottom: 6px;
      }
      .desktop-layout__stat-value {
        color: rgba(var(--accent-rgb), 0.85);
      }
      .desktop-layout__progress-track {
        height: 4px;
        border-radius: 99px;
        background: rgba(var(--accent-rgb), 0.1);
        overflow: hidden;
      }
      .desktop-layout__progress-fill {
        height: 100%;
        border-radius: 99px;
        background: var(--accent);
        box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.8);
        transform-origin: left center;
        transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        animation: progressFill 1s cubic-bezier(0.25, 1, 0.5, 1);
      }
      .desktop-layout__star-counter {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .desktop-layout__star-icon {
        width: 18px;
        height: 18px;
        color: rgba(var(--accent-rgb), 0.9);
        filter: drop-shadow(0 0 6px rgba(var(--accent-rgb), 0.7));
      }
      .desktop-layout__star-text {
        font-size: 15px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--accent);
        text-shadow: 0 0 10px rgba(var(--accent-rgb), 0.6);
      }

      /* ── Tab bar ──────────────────────────────────────────────────────── */
      .desktop-layout__tab-bar {
        display: flex;
        gap: 4px;
        margin-bottom: 24px;
        border-bottom: 1px solid rgba(var(--accent-rgb), 0.1);
        padding-bottom: 0;
      }
      .desktop-layout__tab-btn {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 16px 12px;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 8px 8px 0 0;
        flex: 1;
        min-width: 0;
      }
      .desktop-layout__tab-btn:hover {
        background: rgba(var(--accent-rgb), 0.05);
      }
      .desktop-layout__tab-btn--active {
        background: rgba(var(--accent-rgb), 0.08);
      }
      .desktop-layout__tab-icon {
        width: 15px;
        height: 15px;
        color: rgba(var(--accent-rgb), 0.45);
        transition: color 0.2s;
        flex-shrink: 0;
      }
      .desktop-layout__tab-btn--active .desktop-layout__tab-icon {
        color: var(--accent);
        filter: drop-shadow(0 0 4px rgba(var(--accent-rgb), 0.6));
      }
      .desktop-layout__tab-label {
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(var(--accent-rgb), 0.45);
        transition: color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .desktop-layout__tab-btn--active .desktop-layout__tab-label {
        color: var(--accent);
      }
      .desktop-layout__tab-progress {
        font-size: 7.5px;
        font-weight: 900;
        letter-spacing: 0.15em;
        color: rgba(var(--accent-rgb), 0.3);
        transition: color 0.2s;
      }
      .desktop-layout__tab-progress--active {
        color: rgba(var(--accent-rgb), 0.7);
      }
      .desktop-layout__tab-underline {
        position: absolute;
        bottom: 0;
        left: 8px;
        right: 8px;
        height: 2px;
        border-radius: 2px 2px 0 0;
        background: var(--accent);
        box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.9);
        animation: tabUnderlineIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        transform-origin: center;
      }

      /* ── Level Grid ───────────────────────────────────────────────────── */
      .desktop-layout__grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 14px;
      }
      .desktop-layout__grid-placeholder {
        min-height: 180px;
        border-radius: 16px;
        border: 1px dashed rgba(var(--accent-rgb), 0.05);
      }

      /* ════════════════════════════════════════════════════════════════════
         MOBILE LAYOUT
         ════════════════════════════════════════════════════════════════════ */
      .mobile-layout {
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 10;
      }
      .mobile-layout__sticky-header {
        position: sticky;
        top: 0;
        z-index: 30;
        background: rgba(var(--bg-primary-rgb, 10, 10, 20), 0.95);
        backdrop-filter: blur(12px);
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(var(--accent-rgb), 0.08);
      }

      /* Summary row */
      .mobile-layout__summary-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 14px 16px 8px;
      }
      .mobile-layout__title {
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--accent);
        text-shadow: 0 0 16px rgba(var(--accent-rgb), 0.6);
        line-height: 1;
      }
      .mobile-layout__summary-stats {
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.15em;
        color: rgba(var(--accent-rgb), 0.55);
        text-transform: uppercase;
      }

      /* Tab strip */
      .mobile-layout__tab-strip {
        display: flex;
        gap: 8px;
        padding: 0 16px;
        overflow-x: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
        touch-action: pan-x pan-y;
        -webkit-overflow-scrolling: touch;
        background: rgba(0, 0, 0, 0.001);
      }
      .mobile-layout__tab-strip::-webkit-scrollbar { display: none; }

      .mobile-layout__tab-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        border-radius: 12px;
        border: 1px solid rgba(var(--accent-rgb), 0.12);
        background: rgba(var(--accent-rgb), 0.03);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .mobile-layout__tab-btn--active {
        background: rgba(var(--accent-rgb), 0.15);
        border-color: rgba(var(--accent-rgb), 0.5);
        box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.2);
      }
      .mobile-layout__tab-icon {
        width: 12px;
        height: 12px;
        color: rgba(var(--accent-rgb), 0.4);
        flex-shrink: 0;
        transition: color 0.2s;
      }
      .mobile-layout__tab-btn--active .mobile-layout__tab-icon {
        color: var(--accent);
      }
      .mobile-layout__tab-label {
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        white-space: nowrap;
        color: rgba(var(--accent-rgb), 0.4);
        transition: color 0.2s;
      }
      .mobile-layout__tab-btn--active .mobile-layout__tab-label {
        color: var(--accent);
      }
      .mobile-layout__tab-progress {
        font-size: 8px;
        font-weight: 900;
        color: rgba(var(--accent-rgb), 0.3);
        transition: color 0.2s;
      }
      .mobile-layout__tab-progress--active {
        color: rgba(var(--accent-rgb), 0.7);
      }

      /* Tab progress bar */
      .mobile-layout__tab-progress-bar-wrap {
        padding: 8px 16px 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .mobile-layout__tab-progress-bar {
        flex: 1;
        height: 3px;
        border-radius: 99px;
        background: rgba(var(--accent-rgb), 0.1);
        overflow: hidden;
      }
      .mobile-layout__tab-progress-fill {
        height: 100%;
        border-radius: 99px;
        background: var(--accent);
        box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.8);
        transform-origin: left center;
        transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
      }
      .mobile-layout__tab-progress-label {
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: rgba(var(--accent-rgb), 0.4);
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* Level list */
      .mobile-layout__level-list {
        list-style: none;
        margin: 0;
        padding: 12px 16px 120px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      /* ════════════════════════════════════════════════════════════════════
         LEVEL CARD (shared — desktop + mobile)
         ════════════════════════════════════════════════════════════════════ */
      .level-card {
        position: relative;
        display: flex;
        overflow: hidden;
        border-radius: 14px;
        border: 1px solid rgba(var(--accent-rgb), 0.12);
        background: var(--bg-primary);
        transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
        will-change: transform, opacity;
        text-align: left;
        width: 100%;
        font-family: inherit;
      }

      /* Desktop variant */
      .level-card--desktop {
        flex-direction: column;
        min-height: 180px;
      }
      /* Mobile variant */
      .level-card--mobile {
        flex-direction: row;
        min-height: 96px;
      }

      /* Locked */
      .level-card--locked {
        opacity: 0.5;
        filter: saturate(0.4);
        cursor: not-allowed;
      }

      /* Unlocked + active */
      .level-card--active {
        cursor: pointer;
        border-color: rgba(var(--accent-rgb), 0.22);
      }
      .level-card--active:hover {
        border-color: rgba(var(--accent-rgb), 0.55);
        box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.14), 0 4px 16px rgba(0,0,0,0.3);
        transform: translateY(-2px);
      }
      .level-card--active:active {
        transform: scale(0.98);
      }

      /* Completed */
      .level-card--completed {
        cursor: pointer;
        border-color: rgba(var(--accent-rgb), 0.14);
        background: rgba(var(--accent-rgb), 0.02);
      }
      .level-card--completed:hover {
        border-color: rgba(var(--accent-rgb), 0.35);
        box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.1);
        transform: translateY(-1px);
      }

      /* ── Diff bar (left strip on mobile, top strip on desktop) ────────── */
      .level-card__diff-bar {
        flex-shrink: 0;
        background: var(--diff-color, rgba(var(--accent-rgb), 0.5));
        transition: box-shadow 0.2s ease;
      }
      .level-card--mobile .level-card__diff-bar {
        width: 4px;
      }
      .level-card--desktop .level-card__diff-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        width: 100%;
      }
      .level-card__diff-bar--glow {
        box-shadow: 0 0 8px var(--diff-color, rgba(var(--accent-rgb), 0.5));
      }
      .level-card--active:hover .level-card__diff-bar--glow {
        box-shadow: 0 0 16px var(--diff-color, rgba(var(--accent-rgb), 0.7));
      }

      /* ── Body ─────────────────────────────────────────────────────────── */
      .level-card__body {
        display: flex;
        flex-direction: column;
        flex: 1;
        padding: 14px;
        min-width: 0;
        position: relative;
        z-index: 1;
      }
      .level-card--desktop .level-card__body {
        padding-top: 18px;
      }

      /* ── Top row ──────────────────────────────────────────────────────── */
      .level-card__top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .level-card__order {
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: rgba(var(--accent-rgb), 0.45);
      }
      .level-card__lock-icon {
        width: 14px;
        height: 14px;
        color: rgba(var(--accent-rgb), 0.25);
        flex-shrink: 0;
      }
      .level-card__badges-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .level-card__clear-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--sem-success);
        background: color-mix(in srgb, var(--sem-success) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--sem-success) 20%, transparent);
        padding: 2px 7px;
        border-radius: 99px;
      }
      .level-card__info-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        min-width: 48px;
        min-height: 48px;
        border-radius: 6px;
        border: 1px solid rgba(var(--accent-rgb), 0.18);
        color: rgba(var(--accent-rgb), 0.45);
        background: transparent;
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
      }
      .level-card__info-btn:hover {
        color: var(--accent);
        border-color: rgba(var(--accent-rgb), 0.5);
        background: rgba(var(--accent-rgb), 0.1);
      }

      /* ── Title ────────────────────────────────────────────────────────── */
      .level-card__title {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        line-height: 1.3;
        color: var(--accent);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        margin-bottom: 6px;
        flex: 1;
      }
      .level-card--mobile .level-card__title {
        font-size: 13px;
      }
      .level-card__title--locked {
        color: rgba(var(--accent-rgb), 0.3);
      }
      .level-card__title--completed {
        color: rgba(var(--accent-rgb), 0.5);
      }

      /* ── Description (mobile only) ────────────────────────────────────── */
      .level-card__description {
        font-size: 10px;
        color: rgba(var(--accent-rgb), 0.35);
        line-height: 1.6;
        letter-spacing: 0.03em;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 8px;
      }

      /* ── Footer ───────────────────────────────────────────────────────── */
      .level-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 8px;
        border-top: 1px solid rgba(var(--accent-rgb), 0.07);
        gap: 6px;
        flex-wrap: wrap;
      }
      .level-card__badge {
        display: inline-block;
        font-size: 7.5px;
        font-weight: 900;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        border-radius: 4px;
        padding: 2px 6px;
        border-width: 1px;
        border-style: solid;
      }
      .level-card__right-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .level-card__points {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 9px;
        font-weight: 900;
        color: rgba(var(--accent-rgb), 0.5);
        letter-spacing: 0.06em;
      }
      .level-card__points--locked {
        color: rgba(var(--accent-rgb), 0.2);
      }
      .level-card__points-icon {
        width: 10px;
        height: 10px;
        flex-shrink: 0;
        color: inherit;
      }
      .level-card__points-icon--lit {
        color: var(--sem-warning);
      }

      /* ── Hover glow overlay ───────────────────────────────────────────── */
      .level-card__hover-glow {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.04), transparent);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        border-radius: inherit;
      }
      .level-card--active:hover .level-card__hover-glow,
      .level-card--completed:hover .level-card__hover-glow {
        opacity: 1;
      }
    `}</style>
  );
}
