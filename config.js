const path = require('path');

module.exports = {
  pastaCompactados: path.join(__dirname, 'arquivos/compactados'),
  pastaDescompactados: path.join(__dirname, 'arquivos/descompactados'),
  intervaloMinutos: 1,  // Verifica novos arquivos a cada 5 minutos
};
