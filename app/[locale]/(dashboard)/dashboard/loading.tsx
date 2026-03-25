export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-64" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 space-y-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-40" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/6" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/5" />
                    </div>
                ))}
            </div>
        </div>
    );
}
