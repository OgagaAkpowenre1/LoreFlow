import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "reactflow";

// ---------------------------------------------------------------------------
// UTILS & SANITIZATION HELPERS
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
  folder: null, // Fixed Bug #9: Explicit schema consistency initialization
});

const escapeCSV = (text) => {
  if (!text) return '""';
  // Fixed Bug #7: Escapes standard newlines to guarantee Excel compatibility
  const escaped = text.toString().replace(/\n/g, " ").replace(/"/g, '""');
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
// STORE ARCHITECTURE
// ---------------------------------------------------------------------------

export const useLoreStore = create(
  persist(
    (set, get) => ({
      // GLOBAL STATE
      projectName: "Untitled Lore",
      activeGraph: "Main Story",
      startGraph: "Main Story",
      graphs: { "Main Story": createEmptyGraph() },
      graphFolders: [],
      activeFolder: null,
      conversationRegistry: {},
      editingNodeId: null,
      sidebarOpen: true, // Restored state property

      // LOCALIZATION STATE
      languages: ["en"],
      currentLanguage: "en",
      locales: { en: {} },

      // SCHEMA DEFINITIONS
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

      // Legacy holders preserved exclusively for fallback hydration context mapping
      nodes: [],
      edges: [],

      // -----------------------------------------------------------------------
      // RESTORED ENGINE HELPERS
      // -----------------------------------------------------------------------

      /** Returns all node IDs reachable downstream from nodeId via edges. */
      getConnectedDescendants: (nodeId) => {
        const { activeGraph, graphs } = get();
        const { edges } = graphs[activeGraph] || { edges: [] };
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

      // PROJECT LIFECYCLE MANAGEMENT
      updateProjectName: (name) => set({ projectName: name }),
      setActiveGraph: (name) => set({ activeGraph: name, editingNodeId: null }),
      setStartGraph: (name) => set({ startGraph: name }),
      setEditingNode: (id) => set({ editingNodeId: id }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })), // Restored Action

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

      // GRAPH PERSISTENCE OPERATIONS
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
            newGraphs[key] = {
              ...newGraphs[key],
              nodes: newGraphs[key].nodes.map((node) => {
                if (
                  node.type === "jump" &&
                  node.data?.targetGraph === oldName
                ) {
                  return {
                    ...node,
                    data: { ...node.data, targetGraph: newName },
                  };
                }
                return node;
              }),
            };
          });

          const newLocales = { ...state.locales };
          Object.keys(newLocales).forEach((lang) => {
            const updatedBlock = {};
            Object.keys(newLocales[lang]).forEach((key) => {
              if (key.startsWith(`${oldName}.`)) {
                const tracking = `${newName}.${key.slice(oldName.length + 1)}`;
                updatedBlock[tracking] = newLocales[lang][key];
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

        Object.keys(graphs).forEach((gKey) => {
          graphs[gKey] = {
            ...graphs[gKey],
            nodes: graphs[gKey].nodes.map((node) =>
              node.type === "jump" && node.data?.targetGraph === name
                ? { ...node, data: { ...node.data, targetGraph: "" } }
                : node,
            ),
          };
        });

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

      // FOLDER ARRANGEMENT UTILITIES
      addFolder: (name) =>
        set((state) => ({ graphFolders: [...state.graphFolders, name] })),

      renameFolder: (oldName, newName) =>
        set((state) => {
          const newFolders = state.graphFolders.map((f) =>
            f === oldName ? newName : f,
          );
          const newGraphs = { ...state.graphs };

          Object.keys(newGraphs).forEach((gKey) => {
            if (newGraphs[gKey].folder === oldName) {
              newGraphs[gKey] = { ...newGraphs[gKey], folder: newName };
            }
          });
          return { graphFolders: newFolders, graphs: newGraphs };
        }),

      deleteFolder: (folderName) =>
        set((state) => {
          const newGraphs = { ...state.graphs };
          Object.keys(newGraphs).forEach((gKey) => {
            if (newGraphs[gKey].folder === folderName) {
              newGraphs[gKey] = { ...newGraphs[gKey], folder: null };
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

      // REACT FLOW GRAPH LISTENERS
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

      // NODE LIFECYCLE MANAGEMENT MUTATORS
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
          const currentGraph = state.graphs[activeGraph];
          if (!currentGraph) return {};
          let filteredNodes = currentGraph.nodes;
          let filteredEdges = currentGraph.edges;

          if (type === "start") {
            const oldStartNode = currentGraph.nodes.find(
              (n) => n.type === "start",
            );
            if (oldStartNode) {
              filteredNodes = currentGraph.nodes.filter(
                (n) => n.id !== oldStartNode.id,
              );
              filteredEdges = currentGraph.edges.filter(
                (e) =>
                  e.source !== oldStartNode.id && e.target !== oldStartNode.id,
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

      updateNodeData: (nodeId, newData) => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        if (!currentGraph) return;
        const oldNode = currentGraph.nodes.find((n) => n.id === nodeId);
        let newEdges = [...currentGraph.edges];

        if (oldNode?.type === "scene") {
          const oldChoices = oldNode.data?.choices || [];
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
            let defaultSaved = false;
            newEdges = newEdges.reduce((acc, edge) => {
              if (edge.source === nodeId) {
                if (!defaultSaved) {
                  acc.push({
                    ...edge,
                    sourceHandle: "default-output",
                    label: "",
                    style: { ...edge.style, stroke: "#9ca3af" },
                  });
                  defaultSaved = true;
                }
              } else {
                acc.push(edge);
              }
              return acc;
            }, []);
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

      // RESTORED LOGIC SUB-CONDITION MUTATORS
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

      // RESTORED CUSTOM SCHEMA FIELD BUILDERS
      addFieldToSchema: (target, newField) =>
        set((state) => ({
          schema: {
            ...state.schema,
            [target]: [...(state.schema[target] || []), newField],
          },
        })),

      removeFieldFromSchema: (target, fieldId) =>
        set((state) => ({
          schema: {
            ...state.schema,
            [target]: (state.schema[target] || []).filter(
              (f) => f.id !== fieldId,
            ),
          },
        })),

      // RESTORED META-LIST REGISTRATION UTILITIES
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
            // finalItem = { ...newItem, defaultValue: defVal };

            finalItem = {
              ...newItem,
              defaultValue: defVal,
              // ✅ CRITICAL INTERCEPT: Seed a safe, empty array instance for string variables right at birth
              ...(newItem.type === "string" ? { allowedValues: [] } : {}),
            };
          }
          return {
            lists: {
              ...state.lists,
              [listId]: [...(state.lists[listId] || []), finalItem],
            },
          };
        }),

      removeItemFromList: (listId, index) => {
        set((state) => {
          const itemToDelete = state.lists[listId][index];
          const isVariable = state.listMetadata[listId] === "variable";
          const deleteName = isVariable ? itemToDelete.name : itemToDelete;

          const newList = state.lists[listId].filter((_, i) => i !== index);
          const affectedNodeFields = state.schema.nodeFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);
          const affectedSeqFields = state.schema.sequenceFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);

          let graphHasChanges = false;
          const updatedGraphs = { ...state.graphs };

          Object.keys(updatedGraphs).forEach((gKey) => {
            let localGraphChanged = false;
            let currentEdges = [...updatedGraphs[gKey].edges];

            const updatedNodes = updatedGraphs[gKey].nodes.map((node) => {
              let nodeDataHasChanges = false;
              let newData = { ...node.data };

              affectedNodeFields.forEach((fieldId) => {
                if (newData[fieldId] === deleteName) {
                  newData[fieldId] = "";
                  nodeDataHasChanges = true;
                }
              });

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

                  if (isVariable && Array.isArray(newLine.variants)) {
                    const originalVarLength = newLine.variants.length;
                    newLine.variants = newLine.variants.filter(
                      (v) => v.check_flag !== deleteName,
                    );
                    if (newLine.variants.length !== originalVarLength)
                      lineHasChanges = true;
                  }

                  if (lineHasChanges) sequenceHasChanges = true;
                  return newLine;
                });
                if (sequenceHasChanges) {
                  newData.dialogueLines = updatedLines;
                  nodeDataHasChanges = true;
                }
              }

              if (newData.choices) {
                let choicesHasChanges = false;
                const updatedChoices = newData.choices.map((choice) => {
                  if (choice.text === deleteName) {
                    choicesHasChanges = true;
                    currentEdges = currentEdges.map((edge) =>
                      edge.source === node.id && edge.sourceHandle === choice.id
                        ? { ...edge, label: "" }
                        : edge,
                    );
                    return { ...choice, text: "" };
                  }
                  return choice;
                });
                if (choicesHasChanges) {
                  newData.choices = updatedChoices;
                  nodeDataHasChanges = true;
                }
              }

              if (isVariable) {
                if (node.type === "logic" && newData.conditions) {
                  const originalLength = newData.conditions.length;
                  newData.conditions = newData.conditions.filter(
                    (c) => c.check_flag !== deleteName,
                  );
                  if (newData.conditions.length !== originalLength)
                    nodeDataHasChanges = true;
                }
                if (newData.flags) {
                  const originalLength = newData.flags.length;
                  newData.flags = newData.flags.filter(
                    (f) => f.key !== deleteName,
                  );
                  if (newData.flags.length !== originalLength)
                    nodeDataHasChanges = true;
                }
              }

              if (nodeDataHasChanges) localGraphChanged = true;
              return nodeDataHasChanges ? { ...node, data: newData } : node;
            });

            if (localGraphChanged) {
              graphHasChanges = true;
              updatedGraphs[gKey] = {
                ...updatedGraphs[gKey],
                nodes: updatedNodes,
                edges: currentEdges,
              };
            }
          });

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
            conversationRegistry: newRegistry,
            ...(graphHasChanges ? { graphs: updatedGraphs } : {}),
          };
        });
      },

      updateItemInList: (listId, index, newValue) => {
        set((state) => {
          const oldValue = state.lists[listId][index];
          if (oldValue === newValue) return state;

          const newList = [...(state.lists[listId] || [])];
          newList[index] = newValue;

          let graphHasChanges = false;
          const updatedGraphs = { ...state.graphs };

          const affectedNodeFields = state.schema.nodeFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);
          const affectedSeqFields = state.schema.sequenceFields
            .filter((f) => f.listId === listId)
            .map((f) => f.id);

          Object.keys(updatedGraphs).forEach((gKey) => {
            let localGraphChanged = false;
            let currentEdges = [...updatedGraphs[gKey].edges];

            const updatedNodes = updatedGraphs[gKey].nodes.map((node) => {
              let nodeDataHasChanges = false;
              let newData = { ...node.data };

              affectedNodeFields.forEach((fieldId) => {
                if (newData[fieldId] === oldValue) {
                  newData[fieldId] = newValue;
                  nodeDataHasChanges = true;
                }
              });

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

                  if (Array.isArray(newLine.variants)) {
                    newLine.variants = newLine.variants.map((v) => {
                      if (v.value === oldValue) {
                        lineHasChanges = true;
                        return { ...v, value: newValue };
                      }
                      return v;
                    });
                  }

                  if (lineHasChanges) sequenceHasChanges = true;
                  return newLine;
                });
                if (sequenceHasChanges) {
                  newData.dialogueLines = updatedLines;
                  nodeDataHasChanges = true;
                }
              }

              if (node.type === "logic" && newData.conditions) {
                let logicHasChanges = false;
                const updatedConditions = newData.conditions.map((c) => {
                  if (c.value === oldValue) {
                    logicHasChanges = true;
                    return { ...c, value: newValue };
                  }
                  return c;
                });
                if (logicHasChanges) {
                  newData.conditions = updatedConditions;
                  nodeDataHasChanges = true;
                }
              }

              if (newData.flags) {
                let flagsHasChanges = false;
                const updatedFlags = newData.flags.map((f) => {
                  if (f.value === oldValue) {
                    flagsHasChanges = true;
                    return { ...f, value: newValue };
                  }
                  return f;
                });
                if (flagsHasChanges) {
                  newData.flags = updatedFlags;
                  nodeDataHasChanges = true;
                }
              }

              if (newData.choices) {
                let choicesHasChanges = false;
                const updatedChoices = newData.choices.map((choice) => {
                  if (choice.text === oldValue) {
                    choicesHasChanges = true;
                    currentEdges = currentEdges.map((edge) =>
                      edge.source === node.id && edge.sourceHandle === choice.id
                        ? { ...edge, label: newValue }
                        : edge,
                    );
                    return { ...choice, text: newValue };
                  }
                  return choice;
                });
                if (choicesHasChanges) {
                  newData.choices = updatedChoices;
                  nodeDataHasChanges = true;
                }
              }

              if (nodeDataHasChanges) localGraphChanged = true;
              return nodeDataHasChanges ? { ...node, data: newData } : node;
            });

            if (localGraphChanged) {
              graphHasChanges = true;
              updatedGraphs[gKey] = {
                ...updatedGraphs[gKey],
                nodes: updatedNodes,
                edges: currentEdges,
              };
            }
          });

          return {
            lists: { ...state.lists, [listId]: newList },
            ...(graphHasChanges ? { graphs: updatedGraphs } : {}),
          };
        });
      },

      updateVariable: (listId, index, field, value) => {
        set((state) => {
          const newList = [...(state.lists[listId] || [])];
          const oldVar = newList[index];
          const oldVarName = oldVar?.name;
          const newVarName = field === "name" ? value : oldVarName;

          const updatedVar = { ...oldVar, [field]: value };
          // if (field === "type") {
          //   if (value === "number") updatedVar.defaultValue = 0;
          //   else if (value === "string") updatedVar.defaultValue = "";
          //   else updatedVar.defaultValue = false;
          // }
          if (field === "type") {
            if (value === "number") {
              updatedVar.defaultValue = 0;
              delete updatedVar.allowedValues; // Clear old string enum configurations
            } else if (value === "string") {
              updatedVar.defaultValue = "";
              updatedVar.allowedValues = []; // Initialize clean enum matrix array
            } else {
              updatedVar.defaultValue = false;
              delete updatedVar.allowedValues; // Clear old string enum configurations
            }
          }
          newList[index] = updatedVar;

          const newRegistry = { ...state.conversationRegistry };
          let updatedGraphs = { ...state.graphs };

          const hasRenamed = field === "name" && oldVarName !== newVarName;
          const hasTypeChanged = field === "type" && oldVar?.type !== value;
          const requiresGraphEmit = hasRenamed || hasTypeChanged;

          if (hasRenamed) {
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

            Object.keys(updatedGraphs).forEach((gKey) => {
              let nodeStructureChanged = false;
              const mappedNodes = updatedGraphs[gKey].nodes.map((node) => {
                let dataChanged = false;
                let newData = { ...node.data };

                if (node.type === "logic" && newData.conditions) {
                  newData.conditions = newData.conditions.map((c) => {
                    if (c.check_flag === oldVarName) {
                      dataChanged = true;
                      return { ...c, check_flag: newVarName };
                    }
                    return c;
                  });
                }

                if (newData.flags) {
                  newData.flags = newData.flags.map((f) => {
                    if (f.key === oldVarName) {
                      dataChanged = true;
                      return { ...f, key: newVarName };
                    }
                    return f;
                  });
                }

                if (
                  newData.dialogueLines &&
                  Array.isArray(newData.dialogueLines)
                ) {
                  newData.dialogueLines = newData.dialogueLines.map((line) => {
                    if (Array.isArray(line.variants)) {
                      let lineVarChanged = false;
                      const updatedVars = line.variants.map((v) => {
                        if (v.check_flag === oldVarName) {
                          lineVarChanged = true;
                          return { ...v, check_flag: newVarName };
                        }
                        return v;
                      });
                      if (lineVarChanged) {
                        dataChanged = true;
                        return { ...line, variants: updatedVars };
                      }
                    }
                    return line;
                  });
                }

                if (dataChanged) nodeStructureChanged = true;
                return dataChanged ? { ...node, data: newData } : node;
              });

              if (nodeStructureChanged) {
                updatedGraphs[gKey] = {
                  ...updatedGraphs[gKey],
                  nodes: mappedNodes,
                };
              }
            });
          }

          if (hasTypeChanged) {
            let defaultOp = "==";
            let defaultRegVal =
              value === "number" ? "0" : value === "string" ? "" : "true";

            Object.keys(newRegistry).forEach((npcId) => {
              newRegistry[npcId] = newRegistry[npcId].map((rule) =>
                rule.condition?.variable === oldVarName
                  ? {
                      ...rule,
                      condition: {
                        ...rule.condition,
                        op: defaultOp,
                        value: defaultRegVal,
                      },
                    }
                  : rule,
              );
            });

            Object.keys(updatedGraphs).forEach((gKey) => {
              let graphChanged = false;
              const updatedNodes = updatedGraphs[gKey].nodes.map((node) => {
                let nodeChanged = false;
                let newData = { ...node.data };

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

                if (newData.flags) {
                  newData.flags = newData.flags.map((f) => {
                    if (f.key === oldVarName) {
                      nodeChanged = true;
                      return {
                        ...f,
                        op: "=",
                        value:
                          value === "number"
                            ? 0
                            : value === "string"
                              ? ""
                              : true,
                      };
                    }
                    return f;
                  });
                }

                if (
                  newData.dialogueLines &&
                  Array.isArray(newData.dialogueLines)
                ) {
                  newData.dialogueLines = newData.dialogueLines.map((line) => {
                    if (Array.isArray(line.variants)) {
                      let lineVarChanged = false;
                      const updatedVars = line.variants.map((v) => {
                        if (v.check_flag === oldVarName) {
                          lineVarChanged = true;
                          return {
                            ...v,
                            operator: defaultOp,
                            value: value === "number" ? 0 : defaultRegVal,
                          };
                        }
                        return v;
                      });
                      if (lineVarChanged) {
                        nodeChanged = true;
                        return { ...line, variants: updatedVars };
                      }
                    }
                    return line;
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
            ...(requiresGraphEmit ? { graphs: updatedGraphs } : {}),
          };
        });
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

      // addRegistryRule: (npcId) =>
      //   set((state) => ({
      //     conversationRegistry: {
      //       ...state.conversationRegistry,
      //       [npcId]: [
      //         {
      //           id: crypto.randomUUID(),
      //           priority: 10,
      //           condition: { variable: "", op: "==", value: "" },
      //           graph: "",
      //         },
      //         ...state.conversationRegistry[npcId],
      //       ],
      //     },
      //   })),

      addRegistryRule: (npcId) =>
        set((state) => {
          const currentRules = state.conversationRegistry[npcId] || [];

          // Find the highest current priority value among existing rules for this NPC
          const maxPriority = currentRules.reduce(
            (max, rule) => Math.max(max, rule.priority || 0),
            0,
          );

          // Escalates by 10 above the current max (defaults to 10 if it's the first conditional rule)
          const nextPriority =
            maxPriority === 0 && currentRules.length <= 1
              ? 10
              : maxPriority + 10;

          return {
            conversationRegistry: {
              ...state.conversationRegistry,
              [npcId]: [
                {
                  id: crypto.randomUUID(),
                  priority: nextPriority,
                  condition: { variable: "", op: "==", value: "" },
                  graph: "",
                },
                ...currentRules,
              ],
            },
          };
        }),

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

      // RESTORED LOCALIZATION SYSTEM MATRIX ENGINE ACTIONS
      addLanguage: (code) =>
        set((state) => {
          const cleanedCode = code.trim().toLowerCase();
          if (!cleanedCode || state.languages.includes(cleanedCode)) return {};
          return {
            languages: [...state.languages, cleanedCode],
            locales: { ...state.locales, [cleanedCode]: {} },
          };
        }),

      updateTranslation: (lang, key, text) =>
        set((state) => ({
          locales: {
            ...state.locales,
            [lang]: { ...(state.locales[lang] || {}), [key]: text },
          },
        })),

      // COLLECTION / MOVEMENT UTILITIES
      removeFromGroup: () => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        if (!currentGraph) return;

        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...currentGraph,
              nodes: currentGraph.nodes.map((node) => {
                if (node.selected && node.parentId) {
                  const nodeAbsPos = getAbsolutePos(node, currentGraph.nodes);
                  return {
                    ...node,
                    parentId: undefined,
                    extent: undefined,
                    position: nodeAbsPos,
                  };
                }
                return node;
              }),
            },
          },
        }));
      },

      moveToCollection: (targetGroupId) => {
        // Restored Contextual Nesting Relocator Action
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        if (!currentGraph) return;
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

      groupSelectedNodes: (baseColor = "#6366f1") => {
        const { activeGraph, graphs } = get();
        const currentGraph = graphs[activeGraph];
        if (!currentGraph) return;
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

        set({
          graphs: {
            ...get().graphs,
            [activeGraph]: {
              ...currentGraph,
              nodes: [groupNode, ...nextNodes],
            },
          },
        });
      },

      onViewportChange: (viewport) => {
        const { activeGraph, graphs } = get();
        if (!graphs[activeGraph]) return;
        set((state) => ({
          graphs: {
            ...state.graphs,
            [activeGraph]: {
              ...state.graphs[activeGraph],
              viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
            },
          },
        }));
      },

      // METADATA CSV DICTIONARY EXTRACTION
      exportStringsCSV: () => {
        const { graphs, listMetadata, lists, projectName } = get();
        let csvContent = "key,speaker,original_text,translation\n";

        const variableListIds = Object.keys(listMetadata || {}).filter(
          (k) => listMetadata[k] === "variable",
        );
        const allAvailableVars = variableListIds.flatMap((k) => lists[k] || []);

        Object.entries(graphs).forEach(([graphName, graphData]) => {
          graphData.nodes.forEach((node) => {
            if (node.type === "scene" && node.data) {
              if (Array.isArray(node.data.dialogueLines)) {
                node.data.dialogueLines.forEach((line, idx) => {
                  csvContent += `${escapeCSV(`${graphName}.${node.id}.line_${idx}`)},${escapeCSV(line.speaker || "Narrator")},${escapeCSV(line.text || "")},""\n`;

                  if (Array.isArray(line.variants)) {
                    line.variants.forEach((v, vIdx) => {
                      const variantKey = `${graphName}.${node.id}.line_${idx}.var_${vIdx}`;
                      const conditionalLabel = `${line.speaker || "Narrator"} (IF ${v.check_flag} ${v.operator} ${v.value})`;
                      csvContent += `${escapeCSV(variantKey)},${escapeCSV(conditionalLabel)},${escapeCSV(v.text || "")},""\n`;
                    });
                  }
                });
              }
              if (Array.isArray(node.data.choices)) {
                node.data.choices.forEach((c, idx) => {
                  csvContent += `${escapeCSV(`${graphName}.${node.id}.choice_${idx}`)},"Player",${escapeCSV(c.text || "")},""\n`;
                });
              }
            }
            if (
              node.type === "logic" &&
              node.data &&
              Array.isArray(node.data.conditions)
            ) {
              node.data.conditions.forEach((cond, idx) => {
                const target = allAvailableVars.find(
                  (v) => v.name === cond.check_flag,
                );
                if (target && target.type === "string") {
                  csvContent += `${escapeCSV(`${graphName}.${node.id}.condition_${idx}`)},"Logic_Value",${escapeCSV(cond.value || "")},""\n`;
                }
              });
            }
            if (node.type === "jump" && node.data && node.data.targetGraph) {
              csvContent += `${escapeCSV(`${graphName}.${node.id}.targetGraph`)},"Jump_Target",${escapeCSV(node.data.targetGraph)},""\n`;
            }
          });
        });

        triggerDownload(
          csvContent,
          `${projectName.toLowerCase().replace(/\s+/g, "_")}_strings.csv`,
          "text/csv",
        );
      },

      // ENGINE COMPILED EXPORTER
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
              .filter((n) => n.type !== "start" && n.type !== "collection")
              .map((node) => {
                const nodeEdges = data.edges.filter(
                  (e) => e.source === node.id,
                );
                let nextMapping = nodeEdges.reduce((acc, e) => {
                  const key =
                    !e.sourceHandle || e.sourceHandle === "default-output"
                      ? "next"
                      : e.sourceHandle;
                  acc[key] = e.target;
                  return acc;
                }, {});

                if (node.type === "logic") {
                  if (!nextMapping["true"])
                    nextMapping["true"] = nextMapping["false"] || null;
                  if (!nextMapping["false"])
                    nextMapping["false"] = nextMapping["true"] || null;
                }

                return {
                  id: node.id,
                  type: node.type,
                  data: node.data,
                  next: nextMapping,
                };
              }),
          };
        });

        const compiledVariables = Object.entries(lists)
          .filter(([id]) => listMetadata[id] === "variable")
          .reduce((acc, [_, items]) => {
            items.forEach((v) => {
              acc[v.name] = {
                type: v.type,
                default: v.defaultValue,
                // Expose choices to your game engine runtime if they exist
                ...(v.type === "string" && Array.isArray(v.allowedValues)
                  ? { allowedValues: v.allowedValues }
                  : {}),
              };
            });
            return acc;
          }, {});

        // ── NEW: Dynamic sorting sweep by priority descending for production compilation ──
        const compiledRegistry = {};
        Object.entries(conversationRegistry).forEach(([npcId, rules]) => {
          compiledRegistry[npcId] = [...rules].sort(
            (a, b) => b.priority - a.priority,
          );
        });

        const bundle = {
          version: "2.0",
          metadata: {
            projectName,
            exportedAt: new Date().toISOString(),
            startGraph,
          },
          registry: compiledRegistry,
          locales,
          variables: compiledVariables,
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
          sidebarOpen,
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
          sidebarOpen,
        };
        triggerDownload(
          JSON.stringify(projectData, null, 2),
          `${projectName.toLowerCase().replace(/\s+/g, "_")}.lore`,
          "application/json",
        );
      },

      importProject: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (data.type !== "LORE_PROJECT_FILE")
            return alert("Invalid file format.");

          const rawGraphs = data.graphs || { "Main Story": createEmptyGraph() };
          const sanitizedGraphs = {};

          Object.entries(rawGraphs).forEach(([name, gObj]) => {
            const verifiedNodes = (Array.isArray(gObj?.nodes) ? gObj.nodes : [])
              .filter((n) => n && typeof n === "object" && n.id && n.type)
              .map((n) => ({ ...n, data: n.data || {} }));

            const xVal = Number(gObj?.viewport?.x);
            const yVal = Number(gObj?.viewport?.y);
            const zVal = Number(gObj?.viewport?.zoom);

            sanitizedGraphs[name] = {
              nodes: verifiedNodes,
              edges: Array.isArray(gObj?.edges) ? gObj.edges : [],
              viewport: {
                x: Number.isNaN(xVal) ? 0 : xVal,
                y: Number.isNaN(yVal) ? 0 : yVal,
                zoom: Number.isNaN(zVal) || zVal <= 0 ? 1 : zVal,
              },
              folder: typeof gObj?.folder === "string" ? gObj.folder : null,
            };
          });

          set({
            projectName:
              typeof data.projectName === "string"
                ? data.projectName
                : "Restored Project",
            startGraph:
              typeof data.startGraph === "string"
                ? data.startGraph
                : Object.keys(sanitizedGraphs)[0],
            graphs: sanitizedGraphs,
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
            languages: Array.isArray(data.languages) ? data.languages : ["en"],
            currentLanguage:
              typeof data.currentLanguage === "string"
                ? data.currentLanguage
                : "en",
            locales:
              data.locales && typeof data.locales === "object"
                ? data.locales
                : { en: {} },
            sidebarOpen:
              typeof data.sidebarOpen === "boolean" ? data.sidebarOpen : true,
            activeGraph: Object.keys(sanitizedGraphs)[0],
            editingNodeId: null,
          });
          alert("Project successfully validated and imported!");
        } catch (e) {
          alert("Fatal error parsing file data.");
        }
      },
    }),
    {
      name: "lore-engine-storage",
      storage: createJSONStorage(() => localStorage),
      // Restored Legacy Automated Data-migration pipeline
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
// PRIVATE HELPERS & GLOBAL BINDINGS
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

window.useLoreStore = useLoreStore; // Restored Global window handle layout debugging access point
