import { AppsFormPage } from '@/src/features/apps/components/apps-form-page'

export default async function EditarAppRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AppsFormPage id={id} />
}
