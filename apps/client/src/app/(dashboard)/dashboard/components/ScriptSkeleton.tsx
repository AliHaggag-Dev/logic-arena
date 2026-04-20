import React from "react";

export const ScriptSkeleton = ({ isMobile }: { isMobile?: boolean }) => {
    return (
        <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
                isMobile ? (
                    <div key={i} className="flex flex-col w-full bg-card/60 border border-border rounded-2xl p-5 gap-4 animate-pulse">
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
                    <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 backdrop-blur-md p-4 sm:p-5 rounded-lg border border-accent/10 animate-pulse" style={{ boxShadow: 'var(--card-shadow)' }}>
                        <div className="flex flex-col gap-1 w-full">
                            <div className="h-6 w-1/3 bg-accent/10 rounded"></div>
                            <div className="h-3 w-1/4 bg-accent/5 rounded mt-1"></div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <div className="w-full sm:w-[110px] h-[34px] bg-accent/10 rounded"></div>
                            <div className="w-full sm:w-[140px] h-[34px] bg-accent/10 rounded"></div>
                            <div className="w-full sm:w-[140px] h-[34px] bg-accent/10 rounded"></div>
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};
