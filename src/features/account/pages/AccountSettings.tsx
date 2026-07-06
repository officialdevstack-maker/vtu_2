import { useState } from "react";
import { Shield, Bell, ChevronRight, Pencil } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Toggle, PageHeader, Card, Button } from "../../user/components/shared-ui";
import { useAuth, AUTH_QUERY_KEY } from "@/shared/providers/auth";
import { accountService } from "../services/accountService";

const initialsOf = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingProfile, setEditingProfile] = useState(false);
  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // UI-only preferences — no backend column exists for these yet.
  const [twoFA, setTwoFA] = useState(true);
  const [txPin, setTxPin] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [smsNotifs, setSmsNotifs] = useState(true);

  const profileMutation = useMutation({
    mutationFn: accountService.updateProfile,
    onSuccess: (updatedUser) => {
      // The endpoint already returns the fresh user, so just update the
      // cache directly instead of refetching /user again.
      queryClient.setQueryData(AUTH_QUERY_KEY, updatedUser);
      setEditingProfile(false);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: accountService.updatePassword,
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      setPasswordSuccess(false);
      setPasswordError(
        error?.response?.data?.errors?.current_password?.[0] ??
          error?.response?.data?.message ??
          "Could not update password. Please try again.",
      );
    },
  });

  const startEditingProfile = () => {
    setFullname(user?.fullname ?? "");
    setPhone(user?.phone ?? "");
    setEditingProfile(true);
  };

  const handleSaveProfile = () => {
    profileMutation.mutate({ fullname, phone });
  };

  const handleChangePassword = () => {
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    passwordMutation.mutate({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageHeader title="Settings" description="Manage your profile, security and preferences" />

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-lg font-semibold shrink-0">
            {initialsOf(user?.fullname ?? user?.username)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-slate-900 font-semibold truncate">{user?.fullname ?? user?.username ?? "—"}</h2>
            <p className="text-slate-500 text-sm truncate">{user?.email}</p>
          </div>
          {!editingProfile && (
            <Button variant="secondary" size="sm" onClick={startEditingProfile}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
        </div>

        {(user?.badges?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            {user!.badges!.map((badge) => (
              <span
                key={badge.event_id}
                title={badge.times_earned > 1 ? `Earned ${badge.times_earned} times` : undefined}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800"
              >
                <span>{badge.icon || "🏅"}</span>
                {badge.name}
                {badge.times_earned > 1 && (
                  <span className="text-amber-500">×{badge.times_earned}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {editingProfile && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
              />
            </div>
            {profileMutation.isError && (
              <p className="text-red-500 text-xs">Could not save changes. Please check your details and try again.</p>
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveProfile} loading={profileMutation.isPending}>
                Save changes
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditingProfile(false)} disabled={profileMutation.isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-900 font-semibold text-sm">Security</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { label: "Two-factor authentication", desc: "Require OTP for all sign-ins", value: twoFA, onChange: setTwoFA },
            { label: "Transaction PIN", desc: "Require PIN for all transactions", value: txPin, onChange: setTxPin },
            { label: "Biometric login", desc: "Use fingerprint or Face ID", value: biometric, onChange: setBiometric },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <div>
                <p className="text-slate-900 text-sm font-medium">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <p className="text-slate-900 text-sm font-medium">Change password</p>
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition"
          />
          {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
          {passwordSuccess && <p className="text-emerald-600 text-xs">Password updated successfully.</p>}
          <Button
            size="sm"
            onClick={handleChangePassword}
            loading={passwordMutation.isPending}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Update password
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-900 font-semibold text-sm">Notifications</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { label: "Push notifications", desc: "In-app alerts for transactions", value: pushNotifs, onChange: setPushNotifs },
            { label: "Email notifications", desc: "Receipts and account updates", value: emailNotifs, onChange: setEmailNotifs },
            { label: "SMS alerts", desc: "Transaction confirmations via SMS", value: smsNotifs, onChange: setSmsNotifs },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3">
              <div>
                <p className="text-slate-900 text-sm font-medium">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
              </div>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 border-red-100">
        <h3 className="text-red-600 font-semibold text-sm mb-3">Danger zone</h3>
        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-red-100 hover:bg-red-50 transition-colors text-left">
          <div>
            <p className="text-red-700 text-sm font-medium">Deactivate account</p>
            <p className="text-red-400 text-xs mt-0.5">Temporarily disable your account</p>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300 shrink-0" />
        </button>
      </Card>
    </div>
  );
}
