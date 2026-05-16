import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow"; 

// ---------------------------------------------------------------------------
// UTILS
// ---------------------------------------------------------------------------

const getAbsolutePos = (node, nodes, depth = 0) => {
  if (!node.parentId || depth > 5) return node.position;
  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) return node.position;
  const parentPos = getAbsolutePos(parent, nodes, depth + 1);
  return {
    x: node.position.x + parentPos.x,
    y: node.position.y + parentPos.y,
  };
};

const createEmptyGraph = () => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
});

// Helper to safely format text cells for CSV compliance
const escapeCSV = (text) => {
  if (!text) return '""';
  const escaped = text.toString().replace(/"/g, '""');
  return `"${escaped}"`;
};

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

export const ALLOWED_TYPES = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "list", label: "Dropdown List" },
  { id: "flag_group", label: "Logic Flags" },
  { id: "sequence", label: "Dialogue Sequence" },
  { id: "choice_list", label: "Player Choices" },
];

// ---------------------------------------------------------------------------
// STORE
// ---------------------------------------------------------------------------

export const useLoreStore = create(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // GLOBAL STATE
      // -----------------------------------------------------------------------

      projectName: "Untitled Lore",
      activeGraph: "Main Story",

      graphs: {
        "Main Story": createEmptyGraph(),
      },

      startGraph: "Main Story",

      graphFolders: [], // Array of strings: ["NPCs", "Main Quest", "Cutscenes"]
      activeFolder: null, // For UI filtering

      // store.js - Initial State
      conversationRegistry: {},

      // ── LOCALIZATION STATE (Phase 4) ──
      languages: ["en"],
      currentLanguage: "en",
      locales: {
        en: {}, // Holds key-value pairs structure: { "GraphName.NodeID.line_0": "Hello" }
      },

      // Legacy holders kept only for migration
      nodes: [],
      edges: [],

      editingNodeId: null,

      schema: {
        nodeFields: [
          { id: "title", label: "Scene Title", type: "text" },
          {
            id: "background",
            label: "Background Image",
            type: "list",
            listId: "backgrounds",
          },
          { id: "flags", label: "Scene Flags", type: "flag_group" },
          {
            id: "music",
            label: "BGM Track",
            type: "list",
            listId: "music_tracks",
          },
          { id: "dialogueLines", label: "Dialogue Sequence", type: "sequence" },
          { id: "choices", label: "Branching Choices", type: "choice_list" },
        ],
        sequenceFields: [
          {
            id: "speaker",
            label: "Speaker",
            type: "list",
            listId: "characters",
          },
          { id: "text", label: "Dialogue Text", type: "textarea" },
          {
            id: "portrait",
            label: "Portrait/Expression",
            type: "list",
            listId: "expressions",
          },
          { id: "sound", label: "SFX", type: "list", listId: "sfx_list" },
        ],
        logicFields: [
          {
            id: "check_flag",
            label: "Target Flag",
            type: "list",
            listId: "available_flags",
          },
          {
            id: "operator",
            label: "Comparison",
            type: "list",
            listId: "operators",
          },
          { id: "value", label: "Value to Check", type: "text" },
        ],
      },

      listMetadata: {
        characters: "string",
        backgrounds: "string",
        music_tracks: "string",
        expressions: "string",
        sfx_list: "string",
        variables: "variable",
        operators: "string",
      },

      lists: {
        characters: ["Narrator", "Protagonist", "Mysterious Stranger"],
        backgrounds: ["Tavern_Night", "Forest_Path", "Castle_Gate"],
        music_tracks: ["Peaceful_Town", "Battle_Theme", "Suspense_Ambient"],
        expressions: ["Neutral", "Happy", "Angry", "Surprised"],
        sfx_list: ["Door_Creek", "Sword_Clash", "Gold_Coins"],
        variables: [
          { name: "game_started", type: "boolean", defaultValue: false },
          { name: "gold_amount", type: "number", defaultValue: 0 },
        ],
        operators: ["==", "!=", ">", "<", ">=", "<="],
      },

      // -----------------------------------------------------------------------
      // HELPERS
      // -----------------------------------------------------------------------

      /** Returns all node IDs reachable downstream from nodeId via edges. */
      getConnectedDescendants: (nodeId) => {
        const { activeGraph, graphs } = get();
        const { edges } = graphs[activeGraph];
        const descendants = [];
        const queue = [nodeId];

        while (queue.length > 0) {
          const currentId = queue.shift();
          edges
            .filter((e) => e.source === currentId)
            .map((e) => e.target)
            .forEach((childId) => {
              if (!descendants.includes(childId)) {
                descendants.push(childId);
                queue.push(childId);
              }
            });
        }
        return descendants;
      },

      // -----------------------------------------------------------------------
      // PROJECT METADATA
      // -----------------------------------------------------------------------

      updateProjectName: (name) => set({ projectName: name }),

      resetProject: () => {
        if (!confirm("This will delete your entire map. Are you sure?")) return;
        const { activeGraph } = get();
        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: createEmptyGraph(),
          },
          editingNodeId: null,
        }));
      },

      // -----------------------------------------------------------------------
      // GRAPH MANAGEMENT
      // -----------------------------------------------------------------------

      setActiveGraph: (name) => set({ activeGraph: name, editingNodeId: null }),

      setStartGraph: (name) => set({ startGraph: name }),

      // Add this to your state
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      addGraph: (name = "New Conversation") => {
        const graphs = get().graphs;
        let uniqueName = name;
        let counter = 1;
        while (graphs[uniqueName]) uniqueName = `${name} ${counter++}`;
        set((state) => ({
          graphs: { ...state.graphs, [uniqueName]: createEmptyGraph() },
          activeGraph: uniqueName,
        }));
      },

      // --- UPDATE renameGraph TO FIX JUMP NODES ---
      renameGraph: (oldName, newName) => {
        if (oldName === newName || !newName.trim()) return;
        set((state) => {
          const newGraphs = { ...state.graphs };
          newGraphs[newName] = newGraphs[oldName];
          delete newGraphs[oldName];

          // ── REFACTOR: Update Registry graph pointers ──
          const newRegistry = { ...state.conversationRegistry };
          Object.keys(newRegistry).forEach((npcId) => {
            newRegistry[npcId] = newRegistry[npcId].map((rule) =>
              rule.graph === oldName ? { ...rule, graph: newName } : rule,
            );
          });

          // ── REFACTOR: Update Jump Nodes (Phase 2 legacy) ──
          Object.keys(newGraphs).forEach((key) => {
            newGraphs[key].nodes = newGraphs[key].nodes.map((node) => {
              if (node.type === "jump" && node.data.targetGraph === oldName) {
                return {
                  ...node,
                  data: { ...node.data, targetGraph: newName },
                };
              }
              return node;
            });
          });

          return {
            graphs: newGraphs,
            conversationRegistry: newRegistry,
            activeGraph:
              state.activeGraph === oldName ? newName : state.activeGraph,
          };
        });
      },

      deleteGraph: (name) => {
        const graphs = { ...get().graphs };
        if (Object.keys(graphs).length <= 1) return;
        delete graphs[name];
        const nextGraph = Object.keys(graphs)[0];
        set({ graphs, activeGraph: nextGraph, editingNodeId: null });
      },

      duplicateGraph: (name) => {
        const { graphs } = get();
        const sourceGraph = graphs[name];
        if (!sourceGraph) return;

        // 1. Create a unique name for the copy
        let newName = `${name} (Copy)`;
        let counter = 1;
        while (graphs[newName]) {
          newName = `${name} (Copy) ${counter++}`;
        }

        // 2. Deep clone the nodes and edges
        // We use JSON parse/stringify for a quick deep clone of the data objects
        const clonedNodes = JSON.parse(JSON.stringify(sourceGraph.nodes));
        const clonedEdges = JSON.parse(JSON.stringify(sourceGraph.edges));

        set((state) => ({
          graphs: {
            ...state.graphs,
            [newName]: {
              ...sourceGraph, // Keeps the viewport settings
              nodes: clonedNodes,
              edges: clonedEdges,
            },
          },
          activeGraph: newName, // Automatically switch to the new copy
        }));
      },

      addFolder: (name) =>
        set((state) => ({
          graphFolders: [...state.graphFolders, name],
        })),

      renameFolder: (oldName, newName) =>
        set((state) => {
          const newFolders = state.graphFolders.map((f) =>
            f === oldName ? newName : f,
          );
          const newGraphs = { ...state.graphs };

          // Update the folder metadata in all graphs
          Object.keys(newGraphs).forEach((gKey) => {
            if (newGraphs[gKey].folder === oldName) {
              newGraphs[gKey].folder = newName;
            }
          });

          return { graphFolders: newFolders, graphs: newGraphs };
        }),

      deleteFolder: (folderName) =>
        set((state) => {
          const newGraphs = { ...state.graphs };
          // Graphs in this folder become "Unassigned"
          Object.keys(newGraphs).forEach((gKey) => {
            if (newGraphs[gKey].folder === folderName) {
              newGraphs[gKey].folder = null;
            }
          });
          return {
            graphFolders: state.graphFolders.filter((f) => f !== folderName),
            graphs: newGraphs,
          };
        }),

      moveGraphToFolder: (graphName, folderName) =>
        set((state) => ({
          graphs: {
            ...state.graphs,
            [graphName]: { ...state.graphs[graphName], folder: folderName },
          },
        })),

      // -----------------------------------------------------------------------
      // REACT FLOW — GRAPH-AWARE HANDLERS
      // -----------------------------------------------------------------------

      onNodesChange: (changes) => {
        const { activeGraph, graphs } = get();
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
          } else {
            edgeStyle.stroke = "#ef4444";
            edgeLabel = "FALSE";
          }
        } else if (sourceNode.type === "scene" && sourceNode.data.choices) {
          const choice = sourceNode.data.choices.find(
            (c) => c.id === connection.sourceHandle,
          );
          if (choice) edgeLabel = choice.text;
        }

        const newEdge = {
          ...connection,
          id: `e-${crypto.randomUUID()}`, // Ensure unique ID
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

      // -----------------------------------------------------------------------
      // NODE MANAGEMENT
      // -----------------------------------------------------------------------

      addNode: (type) => {
        const { activeGraph } = get();
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

        const newNode = {
          id,
          type,
          position: { x: 100, y: 100 },
          zIndex: type === "collection" ? -10 : 10,
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
                : type === "jump"
                  ? { targetGraph: "" } // New jump data
                  : {},
        };

        set((state) => {
          const currentNodes = state.graphs[activeGraph].nodes;
          const filteredNodes =
            type === "start"
              ? currentNodes.filter((n) => n.type !== "start")
              : currentNodes;
          return {
            graphs: {
              ...state.graphs,
              [activeGraph]: {
                ...state.graphs[activeGraph],
                nodes: [...filteredNodes, newNode],
              },
            },
          };
        });
      },

      /** Directly overwrite the node list for the active graph (useful for bulk operations). */
      setNodes: (newNodes) => {
        const { activeGraph } = get();
        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: { ...state.graphs[activeGraph], nodes: newNodes },
          },
        }));
      },

      updateNodeData: (nodeId, newData) => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        const oldNode = currentGraph.nodes.find((n) => n.id === nodeId);
        let newEdges = [...currentGraph.edges];

        if (oldNode?.type === "scene") {
          const oldChoices = oldNode.data.choices || [];
          const newChoices = newData.choices || [];

          if (oldChoices.length === 0 && newChoices.length > 0) {
            // Linear → branching: inherit the existing edge to the first choice
            newEdges = newEdges.map((edge) =>
              edge.source === nodeId &&
              (!edge.sourceHandle || edge.sourceHandle === "default-output")
                ? {
                    ...edge,
                    sourceHandle: newChoices[0].id,
                    label: newChoices[0].text,
                    style: { ...edge.style, stroke: "#3b82f6" },
                  }
                : edge,
            );
          } else if (oldChoices.length > 0 && newChoices.length === 0) {
            // Branching → linear: reset handles
            newEdges = newEdges.map((edge) =>
              edge.source === nodeId
                ? {
                    ...edge,
                    sourceHandle: "default-output",
                    label: "",
                    style: { ...edge.style, stroke: "#9ca3af" },
                  }
                : edge,
            );
          } else {
            // Live label sync
            newEdges = newEdges.map((edge) => {
              if (edge.source === nodeId) {
                const match = newChoices.find(
                  (c) => c.id === edge.sourceHandle,
                );
                if (match && edge.label !== match.text)
                  return { ...edge, label: match.text };
              }
              return edge;
            });
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

      deleteNode: (nodeId) => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        const nodeToDelete = currentGraph.nodes.find((n) => n.id === nodeId);

        if (nodeToDelete?.type === "collection") {
          const children = currentGraph.nodes.filter(
            (n) => n.parentId === nodeId,
          );
          const deleteContent =
            children.length > 0
              ? window.confirm(
                  "This collection contains nodes. Delete its contents too?\n\nOK = delete everything  |  Cancel = keep nodes, remove group",
                )
              : false;

          set((state) => {
            let nextNodes;
            if (!deleteContent) {
              // Detach children, restore absolute positions
              nextNodes = currentGraph.nodes
                .filter((n) => n.id !== nodeId)
                .map((n) =>
                  n.parentId === nodeId
                    ? {
                        ...n,
                        parentId: undefined,
                        extent: undefined,
                        position: {
                          x: n.position.x + nodeToDelete.position.x,
                          y: n.position.y + nodeToDelete.position.y,
                        },
                      }
                    : n,
                );
            } else {
              const childIds = children.map((c) => c.id);
              nextNodes = currentGraph.nodes.filter(
                (n) => n.id !== nodeId && !childIds.includes(n.id),
              );
            }

            return {
              graphs: {
                ...state.graphs,
                [activeGraph]: {
                  ...currentGraph,
                  nodes: nextNodes,
                  edges: currentGraph.edges.filter(
                    (e) => e.source !== nodeId && e.target !== nodeId,
                  ),
                },
              },
              editingNodeId:
                state.editingNodeId === nodeId ? null : state.editingNodeId,
            };
          });
          return;
        }

        // Standard delete
        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...currentGraph,
              nodes: currentGraph.nodes.filter((n) => n.id !== nodeId),
              edges: currentGraph.edges.filter(
                (e) => e.source !== nodeId && e.target !== nodeId,
              ),
            },
          },
          editingNodeId:
            state.editingNodeId === nodeId ? null : state.editingNodeId,
        }));
      },

      deleteEdge: (edgeId) => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
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

      setEditingNode: (id) => set({ editingNodeId: id }),

      // -----------------------------------------------------------------------
      // LOGIC NODE CONDITIONS
      // -----------------------------------------------------------------------

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
                          ...(n.data.conditions || []),
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
                        conditions: (n.data.conditions || []).filter(
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

      // -----------------------------------------------------------------------
      // SCHEMA MANAGEMENT
      // -----------------------------------------------------------------------

      addFieldToSchema: (target, newField) =>
        set((state) => ({
          schema: {
            ...state.schema,
            [target]: [...state.schema[target], newField],
          },
        })),

      removeFieldFromSchema: (target, fieldId) =>
        set((state) => ({
          schema: {
            ...state.schema,
            [target]: state.schema[target].filter((f) => f.id !== fieldId),
          },
        })),

      // -----------------------------------------------------------------------
      // LIST MANAGEMENT
      // -----------------------------------------------------------------------

      createNewList: (id, type, initialItems = []) =>
        set((state) => ({
          listMetadata: { ...state.listMetadata, [id]: type },
          lists: { ...state.lists, [id]: initialItems },
        })),

      deleteList: (listId) =>
        set((state) => {
          if (listId === "variables") return state; // Protected list
          const newLists = { ...state.lists };
          const newMeta = { ...state.listMetadata };
          delete newLists[listId];
          delete newMeta[listId];
          return { lists: newLists, listMetadata: newMeta };
        }),

      // --- Inside useLoreStore ---
      addToList: (listId, newItem) =>
        set((state) => {
          let finalItem = newItem;

          // If adding a variable, ensure it has a type-safe default value
          if (
            state.listMetadata[listId] === "variable" &&
            typeof newItem === "object"
          ) {
            let defVal = false; // Default for boolean
            if (newItem.type === "number") defVal = 0;
            if (newItem.type === "string") defVal = ""; // <--- ADD THIS LINE

            finalItem = {
              ...newItem,
              defaultValue: defVal,
            };
          }

          return {
            lists: {
              ...state.lists,
              [listId]: [...(state.lists[listId] || []), finalItem],
            },
          };
        }),

      // --- Inside useLoreStore ---

      removeItemFromList: (listId, index) => {
        set((state) => {
          const itemToDelete = state.lists[listId][index];
          const isVariable = state.listMetadata[listId] === "variable";
          const deleteName = isVariable ? itemToDelete.name : itemToDelete;

          // 1. Remove from the actual list
          const newList = state.lists[listId].filter((_, i) => i !== index);

          // 2. SCRUB GRAPHS (Mutation-Free)
          const updatedGraphs = { ...state.graphs };

          Object.keys(updatedGraphs).forEach((gKey) => {
            // Must recreate the graph object to avoid mutating state.graphs[gKey] directly
            updatedGraphs[gKey] = {
              ...updatedGraphs[gKey],
              nodes: updatedGraphs[gKey].nodes.map((node) => {
                let newData = { ...node.data };
                let changed = false;

                // Scrub Logic Nodes
                if (node.type === "logic" && newData.conditions) {
                  const originalLength = newData.conditions.length;
                  newData.conditions = newData.conditions.filter(
                    (c) => c.check_flag !== deleteName,
                  );
                  if (newData.conditions.length !== originalLength)
                    changed = true;
                }

                // Scrub Scene Flags
                if (newData.flags) {
                  const originalLength = newData.flags.length;
                  newData.flags = newData.flags.filter(
                    (f) => f.key !== deleteName,
                  );
                  if (newData.flags.length !== originalLength) changed = true;
                }

                // Scrub Dialogue Speakers (If deleting from 'characters' list)
                if (listId === "characters" && newData.dialogueLines) {
                  const scrubbedLines = newData.dialogueLines.map((line) => {
                    if (line.speaker === deleteName) {
                      changed = true;
                      return { ...line, speaker: "" };
                    }
                    return line;
                  });
                  if (changed) newData.dialogueLines = scrubbedLines;
                }

                return changed ? { ...node, data: newData } : node;
              }),
            };
          });

          // 3. SCRUB REGISTRY (If it's a variable)
          const newRegistry = { ...state.conversationRegistry };
          if (isVariable) {
            Object.keys(newRegistry).forEach((npcId) => {
              const originalLength = newRegistry[npcId].length;
              newRegistry[npcId] = newRegistry[npcId].filter(
                (rule) =>
                  !rule.condition || rule.condition.variable !== deleteName,
              );
              // We don't track 'changed' here because we just recreate the array,
              // Zustand will handle the shallow compare at the top level.
            });
          }

          return {
            lists: { ...state.lists, [listId]: newList },
            graphs: updatedGraphs,
            conversationRegistry: newRegistry,
          };
        });
      },

      updateItemInList: (listId, index, newValue) => {
        set((state) => {
          const oldValue = state.lists[listId][index];
          if (oldValue === newValue) return state;

          // 1. Update the list itself
          const newList = [...(state.lists[listId] || [])];
          newList[index] = newValue;

          // 2. SCAN & REPLACE ENGINE
          let updatedGraphs = { ...state.graphs };

          // Find which Blueprint fields are actually linked to this list
          const affectedNodeFields = state.schema.nodeFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);
          const affectedSeqFields = state.schema.sequenceFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);

          Object.keys(updatedGraphs).forEach((gKey) => {
            updatedGraphs[gKey] = {
              ...updatedGraphs[gKey],
              nodes: updatedGraphs[gKey].nodes.map((node) => {
                let hasChanged = false;
                let newData = { ...node.data };

                // Fix top-level node data (e.g., node.data.background)
                affectedNodeFields.forEach((fieldId) => {
                  if (newData[fieldId] === oldValue) {
                    newData[fieldId] = newValue;
                    hasChanged = true;
                  }
                });

                // Fix Dialogue Sequences (e.g., speaker or portrait inside lines)
                if (newData.dialogueLines) {
                  newData.dialogueLines = newData.dialogueLines.map((line) => {
                    let newLine = { ...line };
                    affectedSeqFields.forEach((fieldId) => {
                      if (newLine[fieldId] === oldValue)
                        newLine[fieldId] = newValue;
                    });
                    return newLine;
                  });
                  hasChanged = true;
                }

                return hasChanged ? { ...node, data: newData } : node;
              }),
            };
          });

          return {
            lists: { ...state.lists, [listId]: newList },
            graphs: updatedGraphs,
          };
        });
      },

      updateVariable: (listId, index, field, value) => {
        set((state) => {
          const newList = [...(state.lists[listId] || [])];
          const oldVar = newList[index];
          const oldVarName = oldVar.name;
          const newVarName = field === "name" ? value : oldVarName;

          const updatedVar = { ...oldVar, [field]: value };
          if (field === "type") {
            if (value === "number") updatedVar.defaultValue = 0;
            else if (value === "string") updatedVar.defaultValue = "";
            else updatedVar.defaultValue = false;
          }
          newList[index] = updatedVar;

          const newRegistry = { ...state.conversationRegistry };
          let updatedGraphs = { ...state.graphs };

          if (field === "name" && oldVarName !== newVarName) {
            // 1. Fix Registry
            Object.keys(newRegistry).forEach((npcId) => {
              newRegistry[npcId] = newRegistry[npcId].map((rule) =>
                rule.condition?.variable === oldVarName
                  ? {
                      ...rule,
                      condition: { ...rule.condition, variable: newVarName },
                    }
                  : rule,
              );
            });

            // 2. Fix Logic Nodes and Scene Flags on Map
            Object.keys(updatedGraphs).forEach((gKey) => {
              updatedGraphs[gKey].nodes = updatedGraphs[gKey].nodes.map(
                (node) => {
                  let newData = { ...node.data };
                  let changed = false;

                  if (node.type === "logic" && newData.conditions) {
                    newData.conditions = newData.conditions.map((c) =>
                      c.check_flag === oldVarName
                        ? { ...c, check_flag: newVarName }
                        : c,
                    );
                    changed = true;
                  }

                  if (newData.flags) {
                    newData.flags = newData.flags.map((f) =>
                      f.key === oldVarName ? { ...f, key: newVarName } : f,
                    );
                    changed = true;
                  }

                  return changed ? { ...node, data: newData } : node;
                },
              );
            });
          }

          return {
            lists: { ...state.lists, [listId]: newList },
            conversationRegistry: newRegistry,
            graphs: updatedGraphs,
          };
        });
      },

      // -----------------------------------------------------------------------
      // GROUPING
      // -----------------------------------------------------------------------

      groupSelectedNodes: (baseColor = "#6366f1") => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        const selectedNodes = currentGraph.nodes.filter(
          (n) => n.selected && n.type !== "collection",
        );
        if (selectedNodes.length < 1) return;

        const title = window.prompt("Collection Name:", "New Chapter");
        if (!title) return;

        const absPositions = selectedNodes.map((n) =>
          getAbsolutePos(n, currentGraph.nodes),
        );
        const minX = Math.min(...absPositions.map((p) => p.x));
        const minY = Math.min(...absPositions.map((p) => p.y));
        const maxX = Math.max(...absPositions.map((p) => p.x + 260));
        const maxY = Math.max(...absPositions.map((p) => p.y + 200));
        const padding = 60;
        const groupId = crypto.randomUUID();

        const groupNode = {
          id: groupId,
          type: "collection",
          position: { x: minX - padding, y: minY - padding },
          zIndex: -50,
          style: {
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2,
          },
          data: { title, color: baseColor },
        };

        const nextNodes = currentGraph.nodes.map((node) => {
          if (node.selected && node.type !== "collection") {
            const abs = getAbsolutePos(node, currentGraph.nodes);
            return {
              ...node,
              parentId: groupId,
              extent: "parent",
              zIndex: 10,
              position: {
                x: abs.x - (minX - padding),
                y: abs.y - (minY - padding),
              },
              selected: false,
            };
          }
          return node;
        });

        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...currentGraph,
              nodes: [groupNode, ...nextNodes],
            },
          },
        }));
      },

      /** Move currently-selected nodes into an existing collection. */
      moveToCollection: (targetGroupId) => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        const targetGroup = currentGraph.nodes.find(
          (n) => n.id === targetGroupId,
        );
        if (!targetGroup) return;

        const updatedNodes = currentGraph.nodes.map((n) => {
          if (n.selected && n.type !== "collection" && n.id !== targetGroupId) {
            const absPos = getAbsolutePos(n, currentGraph.nodes);
            return {
              ...n,
              parentId: targetGroupId,
              extent: "parent",
              zIndex: 10,
              position: {
                x: absPos.x - targetGroup.position.x,
                y: absPos.y - targetGroup.position.y,
              },
            };
          }
          return n;
        });

        // Collections must appear before their children in the array
        const sortedNodes = [...updatedNodes].sort((a, b) => {
          if (a.type === "collection" && b.type !== "collection") return -1;
          if (a.type !== "collection" && b.type === "collection") return 1;
          return 0;
        });

        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: { ...currentGraph, nodes: sortedNodes },
          },
        }));
      },

      /** Remove selected nodes from their parent collection. */
      removeFromGroup: () => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];

        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...currentGraph,
              nodes: currentGraph.nodes.map((node) => {
                if (node.selected && node.parentId) {
                  const parent = currentGraph.nodes.find(
                    (n) => n.id === node.parentId,
                  );
                  return {
                    ...node,
                    parentId: undefined,
                    extent: undefined,
                    position: {
                      x: node.position.x + (parent?.position.x || 0),
                      y: node.position.y + (parent?.position.y || 0),
                    },
                  };
                }
                return node;
              }),
            },
          },
        }));
      },

      // ── REGISTRY ACTIONS ──

      registerNpc: (npcId) =>
        set((state) => ({
          conversationRegistry: {
            ...state.conversationRegistry,
            [npcId]: [
              {
                id: crypto.randomUUID(),
                priority: 0,
                condition: null,
                graph: "",
              },
            ],
          },
        })),

      updateRegistryRule: (npcId, ruleId, updates) =>
        set((state) => ({
          conversationRegistry: {
            ...state.conversationRegistry,
            [npcId]: state.conversationRegistry[npcId].map((r) =>
              r.id === ruleId ? { ...r, ...updates } : r,
            ),
          },
        })),

      addRegistryRule: (npcId) =>
        set((state) => ({
          conversationRegistry: {
            ...state.conversationRegistry,
            [npcId]: [
              {
                id: crypto.randomUUID(),
                priority: 10,
                condition: { variable: "", op: "==", value: "" },
                graph: "",
              },
              ...state.conversationRegistry[npcId],
            ],
          },
        })),

      deleteRegistryRule: (npcId, ruleId) =>
        set((state) => ({
          conversationRegistry: {
            ...state.conversationRegistry,
            [npcId]: state.conversationRegistry[npcId].filter(
              (r) => r.id !== ruleId,
            ),
          },
        })),

      deleteNpcFromRegistry: (npcId) =>
        set((state) => {
          const newRegistry = { ...state.conversationRegistry };
          delete newRegistry[npcId];
          return { conversationRegistry: newRegistry };
        }),

      // -----------------------------------------------------------------------
      // EXPORT / IMPORT
      // -----------------------------------------------------------------------

      /** Export a runtime-ready JSON (stripped of editor metadata). */
      exportGameData: () => {
        const { graphs, lists, schema, projectName } = get();

        const exportGraphs = {};
        Object.entries(graphs).forEach(([name, data]) => {
          const startNode = data.nodes.find((n) => n.type === "start");
          const startEdge = data.edges.find((e) => e.source === startNode?.id);

          exportGraphs[name] = {
            startNode: startEdge ? startEdge.target : null,
            nodes: data.nodes
              .filter((n) => n.type !== "start")
              .map((node) => ({
                id: node.id,
                type: node.type,
                data: node.data,
                next: data.edges
                  .filter((e) => e.source === node.id)
                  .reduce((acc, e) => {
                    const key =
                      !e.sourceHandle || e.sourceHandle === "default-output"
                        ? "next"
                        : e.sourceHandle;
                    acc[key] = e.target;
                    return acc;
                  }, {}),
              })),
          };
        });

        const bundle = {
          metadata: {
            projectName,
            exportedAt: new Date().toISOString(),
            version: "2.0",
            startGraph: get().startGraph,
          },
          registry: {
            lists,
            conversations: get().conversationRegistry, // The new routing table!
            definitions: {
              nodeFields: schema.nodeFields.map((f) => ({
                id: f.id,
                type: f.type,
              })),
              sequenceFields: schema.sequenceFields.map((f) => ({
                id: f.id,
                type: f.type,
              })),
            },
          },
          graphs: exportGraphs,
        };

        triggerDownload(
          JSON.stringify(bundle, null, 2),
          `${projectName.replace(/\s+/g, "_").toLowerCase()}_export.json`,
        );
      },

      /** Export a full fidelity project file (.lore) for round-tripping. */
      exportProject: () => {
        const { graphs, lists, schema, projectName } = get();
        const projectData = {
          type: "LORE_PROJECT_FILE",
          version: "2.0.0",
          projectName,
          graphs,
          lists,
          schema,
        };
        triggerDownload(
          JSON.stringify(projectData, null, 2),
          `${projectName.toLowerCase().replace(/\s+/g, "_")}.lore`,
        );
      },

      importProject: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (data.type !== "LORE_PROJECT_FILE") {
            alert("Invalid file format. Please upload a .lore project file.");
            return;
          }
          set({
            graphs: data.graphs || { "Main Story": createEmptyGraph() },
            lists: data.lists || get().lists,
            schema: data.schema || get().schema,
            projectName: data.projectName || get().projectName,
            activeGraph: Object.keys(data.graphs || {})[0] || "Main Story",
            editingNodeId: null,
          });
          alert("Project loaded successfully!");
        } catch {
          alert("Error parsing the file. Is it valid JSON?");
        }
      },

      // Add this to your store actions in store.js
      onViewportChange: (viewport) => {
        const { activeGraph, graphs } = get();
        if (!graphs[activeGraph]) return;

        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...state.graphs[activeGraph],
              viewport: viewport, // Saves { x, y, zoom }
            },
          },
        }));
      },
    }),

    // -------------------------------------------------------------------------
    // PERSISTENCE CONFIG
    // -------------------------------------------------------------------------
    {
      name: "lore-engine-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // One-time migration: lift legacy top-level nodes into graphs["Main Story"]
        if (
          state &&
          state.nodes?.length > 0 &&
          state.graphs?.["Main Story"]?.nodes?.length === 0
        ) {
          console.log("Migrating legacy project to multi-graph format…");
          state.graphs["Main Story"].nodes = state.nodes;
          state.graphs["Main Story"].edges = state.edges;
          state.nodes = [];
          state.edges = [];
        }
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// PRIVATE HELPERS
// ---------------------------------------------------------------------------

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Expose to browser console for debugging
window.useLoreStore = useLoreStore;
