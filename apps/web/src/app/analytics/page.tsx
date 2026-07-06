"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/auth";
import { api } from "../../lib/api";

interface Metrics {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  averageMessagesPerConversation: number;
}

interface Bot {
  id: string;
  name: string;
  status: string;
}

export default function AnalyticsPage() {
  const { user, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7d");

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, router, dateRange]);

  const loadData = async () => {
    try {
      const orgsRes = await api.orgs.list();
      if (orgsRes.data.length > 0) {
        const orgIdStr = orgsRes.data[0].id;
        setOrgId(orgIdStr);

        const botsRes = await api.bots.list(orgIdStr);
        setBots(botsRes.data);

        const endDate = new Date();
        const startDate = new Date();
        if (dateRange === "7d") startDate.setDate(startDate.getDate() - 7);
        else if (dateRange === "30d") startDate.setDate(startDate.getDate() - 30);
        else if (dateRange === "90d") startDate.setDate(startDate.getDate() - 90);

        try {
          const metricsRes = await api.analytics.getDashboard(orgIdStr);
          setMetrics(metricsRes.data);
        } catch {
          setMetrics({
            totalConversations: 0,
            totalMessages: 0,
            totalTokens: 0,
            averageMessagesPerConversation: 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
              &larr; Back
            </Link>
            <h1 className="text-xl font-semibold">Analytics</h1>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-500">Total Conversations</p>
            <p className="text-3xl font-bold mt-1">{metrics?.totalConversations || 0}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-500">Total Messages</p>
            <p className="text-3xl font-bold mt-1">{metrics?.totalMessages || 0}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-500">Total Tokens Used</p>
            <p className="text-3xl font-bold mt-1">{metrics?.totalTokens || 0}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-500">Avg. Messages/Conversation</p>
            <p className="text-3xl font-bold mt-1">
              {metrics?.averageMessagesPerConversation?.toFixed(1) || "0"}
            </p>
          </div>
        </div>

        {/* Bots Overview */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Bot Performance</h2>
          {bots.length === 0 ? (
            <p className="text-gray-500 text-sm">No bots yet</p>
          ) : (
            <div className="divide-y">
              {bots.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{bot.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{bot.status}</p>
                  </div>
                  <Link
                    href={`/preview?bot=${bot.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Test Chat
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
