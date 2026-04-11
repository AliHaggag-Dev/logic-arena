import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api-client";

interface RobotScript {
    id: string;
    title: string;
    content: string;
    version: number;
    createdAt: string;
}

const DashboardPage = () => {
    const [scripts, setScripts] = useState<RobotScript[]>([]);
    const [newScriptTitle, setNewScriptTitle] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchScripts = async () => {
            try {
                const response = await apiClient.get("/scripts");
                setScripts(response.data);
            } catch (error: any) {
                console.error("Failed to fetch scripts:", error.response?.data?.message || error.message);
                // Redirect to login if unauthorized
                if (error.response?.status === 401) {
                    router.push("/login");
                }
            }
        };
        fetchScripts();
    }, [router]);

    const handleCreateScript = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await apiClient.post("/scripts", { title: newScriptTitle, content: "// Write your AliScript here" });
            setScripts([...scripts, response.data]);
            setNewScriptTitle("");
            alert("Script created successfully!");
            // Optionally, navigate to an editor page for the new script
        } catch (error: any) {
            console.error("Failed to create script:", error.response?.data?.message || error.message);
            alert("Failed to create script: " + (error.response?.data?.message || error.message));
        }
    };

    const handleGoToArena = (scriptId: string) => {
        router.push(`/arena?scriptId=${scriptId}`); // Assuming an /arena page exists
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-4xl font-bold text-center text-blue-400 mb-10">Your Logic Arena Dashboard</h1>

            <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg border border-blue-500">
                <h2 className="text-2xl font-bold text-blue-300 mb-4">Your Robot Scripts</h2>
                {scripts.length === 0 ? (
                    <p className="text-gray-400">No scripts yet. Create one to get started!</p>
                ) : (
                    <ul className="space-y-4">
                        {scripts.map((script) => (
                            <li key={script.id} className="flex justify-between items-center bg-gray-700 p-4 rounded-md border border-blue-600">
                                <div>
                                    <h3 className="text-xl font-semibold text-blue-200">{script.title}</h3>
                                    <p className="text-gray-400 text-sm">Version: {script.version} | Created: {new Date(script.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => console.log("Edit script:", script.id)} // Placeholder for edit functionality
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Edit Script
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleGoToArena(script.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Go to Arena
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-8 border-t border-blue-700 pt-6">
                    <h2 className="text-2xl font-bold text-blue-300 mb-4">Create New Script</h2>
                    <form onSubmit={handleCreateScript} className="flex space-x-4">
                        <input
                            type="text"
                            placeholder="New Script Title"
                            className="flex-grow shadow appearance-none border border-blue-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
                            value={newScriptTitle}
                            onChange={(e) => setNewScriptTitle(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Create Script
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
