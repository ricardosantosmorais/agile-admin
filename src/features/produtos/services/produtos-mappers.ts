import type { CrudRecord } from '@/src/components/crud-base/types'
import { formatLocalizedDecimal, normalizeCurrencyInputValue, parseInteger, parseLocalizedNumber } from '@/src/lib/value-parsers'
import { normalizeLookupState, nullableLookupId } from '@/src/lib/lookup-options'

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value === 1
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }
  return fallback
}

export function normalizeProdutoRecord(record: CrudRecord): CrudRecord {
  const produtoPaiLookup = normalizeLookupState(record, 'id_produto_pai', 'produto_pai', 'id_produto_pai_lookup', ['nome'])
  const departamentoLookup = normalizeLookupState(record, 'id_departamento', 'departamento', 'id_departamento_lookup', ['nome'])
  const marcaLookup = normalizeLookupState(record, 'id_marca', 'marca', 'id_marca_lookup', ['nome'])
  const canalLookup = normalizeLookupState(
    {
      ...record,
      canal_distribuicao:
        record.canal_distribuicao
        ?? record.canais_distribuicao
        ?? record.canal
        ?? null,
    },
    'id_canal_distribuicao',
    'canal_distribuicao',
    'id_canal_distribuicao_lookup',
    ['nome', 'descricao'],
  )
  const fornecedorLookup = normalizeLookupState(record, 'id_fornecedor', 'fornecedor', 'id_fornecedor_lookup', ['nome_fantasia', 'razao_social'])

  return {
    ...record,
    ...produtoPaiLookup,
    ...departamentoLookup,
    ...marcaLookup,
    ...canalLookup,
    ...fornecedorLookup,
    ativo: normalizeBoolean(record.ativo, true),
    feed: normalizeBoolean(record.feed, true),
    vende_sem_estoque: normalizeBoolean(record.vende_sem_estoque),
    controla_estoque: normalizeBoolean(record.controla_estoque),
    ipi: normalizeCurrencyInputValue(record.ipi),
    peso: formatLocalizedDecimal(record.peso, 3),
    altura: String(record.altura ?? ''),
    largura: String(record.largura ?? ''),
    comprimento: String(record.comprimento ?? ''),
    quantidade_embalagem: String(record.quantidade_embalagem ?? ''),
    prazo_entrega: String(record.prazo_entrega ?? ''),
    horas_cronometro: String(record.horas_cronometro ?? ''),
    posicao: String(record.posicao ?? ''),
  }
}

export function buildProdutoPayload(record: CrudRecord): CrudRecord {
  return {
    ...record,
    id_produto_pai: nullableLookupId(record.id_produto_pai_lookup ?? record.id_produto_pai),
    id_departamento: nullableLookupId(record.id_departamento_lookup ?? record.id_departamento),
    id_marca: nullableLookupId(record.id_marca_lookup ?? record.id_marca),
    id_canal_distribuicao: nullableLookupId(record.id_canal_distribuicao_lookup ?? record.id_canal_distribuicao),
    id_fornecedor: nullableLookupId(record.id_fornecedor_lookup ?? record.id_fornecedor),
    feed: normalizeBoolean(record.feed),
    ativo: normalizeBoolean(record.ativo, true),
    vende_sem_estoque: normalizeBoolean(record.vende_sem_estoque),
    controla_estoque: normalizeBoolean(record.controla_estoque),
    ipi: parseLocalizedNumber(record.ipi),
    peso: parseLocalizedNumber(record.peso),
    altura: parseInteger(record.altura),
    largura: parseInteger(record.largura),
    comprimento: parseInteger(record.comprimento),
    quantidade_embalagem: parseLocalizedNumber(record.quantidade_embalagem),
    prazo_entrega: parseInteger(record.prazo_entrega),
    horas_cronometro: parseInteger(record.horas_cronometro),
    posicao: parseInteger(record.posicao),
    ids_grades_json: JSON.stringify(
      (Array.isArray(record.produtos_grades_valores) ? record.produtos_grades_valores : [])
        .map((item) => ({
          id_grade: String((item as Record<string, unknown>).id_grade || '').trim(),
          id_valor: String((item as Record<string, unknown>).id_valor || '').trim(),
        }))
        .filter((item) => item.id_grade && item.id_valor),
    ),
  }
}
