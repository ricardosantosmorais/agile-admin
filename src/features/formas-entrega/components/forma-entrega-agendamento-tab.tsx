'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { DateInput } from '@/src/components/ui/date-input'
import { FormField } from '@/src/components/ui/form-field'
import { TimeInput } from '@/src/components/ui/time-input'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { inputClasses } from '@/src/components/ui/input-styles'
import { SectionCard } from '@/src/components/ui/section-card'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { createFormaEntregaDataPayload, serializeFormaEntregaRecord, type FormaEntregaDataDraft, type FormaEntregaDataRecord } from '@/src/features/formas-entrega/services/formas-entrega-mappers'
import { formasEntregaClient } from '@/src/features/formas-entrega/services/formas-entrega-client'
import { useI18n } from '@/src/i18n/use-i18n'

type ScheduleSettingsDraft = {
  agendamento: boolean
  agendamento_dias_minimo: string
  agendamento_dias_maximo: string
  agendamento_horario_corte: string
  agendamento_seg: boolean
  agendamento_ter: boolean
  agendamento_qua: boolean
  agendamento_qui: boolean
  agendamento_sex: boolean
  agendamento_sab: boolean
  agendamento_dom: boolean
}

function checked(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function normalizeIntegerInput(value: string, maxLength = 3) {
  return value.replace(/[^\d]/g, '').slice(0, maxLength)
}

function createSettingsDraft(form: Record<string, unknown>): ScheduleSettingsDraft {
  return {
    agendamento: checked(form.agendamento),
    agendamento_dias_minimo: String(form.agendamento_dias_minimo ?? ''),
    agendamento_dias_maximo: String(form.agendamento_dias_maximo ?? ''),
    agendamento_horario_corte: String(form.agendamento_horario_corte ?? ''),
    agendamento_seg: checked(form.agendamento_seg),
    agendamento_ter: checked(form.agendamento_ter),
    agendamento_qua: checked(form.agendamento_qua),
    agendamento_qui: checked(form.agendamento_qui),
    agendamento_sex: checked(form.agendamento_sex),
    agendamento_sab: checked(form.agendamento_sab),
    agendamento_dom: checked(form.agendamento_dom),
  }
}

function createDateDraft(item?: FormaEntregaDataRecord | null): FormaEntregaDataDraft {
  return {
    id: item?.id,
    data: item?.data ? String(item.data).slice(0, 10) : '',
    descricao: String(item?.descricao ?? ''),
    restricao: checked(item?.restricao ?? true),
  }
}

export function FormaEntregaAgendamentoTab({
  formaEntregaId,
  form,
  readOnly,
  refreshRecord,
  onError,
}: {
  formaEntregaId: string
  form: Record<string, unknown>
  readOnly: boolean
  refreshRecord: () => Promise<void>
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<FormaEntregaDataRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [dateModalOpen, setDateModalOpen] = useState(false)
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null)
  const [dateFeedback, setDateFeedback] = useState<string | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<ScheduleSettingsDraft>(createSettingsDraft(form))
  const [dateDraft, setDateDraft] = useState<FormaEntregaDataDraft>(createDateDraft())

  useEffect(() => {
    setSettingsDraft(createSettingsDraft(form))
  }, [form])

  const refreshDates = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await formasEntregaClient.listDatas(formaEntregaId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.loadDatesError', 'Não foi possível carregar as datas excepcionais.'))
    } finally {
      setIsLoading(false)
    }
  }, [formaEntregaId, onError, t])

  useEffect(() => {
    void refreshDates()
  }, [refreshDates])

  const deliveryDays = useMemo(() => {
    const labels = [
      settingsDraft.agendamento_seg ? t('logistics.rotas.fields.monday', 'Segunda') : null,
      settingsDraft.agendamento_ter ? t('logistics.rotas.fields.tuesday', 'Terça') : null,
      settingsDraft.agendamento_qua ? t('logistics.rotas.fields.wednesday', 'Quarta') : null,
      settingsDraft.agendamento_qui ? t('logistics.rotas.fields.thursday', 'Quinta') : null,
      settingsDraft.agendamento_sex ? t('logistics.rotas.fields.friday', 'Sexta') : null,
      settingsDraft.agendamento_sab ? t('logistics.rotas.fields.saturday', 'Sábado') : null,
      settingsDraft.agendamento_dom ? t('logistics.rotas.fields.sunday', 'Domingo') : null,
    ].filter((item): item is string => Boolean(item))

    return labels.length ? labels.join(', ') : t('common.none', 'Nenhum')
  }, [settingsDraft, t])

  function openSettingsModal() {
    setSettingsDraft(createSettingsDraft(form))
    setSettingsFeedback(null)
    setSettingsModalOpen(true)
  }

  function openCreateDateModal() {
    setDateDraft(createDateDraft())
    setDateFeedback(null)
    setDateModalOpen(true)
  }

  function openEditDateModal(item: FormaEntregaDataRecord) {
    setDateDraft(createDateDraft(item))
    setDateFeedback(null)
    setDateModalOpen(true)
  }

  async function handleSaveSettings() {
    try {
      await formasEntregaClient.save(serializeFormaEntregaRecord({
        ...form,
        ...settingsDraft,
      }))
      await refreshRecord()
      setSettingsModalOpen(false)
      setSettingsFeedback(null)
    } catch (error) {
      setSettingsFeedback(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.saveScheduleError', 'Não foi possível salvar o agendamento.'))
    }
  }

  async function handleSaveDate() {
    if (!dateDraft.data) {
      setDateFeedback(t('logistics.deliveryMethods.messages.dateRequired', 'Selecione uma data.'))
      return
    }

    try {
      await formasEntregaClient.saveData(formaEntregaId, createFormaEntregaDataPayload(formaEntregaId, dateDraft))
      await refreshDates()
      setDateModalOpen(false)
      setDateFeedback(null)
    } catch (error) {
      setDateFeedback(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.saveDateError', 'Não foi possível salvar a data excepcional.'))
    }
  }

  async function handleDelete() {
    try {
      await formasEntregaClient.deleteDatas(formaEntregaId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refreshDates()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.deleteDateError', 'Não foi possível excluir as datas excepcionais.'))
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title={t('logistics.deliveryMethods.tabs.scheduling', 'Agendamento')}
        description={t('logistics.deliveryMethods.help.scheduleSummary', 'A configuração fica resumida aqui. Para incluir ou alterar, use o modal de edição.')}
        action={!readOnly ? (
          <button type="button" onClick={openSettingsModal} className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
            <Pencil className="h-4 w-4" />
            {t('common.edit', 'Editar')}
          </button>
        ) : null}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('logistics.deliveryMethods.scheduling.enabled', 'Agendamento')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{settingsDraft.agendamento ? t('common.yes', 'Sim') : t('common.no', 'Não')}</p>
          </div>
          <div className="rounded-[1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('logistics.deliveryMethods.scheduling.minDays', 'Mínimo de dias para agendamento')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{settingsDraft.agendamento_dias_minimo || '0'}</p>
          </div>
          <div className="rounded-[1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('logistics.deliveryMethods.scheduling.maxDays', 'Máximo de dias para agendamento')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{settingsDraft.agendamento_dias_maximo || '0'}</p>
          </div>
          <div className="rounded-[1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('logistics.deliveryMethods.scheduling.cutoffTime', 'Horário de corte')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{settingsDraft.agendamento_horario_corte || '--:--'}</p>
          </div>
          <div className="rounded-[1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3 md:col-span-2 xl:col-span-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('logistics.sections.deliveryDays', 'Dias de entrega')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{deliveryDays}</p>
          </div>
        </div>
      </SectionCard>

      <ClienteRelationSection<FormaEntregaDataRecord>
        title={t('logistics.deliveryMethods.scheduling.exceptionalDates', 'Datas excepcionais')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreateDateModal}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('logistics.deliveryMethods.messages.emptyDates', 'Não existem datas cadastradas.')}
        columns={[
          { header: t('logistics.deliveryMethods.scheduling.date', 'Data'), render: (item) => item.data ? String(item.data).slice(0, 10) : '-' },
          { header: t('logistics.deliveryMethods.scheduling.description', 'Descrição'), render: (item) => item.descricao || '-' },
          { header: t('logistics.deliveryMethods.scheduling.restriction', 'Restrição'), render: (item) => checked(item.restricao) ? t('common.yes', 'Sim') : t('common.no', 'Não') },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[104px]',
            render: (item) => !readOnly ? (
              <div className="flex items-center gap-2">
                <TooltipIconButton label={t('simpleCrud.actions.edit', 'Editar')}>
                  <button type="button" onClick={() => openEditDateModal(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6dfd3] bg-white text-slate-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
                <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                  <button type="button" onClick={() => { setSelectedIds([item.id]); setConfirmOpen(true) }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
              </div>
            ) : null,
          },
        ]}
      />

      <CrudModal
        open={settingsModalOpen}
        title={t('logistics.deliveryMethods.messages.editScheduleTitle', 'Editar agendamento')}
        onClose={() => setSettingsModalOpen(false)}
        onConfirm={() => void handleSaveSettings()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {settingsFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{settingsFeedback}</div> : null}

          <FormField label={t('logistics.deliveryMethods.scheduling.enabled', 'Agendamento')} className="md:col-span-2">
            <label className="inline-flex h-[46px] items-center gap-3 rounded-[1rem] border border-[#e6dfd3] px-3.5 text-sm text-slate-700">
              <input type="checkbox" checked={settingsDraft.agendamento} onChange={(event) => setSettingsDraft((current) => ({ ...current, agendamento: event.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
              <span>{settingsDraft.agendamento ? t('common.yes', 'Sim') : t('common.no', 'Não')}</span>
            </label>
          </FormField>

          <FormField label={t('logistics.deliveryMethods.scheduling.minDays', 'Mínimo de dias para agendamento')}>
            <input value={settingsDraft.agendamento_dias_minimo} onChange={(event) => setSettingsDraft((current) => ({ ...current, agendamento_dias_minimo: normalizeIntegerInput(event.target.value) }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.scheduling.maxDays', 'Máximo de dias para agendamento')}>
            <input value={settingsDraft.agendamento_dias_maximo} onChange={(event) => setSettingsDraft((current) => ({ ...current, agendamento_dias_maximo: normalizeIntegerInput(event.target.value) }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.scheduling.cutoffTime', 'Horário de corte')} className="md:col-span-2">
            <TimeInput value={settingsDraft.agendamento_horario_corte} onChange={(event) => setSettingsDraft((current) => ({ ...current, agendamento_horario_corte: event.target.value }))} />
          </FormField>
          <FormField
            label={t('logistics.sections.deliveryDays', 'Dias de entrega')}
            className="md:col-span-2"
            helperText={t('logistics.deliveryMethods.help.scheduleDays', 'Marque os dias em que a forma de entrega permite agendamento.')}
          >
            <div className="flex flex-wrap gap-4 rounded-[1rem] border border-[#e6dfd3] bg-white px-4 py-3">
              {[
                ['agendamento_seg', t('logistics.rotas.fields.monday', 'Segunda')],
                ['agendamento_ter', t('logistics.rotas.fields.tuesday', 'Terça')],
                ['agendamento_qua', t('logistics.rotas.fields.wednesday', 'Quarta')],
                ['agendamento_qui', t('logistics.rotas.fields.thursday', 'Quinta')],
                ['agendamento_sex', t('logistics.rotas.fields.friday', 'Sexta')],
                ['agendamento_sab', t('logistics.rotas.fields.saturday', 'Sábado')],
                ['agendamento_dom', t('logistics.rotas.fields.sunday', 'Domingo')],
              ].map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsDraft[key as keyof ScheduleSettingsDraft] as boolean}
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, [key]: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </CrudModal>

      <CrudModal
        open={dateModalOpen}
        title={dateDraft.id ? t('logistics.deliveryMethods.messages.editDateTitle', 'Editar data excepcional') : t('logistics.deliveryMethods.messages.createDateTitle', 'Nova data excepcional')}
        onClose={() => setDateModalOpen(false)}
        onConfirm={() => void handleSaveDate()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {dateFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{dateFeedback}</div> : null}
          <FormField label={t('logistics.deliveryMethods.scheduling.date', 'Data')}>
            <DateInput value={dateDraft.data} onChange={(event) => setDateDraft((current) => ({ ...current, data: event.target.value }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.scheduling.description', 'Descrição')}>
            <input value={dateDraft.descricao} onChange={(event) => setDateDraft((current) => ({ ...current, descricao: event.target.value }))} className={inputClasses()} />
          </FormField>
          <FormField
            label={t('logistics.deliveryMethods.scheduling.restriction', 'Restrição')}
            className="md:col-span-2"
            helperText={t('logistics.deliveryMethods.help.dateRestriction', 'Use “Sim” para bloquear a data. Use “Não” quando a data for apenas informativa.')}
          >
            <label className="inline-flex h-[46px] items-center gap-3 rounded-[1rem] border border-[#e6dfd3] px-3.5 text-sm text-slate-700">
              <input type="checkbox" checked={dateDraft.restricao} onChange={(event) => setDateDraft((current) => ({ ...current, restricao: event.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
              <span>{dateDraft.restricao ? t('common.yes', 'Sim') : t('common.no', 'Não')}</span>
            </label>
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('logistics.deliveryMethods.messages.deleteDateTitle', 'Excluir datas excepcionais')}
        description={t('logistics.deliveryMethods.messages.deleteDateDescription', 'As datas selecionadas serão removidas.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
