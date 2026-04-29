'use client'

import Image from 'next/image'
import { AlertCircle, FileText, ImagePlus, LoaderCircle, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useI18n } from '@/src/i18n/use-i18n'
import { getDisplayFileName, normalizeUploadResult, type UploadAssetHandler } from '@/src/lib/uploads'

type AssetUploadFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onUploadFile: UploadAssetHandler
  kind?: 'image' | 'file'
  accept?: Record<string, string[]>
  title?: string
  description?: string
  formatsLabel?: string
  maxSizeLabel?: string
}

export function AssetUploadField({
  value,
  onChange,
  disabled = false,
  onUploadFile,
  kind = 'image',
  accept,
  title,
  description,
  formatsLabel,
  maxSizeLabel,
}: AssetUploadFieldProps) {
  const { t } = useI18n()
  const [previewValue, setPreviewValue] = useState(value)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const hasAsset = value.trim().length > 0
  const isImage = kind === 'image'
  const currentFileName = isImage ? '' : getDisplayFileName(value)

  useEffect(() => {
    setPreviewValue(value)
  }, [value])

  const resolvedTitle = title || (isImage ? t('common.selectImage', 'Selecionar imagem') : t('common.selectFile', 'Selecionar arquivo'))
  const resolvedDescription = description || (isImage
    ? t('uploads.imageDropHint', 'Arraste a imagem ou clique para enviar.')
    : t('uploads.fileDropHint', 'Arraste o arquivo ou clique para enviar.'))
  const resolvedFormatsLabel = formatsLabel || (isImage ? 'JPG, PNG, GIF ou WEBP' : t('uploads.anyFile', 'Formato conforme o módulo'))

  async function processFile(file?: File) {
    if (!file) {
      return
    }

    setIsUploading(true)
    setUploadError(null)
    try {
      const result = normalizeUploadResult(await onUploadFile(file))
      setPreviewValue(result.previewValue || result.value)
      onChange(result.value)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('uploads.error', 'Não foi possível enviar o arquivo.'))
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    accept,
    multiple: false,
    disabled: disabled || isUploading,
    noClick: true,
    onDrop: (acceptedFiles) => {
      void processFile(acceptedFiles[0])
    },
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={[
          'app-pane rounded-[1.35rem] border-2 border-dashed p-5 transition',
          isDragReject
            ? 'border-rose-400/70 bg-rose-500/8'
            : isDragActive
              ? 'border-emerald-400 bg-emerald-500/8'
              : 'border-emerald-400/90 bg-transparent',
          disabled || isUploading ? 'opacity-70' : 'cursor-pointer',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="app-pane-muted overflow-hidden rounded-[1rem] border border-[color:var(--app-card-border)]">
            {hasAsset && isImage ? (
              <div className="app-pane relative h-[11rem] w-full">
                <Image src={previewValue} alt="" fill className="object-contain object-center p-3" unoptimized />
              </div>
            ) : hasAsset && !isImage ? (
              <div className="flex h-[11rem] w-full flex-col items-center justify-center gap-2 px-4 text-center text-[color:var(--app-muted)]">
                <FileText className="h-9 w-9 text-[color:var(--app-muted)]/70" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  {t('uploads.currentFile', 'Arquivo atual')}
                </span>
                <span className="max-w-full truncate text-sm font-semibold text-[color:var(--app-text)]">
                  {currentFileName || value}
                </span>
              </div>
            ) : (
              <div className="flex h-[11rem] w-full flex-col items-center justify-center gap-2 px-4 text-center text-[color:var(--app-muted)]">
                {isImage ? <ImagePlus className="h-9 w-9 text-[color:var(--app-muted)]/70" /> : <FileText className="h-9 w-9 text-[color:var(--app-muted)]/70" />}
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  {isImage ? t('common.noImage', 'Sem imagem') : t('uploads.noFile', 'Sem arquivo')}
                </span>
              </div>
            )}
          </div>

          <div className="flex min-h-[11rem] flex-col justify-between gap-4">
            <div className="space-y-3 text-center lg:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-300 lg:mx-0">
                {isUploading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[1.15rem] font-semibold tracking-tight text-[color:var(--app-text)]">
                  {isDragActive ? t('uploads.dropNow', 'Solte o arquivo para enviar') : resolvedTitle}
                </h3>
                <p className="max-w-2xl text-sm leading-6 text-[color:var(--app-muted)]">{resolvedDescription}</p>
                <p className="text-sm text-[color:var(--app-muted)]">
                  {resolvedFormatsLabel}
                  {maxSizeLabel ? ` • ${maxSizeLabel}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={disabled || isUploading}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  open()
                }}
                className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {isUploading ? t('common.loading', 'Carregando...') : t('uploads.chooseFile', 'Escolher arquivo')}
              </button>
              <button
                type="button"
                disabled={disabled || isUploading || !hasAsset}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setPreviewValue('')
                  setUploadError(null)
                  onChange('')
                }}
                className="app-button-danger inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.clear', 'Limpar')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="flex items-center gap-2 rounded-[0.9rem] border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      ) : null}
    </div>
  )
}
