"use client";

import { useMemo, useEffect } from "react";
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
        nodesep: 100
    });

    nodes.forEach((node) => {
        // --- Robust Dynamic Size Estimation ---
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

            // Height Estimation
            const textWidth = width - 40; // padding
            const charsPerLine = textWidth / 9;
            const wrappedLines = Math.ceil(charCount / charsPerLine);
            const explicitLines = text.split("\n").length;
            const totalLines = Math.max(wrappedLines, explicitLines);

            height = Math.max(BASE_HEIGHT, 50 + (totalLines * 24));
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

function MindMapContent({ root }: { root: BraceNode }) {
    const { fitView, getNodes } = useReactFlow();

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => flattenTree(root), [root]);
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => getLayoutedElements(initialNodes, initialEdges), [initialNodes, initialEdges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

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

    useEffect(() => {
        window.requestAnimationFrame(() => fitView());
    }, [nodes, fitView]);

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

            <Panel position="top-right">
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
        </ReactFlow>
    );
}

/* ==================== WRAPPER ==================== */

export default function MindMap({ root }: { root: BraceNode }) {
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
                <MindMapContent root={root} />
            </ReactFlowProvider>
        </div>
    );
}
