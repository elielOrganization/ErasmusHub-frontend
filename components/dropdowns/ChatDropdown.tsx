"use client"
import { useRouter } from '@/i18n/routing';
import { useApi } from '@/hooks/useApi';

export default function ChatDropdown() {
    const router = useRouter();
    const { data: chats } = useApi<{ unread_count: number }[]>('/chat/', { refreshInterval: 30_000 });
    const totalUnread = (chats ?? []).reduce((acc, c) => acc + c.unread_count, 0);

    return (
        <button
            onClick={() => router.push('/dashboard/messages')}
            className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95 transition-all relative"
            aria-label="Messages"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            {totalUnread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
        </button>
    );
}
