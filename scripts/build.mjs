import {build} from 'esbuild';
import {writeFile, mkdir, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import './build-logo.mjs';

await mkdir('dist', {recursive: true});
const result = await build({entryPoints: ['bin/gateway.mjs'], outfile: 'dist/gateway.mjs', bundle: true,
  platform: 'node', target: 'node20', format: 'esm', minify: false, legalComments: 'eof', metafile: true,
  banner: {js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);"}});
await writeFile('dist/build-inputs.json', JSON.stringify(Object.keys(result.metafile.inputs).sort(), null, 2) + '\n');
const packages = new Set(Object.keys(result.metafile.inputs).filter(p => p.startsWith('node_modules/')).map(p => {
  const parts = p.slice('node_modules/'.length).split('/');
  return parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}));
let notices = 'Bundled third-party software\n\n';
for (const pkg of [...packages].sort()) {
  const metadata = JSON.parse(await readFile(`node_modules/${pkg}/package.json`, 'utf8'));
  if (!['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'].includes(metadata.license)) throw new Error(`Review dependency license: ${pkg}`);
  let license;
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'LICENSE-MIT']) {
    try { license = await readFile(`node_modules/${pkg}/${name}`, 'utf8'); break; } catch {}
  }
  if (!license) throw new Error(`Missing dependency license: ${pkg}`);
  notices += `${pkg}@${metadata.version} (${metadata.license})\n${license}\n\n`;
  try { notices += await readFile(`node_modules/${pkg}/NOTICE`, 'utf8') + '\n\n'; } catch {}
}
await writeFile('dist/THIRD_PARTY_NOTICES.txt', notices);
const bytes = await readFile('dist/gateway.mjs');
await writeFile('dist/SHA256SUMS', createHash('sha256').update(bytes).digest('hex') + '  gateway.mjs\n');
console.log(JSON.stringify({built: true, minified: false, runtime: 'node >=20', bundled_dependencies: true, sha256: createHash('sha256').update(bytes).digest('hex')}));
