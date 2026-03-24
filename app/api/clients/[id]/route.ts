import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { mapClientDetail } from '@/src/features/clientes/services/clientes-mappers'
import { serverApiFetch } from '@/src/services/http/server-api'

const CLIENT_EMBED =
  'formularios,formularios.dados.campo,vendedor,vendedores.vendedor,filial,filiais.filial,filiais.tabela_preco,grupo,rede,segmento,tabela_preco,forma_pagamento,forma_pagamento_padrao,condicao_pagamento,condicao_pagamento_padrao,formas_pagamento.forma_pagamento,formas_pagamento.filial,condicoes_pagamento.condicao_pagamento,condicoes_pagamento.filial,canal_distribuicao'

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await serverApiFetch(`clientes/${id}?embed=${encodeURIComponent(CLIENT_EMBED)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (result.status === 404) {
    return NextResponse.json({ message: 'Cliente nao encontrado.' }, { status: 404 })
  }

  if (!result.ok) {
    const message =
      typeof result.payload === 'object'
      && result.payload !== null
      && 'error' in result.payload
      && typeof result.payload.error === 'object'
      && result.payload.error !== null
      && 'message' in result.payload.error
      && typeof result.payload.error.message === 'string'
        ? result.payload.error.message
        : 'Nao foi possivel carregar o cliente.'

    return NextResponse.json({ message }, { status: result.status || 400 })
  }

  const client = mapClientDetail(result.payload)
  if (!client) {
    return NextResponse.json({ message: 'Cliente nao encontrado.' }, { status: 404 })
  }

  return NextResponse.json(client)
}
