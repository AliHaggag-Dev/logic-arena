export const NAV_LINKS = [
  { label: "Home", href: "/dashboard" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Black Market", href: "/black-market" },
  { label: "Docs", href: "/docs" },
  { label: "Arena Guide", href: "/arena-guide" },
];

export const ARENA_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Updates", href: "/patch-notes" },
  { label: "Report Bug", href: "/bug-report" },
  { label: "Request Feature", href: "/feature-requests" },
];

export const SOCIAL_LINKS = [
  { label: "LinkedIn", target: "_blank", href: "https://www.linkedin.com/in/ali-haggag7" },
  { label: "GitHub", target: "_blank", href: "https://github.com/Ali-Haggag7/logic-arena" },
  { label: "Portfolio", target: "_blank", href: "https://alihaggag.me" },
];

export const LEGAL_LINKS = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
  { label: "Contact", href: "/contact" },
];

export const ACCORDION_SECTIONS = [
  { title: "Navigate", links: NAV_LINKS },
  { title: "Arena", links: ARENA_LINKS },
  { title: "Social", links: SOCIAL_LINKS },
  { title: "Legal", links: LEGAL_LINKS },
] as const;
