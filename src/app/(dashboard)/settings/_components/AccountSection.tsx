"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Check } from "lucide-react";
import { updateDisplayName, updatePassword, updateAvatarUrl } from "../actions";
import { createClient } from "@/lib/supabase/client";
import type { ProfilePrefs } from "../actions";

interface Props {
  prefs: ProfilePrefs;
  email: string;
}

export function AccountSection({ prefs, email }: Props) {
  const [name, setName] = useState(prefs.username ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleNameSave() {
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMsg(null);
    const res = await updateDisplayName(name.trim());
    setNameSaving(false);
    setNameMsg(res.error ? { text: res.error } : { ok: true, text: "Saved" });
  }

  async function handlePasswordSave() {
    if (!curPwd || !newPwd) return;
    if (newPwd.length < 8) { setPwdMsg({ text: "Password must be at least 8 characters" }); return; }
    setPwdSaving(true);
    setPwdMsg(null);
    const res = await updatePassword(curPwd, newPwd);
    setPwdSaving(false);
    if (res.error) { setPwdMsg({ text: res.error }); }
    else { setPwdMsg({ ok: true, text: "Password updated" }); setCurPwd(""); setNewPwd(""); }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAvatarUploading(false); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateAvatarUrl(data.publicUrl);
    }
    setAvatarUploading(false);
  }

  const avatarInitials = (prefs.username ?? email).slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {prefs.avatar_url ? (
            <img src={prefs.avatar_url} alt="" className="w-16 h-16 rounded-pill object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-pill flex items-center justify-center font-mono text-18 font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--color-accent), #FF8A3D)" }}>
              {avatarInitials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-pill bg-bg-elevated border border-border flex items-center justify-center hover:bg-bg-overlay transition-colors"
          >
            {avatarUploading ? <Loader2 size={11} className="animate-spin text-text-muted" /> : <Camera size={11} className="text-text-secondary" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-14 font-semibold text-text-primary">{prefs.username ?? "No name set"}</p>
          <p className="text-12 text-text-muted mt-0.5">{email}</p>
        </div>
      </div>

      <Divider />

      {/* Display Name */}
      <Field label="Display name">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 bg-bg-elevated border border-border rounded-r3 px-3 py-2 text-13 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
          />
          <SaveButton loading={nameSaving} onClick={handleNameSave} />
        </div>
        {nameMsg && <Msg {...nameMsg} />}
      </Field>

      {/* Email (read-only) */}
      <Field label="Email address">
        <input
          value={email}
          readOnly
          className="w-full bg-bg-inset border border-border rounded-r3 px-3 py-2 text-13 text-text-muted cursor-not-allowed"
        />
        <p className="text-11 text-text-disabled mt-1">Email cannot be changed here. Contact support.</p>
      </Field>

      <Divider />

      {/* Password */}
      <div className="flex flex-col gap-3">
        <p className="text-13 font-semibold text-text-primary">Change password</p>
        <Field label="Current password">
          <input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded-r3 px-3 py-2 text-13 text-text-primary focus:outline-none focus:border-accent transition-colors" />
        </Field>
        <Field label="New password">
          <div className="flex gap-2">
            <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
              className="flex-1 bg-bg-elevated border border-border rounded-r3 px-3 py-2 text-13 text-text-primary focus:outline-none focus:border-accent transition-colors" />
            <SaveButton loading={pwdSaving} onClick={handlePasswordSave} label="Update" />
          </div>
        </Field>
        {pwdMsg && <Msg {...pwdMsg} />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-12 font-medium text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ loading, onClick, label = "Save" }: { loading: boolean; onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="px-4 py-2 rounded-r3 bg-accent hover:bg-accent-hover text-white text-13 font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5">
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      {label}
    </button>
  );
}

function Msg({ ok, text }: { ok?: boolean; text: string }) {
  return <p className={`text-12 ${ok ? "text-success" : "text-danger"}`}>{text}</p>;
}

function Divider() {
  return <div className="border-t border-border" />;
}
