import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/page-metadata';

// Server layout co-located with the 'use client' explore/mcp page.
export const metadata: Metadata = pageMetadata({
  title: 'MCP Servers',
  description: 'MCP Server Directory — 100+ Model Context Protocol servers connecting AI agents to databases, tools, and services through standardized interfaces.',
  path: '/explore/mcp',
});

export default function McpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
