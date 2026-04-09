import React from "react";

const ControlPanel = ({
  editMode,
  toggleEditMode,
  handleTrain,
  generateRandomGrid,
  handleRunAll,
  loading,
}) => {
  return (
    <div className="card p-5 flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={toggleEditMode}
        className={`btn ${
          editMode
            ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
            : "btn-outline"
        }`}
      >
        {editMode ? "✕ Cancel Edit" : "✎ Edit Grid"}
      </button>

      <button onClick={handleTrain} className="btn btn-outline">
        🧠 Train RL
      </button>

      <button onClick={generateRandomGrid} className="btn btn-outline">
        🎲 Random Grid
      </button>

      <button
        onClick={handleRunAll}
        disabled={loading}
        className={`btn btn-primary ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "⏳ Running..." : "▶ Run All"}
      </button>
    </div>
  );
};

export default ControlPanel;