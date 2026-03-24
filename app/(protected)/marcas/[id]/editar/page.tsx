import { MarcaFormPage } from '@/src/features/marcas/components/marca-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MarcaFormPage id={id} />
}
