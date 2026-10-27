import { useEffect, useRef } from 'react';

const TOOLS = [
  { cmd: 'bold', label: 'B', className: 'font-bold' },
  { cmd: 'italic', label: 'I', className: 'italic' },
  { cmd: 'underline', label: 'U', className: 'underline' },
];

export default function RichEditor({ value, onChange, placeholder = 'Start writing…' }) {
  const ref = useRef(null);
  const lastExternal = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (value !== lastExternal.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || '';
      lastExternal.current = value;
    }
  }, [value]);

  const run = (cmd) => {
    ref.current?.focus();
    document.execCommand(cmd, false);
    emit();
  };

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastExternal.current = html;
    onChange?.(html);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-stone-300 bg-white/80 shadow-sm">
      <div className="flex gap-1 border-b border-stone-200 bg-stone-50/80 px-2 py-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.cmd}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              run(tool.cmd);
            }}
            className={`rounded px-2.5 py-1 text-sm text-ink hover:bg-stone-200 ${tool.className}`}
            title={tool.cmd}
          >
            {tool.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        className="editor-surface prose-journal min-h-[240px] px-4 py-3 text-[1.05rem] leading-relaxed outline-none"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
