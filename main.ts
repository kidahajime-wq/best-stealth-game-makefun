// Verdant — A Glasshouse Heist. Entry program (Node 22, stdlib only).
//
// It hands the game in: copies this repository's game/ and
// screenshots/ into the output directory and writes dossier.json,
// the summary the judge reads, with the vendored make.fun library.
// The grader runs it twice and both runs must write identical bytes,
// so this program does nothing time- or environment-dependent: it
// copies files and builds the dossier, nothing else.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the kit documents them: the dossier text is
// capped at 160 KiB, at most 4 screenshots of at most 256 KiB each,
// game/ at most 993 files and 48 MiB in all, every game/ path at
// most 1000 bytes. An entry that breaks one is refused by the gate,
// so the program refuses it here first, before writing anything.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
