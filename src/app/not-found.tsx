import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--color-brand-700)' }}>
        404
      </h1>
      <h2 className="text-2xl font-semibold mb-3 text-gray-800">
        Page not found
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Looks like this page wandered off — maybe it&apos;s traveling. Let&apos;s get you back home.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium text-white"
        style={{ backgroundColor: 'var(--color-brand-700)' }}
      >
        Back to Home
      </Link>
    </section>
  );
}
