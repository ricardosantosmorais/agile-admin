import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

function getPayloadMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
			return payload.error.message
		}
		if ('message' in payload && typeof payload.message === 'string') {
			return payload.message
		}
	}
	return fallback
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}
	if (!isRootAgileecommerceTenant(session.currentTenantId)) {
		return NextResponse.json({ message: 'Você não tem acesso ao recurso solicitado.' }, { status: 403 })
	}

	const { id } = await context.params
	const result = await agileV2Fetch('querys', {
		method: 'GET',
		query: { perpage: 1, id },
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar a query.') }, { status: result.status || 400 })
	}

	const item = asArray<Record<string, unknown>>(asRecord(result.payload).data).at(0)
	if (!item) {
		return NextResponse.json({ message: 'Query não encontrada.' }, { status: 404 })
	}

	const templateId = String(item.id_template ?? '').trim()
	if (!templateId) {
		return NextResponse.json(item)
	}

	const templateResult = await agileV2Fetch('templates', {
		method: 'GET',
		query: { perpage: 1, id: templateId },
	})
	let template = templateResult.ok ? asArray<Record<string, unknown>>(asRecord(templateResult.payload).data).at(0) : null
	if (!template) {
		const legacyTemplateResult = await externalAdminApiFetch('painelb2b', 'templates', {
			method: 'GET',
			query: { perpage: 1, id: templateId },
		})
		template = legacyTemplateResult.ok ? asArray<Record<string, unknown>>(asRecord(legacyTemplateResult.payload).data).at(0) : null
	}

	return NextResponse.json({
		...item,
		template_nome: String(template?.nome ?? item.template_nome ?? item['templates.nome'] ?? '').trim(),
		'templates.nome': String(template?.nome ?? item['templates.nome'] ?? '').trim(),
	})
}
