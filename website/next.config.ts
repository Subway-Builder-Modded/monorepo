import createMDX from '@next/mdx';
import type { NextConfig } from 'next';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = dirname(projectRoot);

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@sbm/core', '@sbm/website', 'react-aria-components'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Next.js 16 aliases 'client-only' to an internal Node.js build-tool
      // module that imports @vercel/nft / child_process, crashing the browser
      // bundle when react-aria-components' RSC entry (import.mjs) is processed.
      // On the client side the guard is semantically a no-op.
      const clientOnlyStub = resolve(projectRoot, 'lib/client-only-noop.js');
      config.resolve.alias['client-only'] = clientOnlyStub;
      config.resolve.alias['next/dist/compiled/client-only/index.js'] =
        clientOnlyStub;
      config.resolve.alias['next/dist/compiled/client-only/index'] =
        clientOnlyStub;
    }
    return config;
  },
  turbopack: {
    root: workspaceRoot,
  },
  images: {
    unoptimized: true,
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
};

export default withMDX(nextConfig);
