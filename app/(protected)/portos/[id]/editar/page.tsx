import { PortoFormPage } from '@/src/features/portos/components/porto-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PortoFormPage id={id} />
}
