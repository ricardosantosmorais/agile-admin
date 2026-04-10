'use client'

import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react'
import { fileToDataUrl } from '@/src/lib/uploads'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function isBase64OrBlobImage(src: string) {
  return src.startsWith('data:image/') || src.startsWith('blob:')
}

async function normalizeHtmlImagesToBase64(html: string) {
  if (!html || !html.includes('<img')) return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = Array.from(doc.querySelectorAll('img[src]'))

  await Promise.all(
    images.map(async (image) => {
      const src = image.getAttribute('src')?.trim()
      if (!src || isBase64OrBlobImage(src)) return

      try {
        const response = await fetch(src)
        if (!response.ok) return
        const blob = await response.blob()
        const base64 = await fileToDataUrl(blob)
        image.setAttribute('src', base64)
      } catch {
        // Preserve the original src when the asset cannot be converted.
      }
    }),
  )

  return doc.body.innerHTML
}

function toolbarButtonClass(active = false, disabled = false) {
  return [
    'inline-flex h-9 w-9 items-center justify-center rounded-[0.8rem] border transition',
    active ? 'border-slate-950 bg-slate-950 text-white' : 'app-control text-[color:var(--app-muted)]',
    disabled ? 'cursor-not-allowed opacity-40' : 'hover:border-[color:var(--app-control-border-strong)] hover:text-[color:var(--app-text)]',
  ].join(' ')
}

export function RichTextEditor({ value, onChange, disabled = false }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const emitNormalizedRef = useRef<number | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
      Placeholder.configure({
        placeholder: 'Digite o conteúdo da página...',
      }),
    ],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[360px] max-h-[560px] w-full overflow-y-auto px-5 py-4 text-sm text-[color:var(--app-text)] outline-none [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-emerald-600 [&_a]:underline',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== (value || '')) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    return () => {
      if (emitNormalizedRef.current) {
        window.clearTimeout(emitNormalizedRef.current)
      }
    }
  }, [])

  async function emitNormalizedHtml() {
    if (!editor) return
    const normalizedHtml = await normalizeHtmlImagesToBase64(editor.getHTML())
    if (normalizedHtml !== editor.getHTML()) {
      editor.commands.setContent(normalizedHtml, { emitUpdate: false })
    }
    onChange(normalizedHtml)
  }

  function scheduleNormalizeHtml() {
    if (emitNormalizedRef.current) {
      window.clearTimeout(emitNormalizedRef.current)
    }
    emitNormalizedRef.current = window.setTimeout(() => {
      void emitNormalizedHtml()
    }, 400)
  }

  function setLink() {
    if (!editor || disabled) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', previousUrl || 'https://')
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  function setImageByUrl() {
    if (!editor || disabled) return
    const url = window.prompt('URL da imagem', 'https://')
    if (!url || !url.trim()) return
    editor.chain().focus().setImage({ src: url.trim() }).run()
    scheduleNormalizeHtml()
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!editor || disabled || !file) return

    const base64 = await fileToDataUrl(file)
    editor.chain().focus().setImage({ src: base64 }).run()
    onChange(editor.getHTML())
  }

  if (!editor) {
    return null
  }

  return (
    <div className="app-pane w-full overflow-hidden rounded-[1rem]">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageUpload(event)} />
      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--app-card-border)] px-3 py-3">
        <button type="button" className={toolbarButtonClass(editor.isActive('bold'), disabled)} onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled}><Bold className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass(editor.isActive('italic'), disabled)} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled}><Italic className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass(editor.isActive('underline'), true)} disabled><Underline className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass(editor.isActive('bulletList'), disabled)} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled}><List className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass(editor.isActive('orderedList'), disabled)} onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled}><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass(editor.isActive('link'), disabled)} onClick={setLink} disabled={disabled}><Link2 className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass(false, disabled)} onClick={() => fileInputRef.current?.click()} disabled={disabled}><ImagePlus className="h-4 w-4" /></button>
        <button type="button" className="app-button-secondary inline-flex h-9 items-center justify-center rounded-[0.8rem] px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40" onClick={setImageByUrl} disabled={disabled}>IMG URL</button>
        <div className="mx-1 h-6 w-px bg-[color:var(--app-card-border)]" />
        <button type="button" className={toolbarButtonClass(false, disabled || !editor.can().chain().focus().undo().run())} onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></button>
        <button type="button" className={toolbarButtonClass(false, disabled || !editor.can().chain().focus().redo().run())} onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></button>
      </div>
      <EditorContent editor={editor} className={disabled ? 'app-control-muted text-[color:var(--app-muted)] [&_.ProseMirror]:bg-transparent' : '[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-xl'} onBlur={() => void emitNormalizedHtml()} />
    </div>
  )
}
