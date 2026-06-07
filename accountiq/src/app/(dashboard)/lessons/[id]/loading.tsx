export default function LessonLoading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      {/* Progress bar header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="h-5 w-5 bg-gray-200 rounded" />
          <div className="flex-1 h-2 bg-gray-200 rounded-full" />
          <div className="h-4 w-8 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-5">
        <div className="text-center py-8 space-y-4">
          <div className="h-16 w-16 bg-gray-200 rounded-2xl mx-auto" />
          <div className="h-7 w-64 bg-gray-300 rounded-lg mx-auto" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded mx-auto" />
            <div className="h-4 w-4/6 bg-gray-200 rounded mx-auto" />
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="h-11 w-full bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
