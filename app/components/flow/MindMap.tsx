"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    Panel,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    useReactFlow,
    MarkerType,
    getRectOfNodes
} from "reactflow";
import "reactflow/dist/style.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Import remark-gfm for tables
import { BraceNode } from "@/app/lib/braceMapSchema";
import { BRANCH_COLORS } from "@/app/lib/mapColors";
import dagre from "dagre";
import { exportMindMapToPdf } from "@/app/lib/pdfGenerator";

/* ==================== CONFIGURATION ==================== */

// Base values for estimation (CSS controls actual render)
const BASE_WIDTH = 200;
const BASE_HEIGHT = 60;
const MAX_WIDTH = 400;

/* ==================== LAYOUT HELPER ==================== */

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "LR") => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: 300, // Generous spacing to prevent overlap
        nodesep: 150  // Increased from 100 to provide more vertical breathing room
    });

    nodes.forEach((node) => {
        
        let width = BASE_WIDTH;
        let height = BASE_HEIGHT;

        if (node.data.label) {
            const text = node.data.label;
            const charCount = text.length;
            const hasNewlines = text.includes("\n");

            // Width Estimation (Approx 9px per char)
            let estimatedTextWidth = charCount * 9;
            if (hasNewlines) {
                const lines = text.split("\n");
                const maxLineChars = Math.max(...lines.map((l: string) => l.length));
                estimatedTextWidth = maxLineChars * 9;
            }
            // Clamp width
            width = Math.max(BASE_WIDTH, Math.min(estimatedTextWidth + 60, MAX_WIDTH));

            // Height Estimation - Optimized for PDF Wrapping
            const textWidth = width - 48; // matching PDF padding (24*2)
            const charsPerLine = Math.floor(textWidth / 8.5); // conservative char width
            const wrappedLines = Math.ceil(charCount / charsPerLine);
            const explicitLines = text.split("\n").length;
            const totalLines = Math.max(wrappedLines, explicitLines);

            // 24px per line + 64px padding (matching PDF buffer)
            height = Math.max(BASE_HEIGHT, 64 + (totalLines * 24));
        }

        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const { width, height } = dagreGraph.node(node.id);

        node.targetPosition = "left" as any;
        node.sourcePosition = "right" as any;

        node.position = {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
        };

        // Explicitly set dimensions for bounds calculation (used by PDF export)
        node.width = width;
        node.height = height;

        return node;
    });

    return { nodes: layoutedNodes, edges };
};

/* ==================== FLATTEN TREE ==================== */

function flattenTree(
    node: BraceNode,
    parentId: string | null = null,
    depth: number = 0,
    branchIndex: number = 0
): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const isRoot = depth === 0;
    const color = BRANCH_COLORS[branchIndex % BRANCH_COLORS.length];

    const label = node.label || "";
    // Align left if long, center if short/title
    const isLongContent = label.length > 50 || label.includes("\n") || label.includes("1.") || label.trim().startsWith("-");

    // Unified CSS Styling (Same shape for everyone)
    let style: React.CSSProperties = {
        padding: "16px 24px",
        fontSize: "15px",
        fontWeight: isRoot ? 700 : 500,
        backgroundColor: isRoot ? "#0f172a" : "#ffffff",
        border: `3px solid ${isRoot ? "#0f172a" : color}`,
        color: isRoot ? "#ffffff" : "#1e293b",
        fontFamily: "var(--font-sans)",
        lineHeight: "1.6",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        transition: "all 0.2s ease",

        // UNIFIED SHAPE
        borderRadius: "16px",
        width: "fit-content", // Allow dynamic growth
        minWidth: isRoot ? 200 : 180,
        maxWidth: MAX_WIDTH,
        height: "auto",

        // Alignment
        textAlign: isLongContent ? "left" : "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        whiteSpace: isLongContent ? "pre-wrap" : "normal",
        wordWrap: "break-word",
    };

    if (isRoot) {
        style.fontSize = "18px";
        style.minWidth = 220;
    }

    nodes.push({
        id: node.id,
        data: { label: node.label },
        position: { x: 0, y: 0 },
        style,
        type: "default",
    });

    if (parentId) {
        edges.push({
            id: `${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: "default",
            style: {
                stroke: color,
                strokeWidth: 3,
                opacity: 0.8
            },
            animated: false,
        });
    }

    if (node.children) {
        node.children.forEach((child, index) => {
            const newBranchIndex = isRoot ? index : branchIndex;
            const result = flattenTree(child, node.id, depth + 1, newBranchIndex);
            nodes.push(...result.nodes);
            edges.push(...result.edges);
        });
    }

    return { nodes, edges };
}

/* ==================== INNER COMPONENT ==================== */


function MindMapContent({ root, title, description, onGenerateDescription }: {
    root: BraceNode,
    title: string,
    description?: string,
    onGenerateDescription: () => Promise<void>
}) {

    const { fitView, getNodes } = useReactFlow();

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => flattenTree(root), [root]);
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => getLayoutedElements(initialNodes, initialEdges), [initialNodes, initialEdges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

    useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    const hasFittedRef = useRef<string | null>(null);

    const downloadPdf = () => {
        const nodes = getNodes();
        const currentEdges = edges;

        if (nodes.length === 0) return;

        try {
            exportMindMapToPdf(nodes, currentEdges);
        } catch (error) {
            console.error("Failed to download PDF", error);
            alert("Could not generate PDF. Please try again.");
        }
    };

    const handleViewDescription = async () => {
        if (description) {
            setIsDescriptionOpen(true);
        } else {
            setIsGeneratingDesc(true);
            await onGenerateDescription();
            setIsGeneratingDesc(false);
            setIsDescriptionOpen(true);
        }
    };

    useEffect(() => {
        if (nodes.length > 0 && hasFittedRef.current !== root.id) {
            window.requestAnimationFrame(() => {
                fitView({ duration: 800 });
                hasFittedRef.current = root.id;
            });
        }
    }, [nodes, fitView, root.id]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            minZoom={0.1}
            maxZoom={4}
            nodesDraggable={false}
            nodesConnectable={false}
        >
            <Background color="#e2e8f0" gap={24} size={1} />
            <Controls showInteractive={false} className="!bg-white !border-slate-200 !shadow-lg !rounded-xl overflow-hidden" />

            <Panel position="top-right" className="flex gap-3">
                <button
                    onClick={handleViewDescription}
                    disabled={isGeneratingDesc}
                    className="bg-white hover:bg-slate-50 text-slate-900 font-bold py-3 px-5 border border-slate-200 rounded-xl shadow-xl flex items-center gap-3 transition-all active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGeneratingDesc ? (
                        <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {isGeneratingDesc ? "Generating..." : "View Description"}
                </button>

                <button
                    onClick={downloadPdf}
                    className="bg-white hover:bg-slate-50 text-slate-900 font-bold py-3 px-5 border border-slate-200 rounded-xl shadow-xl flex items-center gap-3 transition-all active:scale-95 group"
                >
                    <svg className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                </button>
            </Panel>

            {/* Description Modal */}
            {isDescriptionOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative">
                        {/* Header */}
                        <div className="p-8 pb-4 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{title}</h2>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Map Overview</p>
                            </div>
                            <button
                                onClick={() => setIsDescriptionOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-6 overflow-y-auto">
                            <div className="prose prose-lg prose-slate max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{description || "No description available."}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsDescriptionOpen(false)}
                                className="btn-primary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ReactFlow>
    );
}

/* ==================== WRAPPER ==================== */

export default function MindMap({ root, title, description, onGenerateDescription }: {
    root: BraceNode,
    title: string,
    description?: string,
    onGenerateDescription: () => Promise<void>
}) {
    if (!root) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium text-sm">Generating visualization...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: "100%", width: "100%" }}>
            <ReactFlowProvider>
                <MindMapContent
                    root={root}
                    title={title}
                    description={description}
                    onGenerateDescription={onGenerateDescription}
                />
            </ReactFlowProvider>
        </div>
    );
}
