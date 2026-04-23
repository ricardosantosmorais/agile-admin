import { describe, expect, it } from 'vitest'
import {
	buildChangelogAdminPayload,
	isRootAgileecommerceTenant,
	normalizeChangelogAdminRecord,
} from '@/src/features/changelog/services/changelog-admin'

describe('changelog-admin', () => {
	it('detecta o tenant root agileecommerce', () => {
		expect(isRootAgileecommerceTenant('agileecommerce')).toBe(true)
		expect(isRootAgileecommerceTenant('AGILEECOMMERCE')).toBe(true)
		expect(isRootAgileecommerceTenant('1698203521854804')).toBe(false)
	})

	it('normaliza o registro carregado para o formulário', () => {
		expect(
			normalizeChangelogAdminRecord({
				id: '10',
				data: '2026-04-23 00:00:00',
				ativo: 1,
				apenas_master: '0',
			}),
		).toMatchObject({
			id: '10',
			data: '2026-04-23',
			data_original: '2026-04-23 00:00:00',
			ativo: true,
			apenas_master: false,
		})
	})

	it('monta o payload de escrita no formato esperado pelo legado', () => {
		expect(
			buildChangelogAdminPayload({
				data: '2026-04-23',
				ativo: '1',
				apenas_master: false,
				plataforma: 'Admin',
				tipo: 'Melhoria',
				titulo: 'Nova atualização',
				conteudo: '<p>Conteúdo</p>',
			}),
		).toMatchObject({
			data: '2026-04-23 00:00:00',
			ativo: true,
			apenas_master: false,
			plataforma: 'admin',
			tipo: 'melhoria',
			titulo: 'Nova atualização',
			conteudo: '<p>Conteúdo</p>',
		})
	})
})
