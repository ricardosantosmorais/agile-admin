import { NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { renderCatalogoDigitalPreviewHtml } from '@/src/features/catalogos-digitais/services/catalogos-digitais-preview-renderer'
import { serverApiFetch } from '@/src/services/http/server-api'

class StudioActionError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function text(value: unknown) {
  return String(value ?? '').trim()
}

function getErrorMessage(payload: unknown, fallback: string) {
  const record = asRecord(payload)
  const error = asRecord(record.error)
  return text(record.message) || text(error.message) || fallback
}

function escapeFilterValue(value: string) {
  return value.trim().replace(/'/g, "\\'")
}

function productSearchFilter(query: string) {
  const safe = escapeFilterValue(query)
  if (!safe) return ''

  return `(produtos.nome like '%${safe}%' or produtos.codigo = '${safe}' or produtos.id = '${safe}')`
}

function productIdsFilter(ids: string[]) {
  const clauses = ids.flatMap((id) => {
    const safe = escapeFilterValue(id)
    return [
      `produtos.id = '${safe}'`,
      `produtos.codigo = '${safe}'`,
    ]
  })

  return clauses.length ? `(${Array.from(new Set(clauses)).join(' or ')})` : ''
}

function splitProductTokens(value: unknown) {
  return Array.from(new Set(
    text(value)
      .split(/[\s,;|]+/)
      .map((item) => item.replace(/[^a-zA-Z0-9._-]/g, '').trim())
      .filter(Boolean),
  )).slice(0, 120)
}

function collectionFilter(query: string) {
  const safe = escapeFilterValue(query)
  if (!safe) return ''

  return `(nome like '%${safe}%' or codigo = '${safe}' or id = '${safe}')`
}

function normalizeProduct(row: unknown) {
  const product = asRecord(row)
  const brand = asRecord(product.marca)
  const images = asArray(product.imagens).map(asRecord)
  const image = images.map((item) => text(item.imagem_thumb || item.imagem || item.url || item.src)).find(Boolean)
    || text(product.imagem_thumb || product.imagem || product.foto || product.url_imagem)

  return {
    id: text(product.id),
    codigo: text(product.codigo),
    sku: text(product.sku),
    nome: text(product.nome) || 'Produto',
    descricao: text(product.descricao_curta || product.titulo || product.descricao1 || product.descricao2 || product.descricao),
    marca: text(brand.nome),
    imagem: image,
    url: text(asRecord(product.url).slug || product.url),
    ativo: product.ativo === undefined ? true : Boolean(product.ativo),
    disponivel: product.disponivel === undefined ? true : Boolean(product.disponivel),
  }
}

function normalizeCollection(row: unknown) {
  const collection = asRecord(row)
  return {
    id: text(collection.id),
    codigo: text(collection.codigo),
    nome: text(collection.nome) || 'Colecao',
  }
}

function normalizeOption(row: unknown, labelFields: string[], extraFields: string[] = []) {
  const source = asRecord(row)
  const label = labelFields.map((field) => text(source[field])).find(Boolean) || text(source.id)
  const option: Record<string, string> = {
    id: text(source.id),
    codigo: text(source.codigo),
    nome: label,
  }
  for (const field of extraFields) {
    option[field] = text(source[field])
  }
  return option
}

async function fetchTenantRows(token: string, tenantId: string, path: string) {
  const result = await serverApiFetch(path, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!result.ok) {
    throw new StudioActionError(getErrorMessage(result.payload, 'Nao foi possivel carregar dados do contexto comercial.'), result.status || 400)
  }

  return asArray(asRecord(result.payload).data)
}

async function fetchEmpresaParametro(token: string, tenantId: string, key: string) {
  const params = new URLSearchParams()
  params.set('id_empresa', tenantId)
  params.set('chave', key)
  params.set('perpage', '20')
  params.set('order', 'chave,posicao')
  const rows = await fetchTenantRows(token, tenantId, `empresas/parametros?${params.toString()}`)
  const found = rows.map(asRecord).find((row) => text(row.chave) === key && text(row.parametros))
  return text(asRecord(found).parametros)
}

async function fetchPricingOptions(token: string, tenantId: string) {
  const [filiais, formas, condicoes, tabelas, commerceModeRaw, defaultClient] = await Promise.all([
    fetchTenantRows(token, tenantId, `filiais?id_empresa=${encodeURIComponent(tenantId)}&ativo=1&perpage=10000&order=nome_fantasia`),
    fetchTenantRows(token, tenantId, `formas_pagamento?id_empresa=${encodeURIComponent(tenantId)}&ativo=1&perpage=10000&order=nome`),
    fetchTenantRows(token, tenantId, `condicoes_pagamento?id_empresa=${encodeURIComponent(tenantId)}&ativo=1&perpage=10000&order=nome`),
    fetchTenantRows(token, tenantId, `tabelas_preco?id_empresa=${encodeURIComponent(tenantId)}&ativo=1&perpage=10000&order=nome`),
    fetchEmpresaParametro(token, tenantId, 'modo_ecommerce'),
    fetchEmpresaParametro(token, tenantId, 'cod_emitente_ecommerce'),
  ])
  const commerceMode = ['b2b', 'b2b2c', 'b2c'].includes(commerceModeRaw.toLowerCase()) ? commerceModeRaw.toLowerCase() : 'b2b'

  return {
    filiais: filiais.map((row) => normalizeOption(row, ['nome_fantasia', 'razao_social', 'nome'])).filter((item) => item.id),
    formas_pagamento: formas.map((row) => normalizeOption(row, ['nome'])).filter((item) => item.id),
    condicoes_pagamento: condicoes.map((row) => normalizeOption(row, ['nome'], ['indice'])).filter((item) => item.id),
    tabelas_preco: tabelas.map((row) => normalizeOption(row, ['nome'])).filter((item) => item.id),
    modo_ecommerce: commerceMode,
    cliente_padrao_codigo: defaultClient,
  }
}

function numberDigits(value: unknown) {
  return text(value).replace(/\D/g, '')
}

function normalizeDecimal(value: unknown) {
  const raw = text(value).replace(/\s/g, '').replace(/^R\$/i, '')
  if (!raw) return ''
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
    : raw.replace(/[^\d.-]/g, '')
  const number = Number(normalized)
  return Number.isFinite(number) ? String(number) : ''
}

function formatCurrency(value: unknown) {
  const number = Number(normalizeDecimal(value))
  if (!Number.isFinite(number) || number <= 0) return ''
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ')
}

function firstNumber(values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeDecimal(value)
    if (normalized) return normalized
  }
  return ''
}

function pricingHasClient(pricing: Record<string, unknown>) {
  return Boolean(text(pricing.cliente_busca) || text(pricing.id_cliente) || text(pricing.codigo_cliente) || text(pricing.cnpj_cpf_cliente))
}

function applyDefaultClientPricingRule(pricing: Record<string, unknown>, options: Awaited<ReturnType<typeof fetchPricingOptions>>) {
  const next = { ...pricing }
  const defaultClient = text(options.cliente_padrao_codigo)
  if (options.modo_ecommerce === 'b2c' && defaultClient) {
    next.cliente_busca = defaultClient
    next.id_cliente = ''
    next.codigo_cliente = defaultClient
    next.cnpj_cpf_cliente = ''
    next.cliente_padrao_aplicado = true
  } else if (options.modo_ecommerce === 'b2b2c' && !pricingHasClient(next) && defaultClient) {
    next.cliente_busca = defaultClient
    next.codigo_cliente = defaultClient
    next.cliente_padrao_aplicado = true
  }
  if (!text(next.quantidade)) {
    next.quantidade = '1'
  }
  return next
}

function missingPricingFields(pricing: Record<string, unknown>, mode: string) {
  const missing: string[] = []
  if (!text(pricing.id_filial)) missing.push('filial')
  if (!text(pricing.id_forma_pagamento)) missing.push('forma de pagamento')
  if (!text(pricing.id_condicao_pagamento)) missing.push('prazo de pagamento')
  if (mode === 'b2b' && !pricingHasClient(pricing)) missing.push('cliente')
  if ((mode === 'b2c' || mode === 'b2b2c') && !pricingHasClient(pricing)) missing.push('cliente padrao do e-commerce')
  return missing
}

function pricingAttempts(pricing: Record<string, unknown>, fields: Record<string, string>) {
  const combinedField = fields.busca
  const combinedValue = combinedField ? text(pricing[combinedField]) : ''
  if (combinedValue) {
    const attempts: Array<Record<string, string>> = [{ id: combinedValue }, { codigo: combinedValue }]
    const digits = numberDigits(combinedValue)
    if (digits) attempts.push({ cnpj_cpf: digits })
    return attempts
  }

  return Object.entries(fields)
    .filter(([apiField]) => apiField !== 'busca')
    .map(([apiField, pricingField]) => {
      const value = apiField === 'cnpj_cpf' ? numberDigits(pricing[pricingField]) : text(pricing[pricingField])
      return value ? { [apiField]: value } : null
    })
    .filter((entry): entry is Record<string, string> => Boolean(entry))
}

async function resolvePricingPerson(
  token: string,
  tenantId: string,
  resource: 'clientes' | 'vendedores',
  pricing: Record<string, unknown>,
  fields: Record<string, string>,
  embed = '',
) {
  const attempts = pricingAttempts(pricing, fields)
  if (!attempts.length) return { id: '', data: {} as Record<string, unknown> }

  let lastMessage = `${resource === 'clientes' ? 'Cliente' : 'Vendedor'} nao localizado para precificacao.`
  for (const attempt of attempts) {
    const params = new URLSearchParams()
    params.set('id_empresa', tenantId)
    if (embed) {
      for (const [key, value] of new URLSearchParams(embed.replace(/^&/, '')).entries()) {
        params.set(key, value)
      }
    }
    for (const [key, value] of Object.entries(attempt)) {
      params.set(key, value)
    }

    const result = await serverApiFetch(`${resource}?${params.toString()}`, {
      method: 'GET',
      token,
      tenantId,
    })
    if (!result.ok) {
      lastMessage = getErrorMessage(result.payload, lastMessage)
      continue
    }
    const rows = asArray(asRecord(result.payload).data).map(asRecord)
    if (rows.length === 1 && text(rows[0].id)) {
      return { id: text(rows[0].id), data: rows[0] }
    }
    lastMessage = `${resource === 'clientes' ? 'Cliente' : 'Vendedor'} nao localizado de forma unica para precificacao.`
  }

  throw new StudioActionError(lastMessage, 400)
}

async function fetchCondicaoIndice(token: string, tenantId: string, idCondicao: string) {
  if (!idCondicao) return ''
  const rows = await fetchTenantRows(token, tenantId, `condicoes_pagamento?id_empresa=${encodeURIComponent(tenantId)}&id=${encodeURIComponent(idCondicao)}&perpage=1`)
  return text(asRecord(rows[0]).indice)
}

function enrichPricingWithPerson(pricing: Record<string, unknown>, type: 'cliente' | 'vendedor', resolved: { id: string; data: Record<string, unknown> }) {
  const next = { ...pricing }
  if (!resolved.id) return next
  const prefix = type
  next[`id_${prefix}`] = resolved.id
  if (text(resolved.data.codigo)) next[`codigo_${prefix}`] = text(resolved.data.codigo)
  const document = text(resolved.data.cnpj_cpf || resolved.data.cpf_cnpj || resolved.data.cnpj || resolved.data.cpf || resolved.data.documento)
  if (document) next[`cnpj_cpf_${prefix}`] = document
  if (type === 'cliente' && !text(next.cliente_busca)) {
    next.cliente_busca = text(next.codigo_cliente || resolved.id)
  }
  return next
}

function selectPackaging(product: Record<string, unknown>, idFilial: string, idEmbalagem: string) {
  const packages = asArray(product.embalagens).map(asRecord)
  return packages.find((item) => idEmbalagem && text(item.id) === idEmbalagem)
    || packages.find((item) => text(product.id_filial_estoque) && text(item.id_filial) === text(product.id_filial_estoque))
    || packages.find((item) => idFilial && text(item.id_filial) === idFilial)
    || packages[0]
    || {}
}

function normalizePricedProduct(base: Record<string, unknown>, priced: Record<string, unknown>, pricing: Record<string, unknown>, idCliente: string, idVendedor: string, indice: string) {
  const packaging = selectPackaging(priced, text(pricing.id_filial), text(pricing.id_embalagem))
  if (!Object.keys(packaging).length) {
    throw new StudioActionError('Produto sem embalagem valida para os parametros comerciais informados.', 400)
  }
  const priceValue = firstNumber([
    packaging.preco_promocao,
    asRecord(asArray(priced.precificadores).map(asRecord).at(-1)).preco_venda,
    packaging.preco_venda,
    priced.preco_venda,
  ])
  if (!priceValue || Number(priceValue) <= 0) {
    throw new StudioActionError('Produto sem preco para este contexto comercial.', 400)
  }
  const calculatedAt = new Date().toISOString()
  const context = {
    ...pricing,
    id_cliente: idCliente,
    id_vendedor: idVendedor,
    indice,
  }
  const snapshot = {
    origem: 'api-v2/produtos',
    calculado_em: calculatedAt,
    contexto: context,
    id_embalagem: text(packaging.id || pricing.id_embalagem),
    embalagem: text(packaging.nome || packaging.descricao || packaging.sigla),
    quantidade_embalagem: firstNumber([packaging.quantidade]),
    preco_inicial: firstNumber([packaging.preco_inicial]),
    preco_base: firstNumber([packaging.preco_base]),
    preco_promocao: firstNumber([packaging.preco_promocao]),
    preco_minimo: firstNumber([packaging.preco_minimo]),
    preco_venda: priceValue,
    preco_fidelidade: firstNumber([packaging.preco_fidelidade]),
    preco_unitario: priceValue,
    id_tabela_preco: text(priced.id_tabela_preco || pricing.id_tabela_preco),
    id_filial: text(priced.id_filial || pricing.id_filial),
    id_filial_estoque: text(priced.id_filial_estoque),
    id_vendedor: text(priced.id_vendedor || idVendedor),
    precificadores: asArray(priced.precificadores),
    tributos: asArray(priced.tributos),
  }

  return {
    ...base,
    preco_snapshot: snapshot,
    preco_valor: priceValue,
    preco_label: formatCurrency(priceValue) || 'Preco consultado',
    preco_calculado_em: calculatedAt,
    precificacao_contexto: context,
    preco_status: 'ok',
  }
}

async function priceProduct(
  token: string,
  tenantId: string,
  product: Record<string, unknown>,
  pricingInput: Record<string, unknown>,
) {
  const options = await fetchPricingOptions(token, tenantId)
  const pricing = applyDefaultClientPricingRule(pricingInput, options)
  const missing = missingPricingFields(pricing, options.modo_ecommerce)
  if (missing.length) {
    throw new StudioActionError(`Contexto incompleto: ${missing.join(', ')}`, 400)
  }
  const cliente = await resolvePricingPerson(token, tenantId, 'clientes', pricing, {
    busca: 'cliente_busca',
    id: 'id_cliente',
    codigo: 'codigo_cliente',
    cnpj_cpf: 'cnpj_cpf_cliente',
  }, '&embed=condicao_pagamento,forma_pagamento,tabela_preco,grupo,segmento,vendedor')
  const vendedor = await resolvePricingPerson(token, tenantId, 'vendedores', pricing, {
    id: 'id_vendedor',
    codigo: 'codigo_vendedor',
    cnpj_cpf: 'cnpj_cpf_vendedor',
  })
  const enrichedPricing = enrichPricingWithPerson(enrichPricingWithPerson(pricing, 'cliente', cliente), 'vendedor', vendedor)
  const indice = await fetchCondicaoIndice(token, tenantId, text(enrichedPricing.id_condicao_pagamento))
  const idProduto = text(product.id)
  if (!idProduto) {
    throw new StudioActionError('Produto sem ID para precificacao.', 400)
  }

  const query = new URLSearchParams()
  query.set('id_empresa', tenantId)
  query.set('q', `(produtos.id = '${idProduto}')`)
  query.set(`embalagens[${idProduto}]`, text(enrichedPricing.id_embalagem))
  query.set('embed', 'embalagens::ativo=1')
  query.set('id_cliente', cliente.id)
  query.set('id_filial_cliente', text(enrichedPricing.id_filial))
  query.set('id_tabela_preco', text(enrichedPricing.id_tabela_preco))
  query.set('id_vendedor', vendedor.id)
  query.set('id_forma_pagamento', text(enrichedPricing.id_forma_pagamento))
  query.set('id_condicao_pagamento', text(enrichedPricing.id_condicao_pagamento))
  query.set('indice', indice)
  query.set(`quantidades[${idProduto}]`, normalizeDecimal(enrichedPricing.quantidade) || '1')
  const freight = normalizeDecimal(enrichedPricing.valor_frete_item)
  if (freight) query.set('valor_frete_item', freight)
  query.set('cache', '0')

  const result = await agileV2Fetch('produtos', {
    method: 'GET',
    query,
  })

  if (!result.ok) {
    throw new StudioActionError(getErrorMessage(result.payload, 'Nao foi possivel precificar o produto.'), result.status || 400)
  }
  const priced = asRecord(asArray(asRecord(result.payload).data)[0])
  if (!Object.keys(priced).length) {
    throw new StudioActionError('Produto indisponivel para este contexto comercial.', 404)
  }

  return normalizePricedProduct(product, priced, enrichedPricing, cliente.id, vendedor.id, indice)
}

function isProductSection(section: Record<string, unknown>) {
  return ['produtos_grid', 'produtos_lista', 'produtos'].includes(text(section.tipo))
}

function productIdsFromPricedSections(sections: unknown[]) {
  const ids = new Set<string>()
  for (const section of sections.map(asRecord)) {
    if (!isProductSection(section) || section.mostrar_preco === false) continue
    for (const id of asArray(section.produtos)) {
      const value = text(id)
      if (value) ids.add(value)
    }
  }
  return ids
}

async function priceSnapshot(token: string, tenantId: string, payload: Record<string, unknown>) {
  const products = asArray(payload.produtos).map(asRecord)
  const sections = asArray(payload.secoes).map(asRecord)
  const idsToPrice = productIdsFromPricedSections(sections)
  if (!idsToPrice.size) {
    return {
      payload,
      meta: { precificado: false, motivo: 'sem_produtos_com_preco' },
    }
  }

  const globalPricing = asRecord(payload.precificacao)
  const pricedProducts: Record<string, unknown>[] = []
  const errors: Record<string, unknown>[] = []
  let successCount = 0

  for (const product of products) {
    const id = text(product.id)
    const code = text(product.codigo)
    if (!idsToPrice.has(id) && !idsToPrice.has(code)) {
      pricedProducts.push(product)
      continue
    }
    if (product.manual || text(product.origem || product.fonte_produtos) === 'manual') {
      pricedProducts.push(product)
      continue
    }

    try {
      const pricing = asRecord(product.precificacao_contexto || asRecord(product.preco_snapshot).contexto || globalPricing)
      const current = await fetchProducts(token, tenantId, productIdsFilter([id, code].filter(Boolean)), 5)
      const source = asRecord(current.data.find((item) => text(item.id) === id || text(item.codigo) === code) || product)
      const priced = await priceProduct(token, tenantId, { ...product, ...source }, pricing)
      pricedProducts.push(priced)
      successCount += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao precificar produto.'
      const rejected = {
        ...product,
        preco_status: 'erro',
        preco_erro: message,
        message,
        disponivel: false,
        precificacao_contexto: globalPricing,
      }
      pricedProducts.push(rejected)
      errors.push(rejected)
    }
  }

  const pricedAt = new Date().toISOString()
  return {
    payload: {
      ...payload,
      produtos: pricedProducts,
      precos_dinamicos: true,
      precificado_em: pricedAt,
    },
    meta: {
      precificado: true,
      precificado_em: pricedAt,
      produtos: pricedProducts.length,
      precificados: successCount,
      erros: errors.length,
      rejeitados: errors.length,
    },
    errors,
    rejected: errors,
  }
}

async function fetchProducts(token: string, tenantId: string, filter: string, perpage: number) {
  const params = new URLSearchParams()
  params.set('page', '1')
  params.set('perpage', String(Math.max(1, Math.min(120, perpage))))
  params.set('embed', 'imagens,url,marca,departamento,fornecedor')
  params.set('id_empresa', tenantId)
  params.set('order', 'produtos.nome')
  params.set('sort', 'asc')
  if (filter) params.set('q', filter)

  const result = await serverApiFetch(`produtos?${params.toString()}`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!result.ok) {
    throw new StudioActionError(getErrorMessage(result.payload, 'Nao foi possivel buscar produtos.'), result.status || 400)
  }

  const payload = asRecord(result.payload)
  return {
    data: asArray(payload.data).map(normalizeProduct).filter((item) => item.id),
    meta: asRecord(payload.meta),
  }
}

export async function POST(request: Request) {
  try {
    const session = await readAuthSession()
    if (!session) {
      return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
    }

    const body = asRecord(await request.json().catch(() => ({})))
    const action = text(body.action)

    if (action === 'pricingOptions' || action === 'precificacaoOptions') {
      return NextResponse.json({ data: await fetchPricingOptions(session.token, session.currentTenantId) })
    }

    if (action === 'previewDraft') {
      const payload = asRecord(body.payload)
      if (!Object.keys(payload).length) {
        return NextResponse.json({ message: 'Snapshot invalido para gerar previa.' }, { status: 422 })
      }

      const html = renderCatalogoDigitalPreviewHtml({
        data: {
          nome: text(payload.nome) || 'Previa do catalogo',
          mostrar_preco: asRecord(payload.saidas).exibir_preco,
          metadata: { snapshot: payload },
        },
      })

      return new NextResponse(html, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }

    if (action === 'searchProducts') {
      const q = text(body.q)
      const result = await fetchProducts(session.token, session.currentTenantId, productSearchFilter(q), Number(body.perpage || 18))
      return NextResponse.json(result)
    }

    if (action === 'priceProducts' || action === 'precificarProdutos') {
      const ids = splitProductTokens(body.ids || body.codigos)
      const products = ids.length
        ? (await fetchProducts(session.token, session.currentTenantId, productIdsFilter(ids), ids.length)).data
        : asArray(body.products).map(asRecord)
      const priced: Record<string, unknown>[] = []
      const errors: Record<string, unknown>[] = []
      for (const product of products.map(asRecord)) {
        try {
          priced.push(await priceProduct(session.token, session.currentTenantId, product, asRecord(body.pricing)))
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Falha ao precificar produto.'
          errors.push({ ...product, preco_status: 'erro', preco_erro: message, message, disponivel: false })
        }
      }
      return NextResponse.json({
        data: priced,
        errors,
        rejected: errors,
        meta: {
          total: priced.length,
          rejeitados: errors.length,
          precificados_em: new Date().toISOString(),
        },
      })
    }

    if (action === 'priceSnapshot' || action === 'precificarSnapshot') {
      const payload = asRecord(body.payload)
      if (!Object.keys(payload).length) {
        return NextResponse.json({ message: 'Snapshot invalido para precificacao.' }, { status: 422 })
      }
      return NextResponse.json(await priceSnapshot(session.token, session.currentTenantId, payload))
    }

    if (action === 'resolveProducts') {
      const tokens = splitProductTokens(body.codigos)
      if (!tokens.length) {
        return NextResponse.json({ data: [], meta: { total: 0 }, not_found: [] })
      }

      const result = await fetchProducts(session.token, session.currentTenantId, productIdsFilter(tokens), Math.max(tokens.length, 1))
      const found = new Set(result.data.flatMap((item) => [item.id, item.codigo].filter(Boolean)))
      return NextResponse.json({
        ...result,
        not_found: tokens.filter((item) => !found.has(item)),
      })
    }

    if (action === 'searchCollections') {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('perpage', '20')
      params.set('fields', 'id,codigo,nome')
      params.set('order', 'nome')
      params.set('sort', 'asc')
      params.set('id_empresa', session.currentTenantId)
      const filter = collectionFilter(text(body.q))
      if (filter) params.set('q', filter)

      const result = await serverApiFetch(`colecoes?${params.toString()}`, {
        method: 'GET',
        token: session.token,
        tenantId: session.currentTenantId,
      })

      if (!result.ok) {
        return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel buscar colecoes.') }, { status: result.status || 400 })
      }

      return NextResponse.json({ data: asArray(asRecord(result.payload).data).map(normalizeCollection).filter((item) => item.id) })
    }

    if (action === 'importCollection') {
      const collectionId = text(body.id_colecao || body.collectionId)
      if (!collectionId) {
        return NextResponse.json({ message: 'Informe a colecao que sera importada.' }, { status: 400 })
      }

      const params = new URLSearchParams()
      params.set('id_empresa', session.currentTenantId)
      params.set('id', collectionId)
      params.set('embed', 'produtos')

      const collectionResult = await serverApiFetch(`colecoes?${params.toString()}`, {
        method: 'GET',
        token: session.token,
        tenantId: session.currentTenantId,
      })

      if (!collectionResult.ok) {
        return NextResponse.json({ message: getErrorMessage(collectionResult.payload, 'Nao foi possivel importar a colecao.') }, { status: collectionResult.status || 400 })
      }

      const collection = asRecord(asArray(asRecord(collectionResult.payload).data)[0])
      if (!Object.keys(collection).length) {
        return NextResponse.json({ message: 'Colecao nao encontrada para a empresa ativa.' }, { status: 404 })
      }

      const productIds = Array.from(new Set(asArray(collection.produtos)
        .map((item) => text(asRecord(asRecord(item).produto).id || asRecord(item).id))
        .filter(Boolean)))

      const productsResult = productIds.length
        ? await fetchProducts(session.token, session.currentTenantId, productIdsFilter(productIds), productIds.length)
        : { data: [], meta: {} }
      const map = new Map(productsResult.data.map((item) => [item.id, item]))
      const orderedProducts = productIds.map((id) => map.get(id)).filter((item): item is ReturnType<typeof normalizeProduct> => Boolean(item))

      return NextResponse.json({
        colecao: normalizeCollection(collection),
        data: orderedProducts,
        meta: { total: orderedProducts.length },
        not_found: productIds.filter((id) => !map.has(id)),
      })
    }

    return NextResponse.json({ message: 'Acao nao reconhecida em Catalogos Digitais.' }, { status: 400 })
  } catch (error) {
    if (error instanceof StudioActionError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }

    throw error
  }
}
