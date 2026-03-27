import type { CrudRecord } from '@/src/components/crud-base/types'
import { asString } from '@/src/lib/api-payload'
import { formatApiDateTimeToInput, formatInputDateTimeToApi } from '@/src/lib/date-time-input'

const LINK_FIELD_BY_TYPE = {
  marca: 'id_link_marca',
  fornecedor: 'id_link_fornecedor',
  departamento: 'id_link_departamento',
  produto: 'id_link_produto',
  colecao: 'id_link_colecao',
  lista: 'id_link_lista',
  combo: 'id_link_combo',
  brinde: 'id_link_brinde',
} as const

type BannerLinkType = keyof typeof LINK_FIELD_BY_TYPE

const normalizeString = asString

export function getBannerLinkFieldKey(tipoLink: unknown) {
  const normalized = normalizeString(tipoLink) as BannerLinkType | ''
  return normalized ? LINK_FIELD_BY_TYPE[normalized] : null
}

export function getBannerLinkedObjectId(record: CrudRecord) {
  const linkField = getBannerLinkFieldKey(record.tipo_link)
  return linkField ? normalizeString(record[linkField]) : ''
}

export { formatApiDateTimeToInput, formatInputDateTimeToApi } from '@/src/lib/date-time-input'

function buildLinkRecordFields(idObjeto: string, tipoLink: string) {
  return {
    id_link_marca: tipoLink === 'marca' ? idObjeto : '',
    id_link_fornecedor: tipoLink === 'fornecedor' ? idObjeto : '',
    id_link_departamento: tipoLink === 'departamento' ? idObjeto : '',
    id_link_produto: tipoLink === 'produto' ? idObjeto : '',
    id_link_colecao: tipoLink === 'colecao' ? idObjeto : '',
    id_link_lista: tipoLink === 'lista' ? idObjeto : '',
    id_link_combo: tipoLink === 'combo' ? idObjeto : '',
    id_link_brinde: tipoLink === 'brinde' ? idObjeto : '',
  }
}

export function normalizeBannerRecord(record: CrudRecord): CrudRecord {
  const tipoLink = normalizeString(record.tipo_link)
  const idObjeto = normalizeString(record.id_objeto)
  const areaId = normalizeString(record.id_area_banner || record.area?.id)
  const areaLabel = normalizeString(record.area?.nome)

  return {
    ...record,
    permissao: normalizeString(record.permissao),
    perfil: normalizeString(record.perfil),
    canal: normalizeString(record.canal),
    target: normalizeString(record.target) || '_self',
    link: normalizeString(record.link),
    titulo: normalizeString(record.titulo),
    tipo_link: tipoLink,
    id_objeto: idObjeto,
    id_area_banner: areaId,
    id_area_banner_lookup: areaId
      ? {
          id: areaId,
          label: areaLabel || areaId,
        }
      : null,
    data_inicio: formatApiDateTimeToInput(record.data_inicio),
    data_fim: formatApiDateTimeToInput(record.data_fim),
    ...buildLinkRecordFields(idObjeto, tipoLink),
  }
}

export function toBannerPayload(record: CrudRecord): CrudRecord {
  const tipoLink = normalizeString(record.tipo_link) as BannerLinkType | ''
  const idObjeto = getBannerLinkedObjectId(record)
  const positionValue = record.posicao as unknown

  return {
    ...record,
    codigo: normalizeString(record.codigo) || null,
    titulo: normalizeString(record.titulo) || null,
    link: normalizeString(record.link) || null,
    target: normalizeString(record.target) || '_self',
    tipo_link: tipoLink || null,
    id_objeto: idObjeto || null,
    posicao: positionValue === '' || positionValue === undefined ? null : record.posicao,
    data_inicio: formatInputDateTimeToApi(record.data_inicio),
    data_fim: formatInputDateTimeToApi(record.data_fim),
    id_link_marca: undefined,
    id_link_fornecedor: undefined,
    id_link_departamento: undefined,
    id_link_produto: undefined,
    id_link_colecao: undefined,
    id_link_lista: undefined,
    id_link_combo: undefined,
    id_link_brinde: undefined,
  }
}
