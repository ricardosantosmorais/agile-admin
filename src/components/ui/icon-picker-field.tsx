'use client'

import { ImageIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DynamicIcon } from 'lucide-react/dynamic.mjs'
import { ImageUploadField } from '@/src/components/ui/image-upload-field'
import {
	filterIconPickerNames,
	isIconPickerIconValue,
	isIconPickerImageValue,
	normalizeIconPickerValue,
	paginateIconPickerNames,
} from '@/src/components/ui/icon-picker-catalog'
import { inputClasses } from '@/src/components/ui/input-styles'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { useI18n } from '@/src/i18n/use-i18n'

export {
	isIconPickerIconValue,
	isIconPickerImageValue,
	normalizeIconPickerValue,
} from '@/src/components/ui/icon-picker-catalog'

export function IconPickerPreview({
	value,
	className = 'h-5 w-5 text-[color:var(--app-text)]',
	imageClassName = 'h-full w-full object-cover',
}: {
	value: string
	className?: string
	imageClassName?: string
}) {
	const normalizedValue = normalizeIconPickerValue(value)
	if (isIconPickerImageValue(normalizedValue)) {
		return <img src={normalizedValue} alt="" className={imageClassName} />
	}
	if (isIconPickerIconValue(normalizedValue)) {
		return <DynamicIcon name={normalizedValue as never} className={className} />
	}
	return <ImageIcon className={className} />
}

export function IconPickerField({
	value,
	onChange,
	disabled = false,
}: {
	value: string
	onChange: (value: string) => void
	disabled?: boolean
}) {
	const { t } = useI18n()
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)

	const normalizedValue = normalizeIconPickerValue(value)
	const filteredOptions = useMemo(() => filterIconPickerNames(query), [query])
	const paginatedOptions = useMemo(() => paginateIconPickerNames(filteredOptions, page), [filteredOptions, page])

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery)
		setPage(1)
	}

	return (
		<>
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="app-pane flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] border border-[color:var(--app-card-border)]">
						<IconPickerPreview value={value} className="h-5 w-5 text-[color:var(--app-text)]" />
					</div>
					<button
						type="button"
						disabled={disabled}
						onClick={() => setOpen(true)}
						className="app-button-secondary inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
					>
						{t('catalog.fields.selectIcon', 'Selecionar ícone')}
					</button>
				</div>

				<input
					type="text"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className={inputClasses()}
					placeholder={t('catalog.fields.iconPlaceholder', 'Nome do ícone ou URL/base64 da imagem')}
					disabled={disabled}
				/>
			</div>

			<OverlayModal open={open} title={t('catalog.fields.selectIcon', 'Selecionar ícone')} onClose={() => setOpen(false)} maxWidthClassName="max-w-5xl">
				<div className="space-y-4">
					<div>
						<p className="mb-2 text-sm font-semibold text-[color:var(--app-text)]">{t('catalog.fields.systemIcons', 'Ícones do sistema')}</p>
						<input
							type="text"
							value={query}
							onChange={(event) => handleQueryChange(event.target.value)}
							className={inputClasses()}
							placeholder={t('common.search', 'Buscar')}
						/>
						<p className="mt-2 text-xs text-[color:var(--app-muted)]">
							{t('catalog.fields.iconsFound', '{{count}} ícones encontrados', { count: filteredOptions.length })}
						</p>
					</div>

					<div className="app-pane-muted grid max-h-[340px] grid-cols-3 gap-3 overflow-y-auto rounded-[1rem] border border-[color:var(--app-card-border)] p-3 md:grid-cols-5 xl:grid-cols-6">
						{paginatedOptions.items.map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => {
									onChange(option)
									setOpen(false)
								}}
								className={[
									'flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-[0.9rem] border px-2 py-3 text-center text-xs transition',
									normalizedValue === option
										? 'app-button-primary border-transparent text-white'
										: 'app-pane border-[color:var(--app-card-border)] text-[color:var(--app-text)] hover:border-[color:var(--app-control-border-strong)]',
								].join(' ')}
							>
								<DynamicIcon name={option as never} className="h-5 w-5" />
								<span className="break-words">{option}</span>
							</button>
						))}
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3">
						<span className="text-xs font-semibold text-[color:var(--app-muted)]">
							{t('catalog.fields.iconPage', 'Página {{page}} de {{pages}}', { page: paginatedOptions.currentPage, pages: paginatedOptions.totalPages })}
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								className="app-button-secondary inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold disabled:opacity-50"
								disabled={paginatedOptions.currentPage <= 1}
								onClick={() => setPage((current) => Math.max(current - 1, 1))}
							>
								{t('table.previous', 'Anterior')}
							</button>
							<button
								type="button"
								className="app-button-secondary inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold disabled:opacity-50"
								disabled={paginatedOptions.currentPage >= paginatedOptions.totalPages}
								onClick={() => setPage((current) => Math.min(current + 1, paginatedOptions.totalPages))}
							>
								{t('table.next', 'Próxima')}
							</button>
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-sm font-semibold text-[color:var(--app-text)]">{t('catalog.fields.orUseImage', 'Ou use uma imagem')}</p>
						<ImageUploadField
							value={isIconPickerImageValue(value) ? value : ''}
							onChange={onChange}
							disabled={disabled}
						/>
					</div>

					<div className="flex justify-end">
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="app-button-secondary inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold"
						>
							{t('common.close', 'Fechar')}
						</button>
					</div>
				</div>
			</OverlayModal>
		</>
	)
}
