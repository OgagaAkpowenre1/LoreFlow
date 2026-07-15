// Custom schema field builders plus dropdown-list and variable CRUD.

export const createSchemaListsSlice = (set, get) => ({
  addFieldToSchema: (target, newField) =>
    set((state) => ({
      schema: {
        ...state.schema,
        [target]: [...(state.schema[target] || []), newField],
      },
    })),

  // NEW: Live Structural Schema Remapping (Clears invalid data when dropdown targets shift)
  updateFieldInSchema: (target, fieldId, updates) =>
    set((state) => {
      const oldField = state.schema[target].find((f) => f.id === fieldId);
      if (!oldField) return state;

      const newField = { ...oldField, ...updates };
      const newSchema = {
        ...state.schema,
        [target]: state.schema[target].map((f) =>
          f.id === fieldId ? newField : f,
        ),
      };

      let newGraphs = { ...state.graphs };
      let graphHasChanges = false;

      // DEFENSIVE REMAP: Trigger validation if list source changes OR if field type converts TO a list
      if (newField.type === "list" && newField.listId) {
        const isNewList = oldField.listId !== newField.listId;
        const isNewType = oldField.type !== "list";

        if (isNewList || isNewType) {
          const newListItems = state.lists[newField.listId] || [];
          const validValues = newListItems.map((v) =>
            typeof v === "object" ? v.name : v,
          );

          Object.keys(newGraphs).forEach((gKey) => {
            let localGraphChanged = false;
            const updatedNodes = newGraphs[gKey].nodes.map((node) => {
              let newData = { ...node.data };
              let nodeChanged = false;

              if (
                target === "nodeFields" &&
                newData[fieldId] &&
                !validValues.includes(newData[fieldId])
              ) {
                newData[fieldId] = "";
                nodeChanged = true;
              } else if (target === "sequenceFields" && newData.dialogueLines) {
                newData.dialogueLines = newData.dialogueLines.map((line) => {
                  if (line[fieldId] && !validValues.includes(line[fieldId])) {
                    nodeChanged = true;
                    return { ...line, [fieldId]: "" };
                  }
                  return line;
                });
              }
              if (nodeChanged) localGraphChanged = true;
              return nodeChanged ? { ...node, data: newData } : node;
            });

            if (localGraphChanged) {
              graphHasChanges = true;
              newGraphs[gKey] = { ...newGraphs[gKey], nodes: updatedNodes };
            }
          });
        }
      }

      return {
        schema: newSchema,
        ...(graphHasChanges ? { graphs: newGraphs } : {}),
      };
    }),

  // UPGRADED: Instantly deletes ghost payloads off the canvas when a schema field is dropped
  removeFieldFromSchema: (target, fieldId) =>
    set((state) => {
      const newSchema = {
        ...state.schema,
        [target]: state.schema[target].filter((f) => f.id !== fieldId),
      };

      const newGraphs = { ...state.graphs };
      Object.keys(newGraphs).forEach((gKey) => {
        newGraphs[gKey].nodes = newGraphs[gKey].nodes.map((node) => {
          let newData = { ...node.data };
          let changed = false;

          if (target === "nodeFields" && newData[fieldId] !== undefined) {
            delete newData[fieldId];
            changed = true;
          } else if (target === "sequenceFields" && newData.dialogueLines) {
            newData.dialogueLines = newData.dialogueLines.map((line) => {
              if (line[fieldId] !== undefined) {
                const newLine = { ...line };
                delete newLine[fieldId];
                changed = true;
                return newLine;
              }
              return line;
            });
          }
          return changed ? { ...node, data: newData } : node;
        });
      });

      return { schema: newSchema, graphs: newGraphs };
    }),

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

            if (node.type === "switch" && newData.check_flag === deleteName) {
              dataChanged = true;
              // newData.check_flag = newVarName; // For updateVariable
              newData.check_flag = ""; // For removeItemFromList
            }
            if (newData.flags) {
              const originalLength = newData.flags.length;
              newData.flags = newData.flags.filter((f) => f.key !== deleteName);
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
            (rule) => !rule.condition || rule.condition.variable !== deleteName,
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

            if (node.type === "switch" && newData.check_flag === oldVarName) {
              dataChanged = true;
              newData.check_flag = newVarName; // For updateVariable
              // OR newData.check_flag = "";   // For removeItemFromList
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

            if (newData.dialogueLines && Array.isArray(newData.dialogueLines)) {
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

            if (node.type === "switch" && newData.check_flag === oldVarName) {
              dataChanged = true;
              newData.check_flag = newVarName; // For updateVariable
              // OR newData.check_flag = "";   // For removeItemFromList
            }

            if (newData.flags) {
              newData.flags = newData.flags.map((f) => {
                if (f.key === oldVarName) {
                  nodeChanged = true;
                  return {
                    ...f,
                    op: "=",
                    value:
                      value === "number" ? 0 : value === "string" ? "" : true,
                  };
                }
                return f;
              });
            }

            if (newData.dialogueLines && Array.isArray(newData.dialogueLines)) {
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
});
