import React, { memo } from "react";
import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from "reactflow";
import { X } from "lucide-react";

function DeleteEdge(props) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    label,
  } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const onEdgeClick = (evt) => {
    evt.stopPropagation();
    window.useLoreStore.getState().deleteEdge(id);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {/* 
            Container with padding: 
            This acts as the 'hit area' so you don't have to be pixel-perfect.
          */}
          <div className="group relative p-4 flex items-center justify-center">
            {/* THE CHOICE TEXT */}
            {label && (
              <div className="flex items-center justify-center bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm transition-opacity duration-200 group-hover:opacity-0">
                <span className="text-[10px] font-black uppercase tracking-tight text-gray-600 whitespace-nowrap leading-none">
                  {label}
                </span>
              </div>
            )}

            {/* THE DELETE BUTTON */}
            <button
              onClick={onEdgeClick}
              className={`flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg transition-all duration-200 transform 
                ${
                  label
                    ? "absolute scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 w-7 h-7"
                    : "relative scale-100 opacity-100 w-7 h-7"
                } 
                hover:bg-red-600 active:scale-90
              `}
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(DeleteEdge)