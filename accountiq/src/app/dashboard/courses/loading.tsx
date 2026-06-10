export default function CoursesLoading() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-pulse">
      <div className="h-7 w-28 bg-gray-200 rounded-lg mb-1" />
      <div className="h-4 w-44 bg-gray-100 rounded-lg mb-6" />

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-100 bg-white p-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-10 bg-gray-100 rounded-full" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-1.5 w-full bg-gray-200 rounded-full mt-2" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-5 bg-gray-200 rounded shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
