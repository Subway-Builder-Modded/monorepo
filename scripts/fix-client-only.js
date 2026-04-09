const fs = require('node:fs');

const markerStub = 'module.exports = {};\n';

function resolveClientOnlyIndex() {
  return require.resolve('client-only', {
    paths: [process.cwd()],
  });
}

function needsRepair(source) {
  return (
    source.includes('handleBuildComplete') ||
    source.includes('../output/log') ||
    source.includes('next/dist/compiled/@vercel/routing-utils')
  );
}

function main() {
  const indexPath = resolveClientOnlyIndex();
  const current = fs.readFileSync(indexPath, 'utf8');

  if (!needsRepair(current)) {
    return;
  }

  fs.writeFileSync(indexPath, markerStub, 'utf8');
  process.stdout.write(`Repaired corrupted client-only marker at ${indexPath}\n`);
}

main();