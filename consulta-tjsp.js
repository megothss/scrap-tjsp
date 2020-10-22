const $ = require("cheerio");
const axios = require("axios");
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const qs = require("qs");
const scrappers = require('./response-scrap')
axiosCookieJarSupport(axios);

const promiseTimeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const scrap = async function (dia, classes, spinner) {
  let cookieJar = new tough.CookieJar();
  const parameters = qs.stringify({
      conversationId: '',
      'dados.buscaInteiroTeor': '',
      'dados.pesquisarComSinonimos': 'S',
      'dados.buscaEmenta': '',
      'dados.nuProcOrigem': '',
      'dados.nuRegistro': '',
      agenteSelectedEntitiesList: '',
      contadoragente: '0',
      contadorMaioragente: '0',
      codigoCr: '',
      codigoTr: '',
      nmAgente: '',
      juizProlatorSelectedEntitiesList: '',
      contadorjuizProlator: '0',
      contadorMaiorjuizProlator: '0',
      codigoJuizCr: '',
      codigoJuizTr: '',
      nmJuiz: '',
      'classesTreeSelection.values': classes,
      'classesTreeSelection.text': '49 Registros selecionados',
      'assuntosTreeSelection.values': '',
      'assuntosTreeSelection.text': '',
      comarcaSelectedEntitiesList: '',
      contadorcomarca: '0',
      contadorMaiorcomarca: '0',
      cdComarca: '',
      nmComarca: '',
      'secoesTreeSelection.values': '',
      'secoesTreeSelection.text': '',
      'dados.dtJulgamentoInicio': dia,
      'dados.dtJulgamentoFim': dia,
      'dados.dtPublicacaoInicio': '',
      'dados.dtPublicacaoFim': '',
      'dados.origensSelecionadas': 'T',
      tipoDecisaoSelecionados: 'A',
      'dados.ordenarPor': 'dtPublicacao'
    }
  )


  let qtdRecuperada = 0;
  let pagina = 1;
  let qtdTotal = -1;
  let resultados = [];

  while (qtdRecuperada < qtdTotal || qtdTotal === -1) {
    spinner.text = dia + ' - ' + qtdRecuperada + '/' + (qtdTotal !== -1 ? qtdTotal : '?')
    try {
      let consultaTjsp;
      if (pagina === 1 || qtdTotal === -1) {
        consultaTjsp = axios.post("https://esaj.tjsp.jus.br/cjsg/resultadoCompleta.do", parameters, {
          jar: cookieJar,
          withCredentials: true,
        }).then((response) => {
          const selector = $.load(response.data);
          qtdTotal = scrappers.getQuantidadeTotal(selector);

          return response;
        })
      } else {
        consultaTjsp = axios.get(`https://esaj.tjsp.jus.br/cjsg/trocaDePagina.do?tipoDeDecisao=A&pagina=${pagina}&conversationId=`, {
          jar: cookieJar,
          withCredentials: true,
        })
      }

      const resultadosPagina = await consultaTjsp.then((response) => {
        // dou um truque na response recebida para q o seletor do scrap permaneça o mesmo
        const selector = $.load(pagina === 1 ? response.data : '<div id="divDadosResultado-A">' + response.data + '</div>');
        pagina++;

        return scrappers.getResultados(selector);
      })

      resultados = [...resultados, ...resultadosPagina];

      qtdRecuperada = resultados.length;
    } catch (ex) {
      // servidor me bloqueou por excesso de requisições bora trocar os cookies
      if (ex.response.status === 403) {
        spinner.text = dia + ' - servidor bloqueou as consultas por excesso de requições - aguardando um pouco, trocando os cookies e torcendo...'

        let locked = false;
        let timeoutMs = 1000;
        do {
          cookieJar = new tough.CookieJar();
          try {
            await Promise.all([axios.post("https://esaj.tjsp.jus.br/cjsg/resultadoCompleta.do", parameters, {
              jar: cookieJar,
              withCredentials: true,
            }),
              promiseTimeout(Math.min(timeoutMs, 10000))
            ]);
            timeoutMs *= 2;

            locked = false;
          } catch (e) {
            locked = true;
          }
        } while (locked)
      } else {
        throw ex
      }
    }
  }

  return resultados;
}

module.exports = scrap;
