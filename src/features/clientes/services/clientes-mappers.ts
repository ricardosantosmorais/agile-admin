import type {
  ClientAdditionalForm,
  ClientAssociatedBranch,
  ClientAssociatedPaymentCondition,
  ClientAssociatedPaymentMethod,
  ClientAssociatedSeller,
  ClientFormRecord,
  ClientListItem,
  ClientListResponse,
  ClientLookupOption,
} from '@/src/features/clientes/types/clientes'
import { formatCpfCnpj } from '@/src/lib/formatters'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function formatPhone(ddd: string, phone: string) {
  const digits = `${digitsOnly(ddd)}${digitsOnly(phone)}`

  if (!digits) {
    return ''
  }

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }

  return digits
}

function formatCurrencyInput(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(asString(value))

  if (!Number.isFinite(numeric)) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numeric)
}

function toDateInputValue(value: string) {
  if (!value) {
    return ''
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function toLookupOption(value: unknown, labelKeys: string[] = ['nome']): ClientLookupOption | null {
  const item = asRecord(value)
  const id = asString(item.id)
  const label =
    labelKeys.map((key) => asString(item[key])).find(Boolean)
    || asString(item.nome)
    || asString(item.nome_fantasia)
    || asString(item.titulo)

  if (!id && !label) {
    return null
  }

  return {
    id,
    label,
  }
}

function mapBranch(value: unknown): ClientAssociatedBranch {
  const item = asRecord(value)
  const filial = asRecord(item.filial)
  const tabelaPreco = asRecord(item.tabela_preco)

  return {
    idFilial: asString(item.id_filial),
    nomeFilial: asString(filial.nome_fantasia || filial.nome),
    tabelaPreco: asString(tabelaPreco.nome),
    limiteCredito: formatCurrencyInput(item.limite_credito),
    padrao: asBoolean(item.padrao),
    idSync: asString(item.id_sync) || null,
  }
}

function mapSeller(value: unknown): ClientAssociatedSeller {
  const item = asRecord(value)
  const vendedor = asRecord(item.vendedor)

  return {
    idVendedor: asString(item.id_vendedor),
    nomeVendedor: asString(vendedor.nome),
    email: asString(vendedor.email),
    telefone: formatPhone(asString(vendedor.ddd), asString(vendedor.telefone)),
    padrao: asBoolean(item.padrao),
    idSync: asString(item.id_sync) || null,
  }
}

function mapPaymentMethod(value: unknown): ClientAssociatedPaymentMethod {
  const item = asRecord(value)
  const formaPagamento = asRecord(item.forma_pagamento)
  const filial = asRecord(item.filial)

  return {
    idFormaPagamento: asString(item.id_forma_pagamento),
    nomeFormaPagamento: asString(formaPagamento.nome),
    filialId: asString(item.id_filial),
    filialNome: asString(filial.nome_fantasia || filial.nome),
    idSync: asString(item.id_sync) || null,
  }
}

function mapPaymentCondition(value: unknown): ClientAssociatedPaymentCondition {
  const item = asRecord(value)
  const condicaoPagamento = asRecord(item.condicao_pagamento)
  const filial = asRecord(item.filial)

  return {
    idCondicaoPagamento: asString(item.id_condicao_pagamento),
    nomeCondicaoPagamento: asString(condicaoPagamento.nome),
    filialId: asString(item.id_filial),
    filialNome: asString(filial.nome_fantasia || filial.nome),
    idSync: asString(item.id_sync) || null,
  }
}

function mapAdditionalForms(value: unknown): ClientAdditionalForm[] {
  return asArray(value)
    .map((item) => {
      const form = asRecord(item)
      const formulario = asRecord(form.formulario)

      return {
        id: asString(form.id),
        title: asString(formulario.titulo),
        date: asString(form.data),
        fields: asArray(form.dados)
          .map((detail) => {
            const dado = asRecord(detail)
            const campo = asRecord(dado.campo)

            return {
              label: asString(campo.titulo),
              value: asString(dado.valor),
              type: asString(campo.tipo),
              fileUrl: asString(dado.valor),
            }
          })
          .filter((field) => field.label || field.value),
      }
    })
    .filter((form) => form.title || form.fields.length > 0)
}

export function mapClientListResponse(payload: unknown): ClientListResponse {
  const source = asRecord(payload)
  const meta = asRecord(source.meta)

  return {
    data: asArray(source.data).map((item) => {
      const client = asRecord(item)

      return {
        id: asString(client.id),
        idSync: asString(client.id_sync) || null,
        codigo: asString(client.codigo),
        codigoAtivacao: asString(client.codigo_ativacao),
        cnpjCpf: formatCpfCnpj(asString(client.cnpj_cpf)),
        inscricaoEstadual: asString(client.inscricao_estadual),
        nomeRazaoSocial: asString(client.razao_social || client.nome_fantasia),
        dataAtivacao: asString(client.data_ativacao),
        ultimoPedido: asString(client.ultimo_pedido),
        qtdPedidos: asNumber(client.qtd_pedidos),
        bloqueado: asBoolean(client.bloqueado),
        bloqueadoPlataforma: asBoolean(client.bloqueado_plataforma),
        ativo: asBoolean(client.ativo),
      } satisfies ClientListItem
    }),
    meta: {
      page: asNumber(meta.page),
      pages: asNumber(meta.pages),
      perPage: asNumber(meta.perpage),
      total: asNumber(meta.total),
      from: asNumber(meta.from),
      to: asNumber(meta.to),
      order: asString(meta.order),
      sort: asString(meta.sort),
    },
  }
}

export function mapClientDetail(payload: unknown): ClientFormRecord | null {
  const source = asRecord(payload)
  if (!Object.keys(source).length) {
    return null
  }

  const rawCpfCnpj = asString(source.cnpj_cpf)
  const tipoApi = asString(source.tipo).toUpperCase()
  const tipo = tipoApi === 'PF' || tipoApi === 'PJ'
    ? (tipoApi as 'PF' | 'PJ')
    : (digitsOnly(rawCpfCnpj).length > 11 ? 'PJ' : 'PF')

  return {
    id: asString(source.id),
    idClasse: asString(source.id_classe),
    ativo: asBoolean(source.ativo),
    bloqueado: asBoolean(source.bloqueado),
    bloqueadoPlataforma: asBoolean(source.bloqueado_plataforma),
    liberado: asBoolean(source.liberado),
    contribuinte: asBoolean(source.contribuinte),
    codigo: asString(source.codigo),
    codigoAtivacao: asString(source.codigo_ativacao),
    tipo,
    cpf: tipo === 'PF' ? formatCpfCnpj(rawCpfCnpj) : '',
    cnpj: tipo === 'PJ' ? formatCpfCnpj(rawCpfCnpj) : '',
    nome: tipo === 'PF' ? asString(source.nome_fantasia || source.razao_social) : '',
    razaoSocial: tipo === 'PJ' ? asString(source.razao_social) : '',
    nomeFantasia: asString(source.nome_fantasia),
    sexo: (asString(source.sexo) as 'M' | 'F' | 'O') || 'M',
    rg: asString(source.rg),
    dataNascimento: toDateInputValue(asString(source.data_nascimento)),
    inscricaoEstadual: asString(source.inscricao_estadual),
    isentoIe: asString(source.inscricao_estadual).toUpperCase() === 'ISENTO',
    limiteCredito: formatCurrencyInput(source.limite_credito),
    limiteDisponivel: formatCurrencyInput(source.limite_disponivel),
    tipoCliente: asString(source.tipo_cliente),
    ramoAtividade: asString(source.ramo_atividade),
    pessoaContato: asString(source.pessoa_contato),
    email: asString(source.email),
    telefone1: formatPhone(asString(source.ddd1), asString(source.telefone1)),
    telefone2: formatPhone(asString(source.ddd2), asString(source.telefone2)),
    celular: formatPhone(asString(source.ddd_celular), asString(source.celular)),
    cep: asString(source.cep),
    endereco: asString(source.endereco),
    numero: asString(source.numero),
    complemento: asString(source.complemento),
    bairro: asString(source.bairro),
    cidade: asString(source.cidade),
    uf: asString(source.uf),
    observacoesBloqueio: asString(source.observacoes),
    observacoesBloqueioPlataforma: asString(source.observacoes_bloqueado_plataforma),
    classificacao: {
      rede: toLookupOption(source.rede),
      segmento: toLookupOption(source.segmento),
      canalDistribuicao: toLookupOption(source.canal_distribuicao),
      filial: toLookupOption(source.filial, ['nome_fantasia', 'nome']),
      vendedor: toLookupOption(source.vendedor),
      tabelaPreco: toLookupOption(source.tabela_preco),
      formaPagamento: toLookupOption(source.forma_pagamento),
      condicaoPagamento: toLookupOption(source.condicao_pagamento),
      formaPagamentoPadrao: toLookupOption(source.forma_pagamento_padrao),
      condicaoPagamentoPadrao: toLookupOption(source.condicao_pagamento_padrao),
    },
    filiais: asArray(source.filiais).map(mapBranch),
    vendedores: asArray(source.vendedores).map(mapSeller),
    formasPagamento: asArray(source.formas_pagamento).map(mapPaymentMethod),
    condicoesPagamento: asArray(source.condicoes_pagamento).map(mapPaymentCondition),
    formularios: mapAdditionalForms(source.formularios),
  }
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : null
}

function normalizeTipoCliente(value: string) {
  const normalized = value.trim().toUpperCase()
  return ['C', 'F', 'R'].includes(normalized) ? normalized : null
}

export function buildClientSavePayload(form: ClientFormRecord) {
  const isPf = form.tipo === 'PF'
  const cpfOrCnpj = digitsOnly(isPf ? form.cpf : form.cnpj)

  const payload: Record<string, unknown> = {
    id: form.id || undefined,
    id_classe: form.idClasse || null,
    ativo: form.ativo,
    bloqueado: form.bloqueado,
    liberado: form.liberado,
    contribuinte: form.contribuinte,
    codigo: form.codigo.trim() || null,
    codigo_ativacao: form.codigoAtivacao.trim() || null,
    tipo: form.tipo,
    cnpj_cpf: cpfOrCnpj,
    nome_fantasia: (isPf ? form.nome : form.nomeFantasia).trim(),
    razao_social: (isPf ? form.nome : (form.razaoSocial || form.nomeFantasia)).trim(),
    rg: isPf ? form.rg || null : null,
    sexo: isPf ? form.sexo || null : null,
    data_nascimento: isPf && form.dataNascimento ? `${form.dataNascimento} 00:00:00` : null,
    inscricao_estadual: isPf ? null : (form.isentoIe ? 'ISENTO' : (form.inscricaoEstadual || null)),
    limite_credito: parseCurrencyInput(form.limiteCredito),
    limite_disponivel: parseCurrencyInput(form.limiteDisponivel),
    tipo_cliente: normalizeTipoCliente(form.tipoCliente),
    ramo_atividade: form.ramoAtividade.trim() || null,
    pessoa_contato: form.pessoaContato.trim() || null,
    email: form.email.trim() || null,
    cep: digitsOnly(form.cep) || null,
    endereco: form.endereco.trim() || null,
    numero: form.numero.trim() || null,
    complemento: form.complemento.trim() || null,
    bairro: form.bairro.trim() || null,
    cidade: form.cidade.trim() || null,
    uf: form.uf.trim() || null,
    id_rede: form.classificacao.rede?.id || null,
    id_segmento: form.classificacao.segmento?.id || null,
    id_canal_distribuicao: form.classificacao.canalDistribuicao?.id || null,
    id_filial: form.classificacao.filial?.id || null,
    id_vendedor: form.classificacao.vendedor?.id || null,
    id_tabela_preco: form.classificacao.tabelaPreco?.id || null,
    id_forma_pagamento: form.classificacao.formaPagamento?.id || null,
    id_condicao_pagamento: form.classificacao.condicaoPagamento?.id || null,
    id_forma_pagamento_padrao: form.classificacao.formaPagamentoPadrao?.id || null,
    id_condicao_pagamento_padrao: form.classificacao.condicaoPagamentoPadrao?.id || null,
    observacoes: form.observacoesBloqueio.trim() || null,
    observacoes_bloqueado_plataforma: form.observacoesBloqueioPlataforma.trim() || null,
  }

  const phone1 = digitsOnly(form.telefone1)
  const phone2 = digitsOnly(form.telefone2)
  const celular = digitsOnly(form.celular)

  payload.ddd1 = phone1 ? phone1.slice(0, 2) : null
  payload.telefone1 = phone1 ? phone1.slice(2) : null
  payload.ddd2 = phone2 ? phone2.slice(0, 2) : null
  payload.telefone2 = phone2 ? phone2.slice(2) : null
  payload.ddd_celular = celular ? celular.slice(0, 2) : null
  payload.celular = celular ? celular.slice(2) : null

  return payload
}

export function mapLookupResponse(payload: unknown, labelKeys: string[]): ClientLookupOption[] {
  const source = asRecord(payload)
  const result: ClientLookupOption[] = []
  const items = Array.isArray(payload) ? payload : asArray(source.data)

  for (const item of items) {
    const option = toLookupOption(item, labelKeys)
    if (!option) {
      continue
    }

    const raw = asRecord(item)
    result.push({
      ...option,
      description: asString(raw.codigo) || undefined,
    })
  }

  return result
}
