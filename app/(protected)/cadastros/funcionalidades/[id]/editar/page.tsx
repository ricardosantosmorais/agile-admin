import { FuncionalidadeFormPage } from '@/src/features/funcionalidades/components/funcionalidade-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <FuncionalidadeFormPage id={id} />
}
