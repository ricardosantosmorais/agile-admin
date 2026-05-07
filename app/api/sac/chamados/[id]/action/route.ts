import { randomUUID } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import { getErrorMessage, requireSacSession } from '@/app/api/sac/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'

type RouteContext = {
  params: Promise<{ id: string }>
}

const ACTION_ENDPOINTS = {
  respond: 'responder',
  'internal-note': 'nota-interna',
  status: 'status',
  assign: 'atribuir',
  transfer: 'transferir',
} as const

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['doc', 'docx', 'odt', 'jpg', 'jpeg', 'gif', 'png', 'pdf', 'xls', 'xlsx', 'txt', 'zip'])
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

export const runtime = 'nodejs'

function text(value: unknown) {
  return String(value ?? '').trim()
}

function getS3Client() {
  const accessKeyId = (process.env.UPLOAD_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.UPLOAD_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim()
  const region = (process.env.UPLOAD_S3_REGION || process.env.AWS_DEFAULT_REGION || 'sa-east-1').trim()

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Configuração de upload S3 ausente.')
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getPrivateBucket() {
  return (process.env.UPLOAD_S3_PRIVATE_BUCKET || process.env.AWS_BUCKET || 'agileecommerce-files').trim()
}

function getExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot >= 0 ? fileName.slice(lastDot + 1).toLowerCase() : ''
}

function buildStorageFileName(fileName: string) {
  const extension = getExtension(fileName)
  return `${Date.now().toString(36)}-${randomUUID().replace(/-/g, '')}${extension ? `.${extension}` : ''}`
}

function isAttachmentFile(value: FormDataEntryValue): value is File {
  return value instanceof File && text(value.name) !== ''
}

function validateAttachments(files: File[]) {
  for (const file of files) {
    const extension = getExtension(file.name)
    if (!extension || !ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
      return 'Só são permitidos arquivos de documento, imagem, planilha ou zip.'
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return 'Só são permitidos arquivos de no máximo 10MB.'
    }
  }
  return ''
}

async function uploadAttachments(files: File[], tenantId: string) {
  const client = getS3Client()
  const bucket = getPrivateBucket()
  const payload = []

  for (const file of files) {
    const arquivo = buildStorageFileName(file.name)
    const key = `${tenantId.replace(/^\/+|\/+$/g, '')}/${arquivo}`
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || 'application/octet-stream',
      ACL: 'private',
    }))
    payload.push({
      arquivo,
      nome_arquivo_original: file.name,
      tipo_mime: file.type || '',
      tamanho: file.size,
    })
  }

  return payload
}

async function readJsonPayload(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown> & { action?: keyof typeof ACTION_ENDPOINTS }
  const payload = { ...body }
  delete payload.action
  return { action: body.action, payload, response: null }
}

async function readMultipartPayload(request: Request, tenantId: string) {
  const formData = await request.formData()
  const action = text(formData.get('action')) as keyof typeof ACTION_ENDPOINTS
  const payload: Record<string, unknown> = {}

  for (const key of ['mensagem', 'status', 'updated_at']) {
    const value = text(formData.get(key))
    if (value) payload[key] = value
  }

  const files = [...formData.getAll('anexos[]'), ...formData.getAll('anexos')].filter(isAttachmentFile)
  const validationError = validateAttachments(files)
  if (validationError) {
    return {
      action,
      payload,
      response: NextResponse.json({ message: validationError }, { status: 400 }),
    }
  }

  if (files.length > 0) {
    payload.anexos = await uploadAttachments(files, tenantId)
  }

  return { action, payload, response: null }
}

export async function POST(request: Request, context: RouteContext) {
  const { session, response } = await requireSacSession()
  if (!session) return response

  const contentType = request.headers.get('content-type') ?? ''
  let body: Awaited<ReturnType<typeof readJsonPayload>> | Awaited<ReturnType<typeof readMultipartPayload>>
  try {
    body = contentType.includes('multipart/form-data')
      ? await readMultipartPayload(request, session.currentTenantId)
      : await readJsonPayload(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível salvar o arquivo anexado.'
    return NextResponse.json({ message }, { status: 500 })
  }
  if (body.response) return body.response

  const endpointAction = body.action ? ACTION_ENDPOINTS[body.action] : undefined
  if (!endpointAction) {
    return NextResponse.json({ message: 'Acao invalida.' }, { status: 400 })
  }

  const { id } = await context.params

  const result = await serverApiFetch(`sac/admin/chamados/${encodeURIComponent(id)}/${endpointAction}`, {
    method: 'POST',
    token: session.token,
    tenantId: session.currentTenantId,
    body: body.payload,
  })

  if (!result.ok) {
    return NextResponse.json({ message: getErrorMessage(result.payload, 'Nao foi possivel processar a acao do chamado.') }, { status: result.status || 400 })
  }

  return NextResponse.json(result.payload)
}
