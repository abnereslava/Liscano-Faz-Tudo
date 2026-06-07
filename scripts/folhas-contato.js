// Gera "folhas de contato": grades numeradas de miniaturas para classificacao visual.
// Saida: scripts/folhas/sheet_XX.jpg  +  scripts/mapa.json (indice -> nome original)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'img', 'servicos');
const OUT = path.join(__dirname, 'folhas');

const COLS = 4;
const ROWS = 5;
const PER_SHEET = COLS * ROWS;
const CELL = 300;        // tamanho de cada celula (quadrada)
const PAD = 8;           // espaco interno

fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC)
  .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
  .sort();

// mapa indice (1-based) -> nome original
const mapa = {};
files.forEach((f, i) => { mapa[i + 1] = f; });
fs.writeFileSync(path.join(__dirname, 'mapa.json'), JSON.stringify(mapa, null, 2));

function labelSVG(n) {
  return Buffer.from(
    `<svg width="${CELL}" height="40">
       <rect x="0" y="0" width="64" height="34" rx="6" fill="#0b5fff"/>
       <text x="12" y="24" font-family="Arial" font-size="22" font-weight="bold" fill="white">${n}</text>
     </svg>`
  );
}

async function buildCell(file, index) {
  const inner = CELL - PAD * 2;
  const thumb = await sharp(path.join(SRC, file))
    .rotate() // respeita EXIF
    .resize(inner, inner, { fit: 'cover' })
    .toBuffer();

  return sharp({
    create: { width: CELL, height: CELL, channels: 3, background: '#ffffff' }
  })
    .composite([
      { input: thumb, top: PAD, left: PAD },
      { input: labelSVG(index), top: PAD, left: PAD }
    ])
    .jpeg({ quality: 70 })
    .toBuffer();
}

(async () => {
  const totalSheets = Math.ceil(files.length / PER_SHEET);
  for (let s = 0; s < totalSheets; s++) {
    const slice = files.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
    const composites = [];
    for (let i = 0; i < slice.length; i++) {
      const globalIndex = s * PER_SHEET + i + 1;
      const cell = await buildCell(slice[i], globalIndex);
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      composites.push({ input: cell, top: r * CELL, left: c * CELL });
    }
    const sheet = sharp({
      create: { width: COLS * CELL, height: ROWS * CELL, channels: 3, background: '#eeeeee' }
    }).composite(composites).jpeg({ quality: 72 });

    const name = `sheet_${String(s + 1).padStart(2, '0')}.jpg`;
    await sheet.toFile(path.join(OUT, name));
    console.log('Gerada', name, `(${slice.length} fotos)`);
  }
  console.log('\nTotal:', files.length, 'fotos em', totalSheets, 'folhas. Mapa salvo em scripts/mapa.json');
})();
