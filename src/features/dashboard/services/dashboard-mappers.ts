import type { DashboardSnapshot } from '@/src/lib/fake-data'
import { asArray, asNumber, asRecord, asString } from '@/src/lib/api-payload'
import type { ApiRecord } from '@/src/lib/api-payload'

function percent(part: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Number(((part / total) * 100).toFixed(1))
}

function formatChartDay(value: unknown) {
  const text = asString(value)
  if (!text) {
    return ''
  }

  const [year, month, day] = text.slice(0, 10).split('-')
  if (!year || !month || !day) {
    return text
  }

  return `${day}/${month}`
}

function buildSeries(payload: ApiRecord) {
  const serie = asRecord(payload.serie)
  const currentRows = asArray<ApiRecord>(serie.diaria)
  const previousRows = asArray<ApiRecord>(asRecord(serie.comparativo).diaria_anterior)

  return currentRows.map((row, index) => {
    const previousRow = asRecord(previousRows[index])
    return {
      dia: formatChartDay(row.data),
      data: asString(row.data),
      atual: asNumber(row.faturamento_valido),
      anterior: asNumber(previousRow.faturamento_valido),
      ticket: asNumber(row.ticket_medio),
      pedidos: asNumber(row.pedidos_validos),
    }
  })
}

function mapMarketingLabel(value: string) {
  const labels: Record<string, string> = {
    sem_incentivo: 'Sem incentivo',
    overlap: 'Overlap',
    promocao: 'Promocao',
    campanha: 'Campanha',
    cupom_manual: 'Cupom manual',
    cupom_automatico: 'Cupom automatico',
    brinde: 'Brinde',
    precificador_promocional: 'Precificador',
  }

  return labels[value] ?? value
}

export function mapDashboardPayloadToSnapshot(payload: unknown, rangeLabel: string): DashboardSnapshot {
  const source = asRecord(payload)
  const resumo = asRecord(source.resumo)
  const resumoComparativo = asRecord(resumo.comparativo)
  const funil = asRecord(source.funil)
  const funilAtual = asRecord(funil.atual)
  const funilComparativo = asRecord(funil.comparativo)
  const clientes = asRecord(source.clientes)
  const clientesIndicadores = asRecord(clientes.indicadores)
  const clientesComparativo = asRecord(clientes.comparativo)
  const mix = asRecord(source.mix)
  const marketing = asRecord(source.marketing)
  const marketingResumo = asRecord(marketing.resumo)
  const marketingComparativo = asRecord(marketing.comparativo)
  const marketingMix = asRecord(marketing.mix)
  const marketingTops = asRecord(marketing.tops)
  const coorte = asRecord(source.coorte)
  const pagamentos = asRecord(source.pagamentos)
  const produtos = asRecord(source.produtos)
  const operacao = asRecord(source.operacao)
  const alertas = asRecord(source.alertas)

  const series = buildSeries(source)
  const paymentRows = asArray<ApiRecord>(pagamentos.formas)
  const paymentTotal = paymentRows.reduce((sum, row) => sum + asNumber(row.valor_total), 0)
  const marketingExclusiveRows = asArray<ApiRecord>(marketingMix.exclusivo)
  const marketingExclusiveRevenue = marketingExclusiveRows.reduce((sum, row) => sum + asNumber(asRecord(row).receita), 0)
  const couponRows = asArray<ApiRecord>(marketingTops.cupons)
  const promotionRows = asArray<ApiRecord>(marketingTops.promocoes)

  return {
    rangeLabel,
    primaryMetrics: [
      {
        label: 'Total de vendas',
        labelKey: 'dashboard.metricLabels.totalVendas',
        value: asNumber(resumo.faturamento_valido),
        variation: asNumber(resumoComparativo.faturamento_valido),
        type: 'currency',
        tone: 'emerald',
        description: 'Receita total dos pedidos validos no periodo selecionado.',
        descriptionKey: 'dashboard.metricDescriptions.totalVendas',
      },
      {
        label: 'Numero de pedidos',
        labelKey: 'dashboard.metricLabels.numeroPedidos',
        value: asNumber(resumo.pedidos_validos),
        variation: asNumber(resumoComparativo.pedidos_validos),
        type: 'number',
        tone: 'sky',
        description: 'Quantidade de pedidos validos no periodo selecionado.',
        descriptionKey: 'dashboard.metricDescriptions.numeroPedidos',
      },
      {
        label: 'Ticket medio',
        labelKey: 'dashboard.metricLabels.ticketMedio',
        value: asNumber(resumo.ticket_medio),
        variation: asNumber(resumoComparativo.ticket_medio),
        type: 'currency',
        tone: 'amber',
        description: 'Valor medio por pedido valido no periodo selecionado.',
        descriptionKey: 'dashboard.metricDescriptions.ticketMedio',
      },
      {
        label: 'Taxa de conversao',
        labelKey: 'dashboard.metricLabels.taxaConversao',
        value: asNumber(funilAtual.taxa_aproveitamento),
        variation: asNumber(funilComparativo.taxa_aproveitamento_variacao),
        type: 'percent',
        tone: 'rose',
        description: 'Percentual de aproveitamento do funil no periodo selecionado.',
        descriptionKey: 'dashboard.metricDescriptions.taxaConversao',
      },
    ],
    customerMetrics: [
      { label: 'Novos clientes', labelKey: 'dashboard.metricLabels.novosClientes', value: asNumber(clientesIndicadores.clientes_novos), variation: asNumber(clientesComparativo.clientes_novos) },
      { label: 'Clientes ativos', labelKey: 'dashboard.metricLabels.clientesAtivos', value: asNumber(clientesIndicadores.clientes_ativos), variation: asNumber(clientesComparativo.clientes_ativos) },
      { label: 'Taxa de recompra', labelKey: 'dashboard.metricLabels.taxaRecompra', value: asNumber(clientesIndicadores.taxa_recompra_geral), variation: asNumber(clientesComparativo.taxa_recompra_geral), type: 'percent' },
      { label: 'LTV medio', labelKey: 'dashboard.metricLabels.ltvMedio', value: asNumber(clientesIndicadores.ltv_medio_clientes_ativos), variation: asNumber(clientesComparativo.ltv_medio_clientes_ativos), type: 'currency' },
    ],
    serie: series.map((item) => ({
      dia: item.dia,
      data: item.data,
      atual: item.atual,
      anterior: item.anterior,
      ticket: item.ticket,
      pedidos: item.pedidos,
    })),
    ticketByDay: series.map((item) => ({
      dia: item.dia,
      data: item.data,
      valor: item.ticket,
      pedidos: item.pedidos,
    })),
    channel: asArray<ApiRecord>(mix.canais).map((row) => ({
      name: asString(row.canal, '(sem classificacao)').toUpperCase(),
      value: asNumber(row.quantidade),
      qtd: asNumber(row.quantidade),
      ticket: asNumber(row.ticket_medio),
      valor: asNumber(row.valor_total),
    })),
    emitente: asArray<ApiRecord>(mix.emitente).map((row) => ({
      name: asString(row.emitente, 'N/D'),
      value: asNumber(row.valor_total),
      qtd: asNumber(row.quantidade),
      ticket: asNumber(row.ticket_medio),
      valor: asNumber(row.valor_total),
    })),
    funil: [
      { name: 'Carrinho', value: asNumber(funilAtual.carrinho_qtd), qtd: asNumber(funilAtual.carrinho_qtd), valor: asNumber(funilAtual.carrinho_valor), pctCarrinho: 100, pctAprovados: 0 },
      { name: 'Aprovados', value: asNumber(funilAtual.aprovados_qtd), qtd: asNumber(funilAtual.aprovados_qtd), valor: asNumber(funilAtual.aprovados_valor), pctCarrinho: asNumber(funilAtual.taxa_aproveitamento), pctAprovados: 100 },
      { name: 'Faturado', value: asNumber(funilAtual.faturados_qtd), qtd: asNumber(funilAtual.faturados_qtd), valor: asNumber(funilAtual.faturados_valor), pctCarrinho: percent(asNumber(funilAtual.faturados_qtd), asNumber(funilAtual.carrinho_qtd)), pctAprovados: percent(asNumber(funilAtual.faturados_qtd), asNumber(funilAtual.aprovados_qtd)) },
      { name: 'Cancelado', value: asNumber(funilAtual.cancelados_qtd), qtd: asNumber(funilAtual.cancelados_qtd), valor: asNumber(funilAtual.cancelados_valor), pctCarrinho: percent(asNumber(funilAtual.cancelados_qtd), asNumber(funilAtual.carrinho_qtd)), pctAprovados: percent(asNumber(funilAtual.cancelados_qtd), asNumber(funilAtual.aprovados_qtd)) },
    ],
    monitoringAlerts: asArray<ApiRecord>(alertas.itens).map((item) => {
      const title = asString(item.titulo)
      const description = asString(item.descricao)
      return title && description ? `${title}: ${description}` : title || description
    }),
    coorte: [
      { name: '30 dias', janela: '30 dias', taxa: asNumber(asRecord(coorte.taxas).recompra_30d), clientes: asNumber(coorte.recompra_30d) },
      { name: '60 dias', janela: '60 dias', taxa: asNumber(asRecord(coorte.taxas).recompra_60d), clientes: asNumber(coorte.recompra_60d) },
      { name: '90 dias', janela: '90 dias', taxa: asNumber(asRecord(coorte.taxas).recompra_90d), clientes: asNumber(coorte.recompra_90d) },
    ],
    topClients: asArray<ApiRecord>(clientes.top_clientes).map((item) => ({
      nome: asString(item.cliente, '(sem nome)'),
      pedidos: asNumber(item.quantidade),
      valor: asNumber(item.valor_total),
    })),
    topProducts: asArray<ApiRecord>(produtos.top_produtos).map((item) => ({
      nome: asString(item.produto, '(sem produto)'),
      quantidade: asNumber(item.quantidade),
      valor: asNumber(item.valor_total),
    })),
    payments: paymentRows.map((item) => ({
      name: asString(item.tipo_pagamento, '(sem tipo)'),
      value: percent(asNumber(item.valor_total), paymentTotal),
      valor: asNumber(item.valor_total),
      registros: asNumber(item.registros),
    })),
    hourlyRevenue: asArray<ApiRecord>(operacao.horarios).map((item) => ({
      hora: `${String(asNumber(item.hora)).padStart(2, '0')}h`,
      name: `${String(asNumber(item.hora)).padStart(2, '0')}h`,
      valor: asNumber(item.valor_total),
    })),
    marketingMetrics: [
      { label: 'Pedidos incentivados', labelKey: 'dashboard.metricLabels.pedidosIncentivados', value: asNumber(marketingResumo.valor_pedidos_com_incentivo), variation: asNumber(marketingComparativo.valor_pedidos_com_incentivo), type: 'currency', tone: 'emerald', descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
      { label: 'Itens incentivados', labelKey: 'dashboard.metricLabels.itensIncentivados', value: asNumber(marketingResumo.valor_itens_incentivados), variation: asNumber(marketingComparativo.valor_itens_incentivados), type: 'currency', tone: 'sky', descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
      { label: 'Qtd. pedidos com incentivo', labelKey: 'dashboard.metricLabels.qtdPedidosComIncentivo', value: asNumber(marketingResumo.pedidos_com_incentivo), variation: asNumber(marketingComparativo.pedidos_com_incentivo), type: 'number', tone: 'amber', descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
      { label: '% da receita com incentivo', labelKey: 'dashboard.metricLabels.receitaComIncentivo', value: asNumber(marketingResumo.receita_com_incentivo_percentual), variation: asNumber(marketingComparativo.receita_com_incentivo_percentual), type: 'percent', tone: 'rose', descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
    ],
    marketingMixExclusive: marketingExclusiveRows.map((item) => ({
      name: mapMarketingLabel(asString(item.classificacao)),
      value: percent(asNumber(item.receita), marketingExclusiveRevenue),
      qtd: asNumber(item.itens),
      receita: asNumber(item.receita),
    })),
    marketingMixInclusive: asArray<ApiRecord>(marketingMix.inclusive).map((item) => ({
      name: mapMarketingLabel(asString(item.classificacao)),
      value: asNumber(item.receita),
      qtd: asNumber(item.itens),
    })),
    marketingTicketComparison: [
      { name: 'Com incentivo', value: asNumber(marketingResumo.ticket_com_incentivo) },
      { name: 'Sem incentivo', value: asNumber(marketingResumo.ticket_sem_incentivo) },
    ],
    topCoupons: couponRows.map((item) => ({
      nome: asString(item.codigo || item.nome, '(sem cupom)'),
      name: asString(item.nome_label || item.codigo || item.nome, '(sem cupom)'),
      pedidos: asNumber(item.pedidos),
      receita: asNumber(item.receita),
      fonte: asString(item.fonte),
    })),
    topPromotions: promotionRows.map((item) => ({
      nome: asString(item.nome || item.codigo, '(sem promocao)'),
      name: asString(item.nome_label || item.nome || item.codigo, '(sem promocao)'),
      pedidos: asNumber(item.pedidos),
      receita: asNumber(item.receita),
    })),
  }
}
