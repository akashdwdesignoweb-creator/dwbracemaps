"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserMetadata {
    name: string;
    email: string;
}

interface Panel {
    id: string;
    title: string;
    core_responsibility: string;
}

import { supabase } from "@/app/lib/supabase";
import { useEffect } from "react";

interface AppContextType {
    user: UserMetadata | null;
    setUser: (user: UserMetadata | null) => void;
    session: any;
    isLoading: boolean;
    idea: string;
    setIdea: (idea: string) => void;
    panels: Panel[];
    setPanels: (panels: Panel[]) => void;
    selectedPanelId: string | null;
    setSelectedPanelId: (id: string | null) => void;
    maps: Record<string, any>;
    setMapForPanel: (panelId: string, mapData: any) => void;
    currentProjectId: string | null;
    setCurrentProjectId: (id: string | null) => void;
    history: any[];
    fetchHistory: () => Promise<void>;
    resetProject: () => void;
    logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserMetadata | null>(null);
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [idea, setIdea] = useState("");
    const [panels, setPanels] = useState<Panel[]>([]);
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
    const [maps, setMaps] = useState<Record<string, any>>({});
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setHistory(data);
        }
    };

    const resetProject = () => {
        setIdea("");
        setPanels([]);
        setMaps({});
        setCurrentProjectId(null);
        setSelectedPanelId(null);
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                setUser({
                    name: session.user.user_metadata.full_name || "User",
                    email: session.user.email || ""
                });
                fetchHistory();
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                setUser({
                    name: session.user.user_metadata.full_name || "User",
                    email: session.user.email || ""
                });
                fetchHistory();
            } else {
                setUser(null);
                setHistory([]);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        resetProject();
    };

    const setMapForPanel = (panelId: string, mapData: any) => {
        setMaps((prev) => ({ ...prev, [panelId]: mapData }));
    };

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                session,
                isLoading,
                idea,
                setIdea,
                panels,
                setPanels,
                selectedPanelId,
                setSelectedPanelId,
                maps,
                setMapForPanel,
                currentProjectId,
                setCurrentProjectId,
                history,
                fetchHistory,
                resetProject,
                logout
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
}
