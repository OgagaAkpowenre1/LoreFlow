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
      projectName: "Untitled Lore",
      activeGraph: "Main Story",
      startGraph: "Main Story",
      graphs: { "Main Story": createEmptyGraph() },
      graphFolders: [],
      activeFolder: null,
      conversationRegistry: {},
      editingNodeId: null,

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

      // PROJECT LIFECYCLE MANAGEMENT
      updateProjectName: (name) => set({ projectName: name }),
      setActiveGraph: (name) => set({ activeGraph: name, editingNodeId: null }),
      setStartGraph: (name) => set({ startGraph: name }),
      setEditingNode: (id) => set({ editingNodeId: id }),

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

        // Fixed Bug #5: Dynamic cascading scrub for Jump nodes pointing to deleted space
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
              // Fixed Reference Mutation: Clones graph reference explicitly before mutating nested keys
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
              // Fixed Reference Mutation: Clones graph reference cleanly
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
            return; // Fixed Bug #3: Defensive structural enforcement against undefined ports
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
          let filteredNodes = currentGraph.nodes;
          let filteredEdges = currentGraph.edges;

          if (type === "start") {
            // Fixed Bug #4: Dynamic sweep drops orphaned edge lines when re-assigning entry nodes
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

      deleteNode: (nodeId) => {
        // Fixed Stale Closure Risk: Resolves confirmation queries *prior* to thread state context evaluation
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
            // Fixed Choice Nesting Cascades: Filters down execution branches safely to avoid duplicate overlays
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

      // SCHEMA DISCOVERY LIST OPERATIONS
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
            finalItem = { ...newItem, defaultValue: defVal };
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
                    // Fixed Edge Text Sync Bug: Clears visual edge routing tags matching dropped items
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
              // Reference Safety: Clones inner graph wrapper correctly
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
            ...(graphHasChanges ? { graphs: updatedGraphs } : {}), // Fixed Bug #2: Conditional state reference emission
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
                    // Fixed Edge Text Sync Bug: Modifies active edge visual strings matching option overrides
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
              // Reference Safety: Rebuilds nested objects properly
              updatedGraphs[gKey] = {
                ...updatedGraphs[gKey],
                nodes: updatedNodes,
                edges: currentEdges,
              };
            }
          });

          return {
            lists: { ...state.lists, [listId]: newList },
            ...(graphHasChanges ? { graphs: updatedGraphs } : {}), // Fixed Bug #2: Pure mutation reference emit gating
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

          const hasRenamed = field === "name" && oldVarName !== newVarName;
          const hasTypeChanged = field === "type" && oldVar.type !== value;
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
                  // Fixed Unconditional Trigger Bug: Node properties copy flag values only if direct matches align
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
            ...(requiresGraphEmit ? { graphs: updatedGraphs } : {}), // Fixed Bug #1: Stops UI tree freezes during variable configuration
          };
        });
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
                  // Fixed Bug #3: Calculates precise deep global positions using absolute positioning vectors
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
              parentId: groupId, // Fixed structural overlap redundancies
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
            // Optimization: Filters out visual presentation artifacts like collections before serialization
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
      //     if (data.type !== "LORE_PROJECT_FILE") return alert("Invalid file format.");

      //     const rawGraphs = data.graphs || { "Main Story": createEmptyGraph() };
      //     const sanitizedGraphs = {};

      //     Object.entries(rawGraphs).forEach(([name, gObj]) => {
      //       // Fixed Bug #8: Deep structural field defenses inside upload ingestion
      //       const verifiedNodes = (Array.isArray(gObj?.nodes) ? gObj.nodes : [])
      //         .filter((n) => n && typeof n === "object" && n.id && n.type)
      //         .map((n) => ({ ...n, data: n.data || {} }));

      //       sanitizedGraphs[name] = {
      //         nodes: verifiedNodes,
      //         edges: Array.isArray(gObj?.edges) ? gObj.edges : [],
      //         viewport: gObj?.viewport && typeof gObj.viewport === "object"
      //           ? { x: Number(gObj.viewport.x) || 0, y: Number(gObj.viewport.y) || 0, zoom: Number(gObj.viewport.zoom) || 1 }
      //           : { x: 0, y: 0, zoom: 1 },
      //         folder: typeof gObj?.folder === "string" ? gObj.folder : null,
      //       };
      //     });

      //     set({
      //       projectName: typeof data.projectName === "string" ? data.projectName : "Restored Project",
      //       startGraph: typeof data.startGraph === "string" ? data.startGraph : Object.keys(sanitizedGraphs)[0],
      //       graphs: sanitizedGraphs,
      //       lists: data.lists && typeof data.lists === "object" ? data.lists : get().lists,
      //       schema: data.schema && typeof data.schema === "object" ? data.schema : get().schema,
      //       graphFolders: Array.isArray(data.graphFolders) ? data.graphFolders : [],
      //       conversationRegistry: data.conversationRegistry && typeof data.conversationRegistry === "object" ? data.conversationRegistry : {},
      //       languages: Array.isArray(data.languages) ? data.languages : ["en"],
      //       currentLanguage: typeof data.currentLanguage === "string" ? data.currentLanguage : "en",
      //       locales: data.locales && typeof data.locales === "object" ? data.locales : { en: {} },
      //       activeGraph: Object.keys(sanitizedGraphs)[0],
      //       editingNodeId: null,
      //     });
      //     alert("Project successfully validated and imported!");
      //   } catch (e) {
      //     alert("Fatal error parsing file data.");
      //   }
      // },

      importProject: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (data.type !== "LORE_PROJECT_FILE")
            return alert("Invalid file format.");

          const rawGraphs = data.graphs || { "Main Story": createEmptyGraph() };
          const sanitizedGraphs = {};

          Object.entries(rawGraphs).forEach(([name, gObj]) => {
            // Validate and clean node parameters safely
            const verifiedNodes = (Array.isArray(gObj?.nodes) ? gObj.nodes : [])
              .filter((n) => n && typeof n === "object" && n.id && n.type)
              .map((n) => ({ ...n, data: n.data || {} }));

            // ── HARDENED VIEWPORT DEFENSE ENGINE ──
            const xVal = Number(gObj?.viewport?.x);
            const yVal = Number(gObj?.viewport?.y);
            const zVal = Number(gObj?.viewport?.zoom);

            sanitizedGraphs[name] = {
              nodes: verifiedNodes,
              edges: Array.isArray(gObj?.edges) ? gObj.edges : [],
              viewport: {
                x: Number.isNaN(xVal) ? 0 : xVal,
                y: Number.isNaN(yVal) ? 0 : yVal,
                // Guarantees zoom can never drop to zero or negative values, avoiding matrix crashes
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
    },
  ),
);

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