import type { Components } from 'react-markdown';

export const markdownComponents: Components = {
  p({ children }) {
    return <p className="mb-2 leading-relaxed">{children}</p>;
  },
  strong({ children }) {
    return <strong className="font-bold text-accent drop-shadow-[0_0_5px_rgba(var(--accent-rgb),0.4)]">{children}</strong>;
  },
  ul({ children }) {
    return <ul className="list-disc mb-3 space-y-1.5 ms-4 text-text-secondary/90">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal mb-3 space-y-1.5 ms-4 text-text-secondary/90">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  h3({ children }) {
    return <h3 className="text-[14px] font-bold text-text-primary mt-4 mb-2">{children}</h3>;
  },
  h4({ children }) {
    return <h4 className="text-[13px] font-bold text-text-primary mt-3 mb-1.5">{children}</h4>;
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline decoration-accent/30 hover:decoration-accent/70 hover:text-accent-bright transition-all">
        {children}
      </a>
    );
  },
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;
    if (isInline) {
      return (
        <code className="text-accent bg-accent/10 px-1 rounded text-[13px]" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-bg-secondary border border-accent/20 rounded-lg p-3 overflow-x-auto text-[13px] leading-relaxed my-2 font-mono">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-2">
        <table className="w-full text-[12px] border-collapse border border-accent/20">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-accent/20 px-2 py-1 text-accent font-bold bg-accent/5">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border border-accent/20 px-2 py-1 text-text-secondary">
        {children}
      </td>
    );
  },
};
