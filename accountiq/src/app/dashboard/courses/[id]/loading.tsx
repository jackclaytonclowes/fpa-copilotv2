export default function CourseMapLoading() {
  return (
    <div className="max-w-lg mx-auto animate-pulse">
      {/* Course header */}
      <div className="px-4 pt-6 pb-8 bg-gray-50">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="h-5 w-10 bg-gray-200 rounded-full mb-2" />
        <div className="h-7 w-56 bg-gray-300 rounded-lg mb-1" />
        <div className="h-4 w-72 bg-gray-200 rounded" />
      </div>

      {/* Lesson path */}
      <div className="px-4 py-6 space-y-4">
        <div className="h-3 w-32 bg-gray-200 rounded mb-4" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-3 space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="flex gap-3">
                <div className="h-3 w-14 bg-gray-100 rounded" />
                <div className="h-3 w-12 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
