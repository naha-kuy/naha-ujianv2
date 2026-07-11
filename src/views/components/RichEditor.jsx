import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Icon from "./Icon";

const btnStyle = {
  background: "none", border: "1px solid transparent", borderRadius: 4,
  cursor: "pointer", padding: "4px 8px", fontSize: 12, fontWeight: 600,
  fontFamily: "monospace", color: "#7a5a20", transition: "all 0.12s",
  lineHeight: 1,
};

const btnActive = {
  background: "rgba(206,173,106,0.15)", borderColor: "#cead6a", color: "#5a3a00",
};

function Tb({ editor, is, run, label }) {
  const active = typeof is === "function" ? is() : editor.isActive(is);
  return (
    <button type="button" style={active ? { ...btnStyle, ...btnActive } : btnStyle}
      onMouseEnter={(e) => { if (!active) { e.target.style.background = "rgba(206,173,106,0.08)"; e.target.style.borderColor = "#d4b86a"; } }}
      onMouseLeave={(e) => { if (!active) { e.target.style.background = "none"; e.target.style.borderColor = "transparent"; } }}
      onClick={run}
    >{label}</button>
  );
}

function Sep() {
  return <span style={{ width: 1, height: 18, background: "#d4b86a", display: "inline-block", margin: "0 3px", opacity: 0.4 }} />;
}

export default function RichEditor({ value, onChange, placeholder = "Tulis pertanyaan di sini...", minHeight = 150 }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("URL gambar:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="rich-editor" style={{ border: "1px solid #d4b86a", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 2, padding: "6px 8px", borderBottom: "1px solid #e8d8a8", background: "#fefae8", flexWrap: "wrap", alignItems: "center" }}>
        <Tb editor={editor} is="bold" run={() => editor.chain().focus().toggleBold().run()} label="B" />
        <Tb editor={editor} is="italic" run={() => editor.chain().focus().toggleItalic().run()} label={<em>I</em>} />
        <Tb editor={editor} is="strike" run={() => editor.chain().focus().toggleStrike().run()} label={<span style={{ textDecoration: "line-through" }}>S</span>} />
        <Sep />
        <Tb editor={editor} is={["heading", { level: 3 }]} run={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3" />
        <Sep />
        <Tb editor={editor} is="bulletList" run={() => editor.chain().focus().toggleBulletList().run()} label="≡" />
        <Tb editor={editor} is="orderedList" run={() => editor.chain().focus().toggleOrderedList().run()} label="1." />
        <Sep />
        <button type="button" style={btnStyle}
          onMouseEnter={(e) => { e.target.style.background = "rgba(206,173,106,0.08)"; e.target.style.borderColor = "#d4b86a"; }}
          onMouseLeave={(e) => { e.target.style.background = "none"; e.target.style.borderColor = "transparent"; }}
          onClick={addImage}><Icon name="image" size={13} /></button>
      </div>
      <div className="editor-content" style={{ padding: "8px 12px", minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
