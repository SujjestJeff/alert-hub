import type { ReactNode } from 'react';
import { Radio, Target, ToggleRightIcon } from 'lucide-react';
import { saveSettings } from './api';

export function SettingsEditor({
  config,
  onChange,
}: {
  config: any;
  onChange: (c: any) => void;
}) {
  const settings = config.settings;

  const toggle = async (key: 'alertingEnabled' | 'goalsEnabled') => {
    const next = await saveSettings({ [key]: !settings[key] });
    onChange({ ...config, settings: next });
  };

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold text-foreground mb-1"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Global switches - changes apply to the overlay instantly
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <ToggleRow
          icon={<Radio size={16} />}
          label="Alerting"
          description="when off, incoming Twitch events never reach the overlay"
          checked={settings.alertingEnabled}
          onClick={() => toggle('alertingEnabled')}
        />
        <ToggleRow
          icon={<Target size={16} />}
          label="Goals"
          description="When off, goal progress freezes and the overlay goal widghet is hidden"
          checked={settings.goalsEnabled}
          onClick={() => toggle('goalsEnabled')}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-primary/10 border-primary/25 text-primary">
          {icon}
        </div>
        <div>
          <h3
            className="text-sm font-semibold text-foreground"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {label}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 shrink-0 ${
          checked
            ? 'bg-primary shadow-[0_0_10px_rgba(124,58,237,0.5)]'
            : 'bg-secondary'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
