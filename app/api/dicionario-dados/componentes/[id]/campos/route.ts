import { NextRequest, NextResponse } from 'next/server'
import {
  asArray,
  asRecord,
  asString,
  dicionarioApiFetch,
  getErrorMessage,
  isDicionarioApiFetchError,
} from '@/app/api/dicionario-dados/_shared'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idComponente } = await context.params
  const idTabela = request.nextUrl.searchParams.get('idTabela')?.trim() || ''
  if (!idTabela) {
    return NextResponse.json({ message: 'Informe a tabela para carregar os campos.' }, { status: 400 })
  }

  const [componenteResult, tabelaResult, camposResult, ignoradosResult] = await Promise.all([
    dicionarioApiFetch(`componentes?id=${encodeURIComponent(idComponente)}&perpage=1`, { method: 'GET' }),
    dicionarioApiFetch(`dicionarios_tabelas?id=${encodeURIComponent(idTabela)}&embed=campos&perpage=1`, { method: 'GET' }),
    dicionarioApiFetch(`componentes_tabelas_campos?id_componente=${encodeURIComponent(idComponente)}&perpage=10000`, { method: 'GET' }),
    dicionarioApiFetch(`componentes_tabelas_campos_ignorados?id_componente=${encodeURIComponent(idComponente)}&perpage=10000`, { method: 'GET' }),
  ])

  if (isDicionarioApiFetchError(componenteResult)) return componenteResult.error
  if (isDicionarioApiFetchError(tabelaResult)) return tabelaResult.error
  if (isDicionarioApiFetchError(camposResult)) return camposResult.error
  if (isDicionarioApiFetchError(ignoradosResult)) return ignoradosResult.error

  const failed = [componenteResult, tabelaResult, camposResult, ignoradosResult].find((item) => !item.result.ok)
  if (failed) {
    return NextResponse.json(
      { message: getErrorMessage(failed.result.payload, 'Nao foi possivel carregar os campos do componente.') },
      { status: failed.result.status || 400 },
    )
  }

  const componente = asRecord(asArray(asRecord(componenteResult.result.payload).data)[0])
  const tabela = asRecord(asArray(asRecord(tabelaResult.result.payload).data)[0])
  const tabelaCampos = asArray(asRecord(tabela).campos).map((value) => asRecord(value))
  const encontrados = asArray(asRecord(camposResult.result.payload).data).map((value) => asRecord(value))
  const ignorados = asArray(asRecord(ignoradosResult.result.payload).data).map((value) => asRecord(value))

  const encontradosByCampo = new Map(encontrados.map((item) => [asString(item.id_dicionario_tabela_campo), item]))
  const ignoradosByCampo = new Map(ignorados.map((item) => [asString(item.id_dicionario_tabela_campo), item]))

  const fields = tabelaCampos.map((campo) => {
    const campoId = asString(campo.id)
    const ignored = ignoradosByCampo.get(campoId)
    const found = encontradosByCampo.get(campoId)
    const status = found ? 'encontrado' : ignored ? 'ignorado' : 'nao_disponivel'
    return {
      id: campoId,
      nome: asString(campo.nome),
      posicao: Number(campo.posicao || 0),
      descricao: asString(campo.descricao),
      regra: asString(campo.regra),
      status,
      ignoredRecordId: ignored ? asString(ignored.id) : '',
      ignoredObservation: ignored ? asString(ignored.observacao) : '',
    }
  })

  return NextResponse.json({
    componente: {
      id: asString(componente.id),
      nome: asString(componente.nome),
      arquivo: asString(componente.arquivo),
      ativo: componente.ativo !== false,
    },
    tabela: {
      id: asString(tabela.id),
      nome: asString(tabela.nome),
    },
    fields,
  })
}
