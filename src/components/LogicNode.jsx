import { memo } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import { GitBranch, AlertTriangle } from "lucide-react";
import { useLoreStore } from "../store";

function LogicNode({ id, data, selected }) {
  console.log(`Logic Node Rendered:  ${data.conditions[0].check_flag}`);

  const accentColor = data.color || "#f97316";
  const conditions = data.conditions || [];

  // Expose React Flow's internal state managers for track selection
  const { getNodes, getEdges, setNodes } = useReactFlow();

  // ── LAZY VALIDATION SENSOR LAYER ──
  // Previously this selected the WHOLE edges array for the active graph,
  // which meant any edge change anywhere re-rendered every LogicNode.
  //
  // The first fix attempt selected a plain object `{ hasTrueBranch,
  // hasFalseBranch }` with a `shallow` equality function - but a bare
  // `create()` store (unlike `createWithEqualityFn`) ignores that second
  // argument entirely. Zustand v4+ is built on useSyncExternalStore,
  // which re-invokes the selector to verify the snapshot is stable; since
  // a NEW object was returned every single call, it never looked stable,
  // and React hit its update-depth limit.
  //
  // The fix: select two independent PRIMITIVES instead of one object.
  // Booleans compare correctly with Object.is with zero extra machinery,
  // so each hook call independently bails out when its own value hasn't
  // changed - no equality function, no useShallow import, no version
  // concerns.
  const hasTrueBranch = useLoreStore((state) =>
    (state.graphs[state.activeGraph]?.edges || []).some(
      (e) => e.source === id && e.sourceHandle === "true",
    ),
  );
  const hasFalseBranch = useLoreStore((state) =>
    (state.graphs[state.activeGraph]?.edges || []).some(
      (e) => e.source === id && e.sourceHandle === "false",
    ),
  );

  const isIncomplete = !hasTrueBranch || !hasFalseBranch;

  const previewText =
    conditions.length > 0 ? conditions[0].check_flag || "Unset" : "No Logic";

  // ── BOOLEAN TRACK SELECTION ──
  // Performs a downstream BFS trace to isolate and toggle a specific branch pathway
  const toggleTrackSelection = (e, trackHandle) => {
    e.stopPropagation();
    const currentEdges = getEdges();
    const currentNodes = getNodes();

    const trackNodeIds = new Set();
    const queue = [];

    // Seed the queue with the immediate children attached to the clicked handle
    currentEdges
      .filter((edge) => edge.source === id && edge.sourceHandle === trackHandle)
      .forEach((edge) => queue.push(edge.target));

    // Traverse all downstream routes
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!trackNodeIds.has(currentId)) {
        trackNodeIds.add(currentId);
        currentEdges
          .filter((edge) => edge.source === currentId)
          .forEach((edge) => queue.push(edge.target));
      }
    }

    if (trackNodeIds.size === 0) return;

    // Check boolean state: Are ALL downstream nodes in this track currently selected?
    const trackNodes = currentNodes.filter((n) => trackNodeIds.has(n.id));
    const allSelected = trackNodes.every((n) => n.selected);

    // Flip the selection state for the isolated track
    setNodes((nds) =>
      nds.map((node) => {
        if (trackNodeIds.has(node.id)) {
          return { ...node, selected: !allSelected };
        }
        return node;
      }),
    );
  };

  return (
    <div
      className={`w-32 h-32 flex items-center justify-center relative rounded-2xl transition-all duration-300 ${
        selected ? "scale-[1.05]" : "hover:scale-[1.02]"
      }`}
    >
      {/* 1. The Diamond Shape Background (Glow Fixed) */}
      <div
        style={{
          borderColor: isIncomplete ? "#ef4444" : accentColor,
          backgroundColor: isIncomplete ? "#fff5f5" : `${accentColor}15`,
          // The glow is applied directly to the rotated diamond, replacing Tailwind's square ring
          boxShadow: selected
            ? `0 0 0 4px ${isIncomplete ? "#fee2e2" : accentColor}4D, 0 10px 30px ${isIncomplete ? "#ef4444" : accentColor}66`
            : "0 2px 5px rgba(0,0,0,0.1)",
        }}
        className="absolute inset-0 rotate-45 rounded-md border-2 transition-all duration-300"
      />

      {/* ── FLOATING ERROR INDICATOR BADGE ── */}
      {isIncomplete && (
        <div
          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-lg z-30 animate-pulse border border-white"
          title="Missing output connection! Ensure both TRUE and FALSE handles are wired to downstream nodes."
        >
          <AlertTriangle size={10} />
        </div>
      )}

      {/* 2. Content Area */}
      <div className="relative z-10 flex flex-col items-center text-center p-3 pointer-events-none">
        <div
          className="p-1.5 rounded-full mb-1 shadow-sm border border-white/50"
          style={{
            backgroundColor: isIncomplete ? "#fee2e2" : `${accentColor}30`,
          }}
        >
          <GitBranch
            size={14}
            style={{ color: isIncomplete ? "#ef4444" : accentColor }}
          />
        </div>

        <span
          className={`text-[9px] font-black uppercase tracking-widest mb-1 leading-none ${
            isIncomplete ? "text-red-500" : "text-gray-500"
          }`}
        >
          {data.logicalOperator || "AND"} CHECK
        </span>

        {/* The "Sticker" for actual data */}
        <div
          className={`px-2 py-1 bg-white border rounded shadow-sm min-w-[70px] ${
            isIncomplete ? "border-red-200" : "border-gray-100"
          }`}
        >
          <p className="text-[10px] font-bold text-gray-800 truncate max-w-[80px] leading-tight">
            {previewText}
          </p>
          {conditions.length > 1 ? (
            <p className="text-[8px] font-black text-gray-400 uppercase">
              +{conditions.length - 1} more
            </p>
          ) : (
            <p
              className="text-[8px] font-black uppercase leading-none"
              style={{ color: isIncomplete ? "#ef4444" : accentColor }}
            >
              {conditions[0]?.operator || "=="}{" "}
              {String(conditions[0]?.value ?? "true")}
            </p>
          )}
        </div>
      </div>

      {/* 3. Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          backgroundColor: isIncomplete ? "#ef4444" : accentColor,
          width: "16px",
          height: "16px",
          top: "4px",
        }}
        className="z-20 border-4 border-white shadow-md hover:scale-125 transition-transform"
      />

      {/* Interactive True Handle */}
      <Handle
        type="source"
        position={Position.Left}
        id="true"
        onClick={(e) => toggleTrackSelection(e, "true")}
        title="Click to select/deselect the entire TRUE pathway"
        style={{
          background: "#22c55e",
          width: "16px",
          height: "16px",
          left: "4px",
          cursor: "pointer",
        }}
        className="z-20 border-4 border-white shadow-md hover:scale-125 transition-transform"
      />

      {/* Interactive False Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        onClick={(e) => toggleTrackSelection(e, "false")}
        title="Click to select/deselect the entire FALSE pathway"
        style={{
          background: "#ef4444",
          width: "16px",
          height: "16px",
          right: "4px",
          cursor: "pointer",
        }}
        className="z-20 border-4 border-white shadow-md hover:scale-125 transition-transform"
      />
    </div>
  );
}

export default memo(LogicNode);