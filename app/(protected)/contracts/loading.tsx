export default function ContractsLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-9 w-36 bg-slate-200 rounded" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>

      <div className="h-10 bg-slate-100 rounded-lg" />

      <div className="h-96 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        <div className="h-6 w-full bg-slate-100 rounded" />
        <div className="h-6 w-full bg-slate-100 rounded" />
        <div className="h-6 w-full bg-slate-100 rounded" />
        <div className="h-6 w-full bg-slate-100 rounded" />
      </div>
    </div>
  )
}
