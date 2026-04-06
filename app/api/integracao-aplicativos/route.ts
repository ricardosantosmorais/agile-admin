import { NextRequest, NextResponse } from 'next/server'
import {
  asRecord,
  generateClientId,
  generateSecret,
  getErrorMessage,
  mapMeta,
  painelB2BFetch,
  resolveIntegracaoAplicativosContext,
} from '@/app/api/integracao-aplicativos/_shared'

function mapOrderBy(value: string) {
  if (['id', 'codigo', 'nome', 'email', 'ativo'].includes(value)) {
    return value
  }

  return 'nome'
}

export async function GET(request: NextRequest) {
  const resolved = await resolveIntegracaoAplicativosContext()
  if ('error' in resolved) return resolved.error

  const searchParams = request.nextUrl.searchParams
  const query: Record<string, string> = {
    page: searchParams.get('page') || '1',
    perpage: searchParams.get('perPage') || '15',
    field: mapOrderBy(searchParams.get('orderBy') || 'nome'),
    sort: searchParams.get('sort') || 'asc',
    id_empresa: resolved.context.tenantCodigo,
    id_perfil: '4',
  }

  const id = searchParams.get('id')?.trim()
  const codigo = searchParams.get('codigo::like')?.trim()
  const nome = searchParams.get('nome::like')?.trim()
  const email = searchParams.get('email::like')?.trim()
  const ativo = searchParams.get('ativo')?.trim()

  if (id) query.id = id
  if (codigo) query['codigo:lk'] = codigo
  if (nome) query['nome:lk'] = nome
  if (email) query['email:lk'] = email
  if (ativo) query.ativo = ativo === '1' ? '1' : '0'

  const result = await painelB2BFetch('gestao_usuario', {
    method: 'GET',
    query,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar os aplicativos.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json({
    ...asRecord(result.payload),
    meta: mapMeta(result.payload),
  })
}

export async function POST(request: NextRequest) {
  const resolved = await resolveIntegracaoAplicativosContext()
  if ('error' in resolved) return resolved.error

  const body = await request.json().catch(() => null)
  const source = asRecord(body)
  const id = String(source.id || '').trim()
  const payload: Record<string, string | number> = {
    id_empresa: resolved.context.tenantCodigo,
    id_perfil: 4,
    perfil: 'api',
    ativo: source.ativo === false || source.ativo === 0 || source.ativo === '0' ? 0 : 1,
    codigo: String(source.codigo || '').trim(),
    nome: String(source.nome || '').trim(),
    email: String(source.email || '').trim(),
  }

  if (id) {
    payload.id = id
  } else {
    payload.login = generateClientId()
    payload.senha = generateSecret()
  }

  const result = await painelB2BFetch('gestao_usuario', {
    method: 'POST',
    body: payload,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível salvar o aplicativo.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
  const resolved = await resolveIntegracaoAplicativosContext()
  if ('error' in resolved) return resolved.error

  const body = await request.json().catch(() => null)
  const source = asRecord(body)
  const ids = Array.isArray(source.ids)
    ? source.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []

  for (const id of ids) {
    const result = await painelB2BFetch('gestao_usuario', {
      method: 'POST',
      body: {
        id,
        id_empresa: resolved.context.tenantCodigo,
        id_perfil: 4,
        perfil: 'api',
        ativo: 0,
      },
    })

    if (!result.ok) {
      return NextResponse.json(
        { message: getErrorMessage(result.payload, 'Não foi possível excluir os aplicativos.') },
        { status: result.status || 400 },
      )
    }
  }

  return NextResponse.json({ success: true })
}

