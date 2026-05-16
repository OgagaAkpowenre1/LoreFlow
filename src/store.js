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

      renameGraph: (oldName, newName) => {
        if (oldName === newName || !newName.trim()) return;
        set((state) => {
          const newGraphs = { ...state.graphs };
          newGraphs[newName] = newGraphs[oldName];
          delete newGraphs[oldName];

          const newRegistry = { ...state.conversationRegistry };
          Object.keys(newRegistry).forEach((npcId) => {
            newRegistry[npcId] = newRegistry[npcId].map((rule) =>
              rule.graph === oldName ? { ...rule, graph: newName } : rule,
            );
          });

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

          // Re-key translation blocks with the new graph namespace
          const newLocales = { ...state.locales };
          Object.keys(newLocales).forEach((lang) => {
            const updatedBlock = {};
            Object.keys(newLocales[lang]).forEach((key) => {
              if (key.startsWith(`${oldName}.`)) {
                const remainder = key.slice(oldName.length + 1);
                updatedBlock[`${newName}.${remainder}`] = newLocales[lang][key];
              } else {
                updatedBlock[key] = newLocales[lang][key];
              }
            });
            newLocales[lang] = updatedBlock;
          });

          return {
            graphs: newGraphs,
            conversationRegistry: newRegistry,
            locales: newLocales,
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

        let newName = `${name} (Copy)`;
        let counter = 1;
        while (graphs[newName]) {
          newName = `${name} (Copy) ${counter++}`;
        }

        const clonedNodes = JSON.parse(JSON.stringify(sourceGraph.nodes));
        const clonedEdges = JSON.parse(JSON.stringify(sourceGraph.edges));

        set((state) => ({
          graphs: {
            ...state.graphs,
            [newName]: {
              ...sourceGraph,
              nodes: clonedNodes,
              edges: clonedEdges,
            },
          },
          activeGraph: newName,
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
          } else if (connection.sourceHandle === "false") {
            edgeStyle.stroke = "#ef4444";
            edgeLabel = "FALSE";
          } else {
            // Reject any generic, unassigned, or undefined handle connection attempts
            console.warn(
              "Rejected invalid connection from Logic Node: missing condition handle identity.",
            );
            return;
          }
        } else if (sourceNode.type === "scene" && sourceNode.data.choices) {
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
                  ? { targetGraph: "" }
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

      // deleteNode: (nodeId) => {
      //   const { activeGraph, graphs } = get();
      //   const currentGraph = graphs[activeGraph];
      //   const nodeToDelete = currentGraph.nodes.find((n) => n.id === nodeId);

      //   if (nodeToDelete?.type === "collection") {
      //     const children = currentGraph.nodes.filter(
      //       (n) => n.parentId === nodeId,
      //     );
      //     const deleteContent =
      //       children.length > 0
      //         ? window.confirm(
      //             "This collection contains nodes. Delete its contents too?\n\nOK = delete everything  |  Cancel = keep nodes, remove group",
      //           )
      //         : false;

      //     set((state) => {
      //       let nextNodes;
      //       if (!deleteContent) {
      //         nextNodes = currentGraph.nodes
      //           .filter((n) => n.id !== nodeId)
      //           .map((n) =>
      //             n.parentId === nodeId
      //               ? {
      //                   ...n,
      //                   parentId: undefined,
      //                   extent: undefined,
      //                   position: {
      //                     x: n.position.x + nodeToDelete.position.x,
      //                     y: n.position.y + nodeToDelete.position.y,
      //                   },
      //                 }
      //               : n,
      //           );
      //       } else {
      //         const childIds = children.map((c) => c.id);
      //         nextNodes = currentGraph.nodes.filter(
      //           (n) => n.id !== nodeId && !childIds.includes(n.id),
      //         );
      //       }

      //       return {
      //         graphs: {
      //           ...state.graphs,
      //           [activeGraph]: {
      //             ...currentGraph,
      //             nodes: nextNodes,
      //             edges: currentGraph.edges.filter(
      //               (e) => e.source !== nodeId && e.target !== nodeId,
      //             ),
      //           },
      //         },
      //         editingNodeId:
      //           state.editingNodeId === nodeId ? null : state.editingNodeId,
      //       };
      //     });
      //     return;
      //   }

      //   set((state) => ({
      //     graphs: {
      //       ...state.graphs,
      //       [activeGraph]: {
      //         ...currentGraph,
      //         nodes: currentGraph.nodes.filter((n) => n.id !== nodeId),
      //         edges: currentGraph.edges.filter(
      //           (e) => e.source !== nodeId && e.target !== nodeId,
      //         ),
      //       },
      //     },
      //     editingNodeId:
      //       state.editingNodeId === nodeId ? null : state.editingNodeId,
      //   }));
      // },

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
              // FIXED: Crawl up the nesting stack to calculate the true canvas offset origin
              const collectionAbsPos = getAbsolutePos(
                nodeToDelete,
                currentGraph.nodes,
              );

              // Detach children and accurately project them back onto the root map matrix coordinate space
              nextNodes = currentGraph.nodes
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

        // Standard delete execution for standard canvas elements
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
          if (listId === "variables") return state;
          const newLists = { ...state.lists };
          const newMeta = { ...state.listMetadata };
          delete newLists[listId];
          delete newMeta[listId];
          return { lists: newLists, listMetadata: newMeta };
        }),

      addToList: (listId, newItem) =>
        set((state) => {
          let finalItem = newItem;

          if (
            state.listMetadata[listId] === "variable" &&
            typeof newItem === "object"
          ) {
            let defVal = false;
            if (newItem.type === "number") defVal = 0;
            if (newItem.type === "string") defVal = "";

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

      // removeItemFromList: (listId, index) => {
      //   set((state) => {
      //     const itemToDelete = state.lists[listId][index];
      //     const isVariable = state.listMetadata[listId] === "variable";
      //     const deleteName = isVariable ? itemToDelete.name : itemToDelete;

      //     const newList = state.lists[listId].filter((_, i) => i !== index);
      //     const updatedGraphs = { ...state.graphs };

      //     Object.keys(updatedGraphs).forEach((gKey) => {
      //       updatedGraphs[gKey] = {
      //         ...updatedGraphs[gKey],
      //         nodes: updatedGraphs[gKey].nodes.map((node) => {
      //           let newData = { ...node.data };
      //           let changed = false;

      //           if (node.type === "logic" && newData.conditions) {
      //             const originalLength = newData.conditions.length;
      //             newData.conditions = newData.conditions.filter(
      //               (c) => c.check_flag !== deleteName,
      //             );
      //             if (newData.conditions.length !== originalLength)
      //               changed = true;
      //           }

      //           if (newData.flags) {
      //             const originalLength = newData.flags.length;
      //             newData.flags = newData.flags.filter(
      //               (f) => f.key !== deleteName,
      //             );
      //             if (newData.flags.length !== originalLength) changed = true;
      //           }

      //           if (listId === "characters" && newData.dialogueLines) {
      //             const scrubbedLines = newData.dialogueLines.map((line) => {
      //               if (line.speaker === deleteName) {
      //                 changed = true;
      //                 return { ...line, speaker: "" };
      //               }
      //               return line;
      //             });
      //             if (changed) newData.dialogueLines = scrubbedLines;
      //           }

      //           return changed ? { ...node, data: newData } : node;
      //         }),
      //       };
      //     });

      //     const newRegistry = { ...state.conversationRegistry };
      //     if (isVariable) {
      //       Object.keys(newRegistry).forEach((npcId) => {
      //         newRegistry[npcId] = newRegistry[npcId].filter(
      //           (rule) =>
      //             !rule.condition || rule.condition.variable !== deleteName,
      //         );
      //       });
      //     }

      //     return {
      //       lists: { ...state.lists, [listId]: newList },
      //       graphs: updatedGraphs,
      //       conversationRegistry: newRegistry,
      //     };
      //   });
      // },

      // updateItemInList: (listId, index, newValue) => {
      //   set((state) => {
      //     const oldValue = state.lists[listId][index];
      //     if (oldValue === newValue) return state;

      //     const newList = [...(state.lists[listId] || [])];
      //     newList[index] = newValue;

      //     let updatedGraphs = { ...state.graphs };

      //     const affectedNodeFields = state.schema.nodeFields
      //       .filter((f) => f.listId === listId)
      //       .map((f) => f.id);
      //     const affectedSeqFields = state.schema.sequenceFields
      //       .filter((f) => f.listId === listId)
      //       .map((f) => f.id);

      //     Object.keys(updatedGraphs).forEach((gKey) => {
      //       updatedGraphs[gKey] = {
      //         ...updatedGraphs[gKey],
      //         nodes: updatedGraphs[gKey].nodes.map((node) => {
      //           let hasChanged = false;
      //           let newData = { ...node.data };

      //           affectedNodeFields.forEach((fieldId) => {
      //             if (newData[fieldId] === oldValue) {
      //               newData[fieldId] = newValue;
      //               hasChanged = true;
      //             }
      //           });

      //           if (newData.dialogueLines) {
      //             newData.dialogueLines = newData.dialogueLines.map((line) => {
      //               let newLine = { ...line };
      //               affectedSeqFields.forEach((fieldId) => {
      //                 if (newLine[fieldId] === oldValue)
      //                   newLine[fieldId] = newValue;
      //               });
      //               return newLine;
      //             });
      //             hasChanged = true;
      //           }

      //           return hasChanged ? { ...node, data: newData } : node;
      //         }),
      //       };
      //     });

      //     return {
      //       lists: { ...state.lists, [listId]: newList },
      //       graphs: updatedGraphs,
      //     };
      //   });
      // },

      removeItemFromList: (listId, index) => {
        set((state) => {
          const itemToDelete = state.lists[listId][index];
          const isVariable = state.listMetadata[listId] === "variable";
          const deleteName = isVariable ? itemToDelete.name : itemToDelete;

          // 1. Remove the master item from the Global List source
          const newList = state.lists[listId].filter((_, i) => i !== index);

          // 2. Discover fields dynamically linked to this specific list via your Blueprints
          const affectedNodeFields = state.schema.nodeFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);
          const affectedSeqFields = state.schema.sequenceFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);

          const updatedGraphs = { ...state.graphs };

          Object.keys(updatedGraphs).forEach((gKey) => {
            let graphHasChanges = false;

            const updatedNodes = updatedGraphs[gKey].nodes.map((node) => {
              let nodeDataHasChanges = false;
              let newData = { ...node.data };

              // A. Scrub top-level node blueprint matches (e.g. background item dropped)
              affectedNodeFields.forEach((fieldId) => {
                if (newData[fieldId] === deleteName) {
                  newData[fieldId] = "";
                  nodeDataHasChanges = true;
                }
              });

              // B. Scrub nested dialogue sequence parameters dynamically (speaker, portraits, audio tracks)
              if (newData.dialogueLines) {
                let sequenceHasChanges = false;
                const updatedLines = newData.dialogueLines.map((line) => {
                  let lineHasChanges = false;
                  let newLine = { ...line };

                  affectedSeqFields.forEach((fieldId) => {
                    if (newLine[fieldId] === deleteName) {
                      newLine[fieldId] = "";
                      lineHasChanges = true;
                    }
                  });

                  if (lineHasChanges) sequenceHasChanges = true;
                  return newLine;
                });

                if (sequenceHasChanges) {
                  newData.dialogueLines = updatedLines;
                  nodeDataHasChanges = true;
                }
              }

              // C. Scrub player choice text instances explicitly matching the dropped item literal
              if (newData.choices) {
                let choicesHasChanges = false;
                const updatedChoices = newData.choices.map((choice) => {
                  if (choice.text === deleteName) {
                    choicesHasChanges = true;
                    return { ...choice, text: "" };
                  }
                  return choice;
                });

                if (choicesHasChanges) {
                  newData.choices = updatedChoices;
                  nodeDataHasChanges = true;
                }
              }

              // D. Variable-specific structural cleanup (Logic Conditions & Scene Flags execution chains)
              if (isVariable) {
                if (node.type === "logic" && newData.conditions) {
                  const originalLength = newData.conditions.length;
                  newData.conditions = newData.conditions.filter(
                    (c) => c.check_flag !== deleteName,
                  );
                  if (newData.conditions.length !== originalLength) {
                    nodeDataHasChanges = true;
                  }
                }

                if (newData.flags) {
                  const originalLength = newData.flags.length;
                  newData.flags = newData.flags.filter(
                    (f) => f.key !== deleteName,
                  );
                  if (newData.flags.length !== originalLength) {
                    nodeDataHasChanges = true;
                  }
                }
              }

              if (nodeDataHasChanges) graphHasChanges = true;
              return nodeDataHasChanges ? { ...node, data: newData } : node;
            });

            if (graphHasChanges) {
              updatedGraphs[gKey] = {
                ...updatedGraphs[gKey],
                nodes: updatedNodes,
              };
            }
          });

          // 3. Clean routing table rules from the Conversation Registry
          const newRegistry = { ...state.conversationRegistry };
          if (isVariable) {
            Object.keys(newRegistry).forEach((npcId) => {
              newRegistry[npcId] = newRegistry[npcId].filter(
                (rule) =>
                  !rule.condition || rule.condition.variable !== deleteName,
              );
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

          // 1. Update the master array entry in Global Lists
          const newList = [...(state.lists[listId] || [])];
          newList[index] = newValue;

          // 2. DISCOVERY ENGINE: Scan and scrub all active graph assets
          let updatedGraphs = { ...state.graphs };

          // Track which Blueprint structure properties hook into this list source
          const affectedNodeFields = state.schema.nodeFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);
          const affectedSeqFields = state.schema.sequenceFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);

          Object.keys(updatedGraphs).forEach((gKey) => {
            let graphHasChanges = false;

            const updatedNodes = updatedGraphs[gKey].nodes.map((node) => {
              let nodeDataHasChanges = false;
              let newData = { ...node.data };

              // A. Update Top-Level Blueprint fields (e.g., node.data.background)
              affectedNodeFields.forEach((fieldId) => {
                if (newData[fieldId] === oldValue) {
                  newData[fieldId] = newValue;
                  nodeDataHasChanges = true;
                }
              });

              // B. Update Nested Sequence Lines safely (Fixes unconditional re-render bug)
              if (newData.dialogueLines) {
                let sequenceHasChanges = false;
                const updatedLines = newData.dialogueLines.map((line) => {
                  let lineHasChanges = false;
                  let newLine = { ...line };

                  affectedSeqFields.forEach((fieldId) => {
                    if (newLine[fieldId] === oldValue) {
                      newLine[fieldId] = newValue;
                      lineHasChanges = true;
                    }
                  });

                  if (lineHasChanges) sequenceHasChanges = true;
                  return newLine;
                });

                if (sequenceHasChanges) {
                  newData.dialogueLines = updatedLines;
                  nodeDataHasChanges = true;
                }
              }

              // C. Update Logic Node Conditions comparing against this string literal value
              if (node.type === "logic" && newData.conditions) {
                let logicHasChanges = false;
                const updatedConditions = newData.conditions.map((cond) => {
                  if (cond.value === oldValue) {
                    logicHasChanges = true;
                    return { ...cond, value: newValue };
                  }
                  return cond;
                });

                if (logicHasChanges) {
                  newData.conditions = updatedConditions;
                  nodeDataHasChanges = true;
                }
              }

              // D. Update Scene Node Flag operations setting values to this string literal
              if (newData.flags) {
                let flagsHasChanges = false;
                const updatedFlags = newData.flags.map((flag) => {
                  if (flag.value === oldValue) {
                    flagsHasChanges = true;
                    return { ...flag, value: newValue };
                  }
                  return flag;
                });

                if (flagsHasChanges) {
                  newData.flags = updatedFlags;
                  nodeDataHasChanges = true;
                }
              }

              // E. Update Choice Node text attributes precisely matching the literal template
              if (newData.choices) {
                let choicesHasChanges = false;
                const updatedChoices = newData.choices.map((choice) => {
                  if (choice.text === oldValue) {
                    choicesHasChanges = true;
                    return { ...choice, text: newValue };
                  }
                  return choice;
                });

                if (choicesHasChanges) {
                  newData.choices = updatedChoices;
                  nodeDataHasChanges = true;
                }
              }

              if (nodeDataHasChanges) graphHasChanges = true;
              return nodeDataHasChanges ? { ...node, data: newData } : node;
            });

            if (graphHasChanges) {
              updatedGraphs[gKey] = {
                ...updatedGraphs[gKey],
                nodes: updatedNodes,
              };
            }
          });

          return {
            lists: { ...state.lists, [listId]: newList },
            graphs: updatedGraphs,
          };
        });
      },

      // updateVariable: (listId, index, field, value) => {
      //   set((state) => {
      //     const newList = [...(state.lists[listId] || [])];
      //     const oldVar = newList[index];
      //     const oldVarName = oldVar.name;
      //     const newVarName = field === "name" ? value : oldVarName;

      //     const updatedVar = { ...oldVar, [field]: value };
      //     if (field === "type") {
      //       if (value === "number") updatedVar.defaultValue = 0;
      //       else if (value === "string") updatedVar.defaultValue = "";
      //       else updatedVar.defaultValue = false;
      //     }
      //     newList[index] = updatedVar;

      //     const newRegistry = { ...state.conversationRegistry };
      //     let updatedGraphs = { ...state.graphs };

      //     if (field === "name" && oldVarName !== newVarName) {
      //       Object.keys(newRegistry).forEach((npcId) => {
      //         newRegistry[npcId] = newRegistry[npcId].map((rule) =>
      //           rule.condition?.variable === oldVarName
      //             ? {
      //                 ...rule,
      //                 condition: { ...rule.condition, variable: newVarName },
      //               }
      //             : rule,
      //         );
      //       });

      //       Object.keys(updatedGraphs).forEach((gKey) => {
      //         updatedGraphs[gKey].nodes = updatedGraphs[gKey].nodes.map(
      //           (node) => {
      //             let newData = { ...node.data };
      //             let changed = false;

      //             if (node.type === "logic" && newData.conditions) {
      //               newData.conditions = newData.conditions.map((c) =>
      //                 c.check_flag === oldVarName
      //                   ? { ...c, check_flag: newVarName }
      //                   : c,
      //               );
      //               changed = true;
      //             }

      //             if (newData.flags) {
      //               newData.flags = newData.flags.map((f) =>
      //                 f.key === oldVarName ? { ...f, key: newVarName } : f,
      //               );
      //               changed = true;
      //             }

      //             return changed ? { ...node, data: newData } : node;
      //           },
      //         );
      //       });
      //     }

      //     return {
      //       lists: { ...state.lists, [listId]: newList },
      //       conversationRegistry: newRegistry,
      //       graphs: updatedGraphs,
      //     };
      //   });
      // },

      // ── LOCALIZATION ACTIONS (Phase 4) ──

      // updateVariable: (listId, index, field, value) => {
      //   set((state) => {
      //     const newList = [...(state.lists[listId] || [])];
      //     const oldVar = newList[index];
      //     const oldVarName = oldVar.name;
      //     const newVarName = field === "name" ? value : oldVarName;

      //     const updatedVar = { ...oldVar, [field]: value };
      //     if (field === "type") {
      //       if (value === "number") updatedVar.defaultValue = 0;
      //       else if (value === "string") updatedVar.defaultValue = "";
      //       else updatedVar.defaultValue = false;
      //     }
      //     newList[index] = updatedVar;

      //     const newRegistry = { ...state.conversationRegistry };
      //     let updatedGraphs = { ...state.graphs };
      //     const hasRenamed = field === "name" && oldVarName !== newVarName;

      //     if (hasRenamed) {
      //       // 1. Fix Registry
      //       Object.keys(newRegistry).forEach((npcId) => {
      //         newRegistry[npcId] = newRegistry[npcId].map((rule) =>
      //           rule.condition?.variable === oldVarName
      //             ? {
      //                 ...rule,
      //                 condition: { ...rule.condition, variable: newVarName },
      //               }
      //             : rule,
      //         );
      //       });

      //       // 2. Fix Logic Nodes and Scene Flags on Map
      //       Object.keys(updatedGraphs).forEach((gKey) => {
      //         updatedGraphs[gKey].nodes = updatedGraphs[gKey].nodes.map(
      //           (node) => {
      //             let newData = { ...node.data };
      //             let changed = false;

      //             if (node.type === "logic" && newData.conditions) {
      //               newData.conditions = newData.conditions.map((c) =>
      //                 c.check_flag === oldVarName
      //                   ? { ...c, check_flag: newVarName }
      //                   : c,
      //               );
      //               changed = true;
      //             }

      //             if (newData.flags) {
      //               newData.flags = newData.flags.map((f) =>
      //                 f.key === oldVarName ? { ...f, key: newVarName } : f,
      //               );
      //               changed = true;
      //             }

      //             return changed ? { ...node, data: newData } : node;
      //           },
      //         );
      //       });
      //     }

      //     return {
      //       lists: { ...state.lists, [listId]: newList },
      //       conversationRegistry: newRegistry,
      //       // Only emit a new graphs object reference if a renaming cycle actually occurred
      //       ...(hasRenamed ? { graphs: updatedGraphs } : {}),
      //     };
      //   });
      // },

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

          const hasRenamed = field === "name" && oldVarName !== newVarName;
          const hasTypeChanged = field === "type" && oldVar.type !== value;

          // ── 1. HANDLE VARIABLE NAME RENAMES ──
          if (hasRenamed) {
            // Fix Registry name pointers
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

            // Fix Logic Nodes and Scene Flags on Map name pointers
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

          // ── 2. HANDLE VARIABLE TYPE CHANGES (Migration Fix for Bug #9) ──
          if (hasTypeChanged) {
            // Establish healthy matching validation defaults for the arriving type configuration
            let defaultOp = "==";
            let defaultRegVal = "true";
            if (value === "number") defaultRegVal = "0";
            if (value === "string") defaultRegVal = "";

            // A. Scan and sanitize conversation registry rules mapping this element
            Object.keys(newRegistry).forEach((npcId) => {
              newRegistry[npcId] = newRegistry[npcId].map((rule) => {
                if (rule.condition && rule.condition.variable === oldVarName) {
                  return {
                    ...rule,
                    condition: {
                      ...rule.condition,
                      op: defaultOp,
                      value: defaultRegVal,
                    },
                  };
                }
                return rule;
              });
            });

            // B. Scan and sanitize condition maps and setter attributes sitting on canvas nodes
            Object.keys(updatedGraphs).forEach((gKey) => {
              let graphChanged = false;

              const updatedNodes = updatedGraphs[gKey].nodes.map((node) => {
                let nodeChanged = false;
                let newData = { ...node.data };

                // Reset canvas evaluation conditions to match the type requirements
                if (node.type === "logic" && newData.conditions) {
                  newData.conditions = newData.conditions.map((c) => {
                    if (c.check_flag === oldVarName) {
                      nodeChanged = true;
                      return {
                        ...c,
                        operator: defaultOp,
                        value: value === "number" ? 0 : defaultRegVal,
                      };
                    }
                    return c;
                  });
                }

                // Reset canvas flag assignment states to accurate literal formats
                if (newData.flags) {
                  newData.flags = newData.flags.map((f) => {
                    if (f.key === oldVarName) {
                      nodeChanged = true;
                      let assignVal = true;
                      if (value === "number") assignVal = 0;
                      if (value === "string") assignVal = "";
                      return { ...f, op: "=", value: assignVal };
                    }
                    return f;
                  });
                }

                if (nodeChanged) graphChanged = true;
                return nodeChanged ? { ...node, data: newData } : node;
              });

              if (graphChanged) {
                updatedGraphs[gKey] = {
                  ...updatedGraphs[gKey],
                  nodes: updatedNodes,
                };
              }
            });
          }

          return {
            lists: { ...state.lists, [listId]: newList },
            conversationRegistry: newRegistry,
            graphs: updatedGraphs,
          };
        });
      },

      addLanguage: (code) =>
        set((state) => {
          const cleanedCode = code.trim().toLowerCase();
          if (!cleanedCode || state.languages.includes(cleanedCode)) return {};
          return {
            languages: [...state.languages, cleanedCode],
            locales: {
              ...state.locales,
              [cleanedCode]: {},
            },
          };
        }),

      updateTranslation: (lang, key, text) =>
        set((state) => ({
          locales: {
            ...state.locales,
            [lang]: {
              ...(state.locales[lang] || {}),
              [key]: text,
            },
          },
        })),

      // exportStringsCSV: () => {
      //   const { graphs } = get();
      //   let csvContent = "key,speaker,original_text,translation\n";

      //   Object.entries(graphs).forEach(([graphName, graphData]) => {
      //     graphData.nodes.forEach((node) => {
      //       // Extract Scene dialogue blocks
      //       if (node.type === "scene" && node.data) {
      //         if (Array.isArray(node.data.dialogueLines)) {
      //           node.data.dialogueLines.forEach((line, index) => {
      //             const key = `${graphName}.${node.id}.line_${index}`;
      //             const speaker = line.speaker || "Narrator";
      //             const text = line.text || "";
      //             csvContent += `${escapeCSV(key)},${escapeCSV(speaker)},${escapeCSV(text)},""\n`;
      //           });
      //         }

      //         // Extract Choice blocks
      //         if (Array.isArray(node.data.choices)) {
      //           node.data.choices.forEach((choice, index) => {
      //             const key = `${graphName}.${node.id}.choice_${index}`;
      //             const text = choice.text || "";
      //             csvContent += `${escapeCSV(key)},"Player",${escapeCSV(text)},""\n`;
      //           });
      //         }
      //       }
      //     });
      //   });

      //   triggerDownload(
      //     csvContent,
      //     `${get().projectName.toLowerCase().replace(/\s+/g, "_")}_strings.csv`,
      //     "text/csv",
      //   );
      // },

      exportStringsCSV: () => {
        const { graphs, listMetadata, lists, projectName } = get();
        let csvContent = "key,speaker,original_text,translation\n";

        // Gather a flat pool of all registered global variables to evaluate data types dynamically
        const variableListIds = Object.keys(listMetadata || {}).filter(
          (key) => listMetadata[key] === "variable",
        );
        const allAvailableVars = variableListIds.flatMap(
          (key) => lists[key] || [],
        );

        Object.entries(graphs).forEach(([graphName, graphData]) => {
          graphData.nodes.forEach((node) => {
            // ── A. SCENE NODES: Dialogue lines & Options ──
            if (node.type === "scene" && node.data) {
              if (Array.isArray(node.data.dialogueLines)) {
                node.data.dialogueLines.forEach((line, index) => {
                  const key = `${graphName}.${node.id}.line_${index}`;
                  const speaker = line.speaker || "Narrator";
                  const text = line.text || "";
                  csvContent += `${escapeCSV(key)},${escapeCSV(speaker)},${escapeCSV(text)},""\n`;
                });
              }

              if (Array.isArray(node.data.choices)) {
                node.data.choices.forEach((choice, index) => {
                  const key = `${graphName}.${node.id}.choice_${index}`;
                  const text = choice.text || "";
                  csvContent += `${escapeCSV(key)},"Player",${escapeCSV(text)},""\n`;
                });
              }
            }

            // ── B. LOGIC NODES: Text Comparison Literals (Fixes Bug #7) ──
            if (
              node.type === "logic" &&
              node.data &&
              Array.isArray(node.data.conditions)
            ) {
              node.data.conditions.forEach((cond, index) => {
                // Check if the condition targets an explicit 'string' (Text) variable type
                const targetedVar = allAvailableVars.find(
                  (v) => v.name === cond.check_flag,
                );

                if (targetedVar && targetedVar.type === "string") {
                  const key = `${graphName}.${node.id}.condition_${index}`;
                  const text = cond.value || "";
                  csvContent += `${escapeCSV(key)},"Logic_Value",${escapeCSV(text)},""\n`;
                }
              });
            }

            // ── C. JUMP NODES: Dynamic Target Graph References (Fixes Bug #7) ──
            if (node.type === "jump" && node.data && node.data.targetGraph) {
              const key = `${graphName}.${node.id}.targetGraph`;
              const text = node.data.targetGraph;
              csvContent += `${escapeCSV(key)},"Jump_Target",${escapeCSV(text)},""\n`;
            }
          });
        });

        triggerDownload(
          csvContent,
          `${projectName.toLowerCase().replace(/\s+/g, "_")}_strings.csv`,
          "text/csv",
        );
      },

      // -----------------------------------------------------------------------
      // GROUPING
      // -----------------------------------------------------------------------

      // groupSelectedNodes: (baseColor = "#6366f1") => {
      //   const { activeGraph, graphs } = get();
      //   const currentGraph = graphs[activeGraph];
      //   const selectedNodes = currentGraph.nodes.filter(
      //     (n) => n.selected && n.type !== "collection",
      //   );
      //   if (selectedNodes.length < 1) return;

      //   const title = window.prompt("Collection Name:", "New Chapter");
      //   if (!title) return;

      //   const absPositions = selectedNodes.map((n) =>
      //     getAbsolutePos(n, currentGraph.nodes),
      //   );
      //   const minX = Math.min(...absPositions.map((p) => p.x));
      //   const minY = Math.min(...absPositions.map((p) => p.y));
      //   const maxX = Math.max(...absPositions.map((p) => p.x + 260));
      //   const maxY = Math.max(...absPositions.map((p) => p.y + 200));
      //   const padding = 60;
      //   const groupId = crypto.randomUUID();

      //   const groupNode = {
      //     id: groupId,
      //     type: "collection",
      //     position: { x: minX - padding, y: minY - padding },
      //     zIndex: -50,
      //     style: {
      //       width: maxX - minX + padding * 2,
      //       height: maxY - minY + padding * 2,
      //     },
      //     data: { title, color: baseColor },
      //   };

      //   const nextNodes = currentGraph.nodes.map((node) => {
      //     if (node.selected && node.type !== "collection") {
      //       const abs = getAbsolutePos(node, currentGraph.nodes);
      //       return {
      //         ...node,
      //         parentId: groupId,
      //         extent: "parent",
      //         zIndex: 10,
      //         position: {
      //           x: abs.x - (minX - padding),
      //           y: abs.y - (minY - padding),
      //         },
      //         selected: false,
      //       };
      //     }
      //     return node;
      //   });

      //   set((state) => ({
      //     graphs: {
      //       ...state.graphs,
      //       [activeGraph]: {
      //         ...currentGraph,
      //         nodes: [groupNode, ...nextNodes],
      //       },
      //     },
      //   }));
      // },

      groupSelectedNodes: (baseColor = "#6366f1") => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];

        // Isolate valid selected layout nodes (ignore collection boundaries themselves)
        const selectedNodes = currentGraph.nodes.filter(
          (n) => n.selected && n.type !== "collection",
        );
        if (selectedNodes.length < 1) return;

        const title = window.prompt("Collection Name:", "New Chapter");
        if (!title) return;

        // 1. Compute bounds using correct absolute workspace tracking coordinates
        const absPositions = selectedNodes.map((n) =>
          getAbsolutePos(n, currentGraph.nodes),
        );
        const minX = Math.min(...absPositions.map((p) => p.x));
        const minY = Math.min(...absPositions.map((p) => p.y));
        const maxX = Math.max(...absPositions.map((p) => p.x + 260));
        const maxY = Math.max(...absPositions.map((p) => p.y + 200));
        const padding = 60;
        const groupId = crypto.randomUUID();

        // 2. Instantiate the new parent wrapper node asset
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

        // 3. REPARENTING ENGINE: Cleanly dissociate children from old groups first
        const nextNodes = currentGraph.nodes.map((node) => {
          if (node.selected && node.type !== "collection") {
            const abs = getAbsolutePos(node, currentGraph.nodes);

            return {
              ...node,
              // DISSOCIATION STEP: Erase old parent hooks before assigning the new container target
              parentId: undefined,
              extent: undefined,

              // REPARENT STEP: Mount cleanly inside the newly registered group context
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
              // Parent macro container element must appear first in array sequence
              nodes: [groupNode, ...nextNodes],
            },
          },
        }));
      },

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

      // -----------------------------------------------------------------------
      // EXPORT / IMPORT
      // -----------------------------------------------------------------------

      // exportGameData: () => {
      //   const {
      //     graphs,
      //     lists,
      //     schema,
      //     projectName,
      //     conversationRegistry,
      //     locales,
      //     startGraph,
      //   } = get();

      //   const exportGraphs = {};
      //   Object.entries(graphs).forEach(([name, data]) => {
      //     const startNode = data.nodes.find((n) => n.type === "start");
      //     const startEdge = data.edges.find((e) => e.source === startNode?.id);

      //     exportGraphs[name] = {
      //       startNode: startEdge ? startEdge.target : null,
      //       nodes: data.nodes
      //         .filter((n) => n.type !== "start")
      //         .map((node) => ({
      //           id: node.id,
      //           type: node.type,
      //           data: node.data,
      //           next: data.edges
      //             .filter((e) => e.source === node.id)
      //             .reduce((acc, e) => {
      //               const key =
      //                 !e.sourceHandle || e.sourceHandle === "default-output"
      //                   ? "next"
      //                   : e.sourceHandle;
      //               acc[key] = e.target;
      //               return acc;
      //             }, {}),
      //         })),
      //     };
      //   });

      //   const bundle = {
      //     version: "2.0",
      //     metadata: {
      //       projectName,
      //       exportedAt: new Date().toISOString(),
      //       startGraph,
      //     },
      //     registry: conversationRegistry,
      //     locales, // Injects translation matrix into game build files
      //     variables: lists.variables.reduce((acc, v) => {
      //       acc[v.name] = { type: v.type, default: v.defaultValue };
      //       return acc;
      //     }, {}),
      //     graphs: exportGraphs,
      //   };

      //   triggerDownload(
      //     JSON.stringify(bundle, null, 2),
      //     `${projectName.replace(/\s+/g, "_").toLowerCase()}_export.json`,
      //     "application/json",
      //   );
      // },

      exportGameData: () => {
        const {
          graphs,
          lists,
          listMetadata,
          projectName,
          conversationRegistry,
          locales,
          startGraph,
        } = get();

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

        // Collect variables from ALL containers marked as 'variable'
        const compiledVariables = Object.entries(lists)
          .filter(([id]) => listMetadata[id] === "variable")
          .reduce((acc, [_, items]) => {
            items.forEach((v) => {
              acc[v.name] = { type: v.type, default: v.defaultValue };
            });
            return acc;
          }, {});

        const bundle = {
          version: "2.0",
          metadata: {
            projectName,
            exportedAt: new Date().toISOString(),
            startGraph,
          },
          registry: conversationRegistry,
          locales,
          variables: compiledVariables, // Safely compiled global state fields
          graphs: exportGraphs,
        };

        triggerDownload(
          JSON.stringify(bundle, null, 2),
          `${projectName.replace(/\s+/g, "_").toLowerCase()}_export.json`,
          "application/json",
        );
      },

      exportProject: () => {
        const {
          graphs,
          lists,
          schema,
          projectName,
          conversationRegistry,
          graphFolders,
          startGraph,
          languages,
          currentLanguage,
          locales,
        } = get();
        const projectData = {
          type: "LORE_PROJECT_FILE",
          version: "2.0.0",
          projectName,
          startGraph,
          graphFolders,
          conversationRegistry,
          graphs,
          lists,
          schema,
          languages,
          currentLanguage,
          locales,
        };
        triggerDownload(
          JSON.stringify(projectData, null, 2),
          `${projectName.toLowerCase().replace(/\s+/g, "_")}.lore`,
          "application/json",
        );
      },

      // importProject: (jsonData) => {
      //   try {
      //     const data = JSON.parse(jsonData);
      //     if (data.type !== "LORE_PROJECT_FILE") {
      //       alert("Invalid file format. Please upload a .lore project file.");
      //       return;
      //     }
      //     set({
      //       graphs: data.graphs || { "Main Story": createEmptyGraph() },
      //       lists: data.lists || get().lists,
      //       schema: data.schema || get().schema,
      //       projectName: data.projectName || get().projectName,
      //       startGraph: data.startGraph || "Main Story",
      //       graphFolders: data.graphFolders || [],
      //       conversationRegistry: data.conversationRegistry || {},
      //       languages: data.languages || ["en"],
      //       currentLanguage: data.currentLanguage || "en",
      //       locales: data.locales || { en: {} },
      //       activeGraph: Object.keys(data.graphs || {})[0] || "Main Story",
      //       editingNodeId: null,
      //     });
      //     alert("Project loaded successfully!");
      //   } catch {
      //     alert("Error parsing the file. Is it valid JSON?");
      //   }
      // },

      importProject: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (data.type !== "LORE_PROJECT_FILE") {
            alert(
              "Invalid file format. Please upload a valid .lore project source file.",
            );
            return;
          }

          // 1. DATA SANITIZATION ENGINE: Reconstruct and validate every incoming graph
          const rawGraphs = data.graphs || { "Main Story": createEmptyGraph() };
          const sanitizedGraphs = {};

          Object.entries(rawGraphs).forEach(([graphName, graphObj]) => {
            sanitizedGraphs[graphName] = {
              // Ensure nodes and edges are always valid arrays
              nodes: Array.isArray(graphObj?.nodes) ? graphObj.nodes : [],
              edges: Array.isArray(graphObj?.edges) ? graphObj.edges : [],

              // Repair or apply default viewport settings to protect canvas cameras
              viewport:
                graphObj?.viewport && typeof graphObj.viewport === "object"
                  ? {
                      x:
                        typeof graphObj.viewport.x === "number"
                          ? graphObj.viewport.x
                          : 0,
                      y:
                        typeof graphObj.viewport.y === "number"
                          ? graphObj.viewport.y
                          : 0,
                      zoom:
                        typeof graphObj.viewport.zoom === "number"
                          ? graphObj.viewport.zoom
                          : 1,
                    }
                  : { x: 0, y: 0, zoom: 1 },

              // Preserving graph organizational tracking metadata safely
              folder:
                typeof graphObj?.folder === "string" ? graphObj.folder : null,
            };
          });

          // 2. STATE REHYDRATION WITH FALLBACK PROTECTION
          set({
            projectName:
              typeof data.projectName === "string"
                ? data.projectName
                : "Restored Lore Project",
            startGraph:
              typeof data.startGraph === "string"
                ? data.startGraph
                : Object.keys(sanitizedGraphs)[0] || "Main Story",
            graphs: sanitizedGraphs,

            // Fallback arrays and objects ensuring safe operations on deep maps
            lists:
              data.lists && typeof data.lists === "object"
                ? data.lists
                : get().lists,
            schema:
              data.schema && typeof data.schema === "object"
                ? data.schema
                : get().schema,
            graphFolders: Array.isArray(data.graphFolders)
              ? data.graphFolders
              : [],
            conversationRegistry:
              data.conversationRegistry &&
              typeof data.conversationRegistry === "object"
                ? data.conversationRegistry
                : {},

            // Rehydrating Localization Matrices smoothly
            languages: Array.isArray(data.languages) ? data.languages : ["en"],
            currentLanguage:
              typeof data.currentLanguage === "string"
                ? data.currentLanguage
                : "en",
            locales:
              data.locales && typeof data.locales === "object"
                ? data.locales
                : { en: {} },

            // Clear current focused viewport node targets
            activeGraph: Object.keys(sanitizedGraphs)[0] || "Main Story",
            editingNodeId: null,
          });

          alert("Project loaded and structural validation complete!");
        } catch (error) {
          console.error("LoreFlow Ingestion Error:", error);
          alert(
            "Fatal Error parsing the file. Please verify the integrity of your JSON string payload.",
          );
        }
      },

      // onViewportChange: (viewport) => {
      //   const { activeGraph, graphs } = get();
      //   if (!graphs[activeGraph]) return;

      //   set((state) => ({
      //     graphs: {
      //       ...state.graphs,
      //       [activeGraph]: {
      //         ...state.graphs[activeGraph],
      //         viewport: viewport,
      //       },
      //     },
      //   }));
      // },

      // ── Inside useLoreStore in store.js ──
      onViewportChange: (viewport) => {
        const { activeGraph, graphs } = get();
        if (!graphs[activeGraph]) return;

        // Since this now fires ONLY when movement ends, the frame-drop cascade is gone
        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...state.graphs[activeGraph],
              viewport: {
                x: viewport.x,
                y: viewport.y,
                zoom: viewport.zoom,
              },
            },
          },
        }));
      },
    }),
    {
      name: "lore-engine-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
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

function triggerDownload(content, filename, contentType = "application/json") {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.useLoreStore = useLoreStore;
