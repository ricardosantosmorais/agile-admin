import { LimiteCreditoFormPage } from '@/src/features/limites-credito/components/limite-credito-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LimiteCreditoFormPage id={id} />
}
