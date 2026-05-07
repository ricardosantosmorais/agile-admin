import { asRecord, toStringValue } from '@/app/api/consultas/_shared'
import { formatCpfCnpj } from '@/src/lib/formatters'

function hasMeaningfulValue(record: Record<string, unknown>) {
  return ['cnpj_cpf', 'cnpj', 'cpf', 'nome_fantasia', 'razao_social', 'nome', 'email']
    .some((key) => toStringValue(record[key]))
}

export function resolveSubmissionPerson(row: Record<string, unknown>) {
  const cliente = asRecord(row.cliente)
  if (hasMeaningfulValue(cliente)) {
    return cliente
  }

  const contato = asRecord(row.contato)
  return hasMeaningfulValue(contato) ? contato : {}
}

export function getSubmissionPersonDocument(row: Record<string, unknown>) {
  const person = resolveSubmissionPerson(row)
  return toStringValue(person.cnpj_cpf || person.cnpj || person.cpf)
}

export function getSubmissionPersonDisplayDocument(row: Record<string, unknown>) {
  const document = getSubmissionPersonDocument(row)
  return document ? formatCpfCnpj(document, '') : ''
}

export function getSubmissionPersonName(row: Record<string, unknown>) {
  const person = resolveSubmissionPerson(row)
  return toStringValue(person.nome_fantasia || person.razao_social || person.nome)
}
