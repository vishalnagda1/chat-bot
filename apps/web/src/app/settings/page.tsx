"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/auth";
import { api } from "../../lib/api";

interface Org {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  user?: { id: string; email: string; name: string };
}

export default function SettingsPage() {
  const { user, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      const orgsRes = await api.orgs.list();
      if (orgsRes.data.length > 0) {
        const orgData = orgsRes.data[0] as Org;
        setOrg(orgData);
        setOrgName(orgData.name);

        const membersRes = await api.orgSettings.getMembers(orgData.id);
        setMembers(membersRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveOrg = async () => {
    if (!org || !orgName.trim()) return;
    setSaving(true);
    try {
      await api.orgSettings.update(org.id, { name: orgName.trim() });
      setOrg({ ...org, name: orgName.trim() });
      alert("Organization updated!");
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !inviteEmail.trim()) return;

    try {
      await api.orgSettings.inviteMember(org.id, { email: inviteEmail.trim(), role: inviteRole });
      setShowInvite(false);
      setInviteEmail("");
      loadData();
    } catch (err) {
      console.error("Failed to invite:", err);
    }
  };

  const removeMember = async (userId: string) => {
    if (!org || !confirm("Remove this member?")) return;

    try {
      await api.orgSettings.removeMember(org.id, userId);
      loadData();
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
              &larr; Back
            </Link>
            <h1 className="text-xl font-semibold">Organization Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Organization</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <p className="text-sm text-gray-600 capitalize">{org?.plan || "free"}</p>
            </div>
            <button
              onClick={saveOrg}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <button
              onClick={() => setShowInvite(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Invite Member
            </button>
          </div>

          {showInvite && (
            <form onSubmit={inviteMember} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="divide-y">
            {members.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No members yet</p>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{member.user?.email || "Unknown"}</p>
                    <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                  </div>
                  <button
                    onClick={() => removeMember(member.userId)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
