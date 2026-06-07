// Nucleo da galeria: le as pastas de categoria, gera thumb + full em WebP
// (de forma INCREMENTAL) e escreve o manifesto. Limpa arquivos orfaos
// (de fotos que voce apagou). Usado tanto pelo `otimizar` quanto pelo `watch`.
//
// VOCE SO MANTEM:  img/servicos/<categoria>/*.jpg|jpeg|png
// GERADO (nao mexa): img/portfolio/{thumbs,full}/  e  manifest.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = path.join(__dirname, '..', 'img', 'servicos');
const OUT = path.join(__dirname, '..', 'img', 'portfolio');
const THUMB_DIR = path.join(OUT, 'thumbs');
const FULL_DIR = path.join(OUT, 'full');

const THUMB_W = 500;   // miniatura (grade)
const FULL_W = 1400;   // versao grande (lightbox)

// Metadados/ordem das categorias = igual ao site original.
// Para criar uma categoria nova: adicione aqui + crie a pasta em img/servicos/.
// Categoria sem foto vira "Em breve" automaticamente.
const CATS = {
  'montagem-moveis':      { label: 'Montagem de Móveis',     icon: 'bx-wrench',       desc: 'Montagem e desmontagem de móveis em geral com perfeição e cuidado.' },
  'eletrica-hidraulica':  { label: 'Elétrica e Hidráulica',  icon: 'bx-bolt-circle',  desc: 'Tomadas, chuveiros, lâmpadas, vazamentos, torneiras e instalações básicas.' },
  'pintura':              { label: 'Pintura',                icon: 'bx-paint-roll',   desc: 'Pequenos retoques e pintura de ambientes internos e externos.' },
  'cortinas-persianas':   { label: 'Cortinas e Persianas',   icon: 'bx-window',       desc: 'Instalação de varões, persianas rolo, romana e modelos diversos.' },
  'prateleiras-suportes': { label: 'Prateleiras e Suportes', icon: 'bx-layer',        desc: 'Instalação segura de prateleiras, nichos e suportes para TV.' },
  'outros':               { label: 'Outros Serviços',        icon: 'bx-category',     desc: 'Outros trabalhos e serviços de manutenção realizados sob medida.' },
};

// Ordem NUMERICA/natural: 1, 2, 3 ... 10, 11 (e nao 1, 10, 11, 2).
function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

// Nome de saida estavel por foto: <cat>__<slug>-<hash>.
// Estavel = apagar/adicionar UMA foto nao renomeia as outras.
function genName(cat, file) {
  const base = file.replace(/\.[^.]+$/, '');
  const slug = base.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'foto';
  const hash = crypto.createHash('md5').update(cat + '/' + file).digest('hex').slice(0, 6);
  return `${cat}__${slug}-${hash}`;
}

// Regera so se faltar a saida ou se a origem for mais nova que ela.
function precisaGerar(saida, mtimeOrigem) {
  if (!fs.existsSync(saida)) return true;
  return fs.statSync(saida).mtimeMs < mtimeOrigem;
}

async function build({ quiet = false } = {}) {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  fs.mkdirSync(FULL_DIR, { recursive: true });

  const log = (...a) => { if (!quiet) console.log(...a); };
  const manifest = {};
  const nomesDesejados = new Set();
  let gerados = 0, total = 0;

  for (const [cat, meta] of Object.entries(CATS)) {
    const dir = path.join(SRC, cat);
    const files = listImages(dir);

    if (!files.length) {
      manifest[cat] = { ...meta, embreve: true, fotos: [] };
      continue;
    }

    const itens = [];
    for (const file of files) {
      const name = genName(cat, file);
      nomesDesejados.add(name);
      const srcPath = path.join(dir, file);
      const mtime = fs.statSync(srcPath).mtimeMs;
      const thumbOut = path.join(THUMB_DIR, `${name}.webp`);
      const fullOut = path.join(FULL_DIR, `${name}.webp`);

      if (precisaGerar(thumbOut, mtime)) {
        await sharp(srcPath).rotate().resize(THUMB_W, THUMB_W, { fit: 'cover' })
          .webp({ quality: 70 }).toFile(thumbOut);
        gerados++;
      }
      if (precisaGerar(fullOut, mtime)) {
        await sharp(srcPath).rotate().resize(FULL_W, FULL_W, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 }).toFile(fullOut);
        gerados++;
      }

      itens.push({
        thumb: `img/portfolio/thumbs/${name}.webp`,
        full: `img/portfolio/full/${name}.webp`,
        alt: `${meta.label} - Liscano Faz Tudo`,
      });
      total++;
    }
    manifest[cat] = { ...meta, embreve: false, fotos: itens };
  }

  // Remove thumbs/full orfaos (fotos que voce apagou ou renomeou)
  let removidos = 0;
  for (const d of [THUMB_DIR, FULL_DIR]) {
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith('.webp')) continue;
      if (!nomesDesejados.has(f.replace(/\.webp$/, ''))) {
        fs.unlinkSync(path.join(d, f));
        removidos++;
      }
    }
  }

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(OUT, 'manifest.js'),
    '// Gerado automaticamente — nao editar a mao. Rode `npm run otimizar` ou `npm run dev`.\n' +
    'window.PORTFOLIO = ' + JSON.stringify(manifest, null, 2) + ';\n'
  );

  const resumo = Object.entries(manifest)
    .map(([k, v]) => `${k}:${v.embreve ? 'em-breve' : v.fotos.length}`).join('  ');
  log(`[galeria] ${total} fotos | ${gerados} arquivos gerados | ${removidos} orfaos removidos`);
  log(`[galeria] ${resumo}`);
  return { total, gerados, removidos };
}

module.exports = { build, CATS, SRC, OUT };
