// CONIK desktop: the Windows app (Tauri) loads a static export from apps/web/out.
// Every screen must therefore be a client page that talks to the local SQLite
// database through the Tauri bridge (lib/local/tauri.ts). Server-only features
// (server components using Supabase, app/api/* routes) are migrated module by module.
const isDesktop = process.env.CONIK_TARGET === 'desktop'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isDesktop ? { output: 'export', images: { unoptimized: true }, trailingSlash: true } : {}),
}

export default nextConfig
