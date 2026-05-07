import { AgileStoreDetailPage } from '@/src/features/agile-store/components/agile-store-detail-page'

export default async function AgileStoreDetailRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AgileStoreDetailPage moduleId={id} />
}
