// CSV/JSON export of strings and full game data, plus project
// export/import (including the legacy-format sanitizer).
import { createEmptyGraph, escapeCSV, triggerDownload } from "./utils";

export const createExportSlice = (set, get) => ({
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
  // exportGameData: () => {
  //   const {
  //     graphs,
  //     lists,
  //     listMetadata,
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
  //         .filter((n) => n.type !== "start" && n.type !== "collection")
  //         .map((node) => {
  //           const nodeEdges = data.edges.filter(
  //             (e) => e.source === node.id,
  //           );
  //           let nextMapping = nodeEdges.reduce((acc, e) => {
  //             const key =
  //               !e.sourceHandle || e.sourceHandle === "default-output"
  //                 ? "next"
  //                 : e.sourceHandle;
  //             acc[key] = e.target;
  //             return acc;
  //           }, {});

  //           if (node.type === "logic") {
  //             if (!nextMapping["true"])
  //               nextMapping["true"] = nextMapping["false"] || null;
  //             if (!nextMapping["false"])
  //               nextMapping["false"] = nextMapping["true"] || null;
  //           }

  //           return {
  //             id: node.id,
  //             type: node.type,
  //             data: node.data,
  //             next: nextMapping,
  //           };
  //         }),
  //     };
  //   });

  //   const compiledVariables = Object.entries(lists)
  //     .filter(([id]) => listMetadata[id] === "variable")
  //     .reduce((acc, [_, items]) => {
  //       items.forEach((v) => {
  //         acc[v.name] = {
  //           type: v.type,
  //           default: v.defaultValue,
  //           // Expose choices to your game engine runtime if they exist
  //           ...(v.type === "string" && Array.isArray(v.allowedValues)
  //             ? { allowedValues: v.allowedValues }
  //             : {}),
  //         };
  //       });
  //       return acc;
  //     }, {});

  //   // ── NEW: Dynamic sorting sweep by priority descending for production compilation ──
  //   const compiledRegistry = {};
  //   Object.entries(conversationRegistry).forEach(([npcId, rules]) => {
  //     compiledRegistry[npcId] = [...rules].sort(
  //       (a, b) => b.priority - a.priority,
  //     );
  //   });

  //   const bundle = {
  //     version: "2.0",
  //     metadata: {
  //       projectName,
  //       exportedAt: new Date().toISOString(),
  //       startGraph,
  //     },
  //     registry: compiledRegistry,
  //     locales,
  //     variables: compiledVariables,
  //     graphs: exportGraphs,
  //   };

  //   triggerDownload(
  //     JSON.stringify(bundle, null, 2),
  //     `${projectName.replace(/\s+/g, "_").toLowerCase()}_export.json`,
  //     "application/json",
  //   );
  // },

  // ════════════════════════════════════════════════════════════
  // ENGINE COMPILED EXPORTER
  // ════════════════════════════════════════════════════════════
  exportGameData: () => {
    const {
      graphs,
      lists,
      listMetadata,
      schema,
      projectName,
      conversationRegistry,
      locales,
      startGraph,
    } = get();
    const exportGraphs = {};

    // Valid execution keys that should never be scrubbed
    const nodeSchemaKeys = schema.nodeFields.map((f) => f.id);
    const seqSchemaKeys = schema.sequenceFields.map((f) => f.id);
    const coreNodeKeys = [
      "title",
      "dialogueLines",
      "choices",
      "conditions",
      "flags",
      "logicalOperator",
      "targetGraph",
      "check_flag",
    ];
    const coreSeqKeys = ["id", "variants"];

    Object.entries(graphs).forEach(([name, data]) => {
      const startNode = data.nodes.find((n) => n.type === "start");
      const startEdge = data.edges.find((e) => e.source === startNode?.id);

      exportGraphs[name] = {
        startNode: startEdge ? startEdge.target : null,
        nodes: data.nodes
          .filter((n) => n.type !== "start" && n.type !== "collection")
          .map((node) => {
            const nodeEdges = data.edges.filter((e) => e.source === node.id);
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

            // DEFENSIVE SWEEP: Purge ghost data that isn't mapped to the current schema
            const scrubbedData = {};
            Object.keys(node.data).forEach((k) => {
              if (nodeSchemaKeys.includes(k) || coreNodeKeys.includes(k))
                scrubbedData[k] = node.data[k];
            });

            if (scrubbedData.dialogueLines) {
              scrubbedData.dialogueLines = scrubbedData.dialogueLines.map(
                (line) => {
                  const scrubbedLine = {};
                  Object.keys(line).forEach((lk) => {
                    if (seqSchemaKeys.includes(lk) || coreSeqKeys.includes(lk))
                      scrubbedLine[lk] = line[lk];
                  });

                  // Critical Speaker Guarantee: Prevents engine crashes if "speaker" field was completely deleted
                  if (!scrubbedLine.speaker) scrubbedLine.speaker = "Narrator";
                  return scrubbedLine;
                },
              );
            }

            return {
              id: node.id,
              type: node.type,
              data: scrubbedData,
              next: nextMapping,
            };
          }),
      };
    });

    // Compile Variables with Allowed Values (Enum) support
    const compiledVariables = Object.entries(lists)
      .filter(([id]) => listMetadata[id] === "variable")
      .reduce((acc, [_, items]) => {
        items.forEach((v) => {
          acc[v.name] = {
            type: v.type,
            default: v.defaultValue,
            // Expose enum choices to your game engine runtime if they exist
            ...(v.type === "string" && Array.isArray(v.allowedValues)
              ? { allowedValues: v.allowedValues }
              : {}),
          };
        });
        return acc;
      }, {});

    // Dynamic sorting sweep by priority descending for production compilation
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

    // FINAL TRIGGER: Executes the actual browser download action
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
        return get().addToast({
          type: "error",
          message: "Invalid file format.",
        });

      const rawGraphs = data.graphs || { "Main Story": createEmptyGraph() };
      const sanitizedGraphs = {};
      const sanitizedViewports = {}; // ── INJECTED ──

      Object.entries(rawGraphs).forEach(([name, gObj]) => {
        const verifiedNodes = (Array.isArray(gObj?.nodes) ? gObj.nodes : [])
          .filter((n) => n && typeof n === "object" && n.id && n.type)
          .map((n) => ({ ...n, data: n.data || {} }));

        const xVal = Number(gObj?.viewport?.x);
        const yVal = Number(gObj?.viewport?.y);
        const zVal = Number(gObj?.viewport?.zoom);

        // ── EXTRACT TO SEPARATE OBJECT ──
        sanitizedViewports[name] = {
          x: Number.isNaN(xVal) ? 0 : xVal,
          y: Number.isNaN(yVal) ? 0 : yVal,
          zoom: Number.isNaN(zVal) || zVal <= 0 ? 1 : zVal,
        };

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
        viewports: sanitizedViewports,
        lists:
          data.lists && typeof data.lists === "object"
            ? data.lists
            : get().lists,
        schema:
          data.schema && typeof data.schema === "object"
            ? data.schema
            : get().schema,
        graphFolders: Array.isArray(data.graphFolders) ? data.graphFolders : [],
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
      get().addToast({
        type: "success",
        message: "Project successfully validated and imported!",
      });
    } catch (e) {
      get().addToast({
        type: "error",
        message: "Fatal error parsing file data.",
      });
    }
  },
});
