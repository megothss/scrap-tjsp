const prompt = require('prompt');
const chalk = require('chalk');
const moment = require('moment');

const form = function () {
  return new Promise((resolve, reject) => {
    const dateFormat = 'DD/MM/YYYY';
    prompt.start();

    prompt.get(
      [
        {
          name: 'inicio',
          message: `Informe uma data válida (${dateFormat})`,
          required: true,
          description: chalk.bold.yellow('Data de ínicio:'),
          conform: (v) => {
            const date = moment.utc(v, dateFormat);
            return date.isValid();
          }
        },
        {
          name: 'fim',
          required: true,
          message: `Informe uma data válida (${dateFormat}) maior ou igual a inicial`,
          description: chalk.bold.yellow('Data de fim:'),
          conform: (v) => {
            const d1 = moment.utc(prompt.history('inicio').value, dateFormat);
            const d2 = moment.utc(v, dateFormat);
            return d2.isValid() && d2.isSameOrAfter(d1);
          }
        },
        {
          name: 'classes',
          default: '50003,50002,50001,1727,10943,283,1733,278,279,1731,272,12394,288,291,12122,1710,307,309,310,11955,413,11398,417,420,426,1729,416,418,419,421,427,428,326,327,1178,325,432,433,332,12077,330,318,319,320,322,323,324,275,10979',
          message: `Informe a seleção de classes gerada no formulário de pesquisa do TJSP`,
          description: chalk.bold.yellow('Classes de processos:'),
        },
      ],
      (err, result) => {
        if (err != null) reject('Erro ao obter dados de entrada:' + err);

        resolve({
          ...result, ...{
            inicio: moment.utc(result.inicio, dateFormat),
            fim: moment.utc(result.fim, dateFormat)
          }
        });
      }
    );
  })
};

module.exports = form;
