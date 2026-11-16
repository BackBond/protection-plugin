import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

await mkdir('assets', {recursive: true});
const png = await readFile('assets/logo-source.png');
const height = 440 * 440 / 1690;
await writeFile('assets/logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="BackBond"><title>BackBond</title><rect width="512" height="512" fill="#0B1A38"/><image x="36" y="${(512-height)/2}" width="440" height="${height}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`);
await writeFile('assets/BRAND-ASSETS.md', `# BackBond logo\n\nThe square SVG places the unchanged packaged BackBond logo-on-navy PNG on an Ink Navy background plate. It contains no external resources, scripts, font substitutions, recolouring or redrawn wordmark. Source PNG SHA-256: ${createHash('sha256').update(png).digest('hex')}.\n\nThe code licence does not grant BackBond trademark rights. The supplied logo may be redistributed unchanged with this plugin for identification; it does not imply endorsement of forks or other services.\n`);
