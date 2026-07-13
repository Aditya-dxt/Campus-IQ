import { useState, useRef } from 'react';
import { Upload, FileText, X, Sparkles, Loader2 } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPTED_EXTENSIONS = '.pdf,.docx';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeUploader({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (f) => {
    if (!f) return false;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Please upload a PDF or DOCX file.');
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError('File size must be under 10 MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && validateFile(selected)) {
      setFile(selected);
    }
    // reset so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && validateFile(dropped)) {
      setFile(dropped);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removeFile = () => {
    setFile(null);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || loading) return;
    onSubmit?.({ file, jobDescription });
  };

  const canSubmit = !!file && !loading;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-6">
      {/* ── Drop Zone ── */}
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative rounded-2xl border-2 border-dashed p-10 text-center
            cursor-pointer transition-all duration-200 select-none
            ${
              dragOver
                ? 'border-primary-400 bg-primary-50'
                : 'border-surface-300 hover:border-primary-400 hover:bg-primary-50'
            }
          `}
        >
          <Upload
            className="mx-auto mb-3 text-primary-400"
            size={40}
            strokeWidth={1.5}
          />
          <p className="text-lg font-semibold text-surface-800">
            Drag &amp; drop your resume
          </p>
          <p className="mt-1 text-sm text-surface-500">or click to browse</p>
          <p className="mt-3 text-xs text-surface-400">
            PDF, DOCX up to 10&nbsp;MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload resume"
          />
        </div>
      ) : (
        /* ── File Preview ── */
        <div className="flex items-center gap-4 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-500">
            <FileText size={24} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-surface-800">
              {file.name}
            </p>
            <p className="text-sm text-surface-500">
              {formatFileSize(file.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={removeFile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Remove file"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {/* ── Job Description ── */}
      <div className="space-y-2">
        <label
          htmlFor="job-description"
          className="block text-sm font-medium text-surface-700"
        >
          Paste Job Description
        </label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here to get a tailored analysis…"
          className="w-full min-h-[120px] resize-y rounded-xl border border-surface-200 bg-white px-4 py-3 text-surface-800 placeholder-surface-400 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`
          flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5
          text-white font-semibold text-base shadow-md transition-all duration-200
          bg-gradient-to-r from-primary-500 to-accent-500
          ${
            canSubmit
              ? 'hover:shadow-lg hover:brightness-110 active:scale-[0.98]'
              : 'opacity-50 cursor-not-allowed'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Analyze Resume
          </>
        )}
      </button>
    </form>
  );
}
