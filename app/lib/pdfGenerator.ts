import { jsPDF } from "jspdf";
import { Node, Edge, getRectOfNodes } from "reactflow";

// Constants matching the UI
const EDGE_COLOR_DEFAULT = "#cbd5e1";

export const exportMindMapToPdf = (nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return;

    // 1. Calculate Bounds
    const bounds = getRectOfNodes(nodes);
    const PADDING = 50;
    const width = bounds.width + PADDING * 2;
    const height = bounds.height + PADDING * 2;

    // 2. Initialize PDF
    const orientation = width > height ? "l" : "p";
    const doc = new jsPDF({
        orientation,
        unit: "px",
        format: [width, height],
        hotfixes: ["px_scaling"]
    });

    // Determine font
    doc.setFont("helvetica");

    // Values to shift coordinates to (0,0) based on bounds
    const offsetX = bounds.x - PADDING;
    const offsetY = bounds.y - PADDING;

    // 3. Draw Edges (Bottom Layer)
    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        // Calculate connection points
        const sx = (sourceNode.position.x || 0) + (sourceNode.width || 0) - offsetX;
        const sy = (sourceNode.position.y || 0) + (sourceNode.height || 0) / 2 - offsetY;
        const tx = (targetNode.position.x || 0) - offsetX;
        const ty = (targetNode.position.y || 0) + (targetNode.height || 0) / 2 - offsetY;

        // Bezier Control Points
        const dist = Math.abs(tx - sx);
        const cp1x = sx + dist * 0.4;
        const cp1y = sy;
        const cp2x = tx - dist * 0.4;
        const cp2y = ty;

        // Draw Line
        const color = edge.style?.stroke || EDGE_COLOR_DEFAULT;
        doc.setDrawColor(color as string);
        doc.setLineWidth(edge.style?.strokeWidth ? Number(edge.style.strokeWidth) : 2);

        doc.lines([[cp1x - sx, cp1y - sy, cp2x - sx, cp2y - sy, tx - sx, ty - sy]], sx, sy, [1, 1]);
    });

    // 4. Draw Nodes (Top Layer)
    nodes.forEach(node => {
        const x = (node.position.x || 0) - offsetX;
        const y = (node.position.y || 0) - offsetY;
        let w = node.width || 0;
        let h = node.height || 0;

        // Colors
        const bgColor = node.style?.backgroundColor || node.style?.background || "#ffffff";
        let borderC = "#000000";

        const borderStyle = node.style?.border;
        if (typeof borderStyle === "string") {
            const parts = borderStyle.split(" ");
            if (parts.length === 3) borderC = parts[2];
        }

        const borderColor = node.style?.borderColor || borderC;

        doc.setFillColor(bgColor as string);
        doc.setDrawColor(borderColor as string);
        doc.setLineWidth(2);

        // Text PRE-CALCULATION
        doc.setTextColor(node.style?.color as string || "#000000");
        const fontSize = node.style?.fontSize ? parseInt(node.style.fontSize as string) : 12;
        doc.setFontSize(fontSize);

        const text = node.data.label || "";
        const align = node.style?.textAlign as "left" | "center" | "right" || "center";

        const maxWidth = w - 48; // padding
        const splitText = doc.splitTextToSize(text, maxWidth);

        // Check if text overflow height
        // AGGRESSIVE BUFFER: 1.5x line height and 60px padding
        const lineHeight = fontSize * 1.5;
        const blockHeight = splitText.length * lineHeight;

        // Dynamic Height Adjustment in PDF
        const minHeight = h;
        const requiredHeight = blockHeight + 60;
        if (requiredHeight > h) {
            h = requiredHeight;
        }

        // Shape
        const radius = node.style?.borderRadius === "9999px" ? h / 2 : 12; // Pill vs Rounded
        doc.roundedRect(x, y, w, h, radius, radius, "FD"); // Fill and Draw

        // Render Text
        const textX = align === "center" ? x + w / 2 : x + 24; // Center or Left padding

        // Text Y centering with careful baseline adj
        const textY = y + (h / 2) - (blockHeight / 2) + (lineHeight / 1.6);

        doc.text(splitText, textX, textY, { align: align === "left" ? "left" : "center" });
    });

    // 5. Save
    doc.save("architecture_map_vector.pdf");
};
