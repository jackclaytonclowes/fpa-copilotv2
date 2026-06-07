export default function HomeLoading() {
  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto animate-pulse">
      {/* Greeting */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-36 bg-gray-100 rounded-lg" />
      </div>

      {/* Daily goal card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full" />
      </div>

      {/* Continue learning */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-200 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Course grid */}
      <div className="space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3"
            >
              <div className="h-10 w-10 bg-gray-200 rounded-xl" />
              <div className="h-3 w-12 bg-gray-100 rounded-full" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-1.5 w-full bg-gray-200 rounded-full" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
