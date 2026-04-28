import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export const AuthModal = ({ isOpen, onClose, title = "AUTHENTICATION REQUIRED", message = "You must log in to access this feature." }: AuthModalProps) => {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border-2 border-accent/30 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-[0_0_40px_rgba(var(--accent-rgb),0.15)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
                
                <div className="flex flex-col items-center text-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]">
                        <ShieldAlert size={32} className="text-accent" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-black text-accent tracking-[0.15em] uppercase drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]">
                            {title}
                        </h2>
                        <p className="text-text-secondary text-sm tracking-wider leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                        <button
                            onClick={() => router.push("/login")}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-accent/20 border border-accent/50 rounded-xl text-accent font-bold tracking-[0.15em] uppercase hover:bg-accent/30 hover:border-accent hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] transition-all active:scale-[0.98]"
                        >
                            <LogIn size={16} />
                            Log In
                        </button>
                        <button
                            onClick={() => router.push("/register")}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-bg-secondary border border-accent/20 rounded-xl text-text-primary font-bold tracking-[0.15em] uppercase hover:bg-accent/10 hover:border-accent/50 transition-all active:scale-[0.98]"
                        >
                            <UserPlus size={16} />
                            Register
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-xs text-text-secondary/60 hover:text-accent tracking-widest uppercase mt-2 transition-colors"
                    >
                        Dismiss & Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};
