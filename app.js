const fs = require('fs')
const ora = require('ora');
const form = require('./form');
const consultaTjsp = require('./consulta-tjsp')

const run = async (inicio, fim, classes) => {
  let dia = inicio;
  let sucesso = 0;
  let falha = 0;
  let pulados = 0;

  console.log(`obtendo as informações dos processos de ${inicio.format('DD/MM/YYYY')} a ${fim.format('DD/MM/YYYY')}`)
  console.log('classes filtradas: ' + classes);

  // cria o diretório de saida se ele não existe
  if (!fs.existsSync('scraps')) {
    fs.mkdirSync('scraps');
  }

  while (fim.isSameOrAfter(dia)) {
    const fmtDia = dia.format('DD/MM/YYYY');
    const arquivoDia = `scraps/${dia.format('YYYY-MM-DD')}.json`;

    const spinner = ora(fmtDia).start();

    if (!fs.existsSync(arquivoDia) && !fs.existsSync(arquivoDia + '.imported')) {
      try {
        const resultados = await consultaTjsp(dia.format('DD/MM/YYYY'), classes, spinner);
        fs.writeFileSync(arquivoDia, JSON.stringify(resultados));
        spinner.succeed(`${fmtDia}: ${resultados.length} processo(s) obtido(s)`);
        sucesso++;
      } catch (e) {
        spinner.fail(fmtDia + ': ' + e);
        falha++;
      }
    } else {
      spinner.info(`${fmtDia}: arquivo de captura já existe na pasta de saida`);
      pulados++;
    }

    dia.add(1, 'day');
  }

  return {sucesso, falha, pulados};
}

form()
  .then((values) => {
    return run(values.inicio, values.fim, values.classes)
  })
  .then(({
           sucesso,
           pulados,
           falha
         }) => `Processamento concluído (${sucesso} dias com sucesso / ${pulados} não processados / ${falha} com falha)`);
