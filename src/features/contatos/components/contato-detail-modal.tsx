'use client'

import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatCpfCnpj, formatDate } from '@/src/lib/formatters'
import type { ContatoDetail } from '@/src/features/contatos/types/contatos'

function renderPhone(ddd?: string | null, number?: string | null) {
  const digits = `${ddd || ''}${number || ''}`.replace(/\D/g, '')
  if (!digits) {
    return '-'
  }

  return digits.length === 11
    ? digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    : digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
}

function statusTone(status?: string | null) {
  if (status === 'aprovado') return 'success'
  if (status === 'reprovado') return 'danger'
  return 'warning'
}

type Props = {
  open: boolean
  detail: ContatoDetail | null
  isLoading: boolean
  error?: string
  onClose: () => void
  onApprove?: () => void
  onReject?: () => void
  canEdit: boolean
}

export function ContatoDetailModal({
  open,
  detail,
  isLoading,
  error,
  onClose,
  onApprove,
  onReject,
  canEdit,
}: Props) {
  const { t } = useI18n()

  const generalRows = detail ? [
    ['people.contacts.fields.status', 'Status', detail.status || '-'],
    ['people.contacts.fields.date', 'Data', detail.created_at ? formatDate(detail.created_at) : '-'],
    ['people.contacts.fields.type', 'Tipo', detail.tipo === 'PJ' ? t('people.personType.pj', 'Pessoa Jurídica') : detail.tipo === 'PF' ? t('people.personType.pf', 'Pessoa Física') : '-'],
    ['people.contacts.fields.document', 'CPF/CNPJ', formatCpfCnpj(detail.cnpj_cpf)],
    ['people.contacts.fields.name', 'Nome / Nome fantasia', detail.nome_fantasia || '-'],
    ['people.contacts.fields.companyName', 'Razão social', detail.razao_social || '-'],
    ['people.contacts.fields.contactPerson', 'Pessoa de contato', detail.pessoa_contato || '-'],
    ['simpleCrud.fields.email', 'E-mail', detail.email || '-'],
    ['people.contacts.fields.segment', 'Segmento', detail.segmento?.nome || '-'],
    ['people.contacts.fields.phone', 'Telefone', renderPhone(detail.ddd1, detail.telefone1)],
    ['people.contacts.fields.mobile', 'Celular', renderPhone(detail.ddd_celular, detail.celular)],
  ] : []

  const addressRows = detail ? [
    ['people.contacts.fields.address', 'Endereço', detail.endereco || '-'],
    ['people.contacts.fields.number', 'Número', detail.numero || '-'],
    ['people.contacts.fields.complement', 'Complemento', detail.complemento || '-'],
    ['people.contacts.fields.district', 'Bairro', detail.bairro || '-'],
    ['people.contacts.fields.city', 'Cidade', detail.cidade || '-'],
    ['people.contacts.fields.uf', 'UF', detail.uf || '-'],
    ['people.contacts.fields.zipCode', 'CEP', detail.cep || '-'],
    ['people.contacts.fields.ibgeCode', 'Código IBGE', detail.codigo_ibge || '-'],
    ['people.contacts.fields.referencePoint', 'Ponto de referência', detail.ponto_referencia || '-'],
  ] : []

  return (
    <OverlayModal open={open} title={t('people.contacts.modalTitle', 'Informações do contato')} onClose={onClose} maxWidthClassName="max-w-5xl">
      <AsyncState isLoading={isLoading} error={error}>
        <div className="space-y-6">
          {detail ? (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[1.2rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-950">{t('people.contacts.sections.general', 'Dados gerais')}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusTone(detail.status) === 'success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : statusTone(detail.status) === 'danger'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {detail.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {generalRows.map(([key, fallback, value]) => (
                      <div key={String(key)} className="grid gap-1 border-b border-[#efe8dd] py-2 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t(String(key), String(fallback))}</span>
                        <span className="text-sm text-slate-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-950">{t('people.contacts.sections.address', 'Endereço')}</h3>
                  <div className="space-y-2">
                    {addressRows.map(([key, fallback, value]) => (
                      <div key={String(key)} className="grid gap-1 border-b border-[#efe8dd] py-2 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t(String(key), String(fallback))}</span>
                        <span className="text-sm text-slate-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {detail.formularios?.length ? (
                <div className="rounded-[1.2rem] border border-[#ebe4d8] bg-white p-4">
                  <h3 className="mb-4 text-sm font-bold text-slate-950">{t('people.contacts.sections.additional', 'Dados adicionais')}</h3>
                  <div className="space-y-5">
                    {detail.formularios.map((section, index) => (
                      <div key={`${section.formulario?.titulo || 'form'}-${index}`} className="rounded-[1rem] border border-[#efe8dd] bg-[#fcfaf5] p-4">
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-slate-950">{section.formulario?.titulo || '-'}</p>
                          <p className="text-xs text-slate-500">{section.data ? formatDate(section.data) : '-'}</p>
                        </div>
                        <div className="space-y-2">
                          {section.dados?.map((field, fieldIndex) => (
                            <div key={`${field.campo?.titulo || 'campo'}-${fieldIndex}`} className="grid gap-1 border-b border-[#efe8dd] py-2 last:border-b-0 md:grid-cols-[220px_minmax(0,1fr)]">
                              <span className="text-sm font-medium text-slate-700">{field.campo?.titulo || '-'}</span>
                              <span className="text-sm text-slate-800">{field.valor || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {canEdit && detail.status === 'recebido' ? (
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={onReject} className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {t('people.contacts.actions.reject', 'Reprovar')}
                  </button>
                  <button type="button" onClick={onApprove} className="inline-flex items-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                    {t('people.contacts.actions.approve', 'Aprovar')}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </AsyncState>
    </OverlayModal>
  )
}
