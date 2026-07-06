"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/auth";
import { api } from "../../lib/api";

interface Bot {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [showNewBot, setShowNewBot] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotDesc, setNewBotDesc] = useState("");
  const { user, logout, loadFromStorage } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadOrgAndBots();
  }, [user, router]);

  const loadOrgAndBots = async () => {
    try {
      const orgsRes = await api.orgs.list();
      const orgs = orgsRes.data;
      if (orgs.length === 0) {
        const newOrg = await api.orgs.create({ name: "My Organization" });
        setOrgId(newOrg.data.id);
        setOrgName(newOrg.data.name);
        setBots([]);
      } else {
        setOrgId(orgs[0].id);
        setOrgName(orgs[0].name);
        const botsRes = await api.bots.list(orgs[0].id);
        setBots(botsRes.data);
      }
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  const createBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newBotName.trim()) return;
    try {
      const res = await api.bots.create({
        orgId,
        name: newBotName.trim(),
        description: newBotDesc.trim() || undefined,
      });
      setBots((prev) => [...prev, { ...res.data, name: newBotName, description: newBotDesc, status: "draft", createdAt: new Date().toISOString() } as Bot]);
      setShowNewBot(false);
      setNewBotName("");
      setNewBotDesc("");
    } catch (err) {
      console.error("Failed to create bot:", err);
    }
  };

  const deleteBot = async (botId: string) => {
    if (!confirm("Delete this bot?")) return;
    try {
      await api.bots.delete(botId);
      setBots((prev) => prev.filter((b) => b.id !== botId));
    } catch (err) {
      console.error("Failed to delete bot:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">ChatBot Builder</h1>
            {orgName && <p className="text-xs text-gray-500">{orgName}</p>}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Link
              href="/analytics"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Analytics
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
            <button
              onClick={() => setShowNewBot(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + New Bot
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showNewBot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Create New Bot</h2>
              <form onSubmit={createBot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Customer Support Bot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newBotDesc}
                    onChange={(e) => setNewBotDesc(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What does this bot do?"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBot(false)}
                    className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">Your Chatbots</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : bots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500 mb-4">No chatbots yet</p>
            <button
              onClick={() => setShowNewBot(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Create your first chatbot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="bg-white rounded-lg border p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{bot.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      bot.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {bot.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{bot.description}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/builder?bot=${bot.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-800 px-3 py-2 rounded text-sm hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/preview?bot=${bot.id}`}
                    className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => deleteBot(bot.id)}
                    className="text-red-500 hover:text-red-700 px-2"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
