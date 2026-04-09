import React, { useState } from "react";
import { trainRL } from "./services/api";
import HexGrid from "./components/HexGrid";
import axios from "axios";

const App = () => {
  const [hexes, setHexes] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editTool, setEditTool] = useState("obstacle");
  const [weightValue, setWeightValue] = useState(5);

  const [activeView, setActiveView] = useState("astar");
  const [showExplored, setShowExplored] = useState(true);

  const RADIUS = 6;

  const initGrid = () => {
    const newHexes = [];
    for (let q = -RADIUS; q <= RADIUS; q++) {
      for (
        let r = Math.max(-RADIUS, -q - RADIUS);
        r <= Math.min(RADIUS, -q + RADIUS);
        r++
      ) {
        newHexes.push({ q, r, weight: 1, is_start: false, is_goal: false });
      }
    }
    const startHex = newHexes.find((h) => h.q === -RADIUS && h.r === 0);
    const goalHex = newHexes.find((h) => h.q === RADIUS && h.r === 0);

    if (startHex) startHex.is_start = true;
    if (goalHex) goalHex.is_goal = true;

    return newHexes;
  };

  const generateRandomGrid = () => {
    const newHexes = initGrid();
    newHexes.forEach((h) => {
      const rand = Math.random();
      if (rand < 0.2) h.weight = 0;
      else if (rand < 0.4) h.weight = Math.floor(Math.random() * 8) + 3;
      else h.weight = 1;

      if (h.is_start || h.is_goal) h.weight = 1;
    });

    setHexes(newHexes);
    setResults(null);
  };

  const toggleEditMode = () => {
    const next = !editMode;
    setEditMode(next);

    if (next && hexes.length === 0) setHexes(initGrid());
  };

  const handleGridClick = (q, r) => {
    if (!editMode) return;

    const newHexes = hexes.map((h) => {
      if (h.q === q && h.r === r) {
        if (editTool === "obstacle") return { ...h, weight: 0 };
        if (editTool === "start") return { ...h, weight: 1, is_start: true };
        if (editTool === "goal") return { ...h, weight: 1, is_goal: true };
        if (editTool === "weight") return { ...h, weight: weightValue };
      }

      if (editTool === "start" && h.is_start) return { ...h, is_start: false };
      if (editTool === "goal" && h.is_goal) return { ...h, is_goal: false };

      return h;
    });

    setHexes(newHexes);
  };

  const handleTrain = async () => {
    try {
      await trainRL("static");
      alert("✓ RL Model Trained!");
    } catch (err) {
      alert("✗ Training Failed");
    }
  };

  const handleRunAll = async () => {
    setLoading(true);
    try {
      const payload = { hexes };
      const res = await axios.post("http://localhost:5000/api/run_all", payload);

      setHexes(res.data.hexes);
      setResults(res.data);
      setActiveView("astar");
    } catch (err) {
      alert("✗ Error running algorithms");
    }
    setLoading(false);
  };

  const getDisplayPath = () => results?.[activeView]?.path || [];
  const getDisplayExplored = () => results?.[activeView]?.explored || [];

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-7xl px-6 py-10">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Adaptive Pathfinding
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            A* • DQN • Hybrid RL on Hexagonal Grids
          </p>
        </header>

        {/* Toolbar */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 mb-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={toggleEditMode}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm border
              ${
                editMode
                  ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
          >
            {editMode ? "✕ Cancel Edit" : "✎ Edit Grid"}
          </button>

          <button
            onClick={handleTrain}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm border bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            🧠 Train RL
          </button>

          <button
            onClick={generateRandomGrid}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm border bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            🎲 Random Grid
          </button>

          <button
            onClick={handleRunAll}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-md
              ${
                loading
                  ? "bg-blue-400 cursor-not-allowed text-white"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white"
              }`}
          >
            {loading ? "⏳ Running..." : "▶ Run All"}
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            <input
              type="checkbox"
              checked={showExplored}
              onChange={(e) => setShowExplored(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm font-semibold text-slate-700">
              Show explored
            </span>
          </div>
        </div>

        {/* Edit Tools */}
        {editMode && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-8 text-center">
            <h3 className="font-bold text-slate-900 mb-4 text-lg">
              Grid Editing Tools
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setEditTool("obstacle")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm border
                  ${
                    editTool === "obstacle"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                🪨 Obstacle
              </button>

              <button
                onClick={() => setEditTool("start")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm border
                  ${
                    editTool === "start"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                🟦 Start
              </button>

              <button
                onClick={() => setEditTool("goal")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm border
                  ${
                    editTool === "goal"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                🟥 Goal
              </button>

              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Weight
                </span>

                <input
                  type="range"
                  min="1"
                  max="15"
                  value={weightValue}
                  onChange={(e) => setWeightValue(Number(e.target.value))}
                  className="w-28 accent-blue-600"
                />

                <span className="font-mono font-bold text-slate-900 w-6 text-center">
                  {weightValue}
                </span>
              </div>

              <button
                onClick={() => setEditTool("weight")}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm border
                  ${
                    editTool === "weight"
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                ✏️ Apply Weight
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-10 flex justify-center">
          {hexes.length > 0 ? (
            <HexGrid
              hexes={hexes}
              path={getDisplayPath()}
              explored={getDisplayExplored()}
              onHexClick={handleGridClick}
              editable={editMode}
              showExplored={showExplored}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <div className="text-6xl mb-4 opacity-40">🗺️</div>
              <p className="font-bold text-lg">No grid loaded</p>
              <p className="text-sm mt-1 text-slate-500">
                Click <span className="font-bold">Edit Grid</span> or{" "}
                <span className="font-bold">Random Grid</span> to begin
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="flex flex-col items-center gap-8">
            {/* Algorithm Selector */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 w-full max-w-3xl">
              <h3 className="font-bold text-slate-900 text-lg mb-4 text-center">
                Algorithm View
              </h3>

              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { key: "astar", label: "A*", color: "bg-green-500" },
                  { key: "dqn", label: "DQN", color: "bg-red-500" },
                  { key: "hybrid", label: "Hybrid", color: "bg-purple-500" },
                ].map((algo) => (
                  <button
                    key={algo.key}
                    onClick={() => setActiveView(algo.key)}
                    className={`px-6 py-3 rounded-xl border font-semibold transition flex items-center gap-3 shadow-sm
                      ${
                        activeView === algo.key
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${algo.color}`}></span>
                    {algo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden w-full max-w-5xl">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-center">
                <h3 className="font-bold text-slate-900 text-xl">
                  Performance Metrics
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Detailed comparison of algorithms
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm">
                      <th className="border border-slate-200 px-4 py-3 text-center">
                        Algorithm
                      </th>
                      <th className="border border-slate-200 px-4 py-3 text-center">
                        Time (s)
                      </th>
                      <th className="border border-slate-200 px-4 py-3 text-center">
                        Steps
                      </th>
                      <th className="border border-slate-200 px-4 py-3 text-center">
                        Cost
                      </th>
                      <th className="border border-slate-200 px-4 py-3 text-center">
                        Nodes
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      { key: "astar", label: "A*", badge: "bg-green-100 text-green-700" },
                      { key: "dqn", label: "DQN", badge: "bg-red-100 text-red-700" },
                      { key: "hybrid", label: "Hybrid", badge: "bg-purple-100 text-purple-700" },
                    ].map((row) => (
                      <tr
                        key={row.key}
                        className="hover:bg-slate-50 transition text-center"
                      >
                        <td className="border border-slate-200 px-4 py-3 font-bold">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${row.badge}`}
                          >
                            {row.label}
                          </span>
                        </td>

                        <td className="border border-slate-200 px-4 py-3 font-mono text-slate-700">
                          {results[row.key]?.metrics?.time?.toFixed(5)}
                        </td>

                        <td className="border border-slate-200 px-4 py-3 font-bold text-slate-900">
                          {results[row.key]?.metrics?.steps}
                        </td>

                        <td className="border border-slate-200 px-4 py-3 font-bold text-amber-600">
                          {results[row.key]?.metrics?.cost}
                        </td>

                        <td className="border border-slate-200 px-4 py-3 text-slate-700 font-semibold">
                          {results[row.key]?.metrics?.nodes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-400 text-sm">
          <p className="font-medium">
            VI Semester Mini Project • AI & Reinforcement Learning
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;