import { GradeFormPage } from '@/src/features/grades/components/grade-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GradeFormPage id={id} />
}
