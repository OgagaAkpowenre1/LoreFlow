import React, { useState, useEffect, useMemo, memo } from "react";
import { useReactFlow } from "reactflow";
import { useLoreStore } from "../store";
import {
  Search,
  X,
  MessageSquare,
  GitBranch,
  Play,
  MoveRight,
  Tag,
  AlignLeft,
} from "lucide-react";

function SearchModal({ isOpen, onClose }) {
  const graphs = useLoreStore((s) => s.graphs);
  const activeGraph = useLoreStore((s) => s.activeGraph);
  const setEditingNode = useLoreStore((s) => s.setEditingNode);
  const setFocusedCollectionId = useLoreStore((s) => s.setFocusedCollectionId);
  const { setCenter } = useReactFlow();
  const [query, setQuery] = useState("");

  const nodes = graphs[activeGraph]?.nodes || [];

  // ── SEARCH ENGINE LOGIC ──
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();

    return nodes
      .map((node) => {
        let score = 0;
        const matchReasons = [];

        // 1. TITLE MATCH
        if (node.data?.title?.toLowerCase().includes(q)) {
          score += 10;
          matchReasons.push({ type: "title", label: "Title Match" });
        }

        // 2. DIALOGUE TEXT MATCH
        if (node.type === "scene" && node.data?.dialogueLines) {
          const matchingLines = node.data.dialogueLines.filter(
            (line) =>
              line.text?.toLowerCase().includes(q) ||
              line.speaker?.toLowerCase().includes(q),
          );
          if (matchingLines.length > 0) {
            score += 8;
            matchReasons.push({
              type: "text",
              label: `${matchingLines.length} Dialogue Match(es)`,
            });
          }
        }

        // 3. FLAG & VARIABLE MATCH
        let hasFlagMatch = false;
        if (node.type === "scene") {
          const inFlags = node.data?.flags?.some((f) =>
            f.key?.toLowerCase().includes(q),
          );
          const inChoices = node.data?.choices?.some((c) =>
            c.conditions?.some((cond) =>
              cond.check_flag?.toLowerCase().includes(q),
            ),
          );
          hasFlagMatch = inFlags || inChoices;
        } else if (node.type === "logic") {
          hasFlagMatch = node.data?.conditions?.some((c) =>
            c.check_flag?.toLowerCase().includes(q),
          );
        } else if (node.type === "switch") {
          hasFlagMatch = node.data?.check_flag?.toLowerCase().includes(q);
        }

        if (hasFlagMatch) {
          score += 9;
          matchReasons.push({ type: "flag", label: "Uses Flag/Variable" });
        }

        return { node, score, matchReasons };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score); // Highest relevance first
  }, [nodes, query]);

  // Handle Hotkey (Cmd/Ctrl + K to open, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectNode = (node) => {
    // If the node is inside a collection, drill down into that collection first
    if (node.parentId) {
      setFocusedCollectionId(node.parentId);
    }

    // Teleport camera and open inspector
    setCenter(node.position.x + 130, node.position.y + 100, {
      zoom: 1.2,
      duration: 600,
    });
    setEditingNode(node.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-gray-900/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <Search size={20} className="text-blue-500 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            className="flex-grow bg-transparent text-lg font-medium text-gray-800 outline-none placeholder-gray-400"
            placeholder="Search scenes, dialogue, or variables..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {results.length === 0 && query.trim() !== "" ? (
            <div className="text-center py-12 text-gray-400 text-sm font-bold uppercase tracking-widest">
              No matching nodes found.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-300 text-xs font-bold uppercase tracking-widest">
              Type to begin searching...
            </div>
          ) : (
            <div className="space-y-1">
              {results.map(({ node, matchReasons }) => {
                // Determine icon based on node type
                const Icon =
                  node.type === "scene"
                    ? MessageSquare
                    : node.type === "logic" || node.type === "switch"
                      ? GitBranch
                      : node.type === "jump"
                        ? MoveRight
                        : Play;

                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className="w-full flex items-center justify-between p-3 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all group text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-gray-100 group-hover:bg-blue-100 group-hover:text-blue-600 text-gray-500 rounded-lg shrink-0 transition-colors">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">
                          {node.data?.title || "Unnamed Node"}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                          ID: {node.id}
                        </p>
                      </div>
                    </div>

                    {/* Match Reason Tags */}
                    <div className="flex gap-1.5 shrink-0 pl-4">
                      {matchReasons.map((reason, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                            reason.type === "flag"
                              ? "bg-orange-100 text-orange-600"
                              : reason.type === "text"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {reason.type === "flag" && <Tag size={10} />}
                          {reason.type === "text" && <AlignLeft size={10} />}
                          {reason.label}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(SearchModal)