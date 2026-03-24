'use client'

import Image from 'next/image'
import { AlertCircle, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useI18n } from '@/src/i18n/use-i18n'
import { base64UploadHandler, normalizeUploadResult, type UploadAssetHandler } from '@/src/lib/uploads'

type ImageUploadFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onUploadFile?: UploadAssetHandler
}

export function ImageUploadField({
  value,
  onChange,
  disabled = false,
  onUploadFile = base64UploadHandler,
}: ImageUploadFieldProps) {
  const { t } = useI18n()
  const [previewValue, setPreviewValue] = useState(value)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const hasImage = value.trim().length > 0

  useEffect(() => {
    setPreviewValue(value)
  }, [value])

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
      setUploadError(error instanceof Error ? error.message : 'Nao foi possivel enviar a imagem.')
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    disabled: disabled || isUploading,
    noClick: true,
    onDrop: (acceptedFiles) => {
      void processFile(acceptedFiles[0])
    },
  })

  function handleButtonClick() {
    if (disabled || isUploading) {
      return
    }
    open()
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-[10.25rem] overflow-hidden rounded-[1rem] border border-[#e6dfd3] bg-[#f8f5ef]">
          {previewValue.trim().length > 0 ? (
            <Image src={previewValue} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
              {t('common.noImage', 'Sem imagem')}
            </div>
          )}
        </div>

        <div className="flex min-h-[10.25rem] flex-col gap-3">
          <div
            {...getRootProps()}
            className={[
              'flex-1 rounded-[1rem] border border-dashed px-4 py-4 transition',
              isDragReject ? 'border-rose-300 bg-rose-50' : isDragActive ? 'border-emerald-400 bg-emerald-50' : 'border-[#d8ccb7] bg-[#fcfaf5]',
              disabled || isUploading ? 'opacity-70' : 'cursor-pointer',
            ].join(' ')}
          >
            <input {...getInputProps()} />
            <div className="flex h-full items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-900">
                  {isDragActive ? 'Solte a imagem aqui' : t('common.selectImage', 'Selecionar imagem')}
                </p>
                <p className="max-w-md text-xs leading-5 text-slate-500">
                  Arraste e solte a imagem aqui ou use o botão para selecionar um arquivo.
                </p>
                <p className="text-xs text-slate-400">
                  PNG, JPG, WEBP, SVG
                </p>
              </div>
              <button
                type="button"
                disabled={disabled || isUploading}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleButtonClick()
                }}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#e6dfd3] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#d5c7b1] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {isUploading ? t('common.loading', 'Carregando...') : 'Escolher arquivo'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || isUploading || !hasImage}
              onClick={() => {
                setPreviewValue('')
                setUploadError(null)
                onChange('')
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.clear', 'Limpar')}
            </button>
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
