"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  useEffect(() => {
    // In production, fetch from API
    setBots([
      {
        id: "1",
        name: "Customer Support Bot",
        description: "Handles customer inquiries",
        status: "published",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Sales Assistant",
        description: "Helps with product recommendations",
        status: "draft",
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">ChatBot Builder</h1>
          <Link
            href="/builder"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + New Bot
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Chatbots</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : bots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500 mb-4">No chatbots yet</p>
            <Link
              href="/builder"
              className="text-blue-600 font-medium hover:underline"
            >
              Create your first chatbot
            </Link>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
