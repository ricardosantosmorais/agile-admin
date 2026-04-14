import { NextResponse } from 'next/server'
import {
  agileV2Fetch,
  asArray,
  asRecord,
  extractApiErrorMessage,
  resolveConsultasContext,
  serverTenantFetch,
  toStringValue,
} from '@/app/api/consultas/_shared'

function normalizeLookupLabel(row: Record<string, unknown>) {
  return toStringValue(row.nome_fantasia || row.nome || row.titulo || row.codigo || row.id)
}

function toNumberString(value: unknown) {
  return String(value ?? '').replace(/\D/g, '')
}

function formatBooleanLabel(value: unknown) {
  return value === true || value === 1 || value === '1' ? 'Sim' : 'Não'
}

function formatCurrency(value: unknown) {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) {
    return 'R$ 0,00'
  }

  return numeric.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

function formatDateTime(value: unknown) {
  const input = toStringValue(value)
  if (!input) return ''
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return input
  return parsed.toLocaleString('pt-BR')
}

function pickFirstFilledRecord(rows: unknown[]) {
  return asRecord(rows.find((entry) => Object.keys(asRecord(entry)).length))
}

function buildProdutoRows(produto: Record<string, unknown>) {
  return [
    { label: 'ID', value: toStringValue(produto.id) },
    { label: 'Código', value: toStringValue(produto.codigo) },
    { label: 'Ativo', value: formatBooleanLabel(produto.ativo) },
    { label: 'Status', value: toStringValue(produto.status) },
    { label: 'Nome', value: toStringValue(produto.nome) },
    { label: 'SKU', value: toStringValue(produto.sku) },
    { label: 'EAN', value: toStringValue(produto.ean) },
    { label: 'NCM', value: toStringValue(produto.ncm) },
    { label: 'IPI', value: toStringValue(produto.ipi) ? `${toStringValue(produto.ipi)}%` : '' },
    { label: 'Produto Pai', value: toStringValue(asRecord(produto.produto_pai).nome) },
    { label: 'Marca', value: toStringValue(asRecord(produto.marca).nome) },
    { label: 'Fornecedor', value: toStringValue(asRecord(produto.fornecedor).nome_fantasia) },
    { label: 'Departamento', value: toStringValue(asRecord(produto.departamento).nome) },
    { label: 'Canal de Distribuição', value: toStringValue(asRecord(produto.canal_distribuicao).nome) },
    { label: 'Disponível', value: formatBooleanLabel(produto.disponivel) },
    { label: 'Vende sem Estoque', value: formatBooleanLabel(produto.vende_sem_estoque) },
  ].filter((row) => row.value)
}

function buildEmbalagemRows(embalagem: Record<string, unknown>) {
  return [
    { label: 'ID', value: toStringValue(embalagem.id) },
    { label: 'Código', value: toStringValue(embalagem.codigo) },
    { label: 'Ativo', value: formatBooleanLabel(embalagem.ativo) },
    { label: 'Nome', value: toStringValue(embalagem.nome) },
    { label: 'SKU', value: toStringValue(embalagem.sku) },
    { label: 'EAN', value: toStringValue(embalagem.ean) },
    { label: 'Quantidade', value: toStringValue(embalagem.quantidade) },
    { label: 'Múltiplo', value: toStringValue(embalagem.multiplo) },
    { label: 'Estoque Disponível', value: toStringValue(embalagem.estoque_disponivel) },
    { label: 'Data de Criação', value: formatDateTime(embalagem.created_at) },
    { label: 'Última Atualização', value: formatDateTime(embalagem.updated_at) },
    { label: 'Sync', value: toStringValue(embalagem.id_sync) },
  ].filter((row) => row.value)
}

function buildValoresRows(produto: Record<string, unknown>, embalagem: Record<string, unknown>) {
  const precificadores = asArray<Record<string, unknown>>(produto.precificadores)
  const tributos = asArray<Record<string, unknown>>(produto.tributos)
  const valorTributos = tributos.reduce((total, tributo) => {
    const tipo = toStringValue(tributo.tipo)
    if (['st', 'fecoep', 'ipi'].includes(tipo)) {
      return total + Number(tributo.valor ?? 0)
    }
    return total
  }, 0)

  return [
    { label: 'Preço Inicial', value: formatCurrency(embalagem.preco_inicial) },
    { label: 'Preço Base', value: formatCurrency(embalagem.preco_base) },
    { label: 'Preço de Promoção', value: Number(embalagem.preco_promocao ?? 0) > 0 ? formatCurrency(embalagem.preco_promocao) : '' },
    {
      label: 'Preço após Precificadores',
      value: precificadores.length
        ? formatCurrency(Number(asRecord(precificadores.at(-1)).preco_venda ?? 0) * Number(embalagem.quantidade ?? 1))
        : '',
    },
    { label: 'Preço Mínimo', value: Number(embalagem.preco_minimo ?? 0) > 0 ? formatCurrency(embalagem.preco_minimo) : '' },
    { label: 'Tributos', value: tributos.length ? formatCurrency(valorTributos) : '' },
    { label: 'Acréscimo', value: Number(embalagem.acrescimo_venda ?? 0) > 0 ? formatCurrency(embalagem.acrescimo_venda) : '' },
    { label: 'Desconto', value: Number(embalagem.desconto_venda ?? 0) > 0 ? formatCurrency(embalagem.desconto_venda) : '' },
    { label: 'Preço Venda', value: formatCurrency(embalagem.preco_venda) },
    { label: 'Preço Fidelidade', value: Number(embalagem.preco_fidelidade ?? 0) > 0 ? formatCurrency(embalagem.preco_fidelidade) : '' },
    {
      label: 'Preço Venda Unit.',
      value: Number(embalagem.quantidade ?? 0) > 1
        ? formatCurrency(Number(embalagem.preco_venda ?? 0) / Number(embalagem.quantidade ?? 1))
        : '',
    },
  ].filter((row) => row.value)
}

function buildPedidoRows(produto: Record<string, unknown>) {
  return [
    { label: 'Filial', value: toStringValue(produto.id_filial) },
    { label: 'Filial de Estoque', value: toStringValue(produto.id_filial_estoque) },
    { label: 'Vendedor', value: toStringValue(produto.id_vendedor) },
    { label: 'Tabela de Preço', value: toStringValue(produto.id_tabela_preco) },
  ].filter((row) => row.value)
}

function getTipoPrecificadorLabel(value: unknown) {
  const tipo = toStringValue(value)
  if (tipo === 'valor') return 'Valor'
  if (tipo === 'percentual') return 'Percentual'
  if (tipo === 'comissao') return 'Comissão'
  return tipo || '-'
}

function getTipoTributoLabel(value: unknown) {
  const tipo = toStringValue(value)
  if (tipo === 'st') return 'ST'
  if (tipo === 'fecoep') return 'FECOEP'
  if (tipo === 'ipi') return 'IPI'
  if (tipo === 'icms') return 'ICMS'
  if (tipo === 'pis') return 'PIS'
  if (tipo === 'cofins') return 'COFINS'
  return tipo || '-'
}

function buildPrecificadoresRows(produto: Record<string, unknown>, embalagem: Record<string, unknown>) {
  return asArray<Record<string, unknown>>(produto.precificadores).map((precificador) => ({
    'ID/Nome': [toStringValue(precificador.id), toStringValue(precificador.nome)].filter(Boolean).join(' - '),
    Tipo: getTipoPrecificadorLabel(precificador.tipo),
    'Prior.': formatBooleanLabel(precificador.prioridade),
    'Qtd. De': toStringValue(precificador.pedido_minimo),
    'Qtd. Até': toStringValue(precificador.pedido_maximo),
    'Data Fim': formatDateTime(precificador.data_fim),
    'Cálculo': Number(precificador.fator ?? 0) === 1 ? 'Fator' : 'Percentual',
    Desconto: toStringValue(precificador.desconto) ? formatCurrency(precificador.desconto) : '',
    'Acréscimo': toStringValue(precificador.acrescimo) ? formatCurrency(precificador.acrescimo) : '',
    'Preço Venda': toStringValue(precificador.preco_venda)
      ? formatCurrency(Number(precificador.preco_venda ?? 0) * Number(embalagem.quantidade ?? 1))
      : '',
  }))
}

function buildTributosRows(produto: Record<string, unknown>) {
  return asArray<Record<string, unknown>>(produto.tributos).map((tributo) => ({
    ID: toStringValue(tributo.id),
    Tipo: getTipoTributoLabel(tributo.tipo),
    Variáveis: toStringValue(tributo.variaveis),
    Valor: toStringValue(tributo.valor) ? formatCurrency(tributo.valor) : '',
  }))
}

function buildPromocoesRows(produto: Record<string, unknown>) {
  return asArray<Record<string, unknown>>(produto.promocoes_quantidade).map((promocao) => ({
    Nome: toStringValue(promocao.nome),
    'Qtd. De': toStringValue(promocao.pedido_minimo),
    'Qtd. Até': toStringValue(promocao.pedido_maximo),
    'Data Fim': formatDateTime(promocao.data_fim),
    'Cálculo': Number(promocao.fator ?? 0) === 1 ? 'Fator' : 'Percentual',
    Desconto: toStringValue(promocao.desconto) ? formatCurrency(promocao.desconto) : '',
    'Preço Venda': toStringValue(promocao.preco_venda) ? formatCurrency(promocao.preco_venda) : '',
  }))
}

function resolveEmbalagem(produto: Record<string, unknown>, idFilial: string, idEmbalagem: string) {
  const embalagens = asArray<Record<string, unknown>>(produto.embalagens)
  if (idEmbalagem) {
    const byId = embalagens.find((entry) => toStringValue(entry.id) === idEmbalagem)
    if (byId) return byId
  }

  if (idFilial) {
    const byFilial = embalagens.find((entry) => toStringValue(entry.id_filial) === idFilial)
    if (byFilial) return byFilial
  }

  return asRecord(embalagens[0])
}

export async function GET() {
  const contextResult = await resolveConsultasContext()
  if ('error' in contextResult) {
    return contextResult.error
  }

  const { context } = contextResult
  const [filiaisResult, formasResult, condicoesResult, tabelasResult] = await Promise.all([
    serverTenantFetch(context, 'filiais?ativo=1&perpage=10000&order=nome_fantasia'),
    serverTenantFetch(context, 'formas_pagamento?ativo=1&perpage=10000&order=nome'),
    serverTenantFetch(context, 'condicoes_pagamento?ativo=1&perpage=10000&order=nome'),
    serverTenantFetch(context, 'tabelas_preco?ativo=1&perpage=10000&order=nome'),
  ])

  const failed = [filiaisResult, formasResult, condicoesResult, tabelasResult].find((result) => !result.ok)
  if (failed) {
    return NextResponse.json(
      { message: extractApiErrorMessage(failed.payload, 'Não foi possível carregar o contexto do simulador de preços.') },
      { status: failed.status || 400 },
    )
  }

  return NextResponse.json({
    data: {
      filiais: asArray(asRecord(filiaisResult.payload).data).map((entry) => {
        const row = asRecord(entry)
        return {
          id: toStringValue(row.id),
          label: normalizeLookupLabel(row),
          subtitle: toStringValue(row.codigo),
        }
      }).filter((entry) => entry.id),
      formasPagamento: asArray(asRecord(formasResult.payload).data).map((entry) => {
        const row = asRecord(entry)
        return {
          id: toStringValue(row.id),
          label: normalizeLookupLabel(row),
        }
      }).filter((entry) => entry.id),
      condicoesPagamento: asArray(asRecord(condicoesResult.payload).data).map((entry) => {
        const row = asRecord(entry)
        return {
          id: toStringValue(row.id),
          label: normalizeLookupLabel(row),
          indice: toStringValue(row.indice),
        }
      }).filter((entry) => entry.id),
      tabelasPreco: asArray(asRecord(tabelasResult.payload).data).map((entry) => {
        const row = asRecord(entry)
        return {
          id: toStringValue(row.id),
          label: normalizeLookupLabel(row),
        }
      }).filter((entry) => entry.id),
    },
  })
}

export async function POST(request: Request) {
  const contextResult = await resolveConsultasContext()
  if ('error' in contextResult) {
    return contextResult.error
  }

  const { context } = contextResult
  const payload = asRecord(await request.json().catch(() => ({})))

  const idProduto = toStringValue(payload.id_produto)
  const idEmbalagem = toStringValue(payload.id_embalagem)
  const quantidade = toStringValue(payload.quantidade) || '1'
  const idFilial = toStringValue(payload.id_filial)
  const idFormaPagamento = toStringValue(payload.id_forma_pagamento)
  const idCondicaoPagamento = toStringValue(payload.id_condicao_pagamento)
  const valorFreteItem = toStringValue(payload.valor_frete_item)

  if (!idProduto || !quantidade || !idFilial || !idFormaPagamento || !idCondicaoPagamento) {
    return NextResponse.json(
      { message: 'Informe produto, quantidade, filial, forma de pagamento e condição de pagamento para continuar.' },
      { status: 400 },
    )
  }

  const [produtoDetalheResult, condicoesResult] = await Promise.all([
    serverTenantFetch(context, `produtos?id=${encodeURIComponent(idProduto)}&embed=canal_distribuicao,departamento,fornecedor,marca,produto_pai`),
    serverTenantFetch(context, 'condicoes_pagamento?ativo=1&perpage=10000&order=nome'),
  ])

  if (!produtoDetalheResult.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(produtoDetalheResult.payload, 'Não foi possível carregar os detalhes do produto.') },
      { status: produtoDetalheResult.status || 400 },
    )
  }

  if (!condicoesResult.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(condicoesResult.payload, 'Não foi possível carregar as condições de pagamento.') },
      { status: condicoesResult.status || 400 },
    )
  }

  const detalheProduto = pickFirstFilledRecord(asArray(asRecord(produtoDetalheResult.payload).data))
  if (!Object.keys(detalheProduto).length) {
    return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 })
  }

  const clienteQuery = new URLSearchParams()
  if (toStringValue(payload.id_cliente)) clienteQuery.set('id', toStringValue(payload.id_cliente))
  if (toStringValue(payload.codigo_cliente)) clienteQuery.set('codigo', toStringValue(payload.codigo_cliente))
  if (toStringValue(payload.cnpj_cpf_cliente)) clienteQuery.set('cnpj_cpf', toNumberString(payload.cnpj_cpf_cliente))

  const vendedorQuery = new URLSearchParams()
  if (toStringValue(payload.id_vendedor)) vendedorQuery.set('id', toStringValue(payload.id_vendedor))
  if (toStringValue(payload.codigo_vendedor)) vendedorQuery.set('codigo', toStringValue(payload.codigo_vendedor))
  if (toStringValue(payload.cnpj_cpf_vendedor)) vendedorQuery.set('cnpj_cpf', toNumberString(payload.cnpj_cpf_vendedor))

  const [clienteResult, vendedorResult] = await Promise.all([
    clienteQuery.toString()
      ? serverTenantFetch(context, `clientes?embed=condicao_pagamento,forma_pagamento,tabela_preco,grupo,segmento,vendedor&${clienteQuery.toString()}`)
      : Promise.resolve({ ok: true, status: 200, payload: { data: [] } }),
    vendedorQuery.toString()
      ? serverTenantFetch(context, `vendedores?${vendedorQuery.toString()}`)
      : Promise.resolve({ ok: true, status: 200, payload: { data: [] } }),
  ])

  if (!clienteResult.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(clienteResult.payload, 'Não foi possível localizar o cliente informado.') },
      { status: clienteResult.status || 400 },
    )
  }

  if (!vendedorResult.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(vendedorResult.payload, 'Não foi possível localizar o vendedor informado.') },
      { status: vendedorResult.status || 400 },
    )
  }

  const cliente = pickFirstFilledRecord(asArray(asRecord(clienteResult.payload).data))
  const vendedor = pickFirstFilledRecord(asArray(asRecord(vendedorResult.payload).data))
  const condicao = asArray<Record<string, unknown>>(asRecord(condicoesResult.payload).data).find((entry) => toStringValue(entry.id) === idCondicaoPagamento)
  const indice = toStringValue(asRecord(condicao).indice)

  const calculoQuery = new URLSearchParams()
  calculoQuery.set('id_empresa', context.tenantId)
  calculoQuery.set('q', `(produtos.id = '${idProduto}')`)
  calculoQuery.set(`embalagens[${idProduto}]`, idEmbalagem)
  calculoQuery.set('embed', 'embalagens::ativo=1')
  calculoQuery.set('id_cliente', toStringValue(cliente.id))
  calculoQuery.set('id_filial_cliente', idFilial)
  calculoQuery.set('id_vendedor', toStringValue(vendedor.id))
  calculoQuery.set('id_forma_pagamento', idFormaPagamento)
  calculoQuery.set('id_condicao_pagamento', idCondicaoPagamento)
  calculoQuery.set('indice', indice)
  calculoQuery.set(`quantidades[${idProduto}]`, quantidade)
  calculoQuery.set('cache', '0')

  if (valorFreteItem) {
    calculoQuery.set('valor_frete_item', valorFreteItem.replace(/\./g, '').replace(',', '.'))
  }

  const calculoResult = await agileV2Fetch('produtos', {
    method: 'GET',
    query: calculoQuery,
  })

  if (!calculoResult.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(calculoResult.payload, 'Não foi possível simular o preço do produto.') },
      { status: calculoResult.status || 400 },
    )
  }

  const produtoCalculado = pickFirstFilledRecord(asArray(asRecord(calculoResult.payload).data))
  if (!Object.keys(produtoCalculado).length) {
    return NextResponse.json({ message: 'A simulação não retornou dados para o produto informado.' }, { status: 404 })
  }

  const embalagem = resolveEmbalagem(produtoCalculado, idFilial, idEmbalagem)
  const debugUrl = `produtos?${calculoQuery.toString()}`

  return NextResponse.json({
    data: {
      produto: buildProdutoRows(detalheProduto),
      embalagem: buildEmbalagemRows(embalagem),
      valores: buildValoresRows(produtoCalculado, embalagem),
      pedido: buildPedidoRows(produtoCalculado),
      precificadores: buildPrecificadoresRows(produtoCalculado, embalagem),
      tributos: buildTributosRows(produtoCalculado),
      promocoesQuantidade: buildPromocoesRows(produtoCalculado),
      debug: {
        url: debugUrl,
        endpoint: debugUrl.replace(/ /g, '%20'),
      },
    },
  })
}
