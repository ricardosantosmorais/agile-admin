'use client'

import Image from 'next/image'
import { AlertCircle, FileText, ImagePlus, LoaderCircle, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useI18n } from '@/src/i18n/use-i18n'
import { normalizeUploadResult, type UploadAssetHandler } from '@/src/lib/uploads'

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
          'rounded-[1.35rem] border-2 border-dashed bg-white p-5 transition',
          isDragReject ? 'border-rose-300 bg-rose-50' : isDragActive ? 'border-emerald-400 bg-emerald-50/50' : 'border-[#2bc48a] bg-[#fffdf9]',
          disabled || isUploading ? 'opacity-70' : 'cursor-pointer',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="overflow-hidden rounded-[1rem] border border-[#ebe3d7] bg-[#f8f5ef]">
            {hasAsset && isImage ? (
              <div className="relative h-[11rem] w-full bg-white">
                <Image src={previewValue} alt="" fill className="object-contain object-center p-3" unoptimized />
              </div>
            ) : (
              <div className="flex h-[11rem] w-full flex-col items-center justify-center gap-2 px-4 text-center text-slate-500">
                {isImage ? <ImagePlus className="h-9 w-9 text-slate-300" /> : <FileText className="h-9 w-9 text-slate-300" />}
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {isImage ? t('common.noImage', 'Sem imagem') : t('uploads.noFile', 'Sem arquivo')}
                </span>
              </div>
            )}
          </div>

          <div className="flex min-h-[11rem] flex-col justify-between gap-4">
            <div className="space-y-3 text-center lg:text-left">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eefaf4] text-[#17a36b] lg:mx-0">
                {isUploading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[1.15rem] font-semibold tracking-tight text-slate-950">
                  {isDragActive ? t('uploads.dropNow', 'Solte o arquivo para enviar') : resolvedTitle}
                </h3>
                <p className="max-w-2xl text-sm leading-6 text-slate-500">{resolvedDescription}</p>
                <p className="text-sm text-slate-500">
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
                className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex h-11 items-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.clear', 'Limpar')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {uploadError ? (
        <div className="flex items-center gap-2 rounded-[0.9rem] border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      ) : null}
    </div>
  )
}
