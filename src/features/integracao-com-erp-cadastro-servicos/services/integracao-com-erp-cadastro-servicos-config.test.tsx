import { describe, expect, it } from 'vitest'
import { INTEGRACAO_COM_ERP_CADASTRO_SERVICOS_CONFIG } from './integracao-com-erp-cadastro-servicos-config'

function getField(key: string) {
	for (const section of INTEGRACAO_COM_ERP_CADASTRO_SERVICOS_CONFIG.sections) {
		const field = section.fields.find((item) => item.key === key)
		if (field) return field
	}

	throw new Error(`Field ${key} not found`)
}

describe('integracao-com-erp-cadastro-servicos-config', () => {
	it('exibe configuracao de dataset consolidado apenas para endpoint gateway', () => {
		const modeField = getField('modo_transformacao_gateway')
		const datasetField = getField('dataset_source_path')

		expect(modeField.hidden?.({ form: { tipo_objeto: 'query' }, isEditing: false })).toBe(true)
		expect(modeField.hidden?.({ form: { tipo_objeto: 'endpoint_gateway' }, isEditing: false })).toBe(false)
		expect(datasetField.hidden?.({ form: { tipo_objeto: 'endpoint_gateway', modo_transformacao_gateway: 'registro' }, isEditing: false })).toBe(true)
		expect(datasetField.hidden?.({ form: { tipo_objeto: 'endpoint_gateway', modo_transformacao_gateway: 'dataset_consolidado' }, isEditing: false })).toBe(false)
		expect(datasetField.required).toBe(true)
	})
})
