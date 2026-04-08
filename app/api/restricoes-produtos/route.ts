import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function normalizePhrase(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeToken(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function escapeSqlLike(value: string) {
  return value.replace(/'/g, "\\'")
}

function buildSmartQ(term: string) {
  const phrase = normalizePhrase(term)
  if (!phrase) return ''

  const tokens = phrase
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length >= 2)
    .slice(0, 6)

  if (!tokens.length) return ''

  const parentParts = [
    'restricoes_produtos.id',
    'restricoes_produtos.perfil',
    'restricoes_produtos.uf',
    'restricoes_produtos.tipo_cliente',
    'restricoes_produtos.id_cliente',
    'restricoes_produtos.id_filial',
    'restricoes_produtos.id_grupo',
    'restricoes_produtos.id_canal_distribuicao_cliente',
    'restricoes_produtos.id_rede',
    'restricoes_produtos.id_segmento',
    'restricoes_produtos.id_tabela_preco',
    'restricoes_produtos.id_praca',
    'restricoes_produtos.id_supervisor',
    'restricoes_produtos.id_vendedor',
    'restricoes_produtos.id_produto',
    'restricoes_produtos.id_marca',
    'restricoes_produtos.id_produto_pai',
    'restricoes_produtos.id_fornecedor',
    'restricoes_produtos.id_canal_distribuicao_produto',
    'restricoes_produtos.id_colecao',
    'restricoes_produtos.id_departamento',
    'restricoes_produtos.id_promocao',
    'restricoes_produtos.id_forma_pagamento',
    'restricoes_produtos.id_condicao_pagamento',
    'restricoes_produtos.ativo',
    'restricoes_produtos.orcamento',
    'restricoes_produtos.contribuinte',
    'produtos.nome',
    'produtos.codigo',
    'produtos_pai.nome',
    'produtos_pai.codigo',
    'clientes.nome_fantasia',
    'clientes.razao_social',
    'fornecedores.nome_fantasia',
    'fornecedores.razao_social',
    'marcas.nome',
    'grupos.nome',
    'filiais.nome_fantasia',
    'redes.nome',
    'segmentos.nome',
    'pracas.nome',
    'tabelas_preco.nome',
    'colecoes.nome',
    'departamentos.nome',
    'promocoes.nome',
    'canais_distribuicao_cliente.nome',
    'canais_distribuicao_produto.nome',
    'supervisores.nome',
    'vendedores.nome',
    'formas_pagamento.nome',
    'condicoes_pagamento.nome',
  ]

  const childParts = [
    'f.id',
    'f.perfil',
    'f.uf',
    'f.tipo_cliente',
    'f.id_cliente',
    'f.id_filial',
    'f.id_grupo',
    'f.id_canal_distribuicao_cliente',
    'f.id_rede',
    'f.id_segmento',
    'f.id_tabela_preco',
    'f.id_praca',
    'f.id_supervisor',
    'f.id_vendedor',
    'f.id_produto',
    'f.id_marca',
    'f.id_produto_pai',
    'f.id_fornecedor',
    'f.id_canal_distribuicao_produto',
    'f.id_colecao',
    'f.id_departamento',
    'f.id_promocao',
    'f.id_forma_pagamento',
    'f.id_condicao_pagamento',
    'f.ativo',
    'f.orcamento',
    'f.contribuinte',
    'fp.nome',
    'fp.codigo',
    'fpp.nome',
    'fpp.codigo',
    'fc.nome_fantasia',
    'fc.razao_social',
    'ffo.nome_fantasia',
    'ffo.razao_social',
    'fm.nome',
    'fgr.nome',
    'ffil.nome_fantasia',
    'fr.nome',
    'fseg.nome',
    'fpr.nome',
    'ftp.nome',
    'fcol.nome',
    'fdep.nome',
    'fpromo.nome',
    'fcdc.nome',
    'fcdp.nome',
    'fsup.nome',
    'fven.nome',
    'ffpag.nome',
    'fcpag.nome',
  ]

  const parentBlob = `LOWER(CONCAT_WS(' ', ${parentParts.join(', ')}))`
  const childBlob = `LOWER(CONCAT_WS(' ', ${childParts.join(', ')}))`

  const boolTrue = new Set(['sim', 'true', 'ativo', '1'])
  const boolFalse = new Set(['nao', 'não', 'false', 'inativo', '0'])

  const tokenExprs = tokens.map((rawToken) => {
    const token = escapeSqlLike(rawToken)
    const parentOr = [`${parentBlob} LIKE '%${token}%'`]
    const childOr = [`${childBlob} LIKE '%${token}%'`]

    if (/^[a-z]{2}$/i.test(rawToken)) {
      const uf = rawToken.toUpperCase()
      parentOr.push(`UPPER(restricoes_produtos.uf) = '${uf}'`)
      childOr.push(`UPPER(f.uf) = '${uf}'`)
    }

    if (boolTrue.has(rawToken)) {
      parentOr.push('(restricoes_produtos.ativo = 1 OR restricoes_produtos.orcamento = 1 OR restricoes_produtos.contribuinte = 1)')
      childOr.push('(f.ativo = 1 OR f.orcamento = 1 OR f.contribuinte = 1)')
    } else if (boolFalse.has(rawToken)) {
      parentOr.push('(restricoes_produtos.ativo = 0 OR restricoes_produtos.orcamento = 0 OR restricoes_produtos.contribuinte = 0)')
      childOr.push('(f.ativo = 0 OR f.orcamento = 0 OR f.contribuinte = 0)')
    }

    const existsClause = `EXISTS (
      SELECT 1
      FROM restricoes_produtos f
      LEFT JOIN produtos fp ON fp.id = f.id_produto
      LEFT JOIN produtos fpp ON fpp.id = f.id_produto_pai
      LEFT JOIN clientes fc ON fc.id = f.id_cliente
      LEFT JOIN filiais ffil ON ffil.id = f.id_filial
      LEFT JOIN grupos fgr ON fgr.id = f.id_grupo
      LEFT JOIN redes fr ON fr.id = f.id_rede
      LEFT JOIN segmentos fseg ON fseg.id = f.id_segmento
      LEFT JOIN pracas fpr ON fpr.id = f.id_praca
      LEFT JOIN tabelas_preco ftp ON ftp.id = f.id_tabela_preco
      LEFT JOIN canais_distribuicao fcdc ON fcdc.id = f.id_canal_distribuicao_cliente
      LEFT JOIN canais_distribuicao fcdp ON fcdp.id = f.id_canal_distribuicao_produto
      LEFT JOIN fornecedores ffo ON ffo.id = f.id_fornecedor
      LEFT JOIN marcas fm ON fm.id = f.id_marca
      LEFT JOIN colecoes fcol ON fcol.id = f.id_colecao
      LEFT JOIN departamentos fdep ON fdep.id = f.id_departamento
      LEFT JOIN promocoes fpromo ON fpromo.id = f.id_promocao
      LEFT JOIN supervisores fsup ON fsup.id = f.id_supervisor
      LEFT JOIN vendedores fven ON fven.id = f.id_vendedor
      LEFT JOIN formas_pagamento ffpag ON ffpag.id = f.id_forma_pagamento
      LEFT JOIN condicoes_pagamento fcpag ON fcpag.id = f.id_condicao_pagamento
      WHERE f.id_pai = restricoes_produtos.id
        AND f.id_empresa = restricoes_produtos.id_empresa
        AND f.deleted_at IS NULL
        AND (${childOr.join(' OR ')})
    )`

    return `((${parentOr.join(' OR ')}) OR ${existsClause})`
  })

  return tokenExprs.length ? `(${tokenExprs.join(' AND ')})` : ''
}

function mapMeta(meta: Record<string, unknown>) {
  return {
    page: Number(meta.page || 1),
    pages: Number(meta.pages || 1),
    perPage: Number(meta.perpage || meta.perPage || 15),
    from: Number(meta.from || 0),
    to: Number(meta.to || 0),
    total: Number(meta.total || 0),
    order: typeof meta.order === 'string' ? meta.order : '',
    sort: typeof meta.sort === 'string' ? meta.sort : '',
  }
}

function mapError(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  return fallback
}

const EMBED_QUERY = 'cliente,produto,produto_pai,marca,grupo,tabela_preco,filial,canal_distribuicao_cliente,canal_distribuicao_produto,colecao,departamento,filhos,fornecedor,rede,segmento,praca,supervisor,vendedor,promocao,forma_pagamento,condicao_pagamento'

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams
  const params = new URLSearchParams({
    page: search.get('page') || '1',
    perpage: search.get('perPage') || '15',
    order: search.get('orderBy') || 'created_at',
    sort: search.get('sort') || 'desc',
    embed: EMBED_QUERY,
    'id_pai::nu': '',
  })

  const q = search.get('q')
  if (q?.trim()) {
    const smartQ = buildSmartQ(q.trim())
    if (smartQ) params.set('q', smartQ)
  }
  const perfil = search.get('perfil')
  if (perfil?.trim()) params.set('perfil', perfil.trim())
  const ativo = search.get('ativo')
  if (ativo?.trim()) params.set('ativo', ativo.trim())
  const id = search.get('id')
  if (id?.trim()) params.set('id', id.trim())

  const result = await serverApiFetch(`restricoes_produtos?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível carregar os registros.') }, { status: result.status || 400 })
  }

  const payload = result.payload as { data?: Array<Record<string, unknown>>; meta?: Record<string, unknown> }
  return NextResponse.json({ data: Array.isArray(payload.data) ? payload.data : [], meta: mapMeta(payload.meta ?? {}) })
}

export async function DELETE(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const body = await request.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids : []
  const payload = ids.map((id) => ({ id, id_empresa: session.currentTenantId }))

  const result = await serverApiFetch('restricoes_produtos', {
    method: 'DELETE',
    token: session.token,
    tenantId: session.currentTenantId,
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: mapError(result.payload, 'Não foi possível excluir os registros.') }, { status: result.status || 400 })
  }

  return NextResponse.json({ success: true })
}
