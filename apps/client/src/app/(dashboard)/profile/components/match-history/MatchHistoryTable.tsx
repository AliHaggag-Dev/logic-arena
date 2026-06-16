"use client";

import React, { useState, useEffect } from "react";
import { MatchEntry, MatchHistoryResponse } from "../../types";
import { DesktopRow } from "./DesktopRow";
import { MobileCard } from "./MobileCard";
import { SkeletonRow } from "./SkeletonRow";
import { EmptyState } from "./EmptyState";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiClient } from "../../../../../lib/api-client";

interface Props {
  userId?:  string;
  profileLoading: boolean;
  isMobile: boolean;
  isGuest?: boolean;
}

const PAGE_SIZE = 5;

export function MatchHistoryTable({ userId, profileLoading, isMobile, isGuest }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [history, setHistory] = useState<MatchEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  useEffect(() => {
    if (!userId || isGuest) {
      setHistory([]);
      return;
    }

    let isMounted = true;
    const fetchMatches = async () => {
      setIsLoadingMatches(true);
      try {
        const res = await apiClient.get<MatchHistoryResponse>(`/users/${userId}/matches?page=${currentPage}&limit=${PAGE_SIZE}`);
        if (isMounted) {
          setHistory(res.data.matches);
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        console.error("Failed to fetch matches", err);
      } finally {
        if (isMounted) setIsLoadingMatches(false);
      }
    };

    fetchMatches();
    return () => { isMounted = false; };
  }, [userId, currentPage, isGuest]);

  const loading = profileLoading || isLoadingMatches;

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const renderPagination = () => {
    if (profileLoading || (history.length === 0 && currentPage === 1)) return null;
    return (
      <div className="flex items-center justify-between p-3 border-t border-accent/10 bg-accent/[0.02]">
        <span className="text-[10px] text-accent/50 font-mono tracking-widest pl-2">
          PAGE {currentPage} OF {totalPages}
        </span>
        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1 || loading}
            className="p-1.5 rounded bg-accent/5 hover:bg-accent/10 disabled:opacity-30 disabled:hover:bg-accent/5 transition-colors border border-accent/10 text-accent cursor-pointer disabled:cursor-not-allowed"
            aria-label="Previous page"
            type="button"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || loading}
            className="p-1.5 rounded bg-accent/5 hover:bg-accent/10 disabled:opacity-30 disabled:hover:bg-accent/5 transition-colors border border-accent/10 text-accent cursor-pointer disabled:cursor-not-allowed"
            aria-label="Next page"
            type="button"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[120px] rounded-xl border border-accent/10 bg-accent/5 animate-[shimmer_1.5s_infinite]"
              />
            ))
          : history.length > 0
            ? (
                <div className="flex flex-col gap-3 w-full rounded-[10px] border border-accent/10 overflow-hidden bg-card/50 backdrop-blur-md pb-0">
                  <div className="flex flex-col gap-3 p-3 pb-2">
                    {history.map((m) => <MobileCard key={m.id} m={m} isGuest={isGuest} />)}
                  </div>
                  {renderPagination()}
                </div>
              )
            : <EmptyState mobile />
        }
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-accent/10 overflow-hidden bg-card/50 backdrop-blur-md">
      <table className="w-full border-collapse text-[10px] tracking-[0.1em]">
        <thead>
          <tr className="border-b border-accent/10 bg-accent/[0.04]">
            {["DATE", "OPPONENT", "TYPE", "RESULT", "DURATION", "REPLAY"].map((h, i) => (
              <th
                key={h}
                className={`p-[12px_16px] text-left text-[9px] font-bold tracking-[0.22em] text-accent/35 uppercase
                  ${i === 0 || i === 4 ? "hidden lg:table-cell" : ""}
                  ${i === 2           ? "hidden sm:table-cell" : ""}
                  ${i === 5           ? "text-right"           : ""}
                `}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
            : history.length > 0
              ? history.map((m, idx) => (
                  <DesktopRow
                    key={m.id}
                    m={m}
                    isLast={idx === history.length - 1}
                    isGuest={isGuest}
                  />
                ))
              : <EmptyState mobile={false} />
          }
        </tbody>
      </table>
      {renderPagination()}
    </div>
  );
}
