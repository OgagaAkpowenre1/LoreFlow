deleteFolder: (folderName) => {
        const { graphs } = get();
        const graphsInFolder = Object.keys(graphs).filter(gKey => graphs[gKey].folder === folderName);

        // Pre-evaluate the cascading destruction prompt before freezing the thread context
        let deleteContents = false;
        if (graphsInFolder.length > 0) {
          deleteContents = window.confirm(
            `The folder "${folderName}" contains ${graphsInFolder.length} graph(s).\n\nOK = Delete folder AND destroy its graphs\nCancel = Keep graphs, just remove the folder`
          );
        }

        set((state) => {
          const newGraphs = { ...state.graphs };
          const newRegistry = { ...state.conversationRegistry };

          if (deleteContents) {
            graphsInFolder.forEach((gName) => {
              delete newGraphs[gName];
              
              // Scrub Jump nodes pointing to the destroyed graphs
              Object.keys(newGraphs).forEach((k) => {
                newGraphs[k] = {
                  ...newGraphs[k],
                  nodes: newGraphs[k].nodes.map((n) =>
                    n.type === "jump" && n.data?.targetGraph === gName
                      ? { ...n, data: { ...n.data, targetGraph: "" } }
                      : n
                  ),
                };
              });

              // Scrub Registry logic pointing to the destroyed graphs
              Object.keys(newRegistry).forEach((npcId) => {
                newRegistry[npcId] = newRegistry[npcId].map((rule) =>
                  rule.graph === gName ? { ...rule, graph: "" } : rule
                );
              });
            });

            // Ultimate Fallback: Never leave a project with 0 graphs
            if (Object.keys(newGraphs).length === 0) {
              newGraphs["Main Story"] = createEmptyGraph();
            }
          } else {
            // Non-destructive un-parenting
            Object.keys(newGraphs).forEach((gKey) => {
              if (newGraphs[gKey].folder === folderName) {
                newGraphs[gKey] = { ...newGraphs[gKey], folder: null };
              }
            });
          }

          const nextActive = newGraphs[state.activeGraph] ? state.activeGraph : Object.keys(newGraphs)[0];

          return {
            graphFolders: state.graphFolders.filter((f) => f !== folderName),
            graphs: newGraphs,
            activeGraph: nextActive,
            conversationRegistry: newRegistry,
          };
        });
      }