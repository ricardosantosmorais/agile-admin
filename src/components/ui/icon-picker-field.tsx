'use client'

import {
  Bell,
  Bookmark,
  BookOpen,
  Boxes,
  Building2,
  CreditCard,
  FileText,
  Folder,
  Globe,
  Grid2X2,
  Heart,
  ImageIcon,
  Layers3,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Megaphone,
  Package,
  Palette,
  Percent,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Ticket,
  Truck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { ImageUploadField } from '@/src/components/ui/image-upload-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { useI18n } from '@/src/i18n/use-i18n'

const ICON_OPTIONS: Array<{ key: string; icon: LucideIcon }> = [
  { key: 'layout-grid', icon: LayoutGrid },
  { key: 'grid-2x2', icon: Grid2X2 },
  { key: 'list', icon: List },
  { key: 'boxes', icon: Boxes },
  { key: 'package', icon: Package },
  { key: 'layers-3', icon: Layers3 },
  { key: 'tag', icon: Tag },
  { key: 'bookmark', icon: Bookmark },
  { key: 'palette', icon: Palette },
  { key: 'image', icon: ImageIcon },
  { key: 'shopping-cart', icon: ShoppingCart },
  { key: 'users', icon: Users },
  { key: 'user', icon: User },
  { key: 'building-2', icon: Building2 },
  { key: 'store', icon: Store },
  { key: 'truck', icon: Truck },
  { key: 'credit-card', icon: CreditCard },
  { key: 'megaphone', icon: Megaphone },
  { key: 'bell', icon: Bell },
  { key: 'mail', icon: Mail },
  { key: 'file-text', icon: FileText },
  { key: 'folder', icon: Folder },
  { key: 'globe', icon: Globe },
  { key: 'settings', icon: Settings },
  { key: 'shield', icon: Shield },
  { key: 'percent', icon: Percent },
  { key: 'ticket', icon: Ticket },
  { key: 'search', icon: Search },
  { key: 'map-pin', icon: MapPin },
  { key: 'star', icon: Star },
  { key: 'heart', icon: Heart },
  { key: 'book-open', icon: BookOpen },
]

function isImageValue(value: string) {
  return value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
}

function resolveIconByKey(value: string) {
  return ICON_OPTIONS.find((option) => option.key === value) ?? null
}

function IconPreview({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return <Icon className={className} />
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

  const currentOption = useMemo(() => resolveIconByKey(value), [value])
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return normalizedQuery
      ? ICON_OPTIONS.filter((option) => option.key.includes(normalizedQuery))
      : ICON_OPTIONS
  }, [query])

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="app-pane flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] border border-[color:var(--app-card-border)]">
            {isImageValue(value) ? (
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : currentOption ? (
              <IconPreview icon={currentOption.icon} className="h-5 w-5 text-[color:var(--app-text)]" />
            ) : (
              <ImageIcon className="h-5 w-5 text-[color:var(--app-muted)]" />
            )}
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
            <p className="mb-2 text-sm font-semibold text-slate-900">{t('catalog.fields.systemIcons', 'Ícones do sistema')}</p>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClasses()}
              placeholder={t('common.search', 'Buscar')}
            />
          </div>

          <div className="app-pane-muted grid max-h-[340px] grid-cols-3 gap-3 overflow-y-auto rounded-[1rem] border border-[color:var(--app-card-border)] p-3 md:grid-cols-5 xl:grid-cols-6">
            {filteredOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  onChange(option.key)
                  setOpen(false)
                }}
                className={[
                  'flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-[0.9rem] border px-2 py-3 text-center text-xs transition',
                  value === option.key
                    ? 'app-button-primary border-transparent text-white'
                    : 'app-pane border-[color:var(--app-card-border)] text-[color:var(--app-text)] hover:border-[color:var(--app-control-border-strong)]',
                ].join(' ')}
              >
                <IconPreview icon={option.icon} className="h-5 w-5" />
                <span className="break-words">{option.key}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">{t('catalog.fields.orUseImage', 'Ou use uma imagem')}</p>
            <ImageUploadField
              value={isImageValue(value) ? value : ''}
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
