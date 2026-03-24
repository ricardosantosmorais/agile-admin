import { TransportadoraFormPage } from '@/src/features/transportadoras/components/transportadora-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TransportadoraFormPage id={id} />
}
