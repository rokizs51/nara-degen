export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              <div className="h-8 w-80 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="h-96 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg animate-pulse"></div>
            <div className="h-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Matrix Skeleton */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Stock Table Skeleton */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="grid grid-cols-9 gap-4">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse mx-auto"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse mx-auto"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse mx-auto"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse mx-auto"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};