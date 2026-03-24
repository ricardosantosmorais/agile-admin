import { describe, expect, it } from 'vitest'
import {
  formatApiDateTimeToInput,
  formatInputDateTimeToApi,
  getBannerLinkFieldKey,
  getBannerLinkedObjectId,
  normalizeBannerRecord,
  toBannerPayload,
} from '@/src/features/banners/services/banners-mappers'

describe('banners-mappers', () => {
  it('normalizes API datetime values to datetime-local input format', () => {
    expect(formatApiDateTimeToInput('2026-03-20 14:30:00')).toBe('2026-03-20T14:30')
    expect(formatApiDateTimeToInput('')).toBe('')
  })

  it('hydrates the matching link lookup field from id_objeto', () => {
    const record = normalizeBannerRecord({
      tipo_link: 'produto',
      id_objeto: '789',
      id_area_banner: '12',
      area: { id: '12', nome: 'Home principal' },
      data_inicio: '2026-03-20 08:15:00',
      data_fim: '2026-03-20 18:45:00',
      target: '',
    })

    expect(record.id_link_produto).toBe('789')
    expect(record.id_link_marca).toBe('')
    expect(record.id_area_banner).toBe('12')
    expect(record.id_area_banner_lookup).toEqual({ id: '12', label: 'Home principal' })
    expect(record.data_inicio).toBe('2026-03-20T08:15')
    expect(record.data_fim).toBe('2026-03-20T18:45')
    expect(record.target).toBe('_self')
  })

  it('builds API payload with id_objeto and nullable fields', () => {
    const payload = toBannerPayload({
      codigo: '',
      titulo: 'Banner principal',
      tipo_link: 'combo',
      id_link_combo: '555',
      link: '',
      target: '',
      data_inicio: '2026-03-20T10:00',
      data_fim: '',
      posicao: null,
    })

    expect(payload.codigo).toBeNull()
    expect(payload.id_objeto).toBe('555')
    expect(payload.tipo_link).toBe('combo')
    expect(payload.link).toBeNull()
    expect(payload.target).toBe('_self')
    expect(payload.data_inicio).toBe('2026-03-20 10:00:00')
    expect(payload.data_fim).toBeNull()
    expect(payload.posicao).toBeNull()
    expect(payload.id_link_combo).toBeUndefined()
  })

  it('keeps permission, profile and channel fields in the write payload', () => {
    const payload = toBannerPayload({
      permissao: 'restrito',
      perfil: 'vendedor',
      canal: 'pc_mobile',
      target: '_blank',
    })

    expect(payload.permissao).toBe('restrito')
    expect(payload.perfil).toBe('vendedor')
    expect(payload.canal).toBe('pc_mobile')
    expect(payload.target).toBe('_blank')
  })

  it('returns null for invalid datetime-local values sent to the API', () => {
    expect(formatInputDateTimeToApi('2026-03-20 10:00')).toBeNull()
  })

  it('resolves the active linked object from the selected link type', () => {
    expect(getBannerLinkFieldKey('produto')).toBe('id_link_produto')
    expect(getBannerLinkedObjectId({ tipo_link: 'produto', id_link_produto: '123', id_link_marca: '456' })).toBe('123')
    expect(getBannerLinkedObjectId({ tipo_link: '', id_link_produto: '123' })).toBe('')
  })
})
