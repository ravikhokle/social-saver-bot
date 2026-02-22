export default function BookmarkSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      {/* gradient bar */}
      <div className="h-1 bg-white/10" />
      <div className="p-5 space-y-3">
        {/* platform chip */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 rounded-full bg-white/8" />
        </div>
        {/* thumbnail */}
        <div className="h-44 rounded-xl bg-white/6" />
        {/* title */}
        <div className="h-4 w-3/4 rounded-md bg-white/8" />
        <div className="h-4 w-1/2 rounded-md bg-white/6" />
        {/* summary */}
        <div className="h-3 w-full rounded-md bg-white/5" />
        <div className="h-3 w-5/6 rounded-md bg-white/5" />
        {/* category + tags */}
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-lg bg-white/8" />
          <div className="h-6 w-16 rounded-full bg-white/5" />
          <div className="h-6 w-14 rounded-full bg-white/5" />
        </div>
        {/* footer */}
        <div className="h-3 w-24 rounded-md bg-white/5 mt-2" />
      </div>
    </div>
  );
}
