import React from "react";

interface ScriptSkeletonProps {
    isMobile: boolean;
}

export const ScriptSkeleton = ({ isMobile }: ScriptSkeletonProps) => {
    return (
        <div className="flex flex-col gap-4 md:gap-3">
            {[1, 2, 3].map((i) => (
                <React.Fragment key={i}>
                    {isMobile ? (
                        /* Mobile Skeleton */
                        <div className="flex flex-col w-full bg-card/60 border border-accent/50 rounded-2xl p-5 gap-4 animate-pulse">
                            <div className="flex flex-col gap-2">
                                <div className="h-5 w-1/2 bg-accent/10 rounded"></div>
                                <div className="h-3 w-1/3 bg-accent/5 rounded"></div>
                            </div>
                            <div className="flex gap-3 h-9">
                                <div className="flex-1 bg-accent/10 rounded-full"></div>
                                <div className="flex-1 bg-accent/10 rounded-full"></div>
                                <div className="flex-1 bg-accent/20 rounded-full"></div>
                            </div>
                        </div>
                    ) : (
                        /* Desktop Skeleton */
                        <div className="flex flex-col bg-card/60 backdrop-blur-md p-5 rounded-xl border border-accent/20 animate-pulse shadow-[var(--card-shadow)]">
                            <div className="flex flex-col gap-1">
                                <div className="h-6 w-1/3 bg-accent/10 rounded"></div>
                                <div className="h-3 w-1/4 bg-accent/5 rounded mt-1"></div>
                            </div>
                            <div className="flex gap-2 justify-end pt-3 border-t border-border/30 mt-3">
                                <div className="w-10 h-10 bg-accent/10 rounded-lg"></div>
                                <div className="w-10 h-10 bg-accent/10 rounded-lg"></div>
                                <div className="w-10 h-10 bg-accent/10 rounded-lg"></div>
                                <div className="w-10 h-10 bg-accent/10 rounded-lg"></div>
                            </div>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
