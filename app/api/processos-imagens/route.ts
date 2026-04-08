import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildUploadObjectKey } from '@/src/lib/upload-targets'
import { serverApiFetch } from '@/src/services/http/server-api'

type MultipartUploadState = {
  uploadId: string
  bucket: string
  key: string
  tenantId: string
  userId: string
  fileName: string
  totalChunks: number
  totalFileSize: number
  parts: Array<{ PartNumber: number; ETag: string }>
}

const MAX_ZIP_SIZE_BYTES = 500 * 1024 * 1024
const UPLOAD_STATE_DIR = path.join(os.tmpdir(), 'admin-v2-web-processos-imagens-upload')

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

function resolveSortField(orderBy: string) {
  if (orderBy === 'id') return 'id'
  if (orderBy === 'usuario') return 'usuario:nome'
  if (orderBy === 'status') return 'status'
  return 'created_at'
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

function isZipFile(file: File) {
  return file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed'
}

function resolveStatePath(uploadId: string) {
  return path.join(UPLOAD_STATE_DIR, `${uploadId}.json`)
}

function normalizeUploadId(value: string) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  return /^[a-zA-Z0-9_-]+$/.test(normalized) ? normalized : ''
}

async function readUploadState(uploadId: string): Promise<MultipartUploadState | null> {
  try {
    const content = await readFile(resolveStatePath(uploadId), 'utf-8')
    return JSON.parse(content) as MultipartUploadState
  } catch {
    return null
  }
}

async function writeUploadState(uploadId: string, state: MultipartUploadState) {
  await mkdir(UPLOAD_STATE_DIR, { recursive: true })
  await writeFile(resolveStatePath(uploadId), JSON.stringify(state), 'utf-8')
}

async function clearUploadState(uploadId: string) {
  await rm(resolveStatePath(uploadId), { force: true })
}

async function createProcessRecord(input: {
  token: string
  tenantId: string
  userId: string
  arquivo: string
}) {
  return serverApiFetch('processos', {
    method: 'POST',
    token: input.token,
    tenantId: input.tenantId,
    body: {
      id_empresa: input.tenantId,
      id_usuario: input.userId,
      tipo: 'imagens',
      arquivo: input.arquivo,
      status: 'criado',
    },
  })
}

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const search = request.nextUrl.searchParams
  const page = Math.max(1, Number(search.get('page') || 1))
  const perPage = Math.min(200, Math.max(1, Number(search.get('perPage') || 15)))
  const orderBy = search.get('orderBy') || 'created_at'
  const sort = search.get('sort') === 'asc' ? 'asc' : 'desc'

  const query = new URLSearchParams({
    page: String(page),
    perpage: String(perPage),
    embed: 'usuario',
    id_empresa: session.currentTenantId,
    tipo: 'imagens',
    order: resolveSortField(orderBy),
    sort,
  })

  const id = String(search.get('id') || '').trim()
  const usuario = String(search.get('usuario') || '').trim()
  const dataInicio = String(search.get('data_inicio') || '').trim()
  const dataFim = String(search.get('data_fim') || '').trim()
  const status = String(search.get('status') || '').trim()

  if (id) query.set('id', id)
  if (usuario) query.set('usuario:nome::like', usuario)
  if (dataInicio) query.set('created_at::ge', `${dataInicio} 00:00:00`)
  if (dataFim) query.set('created_at::le', `${dataFim} 23:59:59`)
  if (status) query.set('status', status)

  const result = await serverApiFetch(`processos?${query.toString()}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!result.ok) {
    return NextResponse.json(
      { message: getErrorMessage(result.payload, 'Não foi possível carregar os processos de imagens.') },
      { status: result.status || 400 },
    )
  }

  return NextResponse.json(result.payload)
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Arquivo ZIP não informado.' }, { status: 400 })
  }

  if (!isZipFile(file)) {
    return NextResponse.json({ message: 'Envie somente arquivo no formato ZIP.' }, { status: 400 })
  }

  const requestedUploadId = normalizeUploadId(String(formData.get('dzuuid') || ''))
  const uploadId = requestedUploadId || randomUUID().replace(/[^a-zA-Z0-9_-]/g, '')
  const chunkIndex = Number(formData.get('dzchunkindex') ?? 0)
  const totalChunks = Number(formData.get('dztotalchunkcount') ?? 1)
  const totalFileSize = Number(formData.get('dztotalfilesize') ?? file.size)
  const originalFileName = String(formData.get('dzfilename') || file.name || 'arquivo.zip').trim() || 'arquivo.zip'

  if (totalFileSize > MAX_ZIP_SIZE_BYTES) {
    return NextResponse.json({ message: 'O arquivo ZIP deve ter no máximo 500 MB.' }, { status: 400 })
  }

  const bucket = process.env.UPLOAD_S3_PRIVATE_BUCKET?.trim() || 'agileecommerce-files'
  const s3 = getS3Client()

  const isMultipartUpload = totalChunks > 1

  if (!isMultipartUpload) {
    const key = buildUploadObjectKey(`processos/${session.currentTenantId}`, file.name)
    const buffer = Buffer.from(await file.arrayBuffer())

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ACL: 'private',
      ContentType: file.type || 'application/zip',
    }))

    const createProcess = await createProcessRecord({
      token: session.token,
      tenantId: session.currentTenantId,
      userId: session.currentUserId,
      arquivo: key,
    })

    if (!createProcess.ok) {
      return NextResponse.json(
        { message: getErrorMessage(createProcess.payload, 'Não foi possível criar o processo de imagens.') },
        { status: createProcess.status || 400 },
      )
    }

    return NextResponse.json({
      success: true,
      status: 'completed',
      uploadId,
      message: 'Upload concluído com sucesso. O processo foi criado para execução.',
      progress: 100,
    })
  }

  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || !Number.isInteger(totalChunks) || totalChunks < 1) {
    return NextResponse.json({ message: 'Metadados de upload em partes inválidos.' }, { status: 400 })
  }

  let state = await readUploadState(uploadId)

  if (!state) {
    if (chunkIndex !== 0) {
      return NextResponse.json({ message: 'Upload em partes inválido. Reinicie o envio do arquivo.' }, { status: 409 })
    }

    const key = buildUploadObjectKey(`processos/${session.currentTenantId}`, originalFileName)
    const created = await s3.send(new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ACL: 'private',
      ContentType: file.type || 'application/zip',
    }))

    state = {
      uploadId: created.UploadId || '',
      bucket,
      key,
      tenantId: session.currentTenantId,
      userId: session.currentUserId,
      fileName: originalFileName,
      totalChunks,
      totalFileSize,
      parts: [],
    }

    if (!state.uploadId) {
      return NextResponse.json({ message: 'Não foi possível iniciar upload multipart no S3.' }, { status: 500 })
    }

    await writeUploadState(uploadId, state)
  }

  if (state.tenantId !== session.currentTenantId || state.userId !== session.currentUserId) {
    return NextResponse.json({ message: 'Upload pertence a outro contexto de sessão.' }, { status: 409 })
  }

  if (chunkIndex >= state.totalChunks) {
    return NextResponse.json({ message: 'Chunk recebido fora do intervalo esperado.' }, { status: 400 })
  }

  const partNumber = chunkIndex + 1
  const chunkBuffer = Buffer.from(await file.arrayBuffer())

  const uploadedPart = await s3.send(new UploadPartCommand({
    Bucket: state.bucket,
    Key: state.key,
    UploadId: state.uploadId,
    PartNumber: partNumber,
    Body: chunkBuffer,
  }))

  if (!uploadedPart.ETag) {
    return NextResponse.json({ message: 'Falha ao enviar chunk para o S3.' }, { status: 500 })
  }

  state.parts = [
    ...state.parts.filter((part) => part.PartNumber !== partNumber),
    { PartNumber: partNumber, ETag: uploadedPart.ETag },
  ]

  const completedChunks = state.parts.length
  const progress = Math.min(100, Math.max(0, Math.round((completedChunks / state.totalChunks) * 100)))

  if (partNumber < state.totalChunks) {
    await writeUploadState(uploadId, state)

    return NextResponse.json({
      success: true,
      status: 'chunk_uploaded',
      uploadId,
      progress,
      message: 'Parte do arquivo recebida.',
    })
  }

  if (state.parts.length !== state.totalChunks) {
    await writeUploadState(uploadId, state)
    return NextResponse.json({ message: 'Upload incompleto. Nem todas as partes foram recebidas.' }, { status: 409 })
  }

  const orderedParts = [...state.parts].sort((left, right) => left.PartNumber - right.PartNumber)

  await s3.send(new CompleteMultipartUploadCommand({
    Bucket: state.bucket,
    Key: state.key,
    UploadId: state.uploadId,
    MultipartUpload: {
      Parts: orderedParts,
    },
  }))

  await clearUploadState(uploadId)

  const createProcess = await createProcessRecord({
    token: session.token,
    tenantId: session.currentTenantId,
    userId: session.currentUserId,
    arquivo: state.key,
  })

  if (!createProcess.ok) {
    return NextResponse.json(
      { message: getErrorMessage(createProcess.payload, 'Não foi possível criar o processo de imagens.') },
      { status: createProcess.status || 400 },
    )
  }

  return NextResponse.json({
    success: true,
    status: 'completed',
    uploadId,
    progress: 100,
    message: 'Upload concluído com sucesso. O processo foi criado para execução.',
  })
}
