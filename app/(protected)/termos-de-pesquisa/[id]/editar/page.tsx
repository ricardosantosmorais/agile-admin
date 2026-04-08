import { TermoPesquisaFormPage } from '@/src/features/termos-pesquisa/components/termo-pesquisa-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TermoPesquisaFormPage id={id} />
}

