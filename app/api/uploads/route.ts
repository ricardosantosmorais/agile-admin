import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { captureOperationalServerError } from '@/src/lib/sentry'
import { buildAssetUrl, buildUploadObjectKey, resolveUploadTarget, type UploadProfileId } from '@/src/lib/upload-targets'

function getS3Client() {
  const accessKeyId = process.env.UPLOAD_S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.UPLOAD_S3_SECRET_ACCESS_KEY?.trim()
  const region = process.env.UPLOAD_S3_REGION?.trim() || 'sa-east-1'

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Configuracao de upload S3 ausente.')
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

function isUploadProfileId(value: string): value is UploadProfileId {
  return [
    'tenant-public-images',
    'tenant-public-files',
    'public-cdn-components',
    'private-app-files',
  ].includes(value)
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
    const profileIdRaw = String(formData.get('profileId') || '').trim()
    const tenantBucketUrl = String(formData.get('tenantBucketUrl') || '').trim()
    const folder = String(formData.get('folder') || '').trim()
    const fixedFileName = String(formData.get('fixedFileName') || '').trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Arquivo não informado.' }, { status: 400 })
    }

    if (!isUploadProfileId(profileIdRaw)) {
      return NextResponse.json({ message: 'Profile de upload inválido.' }, { status: 400 })
    }

    const target = resolveUploadTarget({
      profileId: profileIdRaw,
      tenantBucketUrl,
      folder,
      publicBucketFallback: process.env.UPLOAD_S3_PUBLIC_BUCKET,
      publicBaseUrlFallback: process.env.UPLOAD_S3_PUBLIC_BASE_URL,
      privateBucket: process.env.UPLOAD_S3_PRIVATE_BUCKET,
    })

    if (!target.bucket) {
      return NextResponse.json({ message: 'Bucket de upload não configurado para o tenant ativo.' }, { status: 409 })
    }

    const key = buildUploadObjectKey(target.keyPrefix, file.name, fixedFileName || undefined)
    const buffer = Buffer.from(await file.arrayBuffer())
    const client = getS3Client()

    await client.send(new PutObjectCommand({
      Bucket: target.bucket,
      Key: key,
      Body: buffer,
      ACL: target.acl,
      ContentType: file.type || 'application/octet-stream',
    }))

    const publicUrl = target.isPublic ? buildAssetUrl(target.baseUrl, key) : ''

    return NextResponse.json({
      value: publicUrl || key,
      previewValue: publicUrl || undefined,
      file_url: publicUrl || undefined,
      file_name: file.name,
      s3_key: key,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível enviar o arquivo.'

    captureOperationalServerError({
      area: 'uploads',
      action: 'post',
      path: '/api/uploads',
      status: 500,
      tenantId: session.currentTenantId,
      payload: { message },
    })

    return NextResponse.json({ message }, { status: 500 })
  }
}
