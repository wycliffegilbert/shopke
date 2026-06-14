export default function Loading() {
  return (
    <div className="container-pad py-12">
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card">
              <div className="aspect-square bg-gray-100 rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-4 bg-gray-100 rounded w-3/5" />
                <div className="h-6 bg-gray-100 rounded w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
