"use client";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";

import { convertMindMapToFlow } from "./utils";

export default function MindMapFlow({ map }: { map: any }) {
  if (!map) return null;

  const { nodes, edges } = convertMindMapToFlow(map.panel.root);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}
