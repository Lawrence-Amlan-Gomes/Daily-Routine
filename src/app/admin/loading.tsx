export default function AdminLoading() {
  return (
    <div className="min-h-screen p-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-4">
        <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
