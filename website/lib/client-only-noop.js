// No-op stub for 'client-only' in browser/client webpack bundles.
// Next.js 16 aliases 'client-only' to an internal Node.js build-tool module
// (next/dist/compiled/client-only/index.js) which imports @vercel/nft and
// child_process, causing webpack to fail when bundling react-aria-components'
// RSC entry (import.mjs) for the browser. On the client side the guard is
// semantically a no-op anyway, so this stub is correct.
