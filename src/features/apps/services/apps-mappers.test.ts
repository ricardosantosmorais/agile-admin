import { describe, expect, it } from 'vitest'
import { buildAppPayload, getAppFileName, getAppFilePreviewUrl, normalizeAppRecord } from '@/src/features/apps/services/apps-mappers'

describe('apps mappers', () => {
  it('normaliza defaults e ultimo log do app', () => {
    const record = normalizeAppRecord({
      id: '10',
      ativo: '1',
      chave_cliente: 'cliente',
      last_log: { created_at: '2026-04-28 09:00:00', status: 'queued', plataforma: 'android' },
    })

    expect(record.ativo).toBe(true)
    expect(record.versao_app).toBe('1.0')
    expect(record.build_ios).toBe(1)
    expect(record.last_log_created_at).toBe('2026-04-28 09:00:00')
    expect(record.last_log_status).toBe('queued')
  })

  it('monta payload fiel ao legado', () => {
    const payload = buildAppPayload({
      id: '',
      ativo: true,
      id_empresa: '1705083119553379',
      chave_cliente: 'nordil',
      identificador_app: 'br.com.nordil',
      nome_app: 'Nordil',
      versao_app: '',
      build_ios: '2',
      build_android: '3',
      url_empresa: 'https://nordil.com.br',
      id_empresa_lookup: { id: '1', label: 'Empresa' },
    })

    expect(payload.id).toBeUndefined()
    expect(payload.ativo).toBe(1)
    expect(payload.id_empresa).toBe('1705083119553379')
    expect(payload.versao_app).toBe('1.0')
    expect(payload.build_ios).toBe(2)
    expect(payload.build_android).toBe(3)
    expect(payload.id_empresa_lookup).toBeUndefined()
  })

  it('resolve preview e nome de arquivos privados', () => {
    expect(getAppFilePreviewUrl('apps/1/icone_1024.png')).toBe('/api/apps/files?s3_key=apps%2F1%2Ficone_1024.png')
    expect(getAppFileName('apps/1/GoogleService-Info.plist')).toBe('GoogleService-Info.plist')
  })
})
