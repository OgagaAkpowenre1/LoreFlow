import React, { useState, useEffect, useRef } from "react";
import { useLoreStore } from "../store";
import {
  X,
  Play,
  RefreshCw,
  Terminal,
  ListTree,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";

export default function Simulator() {
  const isSimulatorOpen = useLoreStore((s) => s.isSimulatorOpen);
  const toggleSimulator = useLoreStore((s) => s.toggleSimulator);
  const graphs = useLoreStore((s) => s.graphs);
  const lists = useLoreStore((s) => s.lists);
  const listMetadata = useLoreStore((s) => s.listMetadata);
  const conversationRegistry = useLoreStore((s) => s.conversationRegistry);

  // ── SANDBOX STATE (The Emulator Memory) ──
  const [sandboxState, setSandboxState] = useState({});
  const [collapsedCats, setCollapsedCats] = useState({});

  // ── SIMULATION ENGINE STATE ──
  const [playMode, setPlayMode] = useState("graph"); // 'graph' or 'npc'
  const [selectedTarget, setSelectedTarget] = useState("");
  const [currentNode, setCurrentNode] = useState(null);
  const [currentGraph, setCurrentGraph] = useState("");
  const [log, setLog] = useState([]);

  // ── UI TOGGLES & REFS ──
  const [logMinimized, setLogMinimized] = useState(false);
  const logEndRef = useRef(null);

  // Initialize Sandbox State from ALL variable lists globally
  useEffect(() => {
    if (isSimulatorOpen) {
      const initialState = {};
      Object.keys(listMetadata).forEach((listKey) => {
        if (listMetadata[listKey] === "variable") {
          const vars = lists[listKey] || [];
          vars.forEach((v) => {
            initialState[v.name] = v.defaultValue;
          });
        }
      });

      setSandboxState(initialState);
      setLog([
        {
          type: "system",
          text: "Engine initialized. Global Sandbox state loaded.",
        },
      ]);
      setCurrentNode(null);
      setCurrentGraph("");
      setLogMinimized(false);
    }
  }, [isSimulatorOpen, lists, listMetadata]);

  // Auto-scroll execution log whenever a new line is added
  useEffect(() => {
    if (!logMinimized && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [log, logMinimized]);

  if (!isSimulatorOpen) return null;

  const addLog = (text, type = "info") => {
    setLog((prev) => [...prev, { type, text }]);
  };

  const hasError = log.some((l) => l.type === "error");

  // ── THE TRAVERSAL BRAIN (Logic Evaluator) ──
  const evaluateCondition = (op, checkValue, targetValue) => {
    switch (op) {
      case "==":
        return checkValue == targetValue;
      case "!=":
        return checkValue != targetValue;
      case ">":
        return Number(checkValue) > Number(targetValue);
      case "<":
        return Number(checkValue) < Number(targetValue);
      case ">=":
        return Number(checkValue) >= Number(targetValue);
      case "<=":
        return Number(checkValue) <= Number(targetValue);
      default:
        return false;
    }
  };

  // const getNextNodeId = (nodeId, graphName, sourceHandle = null) => {
  //   const edges = graphs[graphName].edges;
  //   const edge = edges.find(
  //     (e) =>
  //       e.source === nodeId &&
  //       (!sourceHandle ||
  //         e.sourceHandle === sourceHandle ||
  //         (sourceHandle === "next" && !e.sourceHandle)),
  //   );
  //   // Fallback to default output if a specific branch isn't found
  //   if (!edge && sourceHandle) {
  //     const fallbackEdge = edges.find(
  //       (e) => e.source === nodeId && e.sourceHandle === "default-output",
  //     );
  //     return fallbackEdge ? fallbackEdge.target : null;
  //   }
  //   return edge ? edge.target : null;
  // };

  // Recursive step function - runs instantly through logic/switch nodes until it hits a scene

  const getNextNodeId = (nodeId, graphName, sourceHandle = null) => {
    const edges = graphs[graphName].edges;

    const edge = edges.find((e) => {
      if (e.source !== nodeId) return false;
      // If we didn't specify a handle at all (null), grab the first available edge
      if (sourceHandle === null) return true;
      // Exact match for choices or switch branches (this now respects empty strings!)
      if (e.sourceHandle === sourceHandle) return true;
      // Handle "next" generic continuations
      if (
        sourceHandle === "next" &&
        (!e.sourceHandle || e.sourceHandle === "default-output")
      )
        return true;
      return false;
    });

    // Fallback to default-output if a specific branch isn't found
    // We check !== null instead of falsy so "" empty strings correctly trigger the fallback
    if (!edge && sourceHandle !== null) {
      const fallbackEdge = edges.find(
        (e) => e.source === nodeId && e.sourceHandle === "default-output",
      );
      return fallbackEdge ? fallbackEdge.target : null;
    }

    return edge ? edge.target : null;
  };

  const stepToNode = (nodeId, graphName) => {
    if (!nodeId) {
      addLog("End of graph reached.", "system");
      setCurrentNode(null);
      return;
    }

    const node = graphs[graphName].nodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (node.type === "scene") {
      setCurrentNode(node);
      setCurrentGraph(graphName);
      addLog(`Entered Scene: ${node.data?.title || "Unnamed"}`, "scene");
      return; // Pause execution for user interaction
    }

    if (node.type === "logic") {
      addLog("Evaluating Logic Gate...", "system");
      const cond = node.data?.conditions?.[0];
      let isTrue = false;
      if (cond) {
        const val = sandboxState[cond.check_flag];
        isTrue = evaluateCondition(cond.operator, val, cond.value);
        addLog(
          `Condition (${cond.check_flag} ${cond.operator} ${cond.value}) evaluated to ${isTrue}`,
          "system",
        );
      }
      const nextId = getNextNodeId(
        node.id,
        graphName,
        isTrue ? "true" : "false",
      );
      stepToNode(nextId, graphName);
    }

    // if (node.type === "switch") {
    //   const varName = node.data?.check_flag;
    //   const currentValue = sandboxState[varName];
    //   addLog(
    //     `Evaluating Switch Node for [${varName}]. Current value: ${currentValue}`,
    //     "system",
    //   );
    //   const nextId = getNextNodeId(node.id, graphName, String(currentValue));
    //   stepToNode(nextId, graphName);
    // }

    if (node.type === "switch") {
      const varName = node.data?.check_flag;
      // Safely coalesce undefined states to empty strings
      const currentValue = sandboxState[varName] ?? "";
      addLog(
        `Evaluating Switch Node for [${varName}]. Current value: "${currentValue}"`,
        "system",
      );
      const nextId = getNextNodeId(node.id, graphName, String(currentValue));
      stepToNode(nextId, graphName);
    }

    if (node.type === "jump") {
      const targetG = node.data?.targetGraph;
      addLog(`Jumping to graph: ${targetG}`, "system");
      if (targetG && graphs[targetG]) {
        const startNode = graphs[targetG].nodes.find((n) => n.type === "start");
        const nextId = startNode ? getNextNodeId(startNode.id, targetG) : null;
        stepToNode(nextId, targetG);
      } else {
        addLog(`Jump target graph not found.`, "error");
        setCurrentNode(null);
      }
    }
  };

  const handlePlay = () => {
    if (!selectedTarget) return;
    setLogMinimized(false);

    if (playMode === "graph") {
      const g = graphs[selectedTarget];
      const startNode = g.nodes.find((n) => n.type === "start");
      addLog(`Starting Graph: ${selectedTarget}`, "system");
      if (!startNode) {
        addLog("No Start Node found in graph.", "error");
        return;
      }
      const nextId = getNextNodeId(startNode.id, selectedTarget);
      stepToNode(nextId, selectedTarget);
    } else if (playMode === "npc") {
      const rules = [...(conversationRegistry[selectedTarget] || [])].sort(
        (a, b) => b.priority - a.priority,
      );
      let matchedRule = null;

      addLog(`Pinging NPC: ${selectedTarget}`, "system");

      for (const rule of rules) {
        if (!rule.condition || !rule.condition.variable) {
          matchedRule = rule; // Fallback rule
          addLog(`Matched Fallback Rule (Priority ${rule.priority})`, "system");
          break;
        }
        const val = sandboxState[rule.condition.variable];
        if (evaluateCondition(rule.condition.op, val, rule.condition.value)) {
          matchedRule = rule;
          addLog(
            `Matched Rule: ${rule.condition.variable} ${rule.condition.op} ${rule.condition.value} (Priority ${rule.priority})`,
            "system",
          );
          break;
        }
      }

      if (matchedRule && matchedRule.graph && graphs[matchedRule.graph]) {
        const targetG = matchedRule.graph;
        const startNode = graphs[targetG].nodes.find((n) => n.type === "start");
        const nextId = startNode ? getNextNodeId(startNode.id, targetG) : null;
        stepToNode(nextId, targetG);
      } else {
        addLog("No valid routing logic found for this NPC.", "error");
      }
    }
  };

  // ── RENDER HELPERS ──
  const handleChoice = (choiceId) => {
    addLog("Player made a choice.", "system");
    const nextId = getNextNodeId(currentNode.id, currentGraph, choiceId);
    stepToNode(nextId, currentGraph);
  };

  const handleNext = () => {
    const nextId = getNextNodeId(currentNode.id, currentGraph, "next");
    stepToNode(nextId, currentGraph);
  };

  // Filter only lists that are strictly declared as variables
  const variableCategories = Object.keys(listMetadata).filter(
    (k) => listMetadata[k] === "variable",
  );

  return (
    <div className="fixed inset-0 z-[999] bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-gray-900 text-white px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Terminal size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-black uppercase tracking-widest text-sm">
                Engine Simulator
              </h2>
              <p className="text-[10px] text-gray-400 uppercase">
                Interactive Testing Environment
              </p>
            </div>
          </div>
          <button
            onClick={toggleSimulator}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-grow overflow-hidden min-h-0">
          {/* LEFT: SANDBOX STATE MANIPULATOR */}
          <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-3 bg-white border-b border-gray-200 shrink-0">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={14} className="text-blue-500" /> Sandbox State
              </h3>
              <p className="text-[9px] text-gray-500 mt-1">
                Changes here trigger logic instantly
              </p>
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {variableCategories.map((cat) => {
                const vars = lists[cat] || [];
                if (vars.length === 0) return null;
                const isCollapsed = collapsedCats[cat];

                return (
                  <div
                    key={cat}
                    className="space-y-2 border-b border-gray-100 pb-3 last:border-0"
                  >
                    <button
                      onClick={() =>
                        setCollapsedCats({
                          ...collapsedCats,
                          [cat]: !isCollapsed,
                        })
                      }
                      className="w-full flex items-center justify-between text-[10px] font-black text-blue-900 uppercase tracking-wider group hover:text-blue-600 transition-colors"
                    >
                      {cat}
                      {isCollapsed ? (
                        <ChevronRight
                          size={14}
                          className="text-gray-400 group-hover:text-blue-400"
                        />
                      ) : (
                        <ChevronDown
                          size={14}
                          className="text-gray-400 group-hover:text-blue-400"
                        />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-3 pt-1">
                        {vars.map((v) => (
                          <div
                            key={v.name}
                            className="space-y-1 bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
                          >
                            <label className="text-[9px] font-bold text-gray-500 uppercase flex justify-between">
                              <span>{v.name}</span>
                              <span className="text-blue-400">{v.type}</span>
                            </label>
                            {v.type === "boolean" ? (
                              <button
                                onClick={() =>
                                  setSandboxState({
                                    ...sandboxState,
                                    [v.name]: !sandboxState[v.name],
                                  })
                                }
                                className={`w-full py-1.5 rounded text-[10px] font-black uppercase transition-colors ${
                                  sandboxState[v.name]
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-300 text-gray-700"
                                }`}
                              >
                                {sandboxState[v.name] ? "TRUE" : "FALSE"}
                              </button>
                            ) : v.type === "string" &&
                              v.allowedValues?.length > 0 ? (
                              <select
                                value={sandboxState[v.name] || ""}
                                onChange={(e) =>
                                  setSandboxState({
                                    ...sandboxState,
                                    [v.name]: e.target.value,
                                  })
                                }
                                className="w-full text-[11px] p-1.5 border rounded outline-none bg-gray-50 font-bold focus:border-blue-400 focus:bg-white"
                              >
                                <option value="">(Empty)</option>
                                {v.allowedValues.map((val) => (
                                  <option key={val} value={val}>
                                    {val}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={v.type === "number" ? "number" : "text"}
                                value={sandboxState[v.name] ?? ""}
                                onChange={(e) =>
                                  setSandboxState({
                                    ...sandboxState,
                                    [v.name]:
                                      v.type === "number"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  })
                                }
                                className="w-full text-[11px] p-1.5 border rounded outline-none bg-gray-50 font-bold focus:border-blue-400 focus:bg-white"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* RIGHT: THE STAGE & CONSOLE */}
          <main className="flex-grow flex flex-col bg-gray-100 relative min-w-0">
            {/* Control Bar */}
            <div className="bg-white p-3 border-b flex gap-3 items-center shrink-0 shadow-sm z-10">
              <select
                value={playMode}
                onChange={(e) => {
                  setPlayMode(e.target.value);
                  setSelectedTarget("");
                  setCurrentNode(null);
                }}
                className="text-xs font-black uppercase bg-gray-100 p-2 rounded-lg outline-none cursor-pointer"
              >
                <option value="graph">Play Graph</option>
                <option value="npc">Talk to NPC</option>
              </select>

              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="flex-grow text-xs font-bold p-2 border border-gray-200 rounded-lg outline-none cursor-pointer min-w-0 truncate"
              >
                <option value="">-- Select Target --</option>
                {playMode === "graph"
                  ? Object.keys(graphs).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))
                  : Object.keys(conversationRegistry).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
              </select>

              <button
                onClick={handlePlay}
                disabled={!selectedTarget}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-all shrink-0"
              >
                <Play size={14} fill="currentColor" />{" "}
                {playMode === "graph" ? "Run Graph" : "Interact"}
              </button>
            </div>

            {/* Stage View */}
            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
              {!currentNode ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 font-bold uppercase tracking-widest gap-3 text-xs">
                  <Play size={32} className="opacity-30" />
                  Awaiting Execution...
                </div>
              ) : (
                <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 pb-12">
                  {/* Scene Title Plate */}
                  <div className="inline-block bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-3 py-1 rounded-full mb-2 border border-blue-200 shadow-sm">
                    {currentGraph} : {currentNode.data?.title || "Scene"}
                  </div>

                  {/* Dialogue Lines Display */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    {currentNode.data?.dialogueLines?.map((line, i) => {
                      // Handle conditional variant texts!
                      let textToShow = line.text;
                      if (Array.isArray(line.variants)) {
                        for (let v of line.variants) {
                          const val = sandboxState[v.check_flag];
                          if (
                            evaluateCondition(v.operator, val, v.value) &&
                            v.text
                          ) {
                            textToShow = v.text;
                            break;
                          }
                        }
                      }

                      return (
                        <div key={i} className="flex gap-4">
                          <div className="w-20 shrink-0 text-right">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pt-1">
                              {line.speaker || "System"}
                            </span>
                          </div>
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex-grow text-sm font-medium text-gray-800 whitespace-pre-wrap">
                            {textToShow || (
                              <span className="text-gray-300 italic">...</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(!currentNode.data?.dialogueLines ||
                      currentNode.data?.dialogueLines.length === 0) && (
                      <div className="text-center text-gray-400 italic text-sm py-4">
                        [Empty Scene Block]
                      </div>
                    )}
                  </div>

                  {/* Choices / Flow Controls */}
                  <div className="flex flex-col gap-2 pt-4">
                    {currentNode.data?.choices?.length > 0 ? (
                      currentNode.data.choices.map((choice) => (
                        <button
                          key={choice.id}
                          onClick={() => handleChoice(choice.id)}
                          className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 p-3 rounded-xl text-sm font-bold transition-all text-left flex items-center justify-between group shadow-sm hover:shadow-md"
                        >
                          {choice.text}
                          <ArrowRight
                            size={16}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </button>
                      ))
                    ) : (
                      <button
                        onClick={handleNext}
                        className="bg-gray-900 text-white hover:bg-black p-3 rounded-xl text-sm font-bold uppercase tracking-wider mx-auto min-w-[200px] transition-all flex items-center justify-center gap-2 shadow-md hover:scale-105"
                      >
                        Continue <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Engine Console (Minimizable) */}
            <div
              className={`bg-gray-900 shrink-0 border-t-4 transition-all duration-300 flex flex-col font-mono z-20 shadow-2xl ${
                logMinimized ? "h-11 cursor-pointer" : "h-48"
              } ${hasError && logMinimized ? "border-red-500 bg-red-950" : "border-gray-800"}`}
            >
              <div
                className="p-2.5 flex justify-between items-center select-none"
                onClick={() => setLogMinimized(!logMinimized)}
              >
                <div
                  className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${hasError && logMinimized ? "text-red-400 animate-pulse" : "text-gray-400"}`}
                >
                  <ListTree size={14} />
                  Execution Log
                  {hasError && logMinimized && (
                    <span className="text-red-500 ml-2">— Errors Detected</span>
                  )}
                </div>
                <button
                  className={`text-gray-500 transition-colors ${hasError && logMinimized ? "text-red-400" : "hover:text-white"}`}
                >
                  {logMinimized ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>

              {!logMinimized && (
                <div className="flex-grow overflow-y-auto space-y-1.5 px-4 pb-4 custom-scrollbar">
                  {log.map((l, i) => (
                    <div
                      key={i}
                      className={`text-[11px] leading-relaxed ${l.type === "error" ? "text-red-400 font-bold bg-red-900/20 p-1 rounded" : l.type === "scene" ? "text-blue-300 font-bold" : "text-gray-400"}`}
                    >
                      <span className="opacity-50 mr-3 text-[9px] border border-gray-700 rounded px-1">
                        [{String(i).padStart(3, "0")}]
                      </span>
                      {l.text}
                    </div>
                  ))}
                  <div ref={logEndRef} className="h-1" />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
