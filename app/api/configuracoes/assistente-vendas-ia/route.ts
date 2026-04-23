import { readFile } from 'node:fs/promises'
import { createHmac } from 'node:crypto'
import { join } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import {
  buildAssistenteVendasIaPayload,
  type AssistenteTokenPayload,
} from '@/src/features/configuracoes-assistente-vendas-ia/services/assistente-vendas-ia-embed'

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function createJwt(payload: AssistenteTokenPayload, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = toBase64Url(JSON.stringify(header))
  const encodedPayload = toBase64Url(JSON.stringify(payload))
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest()

  return `${encodedHeader}.${encodedPayload}.${toBase64Url(signature)}`
}

async function resolveJwtSecret() {
  const explicitSecret = (process.env.ASSISTENTE_VENDAS_IA_JWT_SECRET || process.env.JWT_SECRET || '').trim()
  if (explicitSecret) {
    return explicitSecret
  }

  try {
    const bootPath = join(process.cwd(), '..', 'admin', 'boot.php')
    const bootContents = await readFile(bootPath, 'utf8')
    const match = bootContents.match(/define\('JWT_SECRET',\s*'([^']+)'\);/)
    return match?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
  }

  const baseUrl = (process.env.ASSISTENTE_VENDAS_IA_URL || 'https://assistente.agileb2b.com.br').trim().replace(/\/+$/, '')
  const jwtSecret = await resolveJwtSecret()

  if (!jwtSecret) {
    return NextResponse.json({ message: 'JWT do Assistente de Vendas IA não configurado no ambiente.' }, { status: 500 })
  }

  const body = (await request.json()) as {
    userId?: string
    userEmail?: string
  }

  const userId = String(body.userId || '').trim()
  const userEmail = String(body.userEmail || '').trim()

  if (!userId || !userEmail) {
    return NextResponse.json({ message: 'Usuário inválido para abrir o assistente de vendas IA.' }, { status: 400 })
  }

  const token = createJwt(
    buildAssistenteVendasIaPayload(
      {
        token: session.token,
        currentTenantId: session.currentTenantId,
      },
      {
        userId,
        userEmail,
      },
    ),
    jwtSecret,
  )

  return NextResponse.json({
    embedUrl: `${baseUrl}/embed?token=${encodeURIComponent(token)}`,
    origin: baseUrl,
  })
}
