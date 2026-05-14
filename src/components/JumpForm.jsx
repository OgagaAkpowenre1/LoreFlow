import { useLoreStore } from "../store";

export default function JumpForm({ node }) {
  const { graphs, activeGraph, updateNodeData } = useLoreStore();

  // Get all graph names EXCEPT the one we are currently in
  const availableGraphs = Object.keys(graphs).filter(
    (name) => name !== activeGraph,
  );

  // ── GUARD CLAUSE ──
  // If the node hasn't loaded yet, return null to prevent the crash
  if (!node || !node.data) return null;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">
          Destination Graph
        </label>
        <select
          value={node.data.targetGraph || ""}
          onChange={(e) =>
            updateNodeData(node.id, {
              ...node.data,
              targetGraph: e.target.value,
            })
          }
          className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Choose a conversation...</option>
          {availableGraphs.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed italic px-1">
        When the player reaches this point, the game will seamlessly transition
        to the start of the selected conversation.
      </p>
    </div>
  );
}
