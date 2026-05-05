import { NextRequest, NextResponse } from 'next/server'
import { asArray, asRecord, extractApiErrorMessage, resolveConsultasContext, serverTenantFetch, toStringValue } from '@/app/api/consultas/_shared'
import { getSubmissionPersonDocument, getSubmissionPersonName } from '@/app/api/consultas/envios-de-formularios/_person'
import { buildEnvioArquivoUrl } from '@/src/features/consultas-envios-formularios/services/envios-formularios-files'

export async function GET(request: NextRequest) {
	const contextResult = await resolveConsultasContext()
	if ('error' in contextResult) {
		return contextResult.error
	}

	const { context } = contextResult
	const formId = toStringValue(request.nextUrl.searchParams.get('id_formulario'))
	if (!formId) {
		return NextResponse.json({ message: 'Selecione o formulário para exportar os dados.' }, { status: 400 })
	}

	const result = await serverTenantFetch(context, `formularios_envios?id_formulario=${encodeURIComponent(formId)}&perpage=10000&embed=dados,cliente,contato`)
	if (!result.ok) {
		return NextResponse.json(
			{ message: extractApiErrorMessage(result.payload, 'Não foi possível carregar os envios para exportação.') },
			{ status: result.status || 400 },
		)
	}

	const rows = asArray(asRecord(result.payload).data)
	const exportRows = rows.map((entry) => {
		const envio = asRecord(entry)
		const output: Record<string, string> = {
			data_envio: toStringValue(envio.data),
			cnpj_cpf: getSubmissionPersonDocument(envio),
			nome_fantasia: getSubmissionPersonName(envio),
		}

		for (const dadoEntry of asArray(envio.dados)) {
			const dado = asRecord(dadoEntry)
			const campo = asRecord(dado.campo)
			const key = toStringValue(campo.nome || campo.titulo || dado.id)
			if (!key) {
				continue
			}

			const value = toStringValue(dado.valor)
			output[key] = toStringValue(campo.tipo) === 'arquivo' && value
				? buildEnvioArquivoUrl(value, process.env.ADMIN_URL_APP, process.env.ADMIN_URL_API_PAINELB2B)
				: value
		}

		return output
	})

	return NextResponse.json({ data: exportRows })
}
