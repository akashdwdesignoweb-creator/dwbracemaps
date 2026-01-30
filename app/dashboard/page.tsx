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
        costing,
        setCosting,
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

    // QUEUE PROCESSOR: Sequentially generate assets for panels
    useEffect(() => {
        async function processQueue() {
            // If already loading or no auth, skip
            if (isMapLoading || !session?.user || !currentProjectId) return;

            // Find the first panel that doesn't have a map
            const pendingPanel = panels.find(p => !maps[p.id]);

            if (pendingPanel) {
                setIsMapLoading(true);
                try {
                    // 1. Generate Mind Map (Phase 2)
                    const resMap = await fetch("/api/mindmaps/phase2", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            idea: idea ?? "",
                            panel: pendingPanel,
                            allPanels: panels
                        })
                    });
                    const mapData = await resMap.json();

                    // Persist Map Immediately
                    let currentMaps = { ...maps, [pendingPanel.id]: mapData };
                    setMapForPanel(pendingPanel.id, mapData);

                    await supabase
                        .from('projects')
                        .update({ maps: currentMaps })
                        .eq('id', currentProjectId);

                    // 2. Generate Description (Phase 3) - Chained immediately
                    const resDesc = await fetch("/api/mindmaps/description", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ map: mapData.panel.root })
                    });
                    const { description } = await resDesc.json();

                    if (description) {
                        const describedMap = {
                            ...mapData,
                            panel: { ...mapData.panel, description }
                        };

                        // Update State & Persist Description
                        currentMaps = { ...currentMaps, [pendingPanel.id]: describedMap };
                        setMapForPanel(pendingPanel.id, describedMap);

                        await supabase
                            .from('projects')
                            .update({ maps: currentMaps })
                            .eq('id', currentProjectId);

                        // Update history to reflect changes in landing page immediately
                        fetchHistory();
                    }

                } catch (error) {
                    console.error(`Failed to process panel ${pendingPanel.id}`, error);
                } finally {
                    setIsMapLoading(false);
                }
            }

            // 3. Generate Costing (Phase 4) - When all maps are done and costing is missing
            const allMapsDone = panels.length > 0 && panels.every(p => maps[p.id]);
            if (allMapsDone && !costing && !isMapLoading) {
                setIsMapLoading(true);
                try {
                    const res = await fetch("/api/costing", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ idea, panels, maps })
                    });
                    const costingData = await res.json();
                    setCosting(costingData);

                    await supabase
                        .from('projects')
                        .update({ costing: costingData })
                        .eq('id', currentProjectId);

                    fetchHistory();
                } catch (error) {
                    console.error("Failed to generate costing", error);
                } finally {
                    setIsMapLoading(false);
                }
            }
        }

        processQueue();
    }, [panels, maps, isMapLoading, session, currentProjectId, setMapForPanel, fetchHistory, costing, setCosting, idea]);



    const handleHistoryClick = (item: any) => {
        setIdea(item.idea);
        setPanels(item.panels);
        setCurrentProjectId(item.id);
        Object.entries(item.maps).forEach(([panelId, mapData]) => {
            setMapForPanel(panelId, mapData);
        });
        setCosting(item.costing || null);
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
                                                {project.title || project.idea}
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
                            {/* Title logic from the selected project in history */}
                            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
                                {history.find(p => p.id === currentProjectId)?.title || idea}
                            </h1>
                            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                        </div>

                        {/* Costing Section */}
                        {costing && (
                            <div className="bg-white/90 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-blue-100 shadow-2xl space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 transition-all group-hover:bg-purple-50 group-hover:scale-110 duration-700"></div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4 uppercase tracking-wider">
                                            Resource Allocation & Estimations
                                        </div>
                                        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Development Roadmap</h2>
                                        <p className="text-gray-500 mt-2 font-medium">Estimated time to launch based on technical complexity</p>
                                    </div>
                                    <div className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
                                        <div className="text-center">
                                            <div className="text-4xl font-black text-blue-600">{costing.total_hours}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Hours</div>
                                        </div>
                                        <div className="h-10 w-px bg-gray-100"></div>
                                        <div className="text-center">
                                            <div className="text-4xl font-black text-purple-600">{costing.estimated_weeks}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Weeks</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                                    {Object.entries(costing.role_breakdown).map(([role, hours]) => (
                                        <div key={role} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 hover:border-blue-200 hover:bg-white hover:shadow-lg transition-all duration-300">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{role}</div>
                                            <div className="text-2xl font-bold text-gray-900">{hours as number} <span className="text-sm font-medium text-gray-400">hrs</span></div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        role === 'backend' ? 'bg-blue-500' : 
                                                        role === 'frontend' ? 'bg-purple-500' : 
                                                        role === 'qa' ? 'bg-pink-500' : 'bg-amber-500'
                                                    }`}
                                                    style={{ width: `${((hours as number) / costing.total_hours) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden relative z-10 shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Project Phase / Panel</th>
                                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Estimated Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {costing.panel_breakdown.map((pb: any) => (
                                                <tr key={pb.panel_id} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{pb.panel_title}</div>
                                                        <div className="flex gap-4 mt-2">
                                                            {Object.entries(pb.roles).map(([role, hours]) => (
                                                                <span key={role} className="text-[10px] font-bold text-gray-400 uppercase">
                                                                    {role.charAt(0)}: <span className="text-gray-600">{hours as number}h</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="font-black text-lg text-gray-900">{pb.total_hours}h</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gray-200"></div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Application Architecture</h3>
                            <div className="h-px flex-1 bg-gray-200"></div>
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
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2">
                            {history.find(p => p.id === currentProjectId)?.title || idea}
                        </h4>
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
                        <MindMap
                            key={selectedPanelId}
                            root={currentMap.panel.root}
                            title={selectedPanel?.title || "Mind Map"}
                            description={currentMap.panel.description}
                            onGenerateDescription={async () => { }} // No-op, handled automatically
                        />
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
