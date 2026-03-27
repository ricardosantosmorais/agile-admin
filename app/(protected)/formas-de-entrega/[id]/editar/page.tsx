import { FormaEntregaFormPage } from '@/src/features/formas-entrega/components/forma-entrega-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FormaEntregaFormPage id={id} />
}
