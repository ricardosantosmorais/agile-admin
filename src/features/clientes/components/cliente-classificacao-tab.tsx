'use client'

import { FormRow } from '@/src/components/ui/form-row'
import { SectionCard } from '@/src/components/ui/section-card'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ClientLookupSelect } from '@/src/features/clientes/components/client-lookup-select'
import type { ClientFormRecord } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'

type ClienteClassificacaoTabProps = {
  form: ClientFormRecord
  readOnly: boolean
  onPatch: <K extends keyof ClientFormRecord>(key: K, value: ClientFormRecord[K]) => void
  onPatchClass: <K extends keyof ClientFormRecord['classificacao']>(
    key: K,
    value: ClientFormRecord['classificacao'][K],
  ) => void
}

export function ClienteClassificacaoTab({
  form,
  readOnly,
  onPatch,
  onPatchClass,
}: ClienteClassificacaoTabProps) {
  const { t } = useI18n()

  return (
    <SectionCard title={t('clientes.form.classification.title', 'Commercial classification')}>
      <div className="space-y-7">
        <FormRow label={t('clientes.form.classification.taxpayer', 'Taxpayer')} contentClassName="max-w-[360px]">
          <BooleanChoice value={form.contribuinte} onChange={(value) => onPatch('contribuinte', value)} disabled={readOnly} trueLabel={t('common.yes', 'Yes')} falseLabel={t('common.no', 'No')} />
        </FormRow>
        <FormRow label={t('clientes.form.classification.network', 'Network')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="redes" label={t('clientes.form.classification.network', 'Network')} value={form.classificacao.rede} onChange={(value) => onPatchClass('rede', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.segment', 'Segment')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="segmentos" label={t('clientes.form.classification.segment', 'Segment')} value={form.classificacao.segmento} onChange={(value) => onPatchClass('segmento', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.distributionChannel', 'Distribution channel')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="canais_distribuicao" label={t('clientes.form.classification.distributionChannel', 'Distribution channel')} value={form.classificacao.canalDistribuicao} onChange={(value) => onPatchClass('canalDistribuicao', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.branch', 'Branch')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="filiais" label={t('clientes.form.classification.branch', 'Branch')} value={form.classificacao.filial} onChange={(value) => onPatchClass('filial', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.seller', 'Seller')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="vendedores" label={t('clientes.form.classification.seller', 'Seller')} value={form.classificacao.vendedor} onChange={(value) => onPatchClass('vendedor', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.priceTable', 'Price table')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="tabelas_preco" label={t('clientes.form.classification.priceTable', 'Price table')} value={form.classificacao.tabelaPreco} onChange={(value) => onPatchClass('tabelaPreco', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.paymentMethod', 'Payment method')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="formas_pagamento" label={t('clientes.form.classification.paymentMethod', 'Payment method')} value={form.classificacao.formaPagamento} onChange={(value) => onPatchClass('formaPagamento', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.paymentCondition', 'Payment term')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="condicoes_pagamento" label={t('clientes.form.classification.paymentCondition', 'Payment term')} value={form.classificacao.condicaoPagamento} onChange={(value) => onPatchClass('condicaoPagamento', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.defaultPaymentMethod', 'Default payment method')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="formas_pagamento" label={t('clientes.form.classification.defaultPaymentMethod', 'Default payment method')} value={form.classificacao.formaPagamentoPadrao} onChange={(value) => onPatchClass('formaPagamentoPadrao', value)} disabled={readOnly} /></FormRow>
        <FormRow label={t('clientes.form.classification.defaultPaymentCondition', 'Default payment term')} contentClassName="max-w-[520px]"><ClientLookupSelect resource="condicoes_pagamento" label={t('clientes.form.classification.defaultPaymentCondition', 'Default payment term')} value={form.classificacao.condicaoPagamentoPadrao} onChange={(value) => onPatchClass('condicaoPagamentoPadrao', value)} disabled={readOnly} /></FormRow>
      </div>
    </SectionCard>
  )
}
