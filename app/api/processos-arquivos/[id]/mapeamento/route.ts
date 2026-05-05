import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import ExcelJS from 'exceljs'
import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

const PREVIEW_TEMP_DIR = path.join(os.tmpdir(), 'admin-v2-web-processos-arquivos-preview')
const MAX_PREVIEW_ROWS = 100

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? value as ApiRecord : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return String(value ?? '').trim()
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }

  return fallback
}

function getS3Client() {
  const accessKeyId = process.env.UPLOAD_S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.UPLOAD_S3_SECRET_ACCESS_KEY?.trim()
  const region = process.env.UPLOAD_S3_REGION?.trim() || 'sa-east-1'

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Configuração de upload S3 ausente.')
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

function getPrivateBucket() {
  return process.env.UPLOAD_S3_PRIVATE_BUCKET?.trim() || 'agileecommerce-files'
}

function getExcelColumnLetter(index: number) {
  let letter = ''
  let cursor = index

  while (cursor >= 0) {
    letter = String.fromCharCode(65 + (cursor % 26)) + letter
    cursor = Math.floor(cursor / 26) - 1
  }

  return letter
}

function cellToString(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)

  const record = asRecord(value)
  if (typeof record.text === 'string') return record.text
  if (typeof record.result === 'string' || typeof record.result === 'number' || typeof record.result === 'boolean') return String(record.result)
  if (Array.isArray(record.richText)) {
    return record.richText.map((part) => asString(asRecord(part).text)).join('')
  }

  return String(value)
}

async function writeBodyToFile(body: unknown, filePath: string) {
  const writable = createWriteStream(filePath)

  try {
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      if (!writable.write(chunk)) {
        await once(writable, 'drain')
      }
    }
    writable.end()
    await once(writable, 'finish')
  } catch (error) {
    writable.destroy()
    throw error
  }
}

async function downloadS3ObjectToTempFile(key: string) {
  await mkdir(PREVIEW_TEMP_DIR, { recursive: true })
  const extension = path.extname(key).toLowerCase() || '.xlsx'
  const filePath = path.join(PREVIEW_TEMP_DIR, `${randomUUID()}${extension}`)
  const result = await getS3Client().send(new GetObjectCommand({
    Bucket: getPrivateBucket(),
    Key: key,
  }))

  if (!result.Body) {
    throw new Error('Arquivo sem conteúdo no S3.')
  }

  await writeBodyToFile(result.Body, filePath)
  return filePath
}

async function readSpreadsheetPreview(key: string, rowLimit: number) {
  const normalizedKey = key.toLowerCase()
  if (!normalizedKey.endsWith('.xlsx')) {
    return {
      sheetName: '',
      columns: [],
      rows: [],
      previewRows: 0,
      warning: 'Preview automático disponível somente para arquivos XLSX. Para XLS legado, informe as colunas manualmente.',
    }
  }

  let tempPath = ''

  try {
    tempPath = await downloadS3ObjectToTempFile(key)
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(tempPath, {
      entries: 'emit',
      sharedStrings: 'cache',
      styles: 'ignore',
      hyperlinks: 'ignore',
      worksheets: 'emit',
    })

    let sheetName = ''
    let columns: Array<{ letter: string; name: string }> = []
    const rows: string[][] = []

    for await (const worksheetReader of workbookReader) {
      sheetName = asString((worksheetReader as unknown as { name?: unknown }).name)
      let rowIndex = 0

      for await (const row of worksheetReader) {
        const rawValues = Array.isArray(row.values) ? row.values : []
        const valueCount = Math.max(Number(row.cellCount || 0), rawValues.length > 0 ? rawValues.length - 1 : 0)
        const values = Array.from({ length: valueCount }, (_, index) => rawValues[index + 1])

        if (rowIndex === 0) {
          columns = values.map((value, index) => {
            const letter = getExcelColumnLetter(index)
            const name = cellToString(value) || `Coluna ${letter}`
            return { letter, name }
          })
        } else if (rows.length < rowLimit) {
          rows.push(columns.map((_, index) => cellToString(values[index])))
        }

        rowIndex += 1
        if (columns.length > 0 && rows.length >= rowLimit) {
          break
        }
      }

      break
    }

    if (!columns.length) {
      return {
        sheetName,
        columns: [],
        rows: [],
        previewRows: 0,
        warning: 'Não foi possível identificar as colunas na primeira linha da planilha.',
      }
    }

    return {
      sheetName,
      columns,
      rows,
      previewRows: rows.length,
      warning: '',
    }
  } catch (error) {
    return {
      sheetName: '',
      columns: [],
      rows: [],
      previewRows: 0,
      warning: error instanceof Error ? error.message : 'Não foi possível carregar o preview da planilha.',
    }
  } finally {
    if (tempPath) {
      await rm(tempPath, { force: true }).catch(() => undefined)
    }
  }
}

function normalizeMappingsFromProcess(process: unknown) {
  return asArray(asRecord(process).mapeamentos).map((mapping) => {
    const record = asRecord(mapping)
    return {
      id: asString(record.id),
      id_processo: asString(record.id_processo),
      id_tabela: asString(record.id_tabela ?? record.tabela),
      coluna_origem: asString(record.coluna_origem),
      id_campo: asString(record.id_campo ?? record.coluna_destino),
    }
  }).filter((mapping) => mapping.coluna_origem && mapping.id_campo)
}

async function loadProcess(input: { id: string; token: string; tenantId: string }) {
  const query = new URLSearchParams({
    id_empresa: input.tenantId,
    id: input.id,
    tipo: 'importacao_planilha',
    embed: 'usuario,logs,mapeamentos',
    perpage: '1',
  })

  return serverApiFetch(`processos?${query.toString()}`, {
    method: 'GET',
    token: input.token,
    tenantId: input.tenantId,
  })
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const previewRows = Math.min(MAX_PREVIEW_ROWS, Math.max(5, Number(request.nextUrl.searchParams.get('previewRows') || 25)))

  const processResult = await loadProcess({ id, token: session.token, tenantId: session.currentTenantId })
  if (!processResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(processResult.payload, 'Não foi possível carregar o processo de importação.') },
      { status: processResult.status || 400 },
    )
  }

  const process = asArray(asRecord(processResult.payload).data)[0]
  if (!process || typeof process !== 'object') {
    return NextResponse.json({ message: 'Processo não encontrado.' }, { status: 404 })
  }

  const dictionariesResult = await serverApiFetch('dicionarios_tabelas?embed=campos&perpage=1000&order=nome&integra_planilha=1', {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!dictionariesResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(dictionariesResult.payload, 'Não foi possível carregar os destinos de dados.') },
      { status: dictionariesResult.status || 400 },
    )
  }

  const mappings = normalizeMappingsFromProcess(process)
  const arquivo = asString(asRecord(process).arquivo)
  const preview = arquivo
    ? await readSpreadsheetPreview(arquivo, previewRows)
    : {
        sheetName: '',
        columns: [],
        rows: [],
        previewRows: 0,
        warning: 'Arquivo da planilha não informado para este processo.',
      }

  return NextResponse.json({
    processo: process,
    dicionarios: asArray(asRecord(dictionariesResult.payload).data),
    mapeamentos: mappings,
    preview,
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params
  const body = asRecord(await request.json().catch(() => null))
  const idTabela = asString(body.id_tabela)
  const mappings = asArray(body.mapeamentos).map((mapping) => {
    const record = asRecord(mapping)
    return {
      id_processo: id,
      id_tabela: idTabela,
      coluna_origem: asString(record.coluna_origem),
      id_campo: asString(record.id_campo),
    }
  }).filter((mapping) => mapping.coluna_origem && mapping.id_campo)

  if (!idTabela) {
    return NextResponse.json({ message: 'Selecione o destino dos dados.' }, { status: 400 })
  }

  if (!mappings.length) {
    return NextResponse.json({ message: 'Faça pelo menos um mapeamento antes de salvar.' }, { status: 400 })
  }

  const processResult = await loadProcess({ id, token: session.token, tenantId: session.currentTenantId })
  if (!processResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(processResult.payload, 'Não foi possível carregar os mapeamentos atuais.') },
      { status: processResult.status || 400 },
    )
  }

  const process = asArray(asRecord(processResult.payload).data)[0]
  const existingMappings = normalizeMappingsFromProcess(process)
  if (existingMappings.length) {
    const deleteResult = await serverApiFetch('processos/mapeamentos', {
      method: 'DELETE',
      token: session.token,
      tenantId: session.currentTenantId,
      body: existingMappings.map((mapping) => ({ id: mapping.id })),
    })

    if (!deleteResult.ok) {
      return NextResponse.json(
        { message: getErrorMessage(deleteResult.payload, 'Não foi possível substituir os mapeamentos atuais.') },
        { status: deleteResult.status || 400 },
      )
    }
  }

  const saveResult = await serverApiFetch('processos/mapeamentos', {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: mappings,
  })

  if (!saveResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(saveResult.payload, 'Não foi possível salvar os mapeamentos.') },
      { status: saveResult.status || 400 },
    )
  }

  return NextResponse.json({
    success: true,
    data: saveResult.payload,
  })
}
