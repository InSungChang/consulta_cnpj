const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { descompactarArquivo } = require('./unzipper');
const config = require('./config');

// Variável para controlar o tempo restante até a próxima verificação
let tempoRestante = config.intervaloMinutos * 60; // Tempo em segundos até a próxima verificação

// Função para exibir o tempo restante até a próxima verificação
function exibirTempoRestante() {
  const minutos = Math.floor(tempoRestante / 60);
  const segundos = tempoRestante % 60;
  console.log(`Próxima verificação em: ${minutos} minutos e ${segundos} segundos`);
}

// Função que atualiza o tempo restante a cada segundo
setInterval(() => {
  if (tempoRestante > 0) {
    tempoRestante--;
    exibirTempoRestante();
  }
}, 1000);

// Função para verificar e descompactar todos os arquivos ZIP na pasta
async function processarArquivos() {
  try {
    const arquivos = fs.readdirSync(config.pastaCompactados);
    const arquivosZip = arquivos.filter(arquivo => path.extname(arquivo) === '.zip');

    if (arquivosZip.length > 0) {
      console.log(`Encontrados ${arquivosZip.length} arquivos ZIP para descompactar.`);
      
      for (const arquivo of arquivosZip) {
        const caminhoArquivo = path.join(config.pastaCompactados, arquivo);

        // Verifica se o arquivo ainda existe antes de tentar descompactá-lo
        if (fs.existsSync(caminhoArquivo)) {
          try {
            console.log(`Descompactando: ${arquivo}`);
            await descompactarArquivo(caminhoArquivo, config.pastaDescompactados);
            console.log(`Arquivo descompactado: ${arquivo}`);
            
            // Deleta o arquivo após descompactar com retentativas
            await deletarArquivoComRetentativa(caminhoArquivo);
          } catch (err) {
            console.error(`Erro ao descompactar o arquivo: ${caminhoArquivo}`, err);
          }
        } else {
          console.warn(`Arquivo já foi deletado: ${caminhoArquivo}`);
        }
      }
    } else {
      console.log('Nenhum arquivo ZIP encontrado para descompactar.');
    }
  } catch (error) {
    console.error('Erro ao processar arquivos compactados:', error);
  }
}

// Função para tentar deletar o arquivo várias vezes
function deletarArquivoComRetentativa(caminho, tentativas = 5) {
  return new Promise((resolve, reject) => {
    let tentativaAtual = 0;

    const tentarDeletar = () => {
      fs.unlink(caminho, (err) => {
        if (!err) {
          console.log(`Arquivo deletado: ${caminho}`);
          resolve();
        } else if (tentativaAtual < tentativas) {
          tentativaAtual++;
          setTimeout(tentarDeletar, 500); // Espera 500ms antes de tentar novamente
        } else {
          reject(err);
        }
      });
    };
    tentarDeletar();
  });
}

// Agendamento para verificar a pasta a cada X minutos
cron.schedule(`*/${config.intervaloMinutos} * * * *`, () => {
  console.log('Iniciando verificação de novos arquivos compactados...');
  processarArquivos();
  // Reseta o tempo restante após cada verificação
  tempoRestante = config.intervaloMinutos * 60;
});

console.log(`Monitorando pasta ${config.pastaCompactados} para novos arquivos ZIP a cada ${config.intervaloMinutos} minutos...`);
