import { LinhaFormPage } from '@/src/features/linhas/components/linha-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LinhaFormPage id={id} />
}
