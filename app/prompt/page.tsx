"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function PromptPage() {
    const { idea, setIdea, setPanels, user, isLoading: authLoading, session, setCurrentProjectId, fetchHistory } = useAppContext();
    const [localIdea, setLocalIdea] = useState(idea);
    const [isGenerating, setIsGenerating] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !session) {
            router.push("/credentials");
        }
    }, [authLoading, session, router]);

    useEffect(() => {
        setCharCount(localIdea.length);
    }, [localIdea]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);

        try {
            setIdea(localIdea);
            const res = await fetch("/api/mindmaps/phase1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea: localIdea })
            });
            const data = await res.json();
            const generatedPanels = data.panels || [];
            setPanels(generatedPanels);

            // Create Project in Supabase
            if (session?.user) {
                const { data: project, error } = await supabase
                    .from('projects')
                    .insert({
                        user_id: session.user.id,
                        idea: localIdea,
                        panels: generatedPanels,
                        maps: {}
                    })
                    .select()
                    .single();

                if (project) {
                    setCurrentProjectId(project.id);
                    fetchHistory();
                }
            }

            router.push("/dashboard");
        } catch (error) {
            console.error("Failed to generate panels", error);
        } finally {
            setIsGenerating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
                <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
                <div className="max-w-4xl w-full space-y-8 fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-12">
                        <Link
                            href="/credentials"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-semibold">Back</span>
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group "
                        >
                            My Projects
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {/* Main Content */}
                    <div className="text-center space-y-6 mb-12">
                        <div className="inline-flex items-center gap-2 px-5 py-2 ">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI Roadmap Generator
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                            What&apos;s your vision,<br />
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {user?.name?.split(' ')[0] || 'friend'}?
                            </span>
                        </h1>


                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <textarea
                                required
                                rows={8}
                                placeholder="Example: I want to build a sustainable urban garden project that uses IoT sensors for automated watering, soil monitoring, and predictive analytics to optimize crop yields..."
                                className="w-full p-8 text-lg rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl transition-all duration-300 outline-none resize-none focus:border-purple-400 focus:shadow-2xl focus:bg-white placeholder:text-gray-400"
                                value={localIdea}
                                onChange={(e) => setLocalIdea(e.target.value)}
                            />

                            {/* Character Count */}
                            <div className="absolute bottom-6 right-8 text-sm font-semibold text-gray-400">
                                {charCount} characters
                            </div>


                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating || !localIdea.trim()}
                            className="btn-primary w-full py-6 text-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating your roadmap...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Generate Roadmap</span>
                                </>
                            )}
                        </button>


                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>
        </div>
    );
}
