const $ = require("cheerio");

const mapaPropriedades = {
  'Classe/Assunto:': 'classeAssunto',
  'Relator(a):': 'relator',
  'Comarca:': 'comarca',
  'Órgão julgador:': 'orgaoJulgador',
  'Data do julgamento:': 'dataJulgamento',
  'Data de publicação:': 'dataPublicacao'
};

const scrappers = {
  getQuantidadeTotal: (domSelector) => {
    const qtdProcessosText = domSelector('#nomeAba-A').text().trim();
    const qtdProcessos = qtdProcessosText.match(/Acórdãos\((\d+)\)/i)

    return parseInt(qtdProcessos[1]);
  },
  getResultados: (domSelector) => {
    const resultados = domSelector("#divDadosResultado-A > table > tbody > tr");

    return resultados.map((index, element) => {
      const nProcesso = $(element).find('.esajLinkLogin');
      const numeroProcesso = nProcesso.text().trim();
      const codigoAcordao = nProcesso.attr('cdacordao');
      const codigoForo = nProcesso.attr('cdforo');

      const segredo = $(element).find('.segredoJustica').length > 0;
      const ementa = $(element).find('.mensagemSemFormatacao').text().replace(/\u00a0/g, " ").trim();

      const outrosDados = $(element).find('tr.ementaClass2 td').map((i, nDado) => {
        const tipo = $(nDado).find('strong').text().trim();
        const texto = nDado.children.filter((v) => v.type === "text").map(v => v.data.trim()).join(" ").trim();

        const propriedade = mapaPropriedades[tipo];

        return propriedade != null ? {[propriedade]: texto} : null;
      }).get().reduce((acc, v) => {
        return {...acc, ...v};
      }, {});

      return numeroProcesso != null && numeroProcesso !== '' ? {
        numeroProcesso,
        codigoAcordao,
        codigoForo,
        ementa,
        segredo, ...outrosDados
      } : null;
    }).get().filter(v => v != null);
  }
}

module.exports = scrappers;