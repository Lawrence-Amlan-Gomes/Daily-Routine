export default function TestimonialsLoading() {
  return (
    <div className="min-h-screen p-6 space-y-8 animate-pulse">
      <div className="h-8 w-56 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5 space-y-3 bg-gray-100 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-4/6 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
