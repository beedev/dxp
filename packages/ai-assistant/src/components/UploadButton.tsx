import React, { useRef, useState } from 'react';
import { Paperclip, FileText, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import type { UploadRecord } from '../lib/agent-types';

interface UploadButtonProps {
  disabled?: boolean;
  onUpload: (file: File) => Promise<UploadRecord | null>;
}

export function UploadButton({ disabled, onUpload }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        await onUpload(f);
      }
    } finally {
      setUploading(false);
      // Reset so selecting the same file again triggers change
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || uploading}
        title="Attach image or PDF"
        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-[var(--dxp-radius)] text-[var(--dxp-text-muted)] hover:bg-[var(--dxp-border-light)] hover:text-[var(--dxp-brand)] disabled:opacity-40"
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Paperclip size={16} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}

interface UploadChipsProps {
  uploads: UploadRecord[];
  onRemove: (fileId: string) => void;
}

export function UploadChips({ uploads, onRemove }: UploadChipsProps) {
  if (uploads.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-5 pt-2">
      {uploads.map((u) => {
        const isImage = u.mime_type?.startsWith('image/');
        return (
          <div
            key={u.id}
            className="flex items-center gap-1.5 rounded-full border border-[var(--dxp-border)] bg-[var(--dxp-border-light)] px-2.5 py-1"
          >
            {isImage ? (
              <ImageIcon size={12} className="text-[var(--dxp-brand)]" />
            ) : (
              <FileText size={12} className="text-[var(--dxp-brand)]" />
            )}
            <span className="text-xs text-[var(--dxp-text)] max-w-[160px] truncate">
              {u.filename}
            </span>
            <span className="text-[10px] text-[var(--dxp-text-muted)] tabular-nums">
              {(u.size / 1024).toFixed(0)}KB
            </span>
            <button
              type="button"
              onClick={() => onRemove(u.id)}
              className="text-[var(--dxp-text-muted)] hover:text-[var(--dxp-danger)]"
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
