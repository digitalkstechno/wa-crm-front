'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading2, Minus,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarBtn({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write a description...' }: RichTextEditorProps) {
  const editor = useEditor({ immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[100px] px-4 py-3 focus:outline-none text-gray-700',
      },
    },
  });

  // Sync external value changes (e.g. when editing a task)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/60 flex-wrap">
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
