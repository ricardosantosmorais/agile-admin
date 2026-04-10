'use client'

import { FormRow } from '@/src/components/ui/form-row'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { inputClasses } from '@/src/components/ui/input-styles'
import { SectionCard } from '@/src/components/ui/section-card'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import type { ClientFormRecord } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { cepMask, cnpjMask, cpfMask, currencyMask, phoneMask } from '@/src/lib/input-masks'

type ClienteGeralTabProps = {
  form: ClientFormRecord
  readOnly: boolean
  onPatch: <K extends keyof ClientFormRecord>(key: K, value: ClientFormRecord[K]) => void
}

export function ClienteGeralTab({ form, readOnly, onPatch }: ClienteGeralTabProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <SectionCard title={t('clientes.form.general.identification', 'Identificação')}>
        <div className="space-y-7">
          <FormRow label={t('clientes.form.general.active', 'Ativo')} contentClassName="max-w-[360px]">
            <BooleanChoice value={form.ativo} onChange={(value) => onPatch('ativo', value)} disabled={readOnly} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormRow>
          <FormRow label={t('clientes.form.general.blocked', 'Bloqueado')} contentClassName="max-w-[360px]" helperText={t('clientes.form.general.blockedHint', 'Indica se o cliente está bloqueado para realizar pedidos.')}>
            <BooleanChoice value={form.bloqueado} onChange={(value) => onPatch('bloqueado', value)} disabled={readOnly} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormRow>
          <FormRow label={t('clientes.form.general.blockedPlatform', 'Bloqueado na plataforma')} contentClassName="max-w-[360px]" helperText={t('clientes.form.general.blockedPlatformHint', 'Indica se o cliente está bloqueado na plataforma.')}>
            <BooleanChoice value={form.bloqueadoPlataforma} onChange={() => undefined} disabled trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormRow>
          <FormRow label={t('clientes.form.general.released', 'Liberado')} contentClassName="max-w-[360px]" helperText={t('clientes.form.general.releasedHint', 'Indica se os pedidos do cliente serão liberados sem aprovação do vendedor.')}>
            <BooleanChoice value={form.liberado} onChange={(value) => onPatch('liberado', value)} disabled={readOnly} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormRow>
          <FormRow label={t('clientes.form.general.code', 'Código')} contentClassName="max-w-[320px]">
            <input value={form.codigo} onChange={(event) => onPatch('codigo', event.target.value)} className={inputClasses()} disabled={readOnly} />
          </FormRow>
          <FormRow label={t('clientes.form.general.activationCode', 'Código de ativação')} contentClassName="max-w-[320px]">
            <input value={form.codigoAtivacao} onChange={(event) => onPatch('codigoAtivacao', event.target.value)} className={inputClasses()} disabled={readOnly} />
          </FormRow>

          <FormRow label={t('clientes.form.general.type', 'Type')} contentClassName="max-w-[360px]">
            <div className="grid grid-cols-2 gap-2">
              {(['PF', 'PJ'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => !readOnly && onPatch('tipo', tipo)}
                  className={[
                    'rounded-[1rem] border px-4 py-3 text-sm font-semibold transition',
                    form.tipo === tipo ? 'app-button-primary' : 'app-button-secondary',
                    readOnly ? 'cursor-not-allowed opacity-60' : '',
                  ].join(' ')}
                >
                  {tipo === 'PF' ? t('clientes.form.general.individual', 'Individual') : t('clientes.form.general.company', 'Company')}
                </button>
              ))}
            </div>
          </FormRow>

          {form.tipo === 'PF' ? (
            <div className="space-y-7">
              <FormRow label={t('clientes.form.general.cpf', 'CPF')} contentClassName="max-w-[320px]"><input value={form.cpf} onChange={(event) => onPatch('cpf', cpfMask(event.target.value))} className={inputClasses()} disabled={readOnly} inputMode="numeric" /></FormRow>
              <FormRow label={t('clientes.form.general.fullName', 'Full name')} contentClassName="max-w-[760px]"><input value={form.nome} onChange={(event) => onPatch('nome', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
              <FormRow label={t('clientes.form.general.gender', 'Gender')} contentClassName="max-w-[240px]"><select value={form.sexo} onChange={(event) => onPatch('sexo', event.target.value as ClientFormRecord['sexo'])} className={inputClasses()} disabled={readOnly}><option value="M">{t('clientes.form.general.male', 'Male')}</option><option value="F">{t('clientes.form.general.female', 'Female')}</option><option value="O">{t('clientes.form.general.other', 'Other')}</option></select></FormRow>
              <FormRow label={t('clientes.form.general.identityDocument', 'Identity document')} contentClassName="max-w-[320px]"><input value={form.rg} onChange={(event) => onPatch('rg', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
              <FormRow label={t('clientes.form.general.birthDate', 'Birth date')} contentClassName="max-w-[240px]"><input type="date" value={form.dataNascimento} onChange={(event) => onPatch('dataNascimento', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
            </div>
          ) : (
            <div className="space-y-7">
              <FormRow label={t('clientes.form.general.cnpj', 'CNPJ')} contentClassName="max-w-[320px]"><input value={form.cnpj} onChange={(event) => onPatch('cnpj', cnpjMask(event.target.value))} className={inputClasses()} disabled={readOnly} inputMode="numeric" /></FormRow>
              <FormRow label={t('clientes.form.general.companyName', 'Company name')} contentClassName="max-w-[760px]"><input value={form.razaoSocial} onChange={(event) => onPatch('razaoSocial', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
              <FormRow label={t('clientes.form.general.tradeName', 'Trade name')} contentClassName="max-w-[760px]"><input value={form.nomeFantasia} onChange={(event) => onPatch('nomeFantasia', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
              <FormRow label={t('clientes.form.general.stateRegistration', 'State registration')} contentClassName="max-w-[420px]">
                <div className="space-y-3">
                  <input value={form.inscricaoEstadual} onChange={(event) => onPatch('inscricaoEstadual', event.target.value)} className={inputClasses()} disabled={readOnly || form.isentoIe} />
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.isentoIe}
                      disabled={readOnly}
                      onChange={(event) => {
                        onPatch('isentoIe', event.target.checked)
                        onPatch('inscricaoEstadual', event.target.checked ? 'ISENTO' : '')
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {t('clientes.form.general.stateRegistrationExempt', 'State registration exempt')}
                  </label>
                </div>
              </FormRow>
            </div>
          )}

          <FormRow label={t('clientes.form.general.totalCreditLimit', 'Total credit limit')} contentClassName="max-w-[320px]">
            <InputWithAffix
              prefix="R$"
              value={form.limiteCredito}
              onChange={(event) => onPatch('limiteCredito', currencyMask(event.target.value))}
              disabled={readOnly}
              placeholder="0,00"
              inputMode="numeric"
            />
          </FormRow>
          <FormRow label={t('clientes.form.general.availableCreditLimit', 'Available credit limit')} contentClassName="max-w-[320px]">
            <InputWithAffix
              prefix="R$"
              value={form.limiteDisponivel}
              onChange={(event) => onPatch('limiteDisponivel', currencyMask(event.target.value))}
              disabled={readOnly}
              placeholder="0,00"
              inputMode="numeric"
            />
          </FormRow>
          <FormRow label={t('clientes.form.general.customerType', 'Customer type')} contentClassName="max-w-[420px]">
            <select value={form.tipoCliente} onChange={(event) => onPatch('tipoCliente', event.target.value)} className={inputClasses()} disabled={readOnly}>
              <option value="">{t('clientes.form.general.select', 'Select')}</option>
              <option value="C">{t('clientes.form.general.customerTypeConsumer', 'Consumer')}</option>
              <option value="R">{t('clientes.form.general.customerTypeReseller', 'Reseller')}</option>
              <option value="F">{t('clientes.form.general.customerTypeEmployee', 'Employee')}</option>
            </select>
          </FormRow>
          <FormRow label={t('clientes.form.general.businessActivity', 'Business activity')} contentClassName="max-w-[520px]"><input value={form.ramoAtividade} onChange={(event) => onPatch('ramoAtividade', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
        </div>
      </SectionCard>

      <SectionCard title={t('clientes.form.general.contactAddress', 'Contact and address')}>
        <div className="space-y-7">
          <FormRow label={t('clientes.form.general.contactPerson', 'Contact person')} contentClassName="max-w-[520px]"><input value={form.pessoaContato} onChange={(event) => onPatch('pessoaContato', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
          <FormRow label={t('clientes.form.general.email', 'E-mail')} contentClassName="max-w-[520px]"><input type="email" value={form.email} onChange={(event) => onPatch('email', event.target.value.trimStart())} className={inputClasses()} disabled={readOnly} inputMode="email" autoComplete="email" /></FormRow>
          <FormRow label={t('clientes.form.general.phone1', 'Phone 1')} contentClassName="max-w-[320px]"><input value={form.telefone1} onChange={(event) => onPatch('telefone1', phoneMask(event.target.value))} className={inputClasses()} disabled={readOnly} inputMode="numeric" placeholder="(00) 0000-0000" /></FormRow>
          <FormRow label={t('clientes.form.general.phone2', 'Phone 2')} contentClassName="max-w-[320px]"><input value={form.telefone2} onChange={(event) => onPatch('telefone2', phoneMask(event.target.value))} className={inputClasses()} disabled={readOnly} inputMode="numeric" placeholder="(00) 0000-0000" /></FormRow>
          <FormRow label={t('clientes.form.general.mobile', 'Mobile phone')} contentClassName="max-w-[320px]"><input value={form.celular} onChange={(event) => onPatch('celular', phoneMask(event.target.value, true))} className={inputClasses()} disabled={readOnly} inputMode="numeric" placeholder="(00) 00000-0000" /></FormRow>
          <FormRow label={t('clientes.form.general.zipCode', 'ZIP code')} contentClassName="max-w-[220px]"><input value={form.cep} onChange={(event) => onPatch('cep', cepMask(event.target.value))} className={inputClasses()} disabled={readOnly} inputMode="numeric" placeholder="00000-000" /></FormRow>
          <FormRow label={t('clientes.form.general.address', 'Address')} contentClassName="max-w-[760px]"><input value={form.endereco} onChange={(event) => onPatch('endereco', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
          <FormRow label={t('clientes.form.general.number', 'Number')} contentClassName="max-w-[220px]"><input value={form.numero} onChange={(event) => onPatch('numero', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
          <FormRow label={t('clientes.form.general.complement', 'Complement')} contentClassName="max-w-[520px]"><input value={form.complemento} onChange={(event) => onPatch('complemento', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
          <FormRow label={t('clientes.form.general.district', 'District')} contentClassName="max-w-[420px]"><input value={form.bairro} onChange={(event) => onPatch('bairro', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
          <FormRow label={t('clientes.form.general.city', 'City')} contentClassName="max-w-[420px]"><input value={form.cidade} onChange={(event) => onPatch('cidade', event.target.value)} className={inputClasses()} disabled={readOnly} /></FormRow>
          <FormRow label={t('clientes.form.general.state', 'State')} contentClassName="max-w-[220px]"><select value={form.uf} onChange={(event) => onPatch('uf', event.target.value)} className={inputClasses()} disabled={readOnly}><option value="">{t('clientes.form.general.select', 'Select')}</option>{BRAZILIAN_STATES.map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></FormRow>
        </div>
      </SectionCard>
    </div>
  )
}
