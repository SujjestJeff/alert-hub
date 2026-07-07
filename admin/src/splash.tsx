export function Splash() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-primary
            border-t-transparent animate-spin"
        />
        <p
          className="text-muted-foreground text-sm"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          initializing...
        </p>
      </div>
    </div>
  );
}
