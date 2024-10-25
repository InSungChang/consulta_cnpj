const StreamZip = require('node-stream-zip');
const fs = require('fs');
const path = require('path');

// Função para descompactar um arquivo ZIP e renomear arquivos para .csv
function descompactarArquivo(arquivoZip, pastaDestino) {
  return new Promise((resolve, reject) => {
    const zip = new StreamZip({
      file: arquivoZip,
      storeEntries: true,
    });

    zip.on('ready', () => {
      zip.extract(null, pastaDestino, (err, count) => {
        if (err) {
          zip.close();
          reject(err);
        } else {
          // Renomeia arquivos para ter a extensão .csv
          fs.readdir(pastaDestino, (err, arquivosDescompactados) => {
            if (err) {
              zip.close();
              reject(err);
            } else {
              arquivosDescompactados.forEach((arquivo) => {
                const caminhoArquivo = path.join(pastaDestino, arquivo);
                const novoNome = caminhoArquivo.endsWith('.csv')
                  ? caminhoArquivo // Mantém o nome se já terminar com .csv
                  : `${caminhoArquivo}.csv`; // Adiciona .csv se não tiver a extensão

                // Renomeia o arquivo
                if (caminhoArquivo !== novoNome) {
                  fs.renameSync(caminhoArquivo, novoNome);
                  console.log(`Arquivo renomeado para: ${novoNome}`);
                }
              });

              zip.close();
              resolve(count);
            }
          });
        }
      });
    });

    zip.on('error', (err) => reject(err));
  });
}

module.exports = { descompactarArquivo };
