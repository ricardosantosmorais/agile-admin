import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { mapLookupResponse } from '@/src/features/clientes/services/clientes-mappers'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'
import { serverApiFetch } from '@/src/services/http/server-api'

const lookupConfig: Record<string, { path: string; labelKeys: string[]; searchField: string; order?: string; extraQuery?: Record<string, string> }> = {
  clientes: { path: 'clientes', labelKeys: ['nome_fantasia', 'razao_social'], searchField: 'nome_fantasia::like', order: 'nome_fantasia' },
  empresas: { path: 'empresas', labelKeys: ['nome_fantasia', 'razao_social'], searchField: 'nome_fantasia::like', order: 'nome_fantasia' },
  grupos: { path: 'grupos', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  redes: { path: 'redes', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  segmentos: { path: 'segmentos', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  canais_distribuicao: { path: 'canais_distribuicao', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  filiais: { path: 'filiais', labelKeys: ['nome_fantasia', 'nome'], searchField: 'nome_fantasia::like', order: 'nome_fantasia' },
  templates_integracao: { path: 'templates', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  erps: { path: 'erps', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  templates: { path: 'templates', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  parametros_grupo: { path: 'parametros_grupo', labelKeys: ['nome'], searchField: 'nome::like', order: 'ordem,nome' },
  querys: { path: 'querys', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  grupos_filiais: { path: 'grupos_filiais', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  vendedores: { path: 'vendedores', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  supervisores: { path: 'supervisores', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  produtos: { path: 'produtos', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  areas_banner: { path: 'areas_banner', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  departamentos: { path: 'departamentos', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  colecoes: { path: 'colecoes', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  listas: { path: 'listas', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  marcas: { path: 'marcas', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  fornecedores: { path: 'fornecedores', labelKeys: ['nome_fantasia', 'razao_social'], searchField: 'nome_fantasia::like', order: 'nome_fantasia' },
  grades: { path: 'grades', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  grupos_promocao: { path: 'grupos_promocao', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  pracas: { path: 'pracas', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  rotas: { path: 'rotas', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  clusters: { path: 'clusters', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  administradores_master: { path: 'administradores', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome', extraQuery: { master: '1' } },
  promocoes: { path: 'promocoes', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  brindes: { path: 'brindes', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  tabelas_preco: { path: 'tabelas_preco', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  formas_pagamento: { path: 'formas_pagamento', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  condicoes_pagamento: { path: 'condicoes_pagamento', labelKeys: ['nome'], searchField: 'nome::like', order: 'nome' },
  formas_entrega: { path: 'formas_entrega', labelKeys: ['nome'], searchField: 'formas_entrega.nome::like', order: 'formas_entrega.nome' },
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { resource } = await context.params
  const config = lookupConfig[resource]

  if (!config) {
    return NextResponse.json({ message: 'Lookup nao suportado.' }, { status: 404 })
  }

  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  const id = (request.nextUrl.searchParams.get('id') || '').trim()
  const page = request.nextUrl.searchParams.get('page') || '1'
  const perPage = request.nextUrl.searchParams.get('perPage') || '15'

  if (resource === 'templates_integracao') {
    const result = await externalAdminApiFetch('painelb2b', 'templates', {
      method: 'GET',
      query: {
        page: id ? '1' : page,
        perpage: id ? '1' : perPage,
        ...(id ? { id } : {}),
      },
    })

    if (!result.ok) {
      return NextResponse.json({ message: 'Nao foi possivel carregar as opcoes.' }, { status: result.status || 400 })
    }

    const options = mapLookupResponse(result.payload, ['nome'])
    const filtered = q
      ? options.filter((option) => option.label.toLowerCase().includes(q.toLowerCase()))
      : options

    return NextResponse.json(filtered)
  }

  if (resource === 'erps' || resource === 'templates' || resource === 'parametros_grupo' || resource === 'querys') {
    const result = await agileV2Fetch(config.path, {
      method: 'GET',
      query: {
        page: id ? '1' : page,
        perpage: id ? '1' : perPage,
        order: config.order || 'nome',
        sort: 'asc',
        ...(id ? { id } : {}),
        ...(!id && q ? { [config.searchField.replace('::like', ':lk')]: q } : {}),
      },
    })

    if (!result.ok) {
      return NextResponse.json({ message: 'Nao foi possivel carregar as opcoes.' }, { status: result.status || 400 })
    }

    return NextResponse.json(mapLookupResponse(result.payload, config.labelKeys))
  }

  const params = new URLSearchParams({
    page: id ? '1' : page,
    perpage: id ? '1' : perPage,
    order: config.order || 'nome',
    sort: 'asc',
  })

  for (const [key, value] of Object.entries(config.extraQuery || {})) {
    params.set(key, value)
  }

  if (id) {
    params.set('id', id)
  } else if (q) {
    params.set(config.searchField, q)
  }

  const result = await serverApiFetch(`${config.path}?${params.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json({ message: 'Nao foi possivel carregar as opcoes.' }, { status: result.status || 400 })
  }

  return NextResponse.json(mapLookupResponse(result.payload, config.labelKeys))
}
