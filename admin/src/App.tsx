import { useRef, useEffect, useState } from "react";
import { getConfig, login, Unauthorized } from "./api";
import { AlertPreview, type PreviewHandle } from "./AlertPreview";
import { ConfigEditor } from "./ConfigEditor";
import { StatusBar } from "./StatusBar";

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [config, setConfig] = useState<any>(null);

  async function load() {
    try { setConfig(await getConfig()); setAuthed(true); }
    catch (e) { if (e instanceof Unauthorized) setAuthed(false); else throw e; }
  }
  useEffect(() => { load(); }, []);

  if (authed === null) return <p>Loading...</p>;
  if (!authed) return <Login onSuccess={load} />;
  const previewRef = useRef<PreviewHandle>(null);
  return (
    <div className="layout">
      <StatusBar />
      <ConfigEditor config={config} onChange={setConfig} previewRef={previewRef} />
      <AlertPreview ref={previewRef} />
    </div>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = async () => (await login(pw) ? onSuccess() : setErr("Incorrect password"));
  return (
    <div className="login">
      <h1>Alert Box Admin</h1>
      <input type="password" value={pw} placeholder="Password"
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()} />
      <button onClick={submit}>Log in</button>
      {err && <p className="error">{err}</p>}
    </div>
  );
}

