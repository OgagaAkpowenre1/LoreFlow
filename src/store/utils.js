// Shared helper functions used across multiple store slices.

export const getAbsolutePos = (node, nodes, depth = 0) => {
  if (!node.parentId || depth > 5) return node.position;
  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) return node.position;
  const parentPos = getAbsolutePos(parent, nodes, depth + 1);
  return {
    x: node.position.x + parentPos.x,
    y: node.position.y + parentPos.y,
  };
};

export const createEmptyGraph = () => ({
  nodes: [],
  edges: [],
  folder: null,
});

export const escapeCSV = (text) => {
  if (!text) return '""';
  // Fixed Bug #7: Escapes standard newlines to guarantee Excel compatibility
  const escaped = text.toString().replace(/\n/g, " ").replace(/"/g, '""');
  return `"${escaped}"`;
};

export function triggerDownload(
  content,
  filename,
  contentType = "application/json",
) {
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
