export default function TodoSkeleton(): React.ReactElement {
  return (
    <div className="animate-pulse space-y-3 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3 px-1 border-b border-[var(--border)] last:border-0">
          <div className="w-4 h-4 rounded bg-[var(--border)]" />
          <div className="flex-1 h-4 rounded bg-[var(--border)]" style={{ width: `${60 + i * 10}%` }} />
        </div>
      ))}
    </div>
  );
}
