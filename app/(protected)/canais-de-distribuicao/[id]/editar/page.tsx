import { CanalDistribuicaoFormPage } from '@/src/features/canais-distribuicao/components/canal-distribuicao-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CanalDistribuicaoFormPage id={id} />
}
