import type { CrudRecord } from '@/src/components/crud-base/types'
import type { ComponenteCampoOption, ComponenteCampoRecord } from '@/src/features/componentes/services/componentes-types'

export function asBoolean(value: unknown, fallback = false) {
  if (value === true || value === 1 || value === '1') {
    return true
  }
  if (value === false || value === 0 || value === '0') {
    return false
  }
  return fallback
}

function nullableText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

export function parseCampoOptions(value: ComponenteCampoRecord['json_seletor']): ComponenteCampoOption[] {
  const parsed = Array.isArray(value)
    ? value
    : (() => {
        try {
          return JSON.parse(String(value || '[]')) as unknown
        } catch {
          return []
        }
      })()

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      return {
        titulo: String(record.titulo ?? '').trim(),
        valor: String(record.valor ?? '').trim(),
      }
    })
    .filter((item): item is ComponenteCampoOption => Boolean(item && (item.titulo || item.valor)))
}

export function normalizeCampo(record: CrudRecord): ComponenteCampoRecord {
  return {
    ...record,
    id: String(record.id ?? ''),
    ativo: asBoolean(record.ativo, true),
    obrigatorio: asBoolean(record.obrigatorio, true),
    codigo: String(record.codigo ?? ''),
    nome: String(record.nome ?? ''),
    titulo: String(record.titulo ?? ''),
    instrucoes: String(record.instrucoes ?? ''),
    tipo: String(record.tipo ?? ''),
    tipo_seletor: String(record.tipo_seletor ?? ''),
    json_seletor: record.json_seletor as ComponenteCampoRecord['json_seletor'],
    posicao: String(record.posicao ?? ''),
  }
}

export function normalizeCampos(value: unknown): ComponenteCampoRecord[] {
  return Array.isArray(value)
    ? value
        .map((item) => normalizeCampo(item as CrudRecord))
        .sort((left, right) => Number(left.posicao || 0) - Number(right.posicao || 0))
    : []
}

export function normalizeComponenteRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ativo: asBoolean(record.ativo, true),
    codigo: String(record.codigo ?? ''),
    nome: String(record.nome ?? ''),
    tipo: String(record.tipo ?? ''),
    arquivo: String(record.arquivo ?? ''),
    imagem: String(record.imagem ?? ''),
    json: String(record.json ?? ''),
    campos: normalizeCampos(record.campos),
  }
}

export function buildComponentePayload(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ativo: asBoolean(record.ativo, false),
    codigo: nullableText(record.codigo),
    tipo: nullableText(record.tipo),
    imagem: nullableText(record.imagem),
    json: nullableText(record.json),
  }
}

export function buildCampoPayload(record: ComponenteCampoRecord, options: ComponenteCampoOption[]): CrudRecord {
  const tipo = nullableText(record.tipo)
  const tipoSeletor = tipo === 'seletor' ? nullableText(record.tipo_seletor) : null
  const jsonSeletor = tipo === 'seletor' && tipoSeletor === 'personalizado'
    ? JSON.stringify(options.filter((option) => option.titulo || option.valor))
    : null

  return {
    id: String(record.id ?? '').trim(),
    id_componente: record.id_componente,
    ativo: asBoolean(record.ativo, true),
    obrigatorio: asBoolean(record.obrigatorio, true),
    codigo: nullableText(record.codigo),
    nome: nullableText(record.nome),
    titulo: nullableText(record.titulo),
    instrucoes: nullableText(record.instrucoes),
    tipo,
    tipo_seletor: tipoSeletor,
    json_seletor: jsonSeletor,
    posicao: Number(record.posicao || 1),
  }
}
