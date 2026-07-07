import { useState } from 'react';
import { Radio, LogIn, AlertCircle } from 'lucide-react';
import { login } from './api';

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pw) return;
    setLoading(true);
    setErr('');
    const ok = await login(pw);
    setLoading(false);
    if (ok) onSuccess();
    else setErr('Incorrect password');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2-translate-y-1/2
            w-[600px] h-[600px] rounded-full bg-primary/10
            blur-[120px]"
        />
        <div
          className="absolute top-2/3 left-1/3 w-[300px] h-[300px]
            rounded-full bg-accent/8 blur-[100px]"
        />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-10">
          <div
            className="w-10 h-10 rounded-xl bg-primary/20 border
              border-primary/40 flex items-center justify-center
              shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            <Radio size={18} className="text-primary" />
          </div>
          <span
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            AlertBox
          </span>
        </div>

        <div
          className="bg-card border border-border rounded-2xl p-4
            shadow-[0_0_40px_rgba(124,58,237,0.12)]"
        >
          <h1
            className="text-xl font-bold text-foreground mb-1"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Admin Login
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your password to manage AlertBox
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-muted-foreground
                  uppercase tracking-wider"
              >
                Password
              </label>
              <input
                type="password"
                value={pw}
                placeholder="*******"
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full bg-secondary/50 border border-border
                  rounded-xl px-4 py-3 text-foreground
                  placeholder:text-muted-foreground/50 focus:outline-none
                  focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                  transition-all"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>

            {err && (
              <div
                className="flex items-center gap-2 text-sm text-red-400
                bg-red-500/10 border border-red-500/20 rounded-lg px-3
                py-2"
              >
                <AlertCircle size={14} />
                {err}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || !pw}
              className="flex items-center justify-center gap-2 w-full
              bg-primary hover:bg-primary/90 disabled:opacity-50
              disabled:cursor-not-allowed text-primary-foreground
              font-semibold rounded-xl px-4 py-3 transition-all
              shadow-[0_0_20px_rgba(124,58,237,0.3)]
              hover:shadow-[0_0_28px_rgba(124,58,237,0.5)]"
            >
              {loading ? (
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/30
                    border-t-white animate-spin"
                />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Checking...' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
