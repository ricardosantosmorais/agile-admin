'use client'

import { LoaderCircle, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BooleanSegmentedField } from '@/src/components/ui/boolean-segmented-field'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { mapContatoDetailToEditForm } from '@/src/features/contatos/services/contatos-mappers'
import type { ContatoDetail, ContatoEditFormValues } from '@/src/features/contatos/types/contatos'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'

type LookupOption = { id: string; label: string }

type TextField = {
  key: keyof ContatoEditFormValues
  labelKey: string
  fallback: string
  type?: string
  inputMode?: 'text' | 'numeric'
}

type SelectField = TextField & {
  options: Array<{ value: string; labelKey: string; fallback: string }>
}

type Props = {
  open: boolean
  detail: ContatoDetail | null
  isSaving: boolean
  error?: string
  onClose: () => void
  onSubmit: (values: ContatoEditFormValues) => Promise<void> | void
}

const ufOptions = ['', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

async function loadSegmentos(query: string, page: number, perPage: number) {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) })
  if (query.trim()) params.set('q', query.trim())

  return httpClient<LookupOption[]>(`/api/lookups/segmentos?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })
}

function ContatoEditFormContent({
  detail,
  isSaving,
  error,
  onClose,
  onSubmit,
}: Omit<Props, 'open' | 'detail'> & { detail: ContatoDetail }) {
  const { t } = useI18n()
  const initialValues = useMemo(() => mapContatoDetailToEditForm(detail), [detail])
  const [values, setValues] = useState<ContatoEditFormValues>(initialValues)
  const [segmentOption, setSegmentOption] = useState<LookupOption | null>(
    initialValues.id_segmento ? { id: initialValues.id_segmento, label: detail.segmento?.nome || initialValues.id_segmento } : null,
  )

  const generalFields = useMemo<TextField[]>(() => [
    { key: 'codigo', labelKey: 'people.contacts.fields.code', fallback: 'Código' },
    { key: 'cnpj_cpf', labelKey: 'people.contacts.fields.document', fallback: 'CPF/CNPJ', inputMode: 'numeric' },
    { key: 'nome_fantasia', labelKey: 'people.contacts.fields.name', fallback: 'Nome / Nome fantasia' },
    { key: 'razao_social', labelKey: 'people.contacts.fields.companyName', fallback: 'Razão social' },
    { key: 'inscricao_estadual', labelKey: 'people.contacts.fields.stateRegistration', fallback: 'Inscrição estadual' },
    { key: 'pessoa_contato', labelKey: 'people.contacts.fields.contactPerson', fallback: 'Pessoa de contato' },
    { key: 'cargo', labelKey: 'people.contacts.fields.role', fallback: 'Cargo' },
    { key: 'ramo_atividade', labelKey: 'people.contacts.fields.businessLine', fallback: 'Ramo de atividade' },
    { key: 'email', labelKey: 'simpleCrud.fields.email', fallback: 'E-mail', type: 'email' },
    { key: 'rg', labelKey: 'people.contacts.fields.identityDocument', fallback: 'Documento de identidade' },
    { key: 'data_nascimento', labelKey: 'people.contacts.fields.birthDate', fallback: 'Data de nascimento', type: 'date' },
  ], [])

  const addressFields = useMemo<TextField[]>(() => [
    { key: 'endereco', labelKey: 'people.contacts.fields.address', fallback: 'Endereço' },
    { key: 'numero', labelKey: 'people.contacts.fields.number', fallback: 'Número' },
    { key: 'complemento', labelKey: 'people.contacts.fields.complement', fallback: 'Complemento' },
    { key: 'bairro', labelKey: 'people.contacts.fields.district', fallback: 'Bairro' },
    { key: 'cidade', labelKey: 'people.contacts.fields.city', fallback: 'Cidade' },
    { key: 'cep', labelKey: 'people.contacts.fields.zipCode', fallback: 'CEP', inputMode: 'numeric' },
    { key: 'codigo_ibge', labelKey: 'people.contacts.fields.ibgeCode', fallback: 'Código IBGE', inputMode: 'numeric' },
    { key: 'ponto_referencia', labelKey: 'people.contacts.fields.referencePoint', fallback: 'Ponto de referência' },
  ], [])

  const phoneFields = useMemo<TextField[]>(() => [
    { key: 'ddd1', labelKey: 'people.contacts.fields.phoneAreaCode', fallback: 'DDD telefone 1', inputMode: 'numeric' },
    { key: 'telefone1', labelKey: 'people.contacts.fields.phone', fallback: 'Telefone', inputMode: 'numeric' },
    { key: 'ddd2', labelKey: 'people.contacts.fields.phone2AreaCode', fallback: 'DDD telefone 2', inputMode: 'numeric' },
    { key: 'telefone2', labelKey: 'people.contacts.fields.phone2', fallback: 'Telefone 2', inputMode: 'numeric' },
    { key: 'ddd_celular', labelKey: 'people.contacts.fields.mobileAreaCode', fallback: 'DDD celular', inputMode: 'numeric' },
    { key: 'celular', labelKey: 'people.contacts.fields.mobile', fallback: 'Celular', inputMode: 'numeric' },
  ], [])

  const selectFields = useMemo<SelectField[]>(() => [
    {
      key: 'status',
      labelKey: 'people.contacts.fields.status',
      fallback: 'Status',
      options: [
        { value: 'recebido', labelKey: 'people.contacts.status.recebido', fallback: 'Recebido' },
        { value: 'aprovado', labelKey: 'people.contacts.status.aprovado', fallback: 'Aprovado' },
        { value: 'reprovado', labelKey: 'people.contacts.status.reprovado', fallback: 'Reprovado' },
      ],
    },
    {
      key: 'perfil',
      labelKey: 'people.contacts.fields.profile',
      fallback: 'Perfil',
      options: [
        { value: '', labelKey: 'common.select', fallback: 'Selecione' },
        { value: 'cliente', labelKey: 'people.contacts.profiles.customer', fallback: 'Cliente' },
        { value: 'fornecedor', labelKey: 'people.contacts.profiles.supplier', fallback: 'Fornecedor' },
        { value: 'vendedor', labelKey: 'people.contacts.profiles.seller', fallback: 'Vendedor' },
      ],
    },
    {
      key: 'tipo',
      labelKey: 'people.contacts.fields.type',
      fallback: 'Tipo',
      options: [
        { value: '', labelKey: 'common.select', fallback: 'Selecione' },
        { value: 'PJ', labelKey: 'people.personType.pj', fallback: 'Pessoa Jurídica' },
        { value: 'PF', labelKey: 'people.personType.pf', fallback: 'Pessoa Física' },
      ],
    },
    {
      key: 'tipo_cliente',
      labelKey: 'people.contacts.fields.customerType',
      fallback: 'Tipo de cliente',
      options: [
        { value: '', labelKey: 'common.select', fallback: 'Selecione' },
        { value: 'C', labelKey: 'people.contacts.customerTypes.consumer', fallback: 'Consumidor' },
        { value: 'R', labelKey: 'people.contacts.customerTypes.reseller', fallback: 'Revendedor' },
        { value: 'F', labelKey: 'people.contacts.customerTypes.employee', fallback: 'Funcionário' },
      ],
    },
    {
      key: 'sexo',
      labelKey: 'people.contacts.fields.gender',
      fallback: 'Sexo',
      options: [
        { value: '', labelKey: 'common.select', fallback: 'Selecione' },
        { value: 'M', labelKey: 'people.contacts.genders.male', fallback: 'Masculino' },
        { value: 'F', labelKey: 'people.contacts.genders.female', fallback: 'Feminino' },
        { value: 'O', labelKey: 'people.contacts.genders.other', fallback: 'Outro' },
      ],
    },
  ], [])

  function patch<K extends keyof ContatoEditFormValues>(key: K, value: ContatoEditFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function renderTextField(field: TextField) {
    return (
      <FormField key={String(field.key)} label={t(field.labelKey, field.fallback)}>
        <input
          value={String(values[field.key] ?? '')}
          type={field.type || 'text'}
          inputMode={field.inputMode}
          onChange={(event) => patch(field.key, event.target.value as ContatoEditFormValues[typeof field.key])}
          className={inputClasses()}
        />
      </FormField>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit(values)
      }}
    >
      {error ? <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="app-control-muted rounded-[1.15rem] p-4">
          <h3 className="mb-4 text-sm font-bold text-slate-950">{t('people.contacts.sections.general', 'Dados gerais')}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {selectFields.map((field) => (
              <FormField key={String(field.key)} label={t(field.labelKey, field.fallback)}>
                <select
                  value={String(values[field.key] ?? '')}
                  onChange={(event) => patch(field.key, event.target.value as ContatoEditFormValues[typeof field.key])}
                  className={inputClasses()}
                >
                  {field.options.map((option) => <option key={`${String(field.key)}-${option.value}`} value={option.value}>{t(option.labelKey, option.fallback)}</option>)}
                </select>
              </FormField>
            ))}
            <FormField label={t('people.contacts.fields.segment', 'Segmento')}>
              <LookupSelect<LookupOption>
                label={t('people.contacts.fields.segment', 'Segmento')}
                value={segmentOption}
                onChange={(option) => {
                  setSegmentOption(option)
                  patch('id_segmento', option?.id || '')
                }}
                loadOptions={loadSegmentos}
              />
            </FormField>
            {generalFields.map(renderTextField)}
          </div>
        </div>

        <div className="app-control-muted rounded-[1.15rem] p-4">
          <h3 className="mb-4 text-sm font-bold text-slate-950">{t('people.contacts.sections.address', 'Endereço')}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t('people.contacts.fields.uf', 'UF')}>
              <select value={values.uf} onChange={(event) => patch('uf', event.target.value)} className={inputClasses()}>
                {ufOptions.map((uf) => <option key={uf || 'empty'} value={uf}>{uf || t('common.select', 'Selecione')}</option>)}
              </select>
            </FormField>
            {addressFields.map(renderTextField)}
          </div>
        </div>
      </div>

      <div className="app-control-muted rounded-[1.15rem] p-4">
        <h3 className="mb-4 text-sm font-bold text-slate-950">{t('people.contacts.sections.contact', 'Contato')}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {phoneFields.map(renderTextField)}
          {(['whatsapp', 'news', 'ativo'] as const).map((field) => (
            <FormField key={field} label={t(`people.contacts.fields.${field}`, field)} asLabel={false}>
              <BooleanSegmentedField value={values[field]} onChange={(value) => patch(field, value)} />
            </FormField>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="app-button-secondary inline-flex rounded-full px-4 py-3 text-sm font-semibold">
          {t('common.cancel', 'Cancelar')}
        </button>
        <button type="submit" disabled={isSaving} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('common.save', 'Salvar')}
        </button>
      </div>
    </form>
  )
}

export function ContatoEditModal({
  open,
  detail,
  isSaving,
  error,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useI18n()

  return (
    <OverlayModal open={open} title={t('people.contacts.editModalTitle', 'Editar contato')} onClose={onClose} maxWidthClassName="max-w-6xl">
      {detail ? (
        <ContatoEditFormContent
          key={detail.id}
          detail={detail}
          isSaving={isSaving}
          error={error}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </OverlayModal>
  )
}
