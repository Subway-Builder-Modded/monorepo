// Empty stub — prevents the server-only package from pulling in @vercel/nft during
// Turbopack static-export builds (Next.js 16.2.1 bug). Since all pages are statically
// exported (output: 'export'), there is no client bundle that could accidentally import
// server-only modules, so the runtime guard is not needed.
export {};
