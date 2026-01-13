"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../context/AppContext";
import MindMap from "../components/flow/MindMap";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
    const {
        panels,
        selectedPanelId,
        setSelectedPanelId,
        maps,
        setMapForPanel,
        user,
        isLoading: authLoading,
        session,
        history,
        fetchHistory,
        idea,
        currentProjectId,
        setCurrentProjectId,
        setIdea,
        setPanels,
        resetProject,
        logout
    } = useAppContext();
    const [viewStatus, setViewStatus] = useState<'landing' | 'overview' | 'canvas'>('landing');
    const [isMapLoading, setIsMapLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !session) {
            router.push("/credentials");
        }
    }, [authLoading, session, router]);

    useEffect(() => {
        if (panels.length > 0 && viewStatus === 'landing') {
            setViewStatus('overview');
        } else if (panels.length === 0 && viewStatus !== 'landing') {
            setViewStatus('landing');
        }
    }, [panels, viewStatus]);

    useEffect(() => {
        if (panels.length > 0 && !selectedPanelId) {
            setSelectedPanelId(panels[0].id);
        }
    }, [panels, selectedPanelId, setSelectedPanelId]);

    const selectedPanel = panels.find(p => p.id === selectedPanelId);
    const currentMap = selectedPanelId ? maps[selectedPanelId] : null;

    useEffect(() => {
        async function fetchMap() {
            if (selectedPanelId && !maps[selectedPanelId] && !isMapLoading) {
                setIsMapLoading(true);
                const panel = panels.find(p => p.id === selectedPanelId);
                if (!panel) return;

                try {
                    const res = await fetch("/api/mindmaps/phase2", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ panel })
                    });
                    const data = await res.json();
                    setMapForPanel(selectedPanelId, data);

                    if (session?.user && currentProjectId) {
                        const updatedMaps = { ...maps, [selectedPanelId]: data };
                        await supabase
                            .from('projects')
                            .update({ maps: updatedMaps })
                            .eq('id', currentProjectId);

                        fetchHistory();
                    }
                } catch (error) {
                    console.error("Failed to fetch map", error);
                } finally {
                    setIsMapLoading(false);
                }
            }
        }
        fetchMap();
    }, [selectedPanelId, maps, panels, setMapForPanel, session, idea, fetchHistory]);

    const handleHistoryClick = (item: any) => {
        setIdea(item.idea);
        setPanels(item.panels);
        setCurrentProjectId(item.id);
        Object.entries(item.maps).forEach(([panelId, mapData]) => {
            setMapForPanel(panelId, mapData);
        });
        if (item.panels.length > 0) {
            setSelectedPanelId(item.panels[0].id);
        }
        setViewStatus('overview');
    };

    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // 1. LANDING VIEW (Projects Grid)
    if (viewStatus === 'landing') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
                {/* Animated Blobs */}
                <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-0 right-4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <header className="border-b border-white/50 backdrop-blur-sm bg-white/30">
                        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-8">
                                {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">BM</div> */}
                                <span className="text-xl font-bold text-gray-900">BraceMaps</span>
                            </Link>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:block text-right">
                                    <div className="text-sm font-semibold text-gray-900">{user?.name}</div>
                                    <div className="text-xs text-gray-600">{user?.email}</div>
                                </div>
                                <button onClick={logout} className="p-2.5 rounded-xl hover:bg-white/50 text-gray-600 hover:text-red-600 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="container mx-auto  px-6 py-12">
                        <div className="max-w-6xl mx-auto space-y-12 fade-in">
                            {/* Page Header */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-10 ">Your Roadmaps</h1>
                                    <p className="text-xs text-gray-600">Continue where you left off or start fresh</p>
                                </div>
                                <button
                                    onClick={() => { resetProject(); router.push("/prompt"); }}
                                    className="btn-primary"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create New Roadmap
                                </button>
                            </div>

                            {/* Projects Grid */}
                            {history.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {history.map((project, i) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleHistoryClick(project)}
                                            className="group relative bg-white p-8 rounded-3xl border-2 border-gray-200 shadow-xl hover:border-purple-500 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col h-72 overflow-hidden scale-in"
                                            style={{ animationDelay: `${i * 100}ms` }}
                                        >
                                            {/* Gradient Overlay */}
                                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-700"></div>

                                            {/* Badge */}
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-4 w-fit">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                                </svg>
                                                {Object.keys(project.maps || {}).length} Maps
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 line-clamp-3 leading-tight transition-colors mb-4 flex-1">
                                                {project.idea}
                                            </h3>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300 p-20 text-center">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No roadmaps yet</h3>
                                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Start by creating your first roadmap to see it here</p>
                                    <button
                                        onClick={() => { resetProject(); router.push("/prompt"); }}
                                        className="btn-primary"
                                    >
                                        Create Your First Roadmap
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>
                </div >

                <style jsx>{`
                    @keyframes blob {
                        0%, 100% { transform: translate(0px, 0px) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                    }
                    .animate-blob { animation: blob 7s infinite; }
                    .animation-delay-2000 { animation-delay: 2s; }
                `}</style>
            </div >
        );
    }

    // 2. OVERVIEW VIEW (Simplified version to stay within limits)
    if (viewStatus === 'overview') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <header className="border-b border-white/50 backdrop-blur-sm bg-white/30 sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => { resetProject(); fetchHistory(); setViewStatus('landing'); }} className="p-2 rounded-xl hover:bg-white/50 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="font-bold text-xl">Project Overview</h2>
                        </div>
                        <button onClick={() => setViewStatus('canvas')} className="btn-primary">
                            Explore Mind Map
                        </button>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-12 max-w-5xl">
                    <div className="space-y-8 fade-in">
                        <div className="space-y-3 mb-12">
                            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">{idea}</h1>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                        </div>

                        {panels.map((panel, idx) => (
                            <div key={panel.id} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border-2 border-white/60 hover:border-purple-300 hover:shadow-2xl transition-all duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex gap-6 items-start">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-2xl font-bold text-gray-900">{panel.title}</h3>
                                            <button onClick={() => { setSelectedPanelId(panel.id); setViewStatus('canvas'); }} className="btn-primary flex-shrink-0 ml-4">
                                                Visualize Phase {idx + 1}
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed bg-white/50 p-6 rounded-2xl border border-gray-100">
                                            {panel.core_responsibility.split('\n').map((line, i) => (
                                                <p key={i} className="mb-2 last:mb-0">{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    // 3. CANVAS VIEW (continuing in next message due to length)
    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <button onClick={() => { resetProject(); fetchHistory(); setViewStatus('landing'); }} className="flex items-center gap-2 font-bold text-lg hover:text-blue-600 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">BM</div>
                        BraceMaps
                    </button>
                    <button onClick={logout} className="p-2 hover:bg-red-50 rounded-xl text-gray-600 hover:text-red-600 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    <button onClick={() => setViewStatus('overview')} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-bold border-2 border-blue-200 hover:bg-blue-100 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Overview
                    </button>

                    <div className="space-y-1">
                        <div className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phases</div>
                        {panels.map((panel) => (
                            <button key={panel.id} onClick={() => setSelectedPanelId(panel.id)} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedPanelId === panel.id ? "bg-blue-50 text-blue-700 font-semibold border-2 border-blue-200" : "hover:bg-gray-50"}`}>
                                <div className="font-medium truncate">{panel.title}</div>
                                <div className="text-xs text-gray-500 truncate">{panel.core_responsibility}</div>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl space-y-2 mt-6">
                        <div className="text-xs font-bold text-gray-500 uppercase">Active Project</div>
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{idea}</h4>
                        <button onClick={() => { resetProject(); fetchHistory(); setViewStatus('landing'); }} className="text-xs text-blue-600 font-bold hover:underline">
                            Switch Project
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={() => { resetProject(); router.push("/prompt"); }} className="btn-secondary w-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Roadmap
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col bg-white">
                <header className="h-16 border-b border-gray-200 flex items-center px-8">
                    <button onClick={() => setViewStatus('overview')} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-all mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="font-bold text-lg">{selectedPanel?.title || "Loading..."}</h2>
                    {isMapLoading && (
                        <div className="ml-4 flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                        </div>
                    )}
                </header>

                <div className="flex-1 relative">
                    {currentMap ? (
                        <MindMap key={selectedPanelId} root={currentMap.panel.root} />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">Generating Mind Map</p>
                                    <p className="text-sm text-gray-600">Building {selectedPanel?.title}...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
