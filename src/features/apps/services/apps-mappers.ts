import { normalizeLookupState } from '@/src/lib/lookup-options'
import type { CrudRecord } from '@/src/components/crud-base/types'

const APP_PAYLOAD_KEYS = [
  'id',
  'id_empresa',
  'chave_cliente',
  'identificador_app',
  'nome_app',
  'versao_app',
  'build_ios',
  'build_android',
  'url_empresa',
  'cor_splash_background',
  'cor_header',
  'cor_botao',
  'cor_texto',
  'cor_sem_internet',
  'login_titulo',
  'login_subtitulo',
  'login_esqueci_senha',
  'login_cta',
  'login_primeiro_acesso',
  'fp_titulo',
  'fp_subtitulo',
  'fp_cta',
  'alerta_titulo',
  'alerta_login_mensagem',
  'alerta_fp_mensagem',
  'alerta_confirmar',
  'outro_titulo_codigo_barras',
  'outro_titulo_sem_internet',
  'outro_mensagem_sem_internet',
  's3_logo_1024_key',
  's3_splash_logo_key',
  's3_firebase_android_key',
  's3_firebase_ios_key',
  's3_env_key',
  'ativo',
] as const

export const APP_DEFAULTS: CrudRecord = {
  ativo: true,
  versao_app: '1.0',
  build_ios: 1,
  build_android: 1,
  cor_splash_background: '#FFFFFF',
  cor_header: '#3070B4',
  cor_botao: '#3070B4',
  cor_texto: '#3070B4',
  cor_sem_internet: '#000000',
  login_titulo: 'Entrar',
  login_subtitulo: 'Informe seus dados de cadastro',
  login_esqueci_senha: 'Esqueci minha senha',
  login_cta: 'Entrar',
  login_primeiro_acesso: 'Primeiro acesso',
  fp_titulo: 'Esqueci minha senha',
  fp_subtitulo: 'Informe o e-mail de cadastro',
  fp_cta: 'Solicitar nova senha',
  alerta_titulo: 'Atenção',
  alerta_login_mensagem: 'Preencha os dois campos',
  alerta_fp_mensagem: 'Preencha o campo email corretamente',
  alerta_confirmar: 'OK',
  outro_titulo_codigo_barras: 'Escanear Código de Barras',
  outro_titulo_sem_internet: 'Erro de conexão',
  outro_mensagem_sem_internet: 'Verifique sua internet e toque aqui para tentar novamente.',
}

function isTruthy(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function asNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function nullableText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

export function normalizeAppRecord(record: CrudRecord): CrudRecord {
  const normalized: CrudRecord = {
    ...APP_DEFAULTS,
    ...record,
    ativo: isTruthy(record.ativo),
    build_ios: asNumber(record.build_ios, 1),
    build_android: asNumber(record.build_android, 1),
  }

  const lastLog = record.last_log && typeof record.last_log === 'object'
    ? record.last_log as Record<string, unknown>
    : null

  if (lastLog) {
    normalized.last_log_created_at = lastLog.created_at ?? null
    normalized.last_log_status = lastLog.status ?? null
    normalized.last_log_platform = lastLog.plataforma ?? null
  }

  return {
    ...normalized,
    ...normalizeLookupState(normalized, 'id_empresa', 'empresa', 'id_empresa_lookup'),
  }
}

export function buildAppPayload(record: CrudRecord): CrudRecord {
  const payload: CrudRecord = {}

  for (const key of APP_PAYLOAD_KEYS) {
    const value = record[key]
    if (key === 'id' && !String(value ?? '').trim()) {
      continue
    }
    ;(payload as Record<string, unknown>)[key] = value
  }

  payload.ativo = isTruthy(record.ativo) ? 1 : 0
  payload.id_empresa = nullableText(record.id_empresa)
  payload.chave_cliente = nullableText(record.chave_cliente)
  payload.identificador_app = nullableText(record.identificador_app)
  payload.nome_app = nullableText(record.nome_app)
  payload.versao_app = nullableText(record.versao_app) ?? '1.0'
  payload.build_ios = asNumber(record.build_ios, 1)
  payload.build_android = asNumber(record.build_android, 1)
  payload.url_empresa = nullableText(record.url_empresa)

  return payload
}

export function getAppFilePreviewUrl(s3Key: unknown) {
  const key = String(s3Key ?? '').trim()
  return key ? `/api/apps/files?s3_key=${encodeURIComponent(key)}` : ''
}

export function getAppFileName(s3Key: unknown) {
  const key = String(s3Key ?? '').trim()
  if (!key) return ''
  const clean = key.split('?')[0]
  const parts = clean.split('/').filter(Boolean)
  return parts[parts.length - 1] || clean
}
