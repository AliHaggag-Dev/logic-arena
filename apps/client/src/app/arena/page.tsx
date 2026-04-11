import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../../lib/api-client";
import { useSocket } from "../../lib/useGameState";

interface RobotScript {
  id: string;
  title: string;
  content: string;
}

const ArenaPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptId = searchParams.get("scriptId");

  const [script, setScript] = useState<RobotScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assuming useSocket handles the connection and state updates
  const { gameState, isConnected } = useSocket(scriptId);

  useEffect(() => {
    if (!scriptId) {
      setError("No script ID provided.");
      setLoading(false);
      return;
    }

    const fetchScript = async () => {
      try {
        const response = await apiClient.get(`/scripts/${scriptId}`); // Assuming a GET /scripts/:id endpoint
        setScript(response.data);
      } catch (err: any) {
        console.error("Failed to fetch script:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [scriptId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Arena...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">Error: {error}</div>;
  }

  if (!script) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">Script not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center text-red-400 mb-10">Arena: {script.title}</h1>
      {!isConnected && <p className="text-center text-yellow-500">Connecting to match server...</p>}

      {isConnected && gameState ? (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-red-500 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-red-300 mb-4">Match State (from server):</h2>
          <pre className="bg-gray-700 p-4 rounded text-green-300 whitespace-pre-wrap">
            {JSON.stringify(gameState, null, 2)}
          </pre>
          {/* Here you would integrate your 3D rendering based on gameState */}
          <p className="mt-4 text-gray-400">Script Content:
          <pre className="bg-gray-700 p-4 rounded text-gray-300 whitespace-pre-wrap">
            {script.content}
          </pre>
          </p>
        </div>
      ) : (
        <p className="text-center text-yellow-500">Waiting for match state...</p>
      )}
    </div>
  );
};

export default ArenaPage;
