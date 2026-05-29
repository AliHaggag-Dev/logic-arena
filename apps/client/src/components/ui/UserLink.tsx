import React from "react";
import Link from "next/link";

interface UserLinkProps {
  username: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  title?: string;
}

export function UserLink({ username, className, children, onClick, title }: UserLinkProps) {
  if (!username || username === "N/A") {
    return <span className={className} title={title}>{children ?? username}</span>;
  }

  return (
    <Link
      href={`/profile/${encodeURIComponent(username)}`}
      className={className}
      onClick={onClick}
      title={title}
    >
      {children ?? username}
    </Link>
  );
}
