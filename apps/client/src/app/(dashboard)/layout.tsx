"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavLink from "../../components/ui/NavLink";

const SIDEBAR_WIDTH = 220;

const navItems = [
  { href: "/dashboard", label: "COMMAND_CENTER", icon: "⬡" },
  { href: "/leaderboard", label: "NEURAL_RANKINGS", icon: "◈" },
  { href: "/lobby", label: "BATTLE_LOBBY", icon: "▶" },
  { href: "/profile", label: "OPERATOR_PROFILE", icon: "◉" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [logoutHover, setLogoutHover] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    router.push("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#030712",
        fontFamily: "var(--font-geist-mono), monospace",
      }}
    >
      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: `${SIDEBAR_WIDTH}px`,
          minWidth: `${SIDEBAR_WIDTH}px`,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(3, 7, 18, 0.95)",
          borderRight: "1px solid rgba(34, 211, 238, 0.12)",
          boxShadow: "4px 0 30px rgba(34, 211, 238, 0.04)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          zIndex: 50,
        }}
      >
        {/* Scanline overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(34,211,238,0.015) 3px, rgba(34,211,238,0.015) 4px)",
            zIndex: 0,
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, #22d3ee, transparent)",
            opacity: 0.6,
            flexShrink: 0,
          }}
        />

        {/* ── LOGO ── */}
        <div
          style={{
            padding: "24px 18px 20px",
            borderBottom: "1px solid rgba(34, 211, 238, 0.08)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "8px",
              letterSpacing: "0.25em",
              color: "rgba(34, 211, 238, 0.4)",
              fontWeight: 700,
              marginBottom: "6px",
              textTransform: "uppercase",
            }}
          >
            // SYS_v1.6.0
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#22d3ee",
              textShadow:
                "0 0 8px rgba(34, 211, 238, 0.8), 0 0 25px rgba(34, 211, 238, 0.4), 0 0 50px rgba(34, 211, 238, 0.15)",
              lineHeight: 1.2,
            }}
          >
            LOGIC ARENA
          </h1>
          <div
            style={{
              marginTop: "8px",
              height: "1px",
              background:
                "linear-gradient(90deg, #22d3ee, transparent)",
              opacity: 0.3,
            }}
          />
        </div>

        {/* ── NAV LINKS ── */}
        <nav
          style={{
            flex: 1,
            padding: "16px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "8px",
              letterSpacing: "0.22em",
              color: "rgba(34, 211, 238, 0.25)",
              fontWeight: 700,
              padding: "0 4px 8px",
              textTransform: "uppercase",
            }}
          >
            navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </nav>

        {/* ── USER + LOGOUT ── */}
        <div
          style={{
            padding: "14px 12px",
            borderTop: "1px solid rgba(34, 211, 238, 0.08)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Username */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
              padding: "8px 10px",
              backgroundColor: "rgba(34, 211, 238, 0.04)",
              borderRadius: "6px",
              border: "1px solid rgba(34, 211, 238, 0.1)",
            }}
          >
            <span
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "rgba(34, 211, 238, 0.15)",
                border: "1px solid rgba(34, 211, 238, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "#22d3ee",
                flexShrink: 0,
                boxShadow: "0 0 8px rgba(34, 211, 238, 0.2)",
              }}
            >
              ◉
            </span>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "8px",
                  color: "rgba(34, 211, 238, 0.35)",
                  letterSpacing: "0.18em",
                  marginBottom: "2px",
                }}
              >
                OPERATOR
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(34, 211, 238, 0.8)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {username ?? "UNKNOWN"}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            style={{
              width: "100%",
              padding: "9px 14px",
              backgroundColor: logoutHover
                ? "rgba(239, 68, 68, 0.15)"
                : "rgba(239, 68, 68, 0.05)",
              border: logoutHover
                ? "1px solid rgba(239, 68, 68, 0.6)"
                : "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "6px",
              color: logoutHover
                ? "#fca5a5"
                : "rgba(239, 68, 68, 0.5)",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: logoutHover
                ? "0 0 14px rgba(239, 68, 68, 0.2)"
                : "none",
              textShadow: logoutHover
                ? "0 0 8px rgba(239, 68, 68, 0.5)"
                : "none",
            }}
          >
            <span style={{ fontSize: "11px" }}>⏻</span>
            DISCONNECT
          </button>

          {/* Bottom tag */}
          <div
            style={{
              marginTop: "12px",
              fontSize: "7px",
              color: "rgba(34, 211, 238, 0.15)",
              letterSpacing: "0.15em",
              textAlign: "center",
            }}
          >
            LOGIC-ARENA © 2026
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
