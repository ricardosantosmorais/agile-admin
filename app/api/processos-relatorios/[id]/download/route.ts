import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import { extractApiErrorMessage } from '@/app/api/relatorios/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getS3Client() {
  const accessKeyId = process.env.UPLOAD_S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.UPLOAD_S3_SECRET_ACCESS_KEY?.trim()
  const region = process.env.UPLOAD_S3_REGION?.trim() || 'sa-east-1'

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('As credenciais de S3 não estão configuradas.')
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

function sanitizeDownloadName(value: string) {
  return value.trim().replace(/[\r\n\0/\\]+/g, '_') || 'relatorio'
}

function toAsciiDownloadName(value: string) {
  return sanitizeDownloadName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '_')
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const { id } = await params

  const processoResult = await serverApiFetch(`processos?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!processoResult.ok) {
    return NextResponse.json(
      { message: extractApiErrorMessage(processoResult.payload, 'Não foi possível carregar o processo.') },
      { status: processoResult.status || 400 },
    )
  }

  const processo = Array.isArray((processoResult.payload as { data?: unknown[] } | null)?.data)
    ? (processoResult.payload as { data: Array<Record<string, unknown>> }).data[0]
    : null

  if (!processo) {
    return NextResponse.json({ message: 'Processo não encontrado.' }, { status: 404 })
  }

  if (String(processo.id_empresa || '') !== session.currentTenantId) {
    return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 })
  }

  const arquivo = String(processo.arquivo || '').trim()
  if (!arquivo) {
    return NextResponse.json({ message: 'O processo não possui arquivo disponível para download.' }, { status: 409 })
  }

  const relatorioResult = await serverApiFetch(`relatorios?id=${encodeURIComponent(String(processo.id_relatorio || ''))}`, {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  const relatorio = Array.isArray((relatorioResult.payload as { data?: unknown[] } | null)?.data)
    ? (relatorioResult.payload as { data: Array<Record<string, unknown>> }).data[0]
    : null

  const extension = arquivo.includes('.') ? arquivo.split('.').pop() ?? '' : ''
  const baseName = sanitizeDownloadName(String(relatorio?.nome || arquivo.split('/').pop() || 'relatorio'))
  const fileName = extension && !baseName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
    ? `${baseName}.${extension}`
    : baseName
  const asciiFileName = toAsciiDownloadName(fileName).replace(/"/g, '')
  const utf8FileName = encodeURIComponent(fileName)

  try {
    const client = getS3Client()
    const bucket = process.env.UPLOAD_S3_PRIVATE_BUCKET?.trim() || 'agileecommerce-files'
    const response = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: arquivo,
    }))

    if (!response.Body) {
      return NextResponse.json({ message: 'Arquivo não encontrado no armazenamento.' }, { status: 404 })
    }

    return new NextResponse(response.Body.transformToWebStream(), {
      headers: {
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${utf8FileName}`,
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível baixar o arquivo.' },
      { status: 500 },
    )
  }
}
