import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">ChatBot Builder</h1>
        <p className="text-lg text-gray-600 mb-8">
          Build intelligent chatbots with a visual drag-and-drop interface.
          Connect to multiple channels and deploy instantly.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/builder"
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Start Building
          </Link>
        </div>
      </div>
    </main>
  );
}
