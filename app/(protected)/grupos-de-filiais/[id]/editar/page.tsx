import { GrupoFilialFormPage } from '@/src/features/grupos-filiais/components/grupo-filial-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GrupoFilialFormPage id={id} />
}
