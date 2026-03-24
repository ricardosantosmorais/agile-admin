import type { CrudRecord } from '@/src/components/crud-base/types'

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function normalizeGrupoComboRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ativo: normalizeBoolean(record.ativo),
    codigo: normalizeString(record.codigo),
    nome: normalizeString(record.nome),
    imagem: normalizeString(record.imagem),
    descricao: typeof record.descricao === 'string' ? record.descricao : '',
  }
}

export function toGrupoComboPayload(record: CrudRecord): CrudRecord {
  const nome = normalizeString(record.nome)
  if (!nome) {
    throw new Error('Informe o nome do grupo de combos.')
  }

  return {
    id: normalizeString(record.id) || undefined,
    codigo: normalizeString(record.codigo) || null,
    nome,
    imagem: normalizeString(record.imagem) || null,
    descricao: typeof record.descricao === 'string' ? record.descricao : '',
    ativo: normalizeBoolean(record.ativo),
  }
}
