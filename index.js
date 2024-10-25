const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { descompactarArquivo } = require('./unzipper');  // Certifique-se de que está importando a função corretamente
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
            await descompactarArquivo(caminhoArquivo, config.pastaDescompactados);  // Certifique-se de que está chamando a função corretamente
            console.log(`Arquivo descompactado: ${arquivo}`);
            
            // Deleta o arquivo após descompactar
            fs.unlinkSync(caminhoArquivo);
            console.log(`Arquivo deletado: ${caminhoArquivo}`);
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

// Agendamento para verificar a pasta a cada X minutos
cron.schedule(`*/${config.intervaloMinutos} * * * *`, () => {
  console.log('Iniciando verificação de novos arquivos compactados...');
  processarArquivos();
  // Reseta o tempo restante após cada verificação
  tempoRestante = config.intervaloMinutos * 60;
});

console.log(`Monitorando pasta ${config.pastaCompactados} para novos arquivos ZIP a cada ${config.intervaloMinutos} minutos...`);
