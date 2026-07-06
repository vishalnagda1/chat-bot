"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "trigger",
    position: { x: 250, y: 50 },
    data: { label: "User Message", type: "webchat" },
  },
  {
    id: "2",
    type: "llm",
    position: { x: 250, y: 200 },
    data: { label: "Claude AI", model: "claude-sonnet-5-20250514" },
  },
  {
    id: "3",
    type: "response",
    position: { x: 250, y: 350 },
    data: { label: "Send Response" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

const nodeTypes = {
  trigger: TriggerNode,
  llm: LLMNode,
  response: ResponseNode,
  tool: ToolNode,
};

function TriggerNode({ data }: { data: { label: string; type: string } }) {
  return (
    <div className="bg-blue-100 border-2 border-blue-500 rounded-lg px-4 py-2 min-w-[150px]">
      <div className="text-xs text-blue-600 font-medium">Trigger</div>
      <div className="font-semibold">{data.label}</div>
      <div className="text-xs text-gray-500">{data.type}</div>
    </div>
  );
}

function LLMNode({ data }: { data: { label: string; model: string } }) {
  return (
    <div className="bg-purple-100 border-2 border-purple-500 rounded-lg px-4 py-2 min-w-[150px]">
      <div className="text-xs text-purple-600 font-medium">AI Model</div>
      <div className="font-semibold">{data.label}</div>
      <div className="text-xs text-gray-500">{data.model}</div>
    </div>
  );
}

function ResponseNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-green-100 border-2 border-green-500 rounded-lg px-4 py-2 min-w-[150px]">
      <div className="text-xs text-green-600 font-medium">Response</div>
      <div className="font-semibold">{data.label}</div>
    </div>
  );
}

function ToolNode({ data }: { data: { label: string; toolType: string } }) {
  return (
    <div className="bg-orange-100 border-2 border-orange-500 rounded-lg px-4 py-2 min-w-[150px]">
      <div className="text-xs text-orange-600 font-medium">Tool</div>
      <div className="font-semibold">{data.label}</div>
      <div className="text-xs text-gray-500">{data.toolType}</div>
    </div>
  );
}

export default function Builder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showToolPanel, setShowToolPanel] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNode = (type: string, label: string) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type,
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: { label, type },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowToolPanel(false);
  };

  const saveFlow = () => {
    const flow = { nodes, edges };
    console.log("Saving flow:", flow);
    // In production, save to API
    alert("Flow saved!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-600 hover:text-gray-800">
            ← Back
          </a>
          <h1 className="font-semibold">Flow Builder</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowToolPanel(!showToolPanel)}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-200"
          >
            + Add Node
          </button>
          <button
            onClick={saveFlow}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={16} />
          </ReactFlow>
        </div>

        {showToolPanel && (
          <div className="w-64 bg-white border-l p-4">
            <h3 className="font-semibold mb-4">Add Node</h3>
            <div className="space-y-2">
              <button
                onClick={() => addNode("trigger", "User Message")}
                className="w-full text-left p-3 bg-blue-50 rounded hover:bg-blue-100"
              >
                <div className="font-medium">Trigger</div>
                <div className="text-xs text-gray-500">Start of conversation</div>
              </button>
              <button
                onClick={() => addNode("llm", "Claude AI")}
                className="w-full text-left p-3 bg-purple-50 rounded hover:bg-purple-100"
              >
                <div className="font-medium">AI Model</div>
                <div className="text-xs text-gray-500">Process with LLM</div>
              </button>
              <button
                onClick={() => addNode("tool", "API Call")}
                className="w-full text-left p-3 bg-orange-50 rounded hover:bg-orange-100"
              >
                <div className="font-medium">API Call</div>
                <div className="text-xs text-gray-500">Call external API</div>
              </button>
              <button
                onClick={() => addNode("tool", "Database Query")}
                className="w-full text-left p-3 bg-orange-50 rounded hover:bg-orange-100"
              >
                <div className="font-medium">Database</div>
                <div className="text-xs text-gray-500">Query database</div>
              </button>
              <button
                onClick={() => addNode("tool", "Send Email")}
                className="w-full text-left p-3 bg-orange-50 rounded hover:bg-orange-100"
              >
                <div className="font-medium">Email</div>
                <div className="text-xs text-gray-500">Send email</div>
              </button>
              <button
                onClick={() => addNode("response", "Send Response")}
                className="w-full text-left p-3 bg-green-50 rounded hover:bg-green-100"
              >
                <div className="font-medium">Response</div>
                <div className="text-xs text-gray-500">Send reply to user</div>
              </button>
            </div>
          </div>
        )}

        {selectedNode && !showToolPanel && (
          <div className="w-80 bg-white border-l p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Node Properties</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label as string}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      )
                    );
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              {selectedNode.type === "llm" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={selectedNode.data.model as string}
                    onChange={(e) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, model: e.target.value } }
                            : n
                        )
                      );
                    }}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="claude-sonnet-5-20250514">Claude Sonnet</option>
                    <option value="claude-opus-4-20250514">Claude Opus</option>
                    <option value="claude-haiku-4-20250514">Claude Haiku</option>
                  </select>
                </div>
              )}
              <button
                onClick={() => {
                  setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                  setEdges((eds) =>
                    eds.filter(
                      (e) =>
                        e.source !== selectedNode.id &&
                        e.target !== selectedNode.id
                    )
                  );
                  setSelectedNode(null);
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
