// Modo manutencao: fica observando as pastas de categoria e regenera a
// galeria sozinho a cada foto adicionada/removida. Rode `npm run dev` e deixe
// aberto enquanto organiza as fotos. Depois e so atualizar o navegador.
const chokidar = require('chokidar');
const path = require('path');
const { build, SRC } = require('./build-galeria');

let timer = null, rodando = false, repetir = false;

function agendar() { clearTimeout(timer); timer = setTimeout(rodar, 400); }

async function rodar() {
  if (rodando) { repetir = true; return; }
  rodando = true;
  try { await build(); } catch (e) { console.error('[galeria] erro:', e.message); }
  rodando = false;
  if (repetir) { repetir = false; agendar(); }
}

console.log('[galeria] Observando', path.relative(process.cwd(), SRC));
console.log('[galeria] Adicione/remova fotos nas pastas de categoria. Ctrl+C para sair.\n');

(async () => { await rodar(); })();   // build inicial

chokidar
  .watch(SRC, {
    ignoreInitial: true,
    ignored: p => p.includes('_revisar'),   // pasta de revisao nao e publicada
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  })
  .on('add', agendar)
  .on('unlink', agendar)
  .on('change', agendar)
  .on('addDir', agendar)
  .on('unlinkDir', agendar);
