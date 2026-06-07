// [HISTORICO] Move os arquivos de img/servicos para subpastas de categoria, segundo a
// classificacao visual feita nas folhas de contato. Usa scripts/mapa.json.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'img', 'servicos');
const mapa = JSON.parse(fs.readFileSync(path.join(__dirname, 'mapa.json'), 'utf8'));

// indice (folha de contato) -> categoria
const classificacao = {
  // montagem-moveis
  1:'montagem-moveis',2:'montagem-moveis',3:'montagem-moveis',4:'montagem-moveis',
  11:'montagem-moveis',13:'montagem-moveis',15:'montagem-moveis',18:'montagem-moveis',
  20:'montagem-moveis',32:'montagem-moveis',35:'montagem-moveis',47:'montagem-moveis',
  67:'montagem-moveis',69:'montagem-moveis',70:'montagem-moveis',72:'montagem-moveis',
  73:'montagem-moveis',74:'montagem-moveis',75:'montagem-moveis',77:'montagem-moveis',
  78:'montagem-moveis',80:'montagem-moveis',82:'montagem-moveis',83:'montagem-moveis',
  85:'montagem-moveis',87:'montagem-moveis',89:'montagem-moveis',90:'montagem-moveis',
  92:'montagem-moveis',97:'montagem-moveis',101:'montagem-moveis',102:'montagem-moveis',
  103:'montagem-moveis',104:'montagem-moveis',106:'montagem-moveis',107:'montagem-moveis',
  108:'montagem-moveis',109:'montagem-moveis',111:'montagem-moveis',113:'montagem-moveis',
  114:'montagem-moveis',115:'montagem-moveis',116:'montagem-moveis',117:'montagem-moveis',
  118:'montagem-moveis',119:'montagem-moveis',120:'montagem-moveis',121:'montagem-moveis',
  122:'montagem-moveis',
  // prateleiras
  6:'prateleiras',10:'prateleiras',14:'prateleiras',16:'prateleiras',30:'prateleiras',
  33:'prateleiras',36:'prateleiras',40:'prateleiras',48:'prateleiras',49:'prateleiras',
  50:'prateleiras',76:'prateleiras',79:'prateleiras',81:'prateleiras',86:'prateleiras',
  110:'prateleiras',112:'prateleiras',
  // paineis-ripados
  5:'paineis-ripados',7:'paineis-ripados',8:'paineis-ripados',9:'paineis-ripados',
  19:'paineis-ripados',21:'paineis-ripados',22:'paineis-ripados',23:'paineis-ripados',
  25:'paineis-ripados',27:'paineis-ripados',28:'paineis-ripados',29:'paineis-ripados',
  // vidros-espelhos
  17:'vidros-espelhos',68:'vidros-espelhos',95:'vidros-espelhos',96:'vidros-espelhos',
  98:'vidros-espelhos',99:'vidros-espelhos',100:'vidros-espelhos',105:'vidros-espelhos',
  // pisos-revestimentos
  56:'pisos-revestimentos',57:'pisos-revestimentos',58:'pisos-revestimentos',
  59:'pisos-revestimentos',60:'pisos-revestimentos',93:'pisos-revestimentos',
  123:'pisos-revestimentos',124:'pisos-revestimentos',
  // pintura
  63:'pintura',65:'pintura',66:'pintura',
  // _revisar (terreno/grama, pecas soltas, ambiguas)
  12:'_revisar',24:'_revisar',26:'_revisar',31:'_revisar',34:'_revisar',37:'_revisar',
  38:'_revisar',39:'_revisar',41:'_revisar',42:'_revisar',43:'_revisar',44:'_revisar',
  45:'_revisar',46:'_revisar',51:'_revisar',52:'_revisar',53:'_revisar',54:'_revisar',
  55:'_revisar',61:'_revisar',62:'_revisar',64:'_revisar',71:'_revisar',84:'_revisar',
  88:'_revisar',91:'_revisar',94:'_revisar',
};

const resumo = {};
let movidos = 0, faltando = [];

for (let i = 1; i <= 124; i++) {
  const nome = mapa[i];
  const cat = classificacao[i];
  if (!nome) { continue; }
  if (!cat) { faltando.push(i); continue; }

  const destDir = path.join(SRC, cat);
  fs.mkdirSync(destDir, { recursive: true });
  const origem = path.join(SRC, nome);
  const destino = path.join(destDir, nome);
  if (fs.existsSync(origem)) {
    fs.renameSync(origem, destino);
    movidos++;
    resumo[cat] = (resumo[cat] || 0) + 1;
  } else {
    faltando.push(`${i} (${nome}) nao encontrado`);
  }
}

console.log('Movidos:', movidos, 'arquivos\n');
Object.entries(resumo).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
if (faltando.length) console.log('\nNao classificados/faltando:', faltando);
