import { NextResponse } from 'next/server'
import { asArray, asRecord, asString, dicionarioApiFetch, getErrorMessage } from '@/app/api/dicionario-dados/_shared'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildHtml(tabelas: Array<Record<string, unknown>>) {
  const generatedAt = new Date().toLocaleString('pt-BR')
  const tableRows = tabelas
    .filter((tabela) => Number(tabela.integra ?? 1) === 1)
    .map((tabela, tableIndex) => {
      const nomeTabela = asString(tabela.nome)
      const descricao = asString(tabela.descricao)
      const regra = asString(tabela.regra)
      const campos = asArray<Record<string, unknown>>(tabela.campos)
        .filter((campo) => Number(campo.integra ?? 1) === 1)
        .map((campo) => {
          const chave = asString(campo.chave) === 'PRI' ? 'Sim' : 'Não'
          const obrigatorio = asString(campo.nulo).toUpperCase() === 'NO' ? 'Sim' : 'Não'
          return `
            <tr>
              <td>${escapeHtml(asString(campo.nome))}</td>
              <td>${escapeHtml(chave)}</td>
              <td>${escapeHtml(asString(campo.tipo))}</td>
              <td>${escapeHtml(asString(campo.descricao))}</td>
              <td>${escapeHtml(asString(campo.regra))}</td>
              <td>${escapeHtml(obrigatorio)}</td>
            </tr>
          `
        })
        .join('')

      return `
        <section style="margin-bottom:36px;">
          <h2 style="margin:0 0 8px 0;">Tabela ${tableIndex + 1}: ${escapeHtml(nomeTabela)}</h2>
          <h3 style="margin:12px 0 4px 0;">Descrição</h3>
          <div>${descricao || '-'}</div>
          <h3 style="margin:12px 0 4px 0;">Regras</h3>
          <div>${regra || '-'}</div>
          <h3 style="margin:12px 0 8px 0;">Colunas</h3>
          <table style="width:100%; border-collapse:collapse;" border="1" cellpadding="6">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Chave Primária</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Regra</th>
                <th>Obrigatório</th>
              </tr>
            </thead>
            <tbody>${campos}</tbody>
          </table>
        </section>
      `
    })
    .join('')

  return `
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Dicionário de Dados</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1 { margin-bottom: 4px; }
          h2, h3 { color: #111827; }
          table th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Dicionário de Dados</h1>
        <p>Gerado em ${escapeHtml(generatedAt)}</p>
        ${tableRows}
      </body>
    </html>
  `
}

export async function GET() {
  const fetched = await dicionarioApiFetch('dicionarios_tabelas?embed=campos&perpage=1000&order=nome', {
    method: 'GET',
  })
  if ('error' in fetched) return fetched.error

  if (!fetched.result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(fetched.result.payload, 'Não foi possível exportar o dicionário.') },
      { status: fetched.result.status || 400 },
    )
  }

  const payload = asRecord(fetched.result.payload)
  const tabelas = asArray<Record<string, unknown>>(payload.data)
  const html = buildHtml(tabelas)
  return new NextResponse(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-disposition': 'attachment; filename="dicionario.html"',
    },
  })
}
