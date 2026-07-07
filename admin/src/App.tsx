import { useEffect, useRef, useState } from 'react';
import { getConfig, Unauthorized } from './api';
import type { PreviewHandle } from './AlertPreview';
import { Splash } from './splash';
import { LoginScreen } from './LoginScreen';
import { Dashboard } from './Dashboard';

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [config, setConfig] = useState<any>(null);
  const previewRef = useRef<PreviewHandle>(null);

  async function load() {
    try {
      setConfig(await getConfig());
      setAuthed(true);
    } catch (e) {
      if (e instanceof Unauthorized) setAuthed(false);
      else throw e;
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (authed === null) return <Splash />;
  if (!authed) return <LoginScreen onSuccess={load} />;
  return (
    <Dashboard config={config} setConfig={setConfig} previewRef={previewRef} />
  );
}
