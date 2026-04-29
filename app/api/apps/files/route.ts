import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { captureOperationalServerError } from '@/src/lib/sentry'

const FILE_TYPES: Record<string, { fileName: string; contentType: string; maxSize: number }> = {
  logo_1024: { fileName: 'icone_1024.png', contentType: 'image/png', maxSize: 2 * 1024 * 1024 },
  splash_logo: { fileName: 'splash_1024.png', contentType: 'image/png', maxSize: 2 * 1024 * 1024 },
  firebase_android: { fileName: 'google-services.json', contentType: 'application/json', maxSize: 2 * 1024 * 1024 },
  firebase_ios: { fileName: 'GoogleService-Info.plist', contentType: 'application/xml', maxSize: 2 * 1024 * 1024 },
  env: { fileName: '.env', contentType: 'text/plain', maxSize: 1 * 1024 * 1024 },
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
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getPrivateBucket() {
  const bucket = process.env.UPLOAD_S3_PRIVATE_BUCKET?.trim() || 'agileecommerce-files'
  if (!bucket) throw new Error('Bucket privado de apps não configurado.')
  return bucket
}

async function streamToBuffer(body: unknown) {
  if (body && typeof body === 'object' && 'transformToByteArray' in body && typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray())
  }

  const chunks: Uint8Array[] = []
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const tipo = String(formData.get('tipo') || '').trim()
    const idEmpresa = String(formData.get('id_empresa') || '').trim()
    const definition = FILE_TYPES[tipo]

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Arquivo não informado.' }, { status: 400 })
    }

    if (!definition) {
      return NextResponse.json({ message: 'Tipo de upload inválido.' }, { status: 400 })
    }

    if (!idEmpresa) {
      return NextResponse.json({ message: 'Selecione uma empresa antes de enviar arquivos.' }, { status: 400 })
    }

    if (file.size > definition.maxSize) {
      return NextResponse.json({ message: 'Arquivo maior que o limite permitido.' }, { status: 413 })
    }

    const key = `apps/${idEmpresa}/${definition.fileName}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const client = getS3Client()

    await client.send(new PutObjectCommand({
      Bucket: getPrivateBucket(),
      Key: key,
      Body: buffer,
      ContentType: file.type || definition.contentType,
      ACL: 'private',
    }))

    return NextResponse.json({
      success: true,
      value: key,
      s3_key: key,
      previewValue: `/api/apps/files?s3_key=${encodeURIComponent(key)}`,
      file_name: file.name,
      stored_name: definition.fileName,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível enviar o arquivo.'
    captureOperationalServerError({
      area: 'apps',
      action: 'upload',
      path: '/api/apps/files',
      status: 500,
      tenantId: session.currentTenantId,
      payload: { message },
    })
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const s3Key = String(request.nextUrl.searchParams.get('s3_key') || '').trim()
  if (!s3Key || !s3Key.startsWith('apps/')) {
    return NextResponse.json({ message: 'Arquivo não informado.' }, { status: 400 })
  }

  try {
    const client = getS3Client()
    const result = await client.send(new GetObjectCommand({
      Bucket: getPrivateBucket(),
      Key: s3Key,
    }))
    const buffer = await streamToBuffer(result.Body)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': result.ContentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível carregar o arquivo.'
    return NextResponse.json({ message }, { status: 404 })
  }
}
