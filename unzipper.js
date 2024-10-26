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
      zip.extract(null, pastaDestino, async (err, count) => {
        zip.close();
        if (err) {
          reject(err);
        } else {
          try {
            // Renomeia arquivos para adicionar a extensão .csv, se necessário
            const arquivosDescompactados = fs.readdirSync(pastaDestino);
            for (const arquivo of arquivosDescompactados) {
              const caminhoArquivo = path.join(pastaDestino, arquivo);
              const novoNome = caminhoArquivo.endsWith('.csv') ? caminhoArquivo : `${caminhoArquivo}.csv`;

              if (caminhoArquivo !== novoNome) {
                try {
                  await renomearArquivoComRetentativa(caminhoArquivo, novoNome);
                  console.log(`Arquivo renomeado para: ${novoNome}`);
                } catch (renameErr) {
                  console.error(`Erro ao renomear o arquivo: ${caminhoArquivo}`, renameErr);
                }
              }
            }
            resolve(count);
          } catch (listErr) {
            reject(listErr);
          }
        }
      });
    });

    zip.on('error', (err) => reject(err));
  });
}

// Função para tentar renomear o arquivo várias vezes, se necessário
function renomearArquivoComRetentativa(caminhoAtual, novoCaminho, tentativas = 5) {
  return new Promise((resolve, reject) => {
    let tentativaAtual = 0;

    const tentarRenomear = () => {
      fs.rename(caminhoAtual, novoCaminho, (err) => {
        if (!err) {
          resolve();
        } else if (tentativaAtual < tentativas) {
          tentativaAtual++;
          setTimeout(tentarRenomear, 500); // Espera 500ms antes de tentar novamente
        } else {
          reject(err);
        }
      });
    };
    tentarRenomear();
  });
}

module.exports = { descompactarArquivo };
