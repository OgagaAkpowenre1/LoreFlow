// Canvas-level node/edge state: React Flow change handlers, node CRUD,
// collection/isolation view settings, and logic-node condition editing.
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";
import { getAbsolutePos } from "./utils";

export const createFlowSlice = (set, get) => ({
  onNodesChange: (changes) => {
    const { activeGraph, graphs } = get();
    if (!graphs[activeGraph]) return;
    set({
      graphs: {
        ...graphs,
        [activeGraph]: {
          ...graphs[activeGraph],
          nodes: applyNodeChanges(changes, graphs[activeGraph].nodes),
        },
      },
    });
  },

  onEdgesChange: (changes) => {
    const { activeGraph, graphs } = get();
    if (!graphs[activeGraph]) return;
    set({
      graphs: {
        ...graphs,
        [activeGraph]: {
          ...graphs[activeGraph],
          edges: applyEdgeChanges(changes, graphs[activeGraph].edges),
        },
      },
    });
  },

  onConnect: (connection) => {
    const { activeGraph, graphs } = get();
    const currentGraph = graphs[activeGraph];
    if (!currentGraph) return;
    const sourceNode = currentGraph.nodes.find(
      (n) => n.id === connection.source,
    );
    if (!sourceNode) return;

    let edgeStyle = { strokeWidth: 2, stroke: "#3b82f6" };
    let edgeLabel = "";
    let animated = false;

    if (sourceNode.type === "logic") {
      animated = true;
      if (connection.sourceHandle === "true") {
        edgeStyle.stroke = "#22c55e";
        edgeLabel = "TRUE";
      } else if (connection.sourceHandle === "false") {
        edgeStyle.stroke = "#ef4444";
        edgeLabel = "FALSE";
      } else {
        return; // Defensive protection against illegal ports
      }
    } else if (sourceNode.type === "switch") {
      animated = true;
      if (connection.sourceHandle === "default-output") {
        edgeStyle.stroke = "#9ca3af";
        edgeLabel = "DEFAULT";
      } else {
        edgeStyle.stroke = "#a855f7"; // Purple for Switch branches
        edgeLabel = connection.sourceHandle;
      }
    } else if (sourceNode.type === "scene" && sourceNode.data?.choices) {
      const choice = sourceNode.data.choices.find(
        (c) => c.id === connection.sourceHandle,
      );
      if (choice) edgeLabel = choice.text;
    }

    const newEdge = {
      ...connection,
      id: `e-${crypto.randomUUID()}`,
      label: edgeLabel,
      animated,
      style: edgeStyle,
      labelStyle: { fill: edgeStyle.stroke, fontWeight: 800, fontSize: 10 },
      labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
    };

    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: {
          ...currentGraph,
          edges: addEdge(newEdge, currentGraph.edges),
        },
      },
    }));
  },

  // ── COLLECTION ISOLATION & VIEW SETTINGS ──
  focusedCollectionId: null,
  collectionDisplayMode: "regular", // "regular" | "isolated"

  setFocusedCollectionId: (id) => set({ focusedCollectionId: id }),
  setCollectionDisplayMode: (mode) =>
    set({
      collectionDisplayMode: mode,
      // Reset focus if they switch back to regular mode to prevent getting trapped
      focusedCollectionId:
        mode === "regular" ? null : get().focusedCollectionId,
    }),

  // NODE LIFECYCLE MANAGEMENT MUTATORS
  addNode: (type) => {
    const { activeGraph, graphs, focusedCollectionId } = get();
    const currentGraph = graphs[activeGraph];
    if (!currentGraph) return;

    // ── CALCULATE VIEWPORT CENTER ──
    // viewport contains { x, y, zoom }.
    // We calculate the center relative to the zoom level.
    // const { x, y, zoom } = currentGraph.viewport;
    // const centerX = (-x + window.innerWidth / 2.5) / zoom;
    // const centerY = (-y + window.innerHeight / 2) / zoom;

    const vp = currentGraph.viewport || { x: 0, y: 0, zoom: 1 };
    const vX = vp.x || 0;
    const vY = vp.y || 0;
    const vZoom = vp.zoom || 1;

    const centerX = (-vX + window.innerWidth / 2.5) / vZoom;
    const centerY = (-vY + window.innerHeight / 2) / vZoom;

    const id = crypto.randomUUID();
    const defaultLogicData = {
      logicalOperator: "AND",
      conditions: [
        {
          id: crypto.randomUUID(),
          check_flag: "",
          operator: "==",
          value: "true",
        },
      ],
    };

    // const newNode = {
    //   id,
    //   type,
    //   position: { x: centerX, y: centerY },
    //   zIndex: type === "collection" ? -10 : 10,
    //   data:
    //     type === "scene"
    //       ? {
    //           title: "New Scene",
    //           dialogueLines: [],
    //           choices: [],
    //           flags: [],
    //         }
    //       : type === "logic"
    //         ? defaultLogicData
    //         : type === "switch"
    //           ? { check_flag: "" }
    //           : type === "jump"
    //             ? { targetGraph: "" }
    //             : {},
    // };

    // ── AUTO-PARENT INJECTION ──
    // If we are isolated inside a collection, force the new node to belong to it.
    // Note: We don't auto-parent Collections inside Collections to prevent nesting bugs.
    const resolvedParentId =
      focusedCollectionId && type !== "collection"
        ? focusedCollectionId
        : undefined;

    const newNode = {
      id,
      type,
      position: { x: centerX, y: centerY },
      zIndex: type === "collection" ? -10 : 10,
      parentId: resolvedParentId, // Auto-assigns if in isolation mode
      data:
        type === "scene"
          ? {
              title: "New Scene",
              dialogueLines: [],
              choices: [],
              flags: [],
            }
          : type === "logic"
            ? defaultLogicData
            : type === "switch"
              ? { check_flag: "" }
              : type === "jump"
                ? { targetGraph: "" }
                : {},
    };

    set((state) => {
      const currentGraph = state.graphs[activeGraph];
      if (!currentGraph) return {};
      let filteredNodes = currentGraph.nodes;
      let filteredEdges = currentGraph.edges;

      if (type === "start") {
        const oldStartNode = currentGraph.nodes.find((n) => n.type === "start");
        if (oldStartNode) {
          filteredNodes = currentGraph.nodes.filter(
            (n) => n.id !== oldStartNode.id,
          );
          filteredEdges = currentGraph.edges.filter(
            (e) => e.source !== oldStartNode.id && e.target !== oldStartNode.id,
          );
        }
      }

      return {
        graphs: {
          ...state.graphs,
          [activeGraph]: {
            ...currentGraph,
            nodes: [...filteredNodes, newNode],
            edges: filteredEdges,
          },
        },
      };
    });
  },

  setNodes: (newNodes) => {
    // Restored Explicit Method Hook
    const { activeGraph } = get();
    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: { ...state.graphs[activeGraph], nodes: newNodes },
      },
    }));
  },

  deleteNode: (nodeId) => {
    const currentActiveGraph = get().activeGraph;
    const currentGraphData = get().graphs[currentActiveGraph];
    const children =
      currentGraphData?.nodes.filter((n) => n.parentId === nodeId) || [];

    const deleteContent =
      children.length > 0
        ? window.confirm(
            "This collection contains nodes. Delete its contents too?\n\nOK = delete everything  |  Cancel = keep nodes, remove group",
          )
        : false;

    set((state) => {
      const freshGraph = state.graphs[state.activeGraph];
      if (!freshGraph) return {};

      const nodeToDelete = freshGraph.nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) return {};

      let nextNodes;
      if (nodeToDelete.type === "collection") {
        if (!deleteContent) {
          const collectionAbsPos = getAbsolutePos(
            nodeToDelete,
            freshGraph.nodes,
          );
          nextNodes = freshGraph.nodes
            .filter((n) => n.id !== nodeId)
            .map((n) =>
              n.parentId === nodeId
                ? {
                    ...n,
                    parentId: undefined,
                    extent: undefined,
                    position: {
                      x: n.position.x + collectionAbsPos.x,
                      y: n.position.y + collectionAbsPos.y,
                    },
                  }
                : n,
            );
        } else {
          const childIds = children.map((c) => c.id);
          nextNodes = freshGraph.nodes.filter(
            (n) => n.id !== nodeId && !childIds.includes(n.id),
          );
        }
      } else {
        nextNodes = freshGraph.nodes.filter((n) => n.id !== nodeId);
      }

      return {
        graphs: {
          ...state.graphs,
          [state.activeGraph]: {
            ...freshGraph,
            nodes: nextNodes,
            edges: freshGraph.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId,
            ),
          },
        },
        editingNodeId:
          state.editingNodeId === nodeId ? null : state.editingNodeId,
      };
    });
  },

  deleteEdge: (edgeId) => {
    const { activeGraph, graphs } = get();
    const currentGraph = graphs[activeGraph];
    if (!currentGraph) return;
    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: {
          ...currentGraph,
          edges: currentGraph.edges.filter((e) => e.id !== edgeId),
        },
      },
    }));
  },

  // updateNodeData: (nodeId, newData) => {
  //   const { activeGraph, graphs } = get();
  //   const currentGraph = graphs[activeGraph];
  //   if (!currentGraph) return;
  //   const oldNode = currentGraph.nodes.find((n) => n.id === nodeId);
  //   let newEdges = [...currentGraph.edges];

  //   if (oldNode?.type === "scene") {
  //     const oldChoices = oldNode.data?.choices || [];
  //     const newChoices = newData.choices || [];

  //     if (oldChoices.length === 0 && newChoices.length > 0) {
  //       newEdges = newEdges.map((edge) =>
  //         edge.source === nodeId &&
  //         (!edge.sourceHandle || edge.sourceHandle === "default-output")
  //           ? {
  //               ...edge,
  //               sourceHandle: newChoices[0].id,
  //               label: newChoices[0].text,
  //               style: { ...edge.style, stroke: "#3b82f6" },
  //             }
  //           : edge,
  //       );
  //     } else if (oldChoices.length > 0 && newChoices.length === 0) {
  //       let defaultSaved = false;
  //       newEdges = newEdges.reduce((acc, edge) => {
  //         if (edge.source === nodeId) {
  //           if (!defaultSaved) {
  //             acc.push({
  //               ...edge,
  //               sourceHandle: "default-output",
  //               label: "",
  //               style: { ...edge.style, stroke: "#9ca3af" },
  //             });
  //             defaultSaved = true;
  //           }
  //         } else {
  //           acc.push(edge);
  //         }
  //         return acc;
  //       }, []);
  //     } else {
  //       newEdges = newEdges.map((edge) => {
  //         if (edge.source === nodeId) {
  //           const match = newChoices.find(
  //             (c) => c.id === edge.sourceHandle,
  //           );
  //           if (match && edge.label !== match.text)
  //             return { ...edge, label: match.text };
  //         }
  //         return edge;
  //       });
  //     }
  //   } else if (oldNode?.type === "switch") {
  //     if (oldNode.data?.check_flag !== newData.check_flag) {
  //       // Sever old enum edges if variable changes, but keep the default fallback
  //       newEdges = newEdges.filter(
  //         (edge) =>
  //           edge.source !== nodeId ||
  //           edge.sourceHandle === "default-output",
  //       );
  //     }
  //   }

  //   set((state) => ({
  //     graphs: {
  //       ...state.graphs,
  //       [activeGraph]: {
  //         ...currentGraph,
  //         nodes: currentGraph.nodes.map((n) =>
  //           n.id === nodeId ? { ...n, data: newData } : n,
  //         ),
  //         edges: newEdges,
  //       },
  //     },
  //   }));
  // },

  // RESTORED LOGIC SUB-CONDITION MUTATORS

  updateNodeData: (nodeId, newData) => {
    const { activeGraph, graphs } = get();
    const currentGraph = graphs[activeGraph];
    if (!currentGraph) return;

    const oldNode = currentGraph.nodes.find((n) => n.id === nodeId);
    let newEdges = [...currentGraph.edges];

    if (oldNode?.type === "scene") {
      const newChoices = newData.choices || [];
      const validChoiceIds = newChoices.map((c) => c.id);

      // 1. FILTER PHASE (Ghost Edge Sweeper)
      newEdges = newEdges.filter((edge) => {
        // Only examine wires originating from this specific scene node
        if (edge.source === nodeId) {
          // ALWAYS keep the permanent fallback wire
          if (!edge.sourceHandle || edge.sourceHandle === "default-output") {
            return true;
          }
          // Keep choice wires ONLY if the choice ID still exists in the node data
          if (validChoiceIds.includes(edge.sourceHandle)) {
            return true;
          }
          // If it's not the default output and the choice was deleted, PURGE IT.
          return false;
        }
        return true;
      });

      // 2. MAP PHASE (Sync Labels)
      newEdges = newEdges.map((edge) => {
        if (edge.source === nodeId && edge.sourceHandle !== "default-output") {
          const match = newChoices.find((c) => c.id === edge.sourceHandle);
          if (match && edge.label !== match.text) {
            // Update the visual edge label if the writer changed the choice text
            return { ...edge, label: match.text };
          }
        }
        return edge;
      });
    } else if (oldNode?.type === "switch") {
      if (oldNode.data?.check_flag !== newData.check_flag) {
        // Sever old enum edges if variable changes, but keep the default fallback
        newEdges = newEdges.filter(
          (edge) =>
            edge.source !== nodeId || edge.sourceHandle === "default-output",
        );
      }
    }

    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: {
          ...currentGraph,
          nodes: currentGraph.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: newData } : n,
          ),
          edges: newEdges,
        },
      },
    }));
  },

  addConditionToLogic: (nodeId) => {
    const { activeGraph } = get();
    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: {
          ...state.graphs[activeGraph],
          nodes: state.graphs[activeGraph].nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    conditions: [
                      ...(n.data?.conditions || []),
                      {
                        id: crypto.randomUUID(),
                        check_flag: "",
                        operator: "==",
                        value: "true",
                      },
                    ],
                  },
                }
              : n,
          ),
        },
      },
    }));
  },

  removeConditionFromLogic: (nodeId, conditionId) => {
    const { activeGraph } = get();
    set((state) => ({
      graphs: {
        ...state.graphs,
        [activeGraph]: {
          ...state.graphs[activeGraph],
          nodes: state.graphs[activeGraph].nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    conditions: (n.data?.conditions || []).filter(
                      (c) => c.id !== conditionId,
                    ),
                  },
                }
              : n,
          ),
        },
      },
    }));
  },
});
