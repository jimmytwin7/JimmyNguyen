'use client';

import { useState } from 'react';

export default function DownloadButton() {
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    setChecking(true);
    try {
      const res = await fetch('/resume.pdf', { method: 'HEAD' });
      if (!res.ok) {
        e.preventDefault();
        setError(true);
      }
    } catch {
      e.preventDefault();
      setError(true);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <a
        href="/resume.pdf"
        download
        onClick={handleClick}
        aria-disabled={checking}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-opacity"
        style={{ backgroundColor: 'var(--color-brand-700)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {checking ? 'Checking…' : 'Download Resume'}
      </a>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          Resume PDF is currently unavailable. Please try again later.
        </p>
      )}
    </div>
  );
}
