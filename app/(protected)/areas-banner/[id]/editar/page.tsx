import { AreaBannerFormPage } from '@/src/features/areas-banner/components/area-banner-form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AreaBannerFormPage id={id} />
}
