import { ChangelogFormPage } from '@/src/features/changelog/components/changelog-form-page'

export default async function ChangelogEditarRoutePage(props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params
	return <ChangelogFormPage id={id} />
}
