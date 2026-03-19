import Link from 'next/link';

interface AccessDeniedProps {
    title: string;
    message: string;
    backLabel: string;
    backHref?: string;
}

function ShieldIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516 11.209 11.209 0 01-7.877-3.08zm.35 5.873a.75.75 0 00-1.262-.528l-3 3a.75.75 0 001.06 1.06l1.72-1.72v4.395a.75.75 0 001.5 0V9.855l1.72 1.72a.75.75 0 101.06-1.06l-3-3a.746.746 0 00-.298-.197z" clipRule="evenodd" />
        </svg>
    );
}

export default function AccessDenied({
    title,
    message,
    backLabel,
    backHref = '/dashboard',
}: AccessDeniedProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-5">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                    <ShieldIcon />
                </div>

                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                    <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
                </div>

                <Link
                    href={backHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                    </svg>
                    {backLabel}
                </Link>
            </div>
        </div>
    );
}
