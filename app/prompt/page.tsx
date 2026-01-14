"use client";

import { useState, useEffect, useRef } from "react";
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

    // References State
    interface Reference {
        type: 'url' | 'file';
        content: string; // URL string or File content
        name: string;
    }
    const [references, setReferences] = useState<Reference[]>([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!authLoading && !session) {
            router.push("/credentials");
        }
    }, [authLoading, session, router]);

    useEffect(() => {
        setCharCount(localIdea.length);
    }, [localIdea]);

    // STT Logic
    const toggleListening = () => {
        if (isListening) {
            try {
                recognitionRef.current?.stop();
            } catch (e) {
                console.warn("Could not stop recognition", e);
            }
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Try Chrome/Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognitionRef.current = recognition;

        let initialText = localIdea; // Capture text when starting

        recognition.onstart = () => {
            setIsListening(true);
            initialText = localIdea; // Ensure we have the latest
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'aborted') {
                return; // Ignore user-initiated aborts
            }
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
                fullTranscript += event.results[i][0].transcript;
            }

            // Append to initial text
            setLocalIdea((initialText ? initialText + " " : "") + fullTranscript);
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start recognition", e);
        }
    };

    // Reference Logic
    const addReference = (type: 'url' | 'file', content: string, name: string) => {
        setReferences(prev => [...prev, { type, content, name }]);
    };

    const removeReference = (index: number) => {
        setReferences(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            for (const file of files) {
                // Determine reader based on file? For now text only
                const text = await file.text();
                addReference('file', text, file.name);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);

        try {
            setIdea(localIdea);
            const res = await fetch("/api/mindmaps/phase1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea: localIdea, references })
            });
            const data = await res.json();
            const generatedPanels = data.panels || [];
            const generatedTitle = data.title || localIdea.substring(0, 50); // Fallback

            setPanels(generatedPanels);

            // Create Project in Supabase
            if (session?.user) {
                const { data: project, error } = await supabase
                    .from('projects')
                    .insert({
                        user_id: session.user.id,
                        idea: localIdea,
                        title: generatedTitle,
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
                        {/* Voice Input Trigger - Prominent */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-md ${isListening
                                    ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200"
                                    : "bg-white text-gray-700 hover:text-blue-600 hover:bg-blue-50 border border-gray-200"
                                    }`}
                            >
                                <svg className={`w-5 h-5 ${isListening ? "animate-bounce" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                {isListening ? "Listening... (Speak Now)" : "Record with Voice"}
                            </button>
                        </div>

                        <div className="relative group">
                            <textarea
                                required
                                rows={6}
                                placeholder="Example: I want to build a sustainable urban garden project that uses IoT sensors for automated watering, soil monitoring, and predictive analytics to optimize crop yields..."
                                className="w-full p-8 text-lg rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl transition-all duration-300 outline-none resize-none focus:border-purple-400 focus:shadow-2xl focus:bg-white placeholder:text-gray-400 pr-16"
                                value={localIdea}
                                onChange={(e) => setLocalIdea(e.target.value)}
                            />

                            {/* Character Count */}
                            <div className="absolute bottom-6 right-8 text-sm font-semibold text-gray-400">
                                {charCount} characters
                            </div>
                        </div>

                        {/* References Section */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100 space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Attach References
                            </h3>

                            {/* Input Area */}
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* URL Input */}
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="url"
                                        placeholder="Add a URL link..."
                                        className="flex-1 px-4 py-2Rounded-xl border border-gray-200 focus:border-purple-400 outline-none rounded-xl"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value;
                                                if (val.trim()) {
                                                    addReference('url', val, val);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                {/* File Input */}
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        multiple
                                        onChange={handleFileSelect}
                                        accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        Add File
                                    </label>
                                </div>
                            </div>

                            {/* Chips List */}
                            {references.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {references.map((ref, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100 max-w-full">
                                            <span className="truncate max-w-[200px]">{ref.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeReference(idx)}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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
