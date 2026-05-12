import { SacAreaSubjectFormPage } from '@/src/features/sac-admin/components/sac-area-subject-form-page'

type SacEditAreaSubjectRoutePageProps = {
  params: Promise<{ id: string }>
}

export default async function SacEditAreaSubjectRoutePage({ params }: SacEditAreaSubjectRoutePageProps) {
  const { id } = await params
  return <SacAreaSubjectFormPage id={id} />
}
