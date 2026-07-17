import type { Metadata } from 'next';

// Server layout co-located with the 'use client' explore/mcp page.
export const metadata: Metadata = { title: 'MCP Servers' };

export default function McpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
