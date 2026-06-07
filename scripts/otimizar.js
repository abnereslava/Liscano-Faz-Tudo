// Gera a galeria uma vez (modo build). Use antes de publicar o site.
// Para manutencao continua enquanto edita, prefira `npm run dev` (watch).
const { build } = require('./build-galeria');

build().then(() => console.log('Pronto.')).catch(err => {
  console.error(err);
  process.exit(1);
});
