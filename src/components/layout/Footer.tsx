export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 px-6 py-10 text-sm text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-medium text-white/80">Fiwin</span>
          <span className="text-white/40">· MVP demo</span>
        </div>
        <div className="flex gap-6">
          <span>Powered by 0G Compute + 0G Storage</span>
        </div>
      </div>
    </footer>
  );
}
