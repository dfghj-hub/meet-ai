"use client";

import { useRef, useState, useCallback, type DragEvent } from "react";

type Mode = "text" | "audio";

interface InputTabsProps {
  onTextSubmit: (text: string) => void;
  onAudioSubmit: (file: File) => void;
  loading: boolean;
  loadingStage: string | null;
  error: string | null;
}

export function InputTabs({
  onTextSubmit,
  onAudioSubmit,
  loading,
  loadingStage,
  error,
}: InputTabsProps) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTextSubmit(text.trim());
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleAudioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onAudioSubmit(selectedFile);
    }
  };

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && /\.(mp3|wav|m4a)$/i.test(file.name)) {
      handleFileChange(file);
    }
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const tabs: { key: Mode; label: string; icon: JSX.Element }[] = [
    {
      key: "text",
      label: "粘贴文字",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      key: "audio",
      label: "上传录音",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="glass-card p-6 animate-slide-up">
      {/* Tabs */}
      <div className="relative mb-6 flex rounded-xl bg-white/[0.03] p-1">
        <div
          className="absolute inset-y-1 rounded-lg bg-gradient-primary transition-all duration-300 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            left: mode === "text" ? "0%" : "50%",
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
              mode === tab.key ? "text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Text input */}
      {mode === "text" && (
        <form onSubmit={handleTextSubmit}>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此粘贴会议记录、聊天记录或文字稿…"
            className="input-glass resize-none font-body text-sm leading-relaxed"
            disabled={loading}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {text.length > 0 ? `${text.length} 字` : ""}
            </span>
            <button type="submit" disabled={loading || !text.trim()} className="btn-primary">
              {loading ? "生成中…" : "生成纪要"}
            </button>
          </div>
        </form>
      )}

      {/* Audio upload */}
      {mode === "audio" && (
        <form onSubmit={handleAudioSubmit}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-200 ${
              dragOver
                ? "border-indigo-500 bg-indigo-500/10"
                : selectedFile
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-surface-border bg-white/[0.02] hover:border-gray-500 hover:bg-surface-hover"
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatSize(selectedFile.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-300"
                >
                  重新选择
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface">
                  <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <p className="text-sm text-gray-300">
                  拖拽音频文件到这里，或<span className="text-indigo-400">点击选择</span>
                </p>
                <p className="text-xs text-gray-500">支持 MP3、WAV、M4A，最大 25MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            disabled={loading}
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="btn-primary"
            >
              {loading ? loadingStage ?? "处理中…" : "上传并生成纪要"}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <svg className="h-4 w-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
