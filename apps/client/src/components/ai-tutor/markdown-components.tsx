import type { Components } from 'react-markdown';

export const markdownComponents: Components = {
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
