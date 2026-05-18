export function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      <span className="w-[5px] h-[5px] rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
      <span className="w-[5px] h-[5px] rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
      <span className="w-[5px] h-[5px] rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
    </span>
  );
}
