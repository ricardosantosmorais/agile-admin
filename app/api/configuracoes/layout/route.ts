import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import {
  configuracoesLayoutFieldKeys,
  configuracoesLayoutTextUploadFields,
} from '@/src/features/configuracoes-layout/services/configuracoes-layout-mappers'
import { buildCompanyParametersPath } from '@/src/lib/company-parameters-query'
import type { ConfiguracoesLayoutFieldKey, ConfiguracoesLayoutFormValues } from '@/src/features/configuracoes-layout/types/configuracoes-layout'
import { buildAssetUrl, buildUploadObjectKey, extractBucketName } from '@/src/lib/upload-targets'
import { captureOperationalServerError } from '@/src/lib/sentry'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

type SaveBody = {
  changedKeys?: ConfiguracoesLayoutFieldKey[]
  values?: Partial<ConfiguracoesLayoutFormValues>
}

const TEXT_UPLOAD_DEFINITIONS = {
  css: { folder: 'css', fileName: 'style.css', contentType: 'text/css', fileParam: 'css_file' },
  'barra-topo': { folder: 'html', fileName: 'barra-topo.html', contentType: 'text/html', fileParam: 'barra-topo_file' },
  'barra-topo-mobile': { folder: 'html', fileName: 'barra-topo-mobile.html', contentType: 'text/html', fileParam: 'barra-topo-mobile_file' },
  'barra-menu': { folder: 'html', fileName: 'barra-menu.html', contentType: 'text/html', fileParam: 'barra-menu_file' },
  'barra-menu-mobile': { folder: 'html', fileName: 'barra-menu-mobile.html', contentType: 'text/html', fileParam: 'barra-menu-mobile_file' },
  'barra-newsletter': { folder: 'html', fileName: 'barra-newsletter.html', contentType: 'text/html', fileParam: 'barra-newsletter_file' },
  'barra-servicos': { folder: 'html', fileName: 'barra-servicos.html', contentType: 'text/html', fileParam: 'barra-servicos_file' },
  'barra-rodape': { folder: 'html', fileName: 'barra-rodape.html', contentType: 'text/html', fileParam: 'barra-rodape_file' },
} as const

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null) {
    if (
      'error' in payload
      && typeof payload.error === 'object'
      && payload.error !== null
      && 'message' in payload.error
      && typeof payload.error.message === 'string'
    ) {
      return payload.error.message
    }

    if ('message' in payload && typeof payload.message === 'string') {
      return payload.message
    }
  }

  return fallback
}

function getS3Client() {
  const accessKeyId = process.env.UPLOAD_S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.UPLOAD_S3_SECRET_ACCESS_KEY?.trim()
  const region = process.env.UPLOAD_S3_REGION?.trim() || 'sa-east-1'

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('ConfiguraÃ§Ã£o de upload S3 ausente.')
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

async function loadCompanyContext(token: string, tenantId: string) {
  const companyResult = await serverApiFetch(`empresas?id=${encodeURIComponent(tenantId)}&perpage=1`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!companyResult.ok) {
    return {
      error: NextResponse.json(
        { message: getErrorMessage(companyResult.payload, 'NÃ£o foi possÃ­vel carregar os dados da empresa.') },
        { status: companyResult.status || 400 },
      ),
    }
  }

  const company = asRecord(asArray(asRecord(companyResult.payload).data)[0])

  return {
    companyResult,
    company,
  }
}

async function uploadTextAsset(bucketUrl: string, fieldKey: keyof typeof TEXT_UPLOAD_DEFINITIONS, content: string) {
  const definition = TEXT_UPLOAD_DEFINITIONS[fieldKey]
  const bucket = extractBucketName(bucketUrl)
  if (!bucket) {
    throw new Error('Empresa ativa sem bucket de layout configurado.')
  }

  const key = buildUploadObjectKey(definition.folder, definition.fileName)
  const client = getS3Client()

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(content, 'utf-8'),
    ACL: 'public-read',
    ContentType: definition.contentType,
  }))

  return {
    key,
    publicUrl: buildAssetUrl(bucketUrl, key),
    fileParam: definition.fileParam,
  }
}

export const runtime = 'nodejs'

export async function GET() {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'SessÃ£o expirada.' }, { status: 401 })
  }

  const companyContext = await loadCompanyContext(session.token, session.currentTenantId)
  if ('error' in companyContext) {
    return companyContext.error
  }

  const parameterResult = await serverApiFetch(buildCompanyParametersPath(session.currentTenantId, configuracoesLayoutFieldKeys), {
    method: 'GET',
    token: session.token,
    tenantId: session.currentTenantId,
  })

  if (!parameterResult.ok) {
    return NextResponse.json(
      { message: getErrorMessage(parameterResult.payload, 'NÃ£o foi possÃ­vel carregar os parÃ¢metros de layout.') },
      { status: parameterResult.status || 400 },
    )
  }

  return NextResponse.json({
    parameters: parameterResult.payload,
    company: companyContext.companyResult.payload,
  })
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'SessÃ£o expirada.' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as SaveBody
    const changedKeys = Array.isArray(body.changedKeys)
      ? body.changedKeys.filter((key): key is ConfiguracoesLayoutFieldKey => typeof key === 'string' && key.length > 0)
      : []
    const values = asRecord(body.values)

    if (!changedKeys.length) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const companyContext = await loadCompanyContext(session.token, session.currentTenantId)
    if ('error' in companyContext) {
      return companyContext.error
    }

    const company = companyContext.company
    const bucketUrl = toStringValue(company.s3_bucket)
    const parameterPayload: Array<{ id_filial: null; chave: string; parametros: string; arquivo?: boolean }> = [
      { id_filial: null, chave: 'versao', parametros: new Date().toISOString().replace('T', ' ').slice(0, 19), arquivo: false },
    ]

    const companyPayload: Record<string, string> = {}
    const changedKeySet = new Set(changedKeys)

    if (changedKeySet.has('logomarca')) {
      const logo = toStringValue(values.logomarca)
      companyPayload.logo = logo
      if (toStringValue(company.logo_alt) === toStringValue(company.logo)) {
        companyPayload.logo_alt = logo
      }
      parameterPayload.push({ id_filial: null, chave: 'logomarca', parametros: logo, arquivo: false })
    }

    if (changedKeySet.has('ico')) {
      const icon = toStringValue(values.ico)
      companyPayload.ico = icon
      parameterPayload.push({ id_filial: null, chave: 'ico', parametros: icon, arquivo: false })
    }

    for (const fieldKey of changedKeys) {
      if (fieldKey === 'logomarca' || fieldKey === 'ico') {
        continue
      }

      const rawValue = toStringValue(values[fieldKey])
      parameterPayload.push({
        id_filial: null,
        chave: fieldKey,
        parametros: rawValue,
        arquivo: configuracoesLayoutTextUploadFields.includes(fieldKey as never),
      })

      if (configuracoesLayoutTextUploadFields.includes(fieldKey as never)) {
        const uploadField = fieldKey as keyof typeof TEXT_UPLOAD_DEFINITIONS

        if (!rawValue) {
          parameterPayload.push({ id_filial: null, chave: TEXT_UPLOAD_DEFINITIONS[uploadField].fileParam, parametros: '', arquivo: false })
          continue
        }

        const uploadResult = await uploadTextAsset(bucketUrl, uploadField, rawValue)
        parameterPayload.push({ id_filial: null, chave: uploadResult.fileParam, parametros: uploadResult.publicUrl, arquivo: false })
      }
    }

    if (Object.keys(companyPayload).length && toStringValue(company.id)) {
      const companySaveResult = await serverApiFetch('empresas', {
        method: 'POST',
        token: session.token,
        tenantId: session.currentTenantId,
        body: {
          id: toStringValue(company.id),
          ...companyPayload,
        },
      })

      if (!companySaveResult.ok) {
        return NextResponse.json(
          { message: getErrorMessage(companySaveResult.payload, 'NÃ£o foi possÃ­vel salvar os dados da empresa.') },
          { status: companySaveResult.status || 400 },
        )
      }
    }

    const result = await serverApiFetch('empresas/parametros', {
      method: 'POST',
      token: session.token,
      tenantId: session.currentTenantId,
      body: parameterPayload,
    })

    if (!result.ok) {
      return NextResponse.json(
        { message: getErrorMessage(result.payload, 'NÃ£o foi possÃ­vel salvar os parÃ¢metros de layout.') },
        { status: result.status || 400 },
      )
    }

    return NextResponse.json(result.payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel salvar o layout.'
    captureOperationalServerError({
      area: 'configuracoes-layout',
      action: 'post',
      path: '/api/configuracoes/layout',
      status: 500,
      payload: { message },
    })
    return NextResponse.json({ message }, { status: 500 })
  }
}




