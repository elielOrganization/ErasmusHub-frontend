import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Access denied</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Go back to dashboard
        </Link>
      </div>
    </div>
  );
}
