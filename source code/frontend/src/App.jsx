import React, { useEffect, useState } from "react";
import HexGrid from "./components/HexGrid";
import MetricsChart from "./components/MetricsChart";
import { trainRL, runAllAlgorithms } from "./services/api";

const App = () => {
  const STATIC_RADIUS = 6;

  const [hexes, setHexes] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const [envMode, setEnvMode] = useState("static");

  // static editing
  const [editMode, setEditMode] = useState(false);
  const [editTool, setEditTool] = useState("obstacle");
  const [weightValue, setWeightValue] = useState(5);

  // view
  const [activeView, setActiveView] = useState("astar");
  const [showExplored, setShowExplored] = useState(true);

  // dynamic settings
  const [dynamicRadius, setDynamicRadius] = useState(6);
  const [frameCount, setFrameCount] = useState(25);
  const [stepsPerFrame, setStepsPerFrame] = useState(2);
  const [intervalSeconds, setIntervalSeconds] = useState(2);

  const [frames, setFrames] = useState([]);
  const [frameIndex, setFrameIndex] = useState(0);

  // NEW: play/pause
  const [isPlaying, setIsPlaying] = useState(true);

  // -------------------------
  // STATIC GRID INIT
  // -------------------------
  const initStaticGrid = () => {
    const newHexes = [];

    for (let q = -STATIC_RADIUS; q <= STATIC_RADIUS; q++) {
      for (
        let r = Math.max(-STATIC_RADIUS, -q - STATIC_RADIUS);
        r <= Math.min(STATIC_RADIUS, -q + STATIC_RADIUS);
        r++
      ) {
        newHexes.push({ q, r, weight: 1, is_start: false, is_goal: false });
      }
    }

    const startHex = newHexes.find(
      (h) => h.q === -STATIC_RADIUS && h.r === 0
    );
    const goalHex = newHexes.find((h) => h.q === STATIC_RADIUS && h.r === 0);

    if (startHex) startHex.is_start = true;
    if (goalHex) goalHex.is_goal = true;

    return newHexes;
  };

  // -------------------------
  // RANDOM STATIC GRID
  // -------------------------
  const generateRandomGrid = () => {
    const newHexes = initStaticGrid();

    newHexes.forEach((h) => {
      const rand = Math.random();

      if (rand < 0.2) h.weight = 0;
      else if (rand < 0.4) h.weight = Math.floor(Math.random() * 8) + 3;
      else h.weight = 1;

      if (h.is_start || h.is_goal) h.weight = 1;
    });

    setHexes(newHexes);
    setResults(null);
    setEditMode(false);
  };

  // -------------------------
  // CREATE CUSTOM GRID
  // -------------------------
  const createCustomGrid = () => {
    setHexes(initStaticGrid());
    setResults(null);
    setEditMode(true);
  };

  // -------------------------
  // CLICK GRID CELL (STATIC EDIT)
  // -------------------------
  const handleGridClick = (q, r) => {
    if (!editMode) return;
    if (envMode === "dynamic") return;

    const newHexes = hexes.map((h) => {
      if (h.q === q && h.r === r) {
        if (editTool === "obstacle") {
          if (h.is_start || h.is_goal) return h;
          return { ...h, weight: 0 };
        }

        if (editTool === "weight") {
          if (h.is_start || h.is_goal) return h;
          return { ...h, weight: weightValue };
        }

        if (editTool === "start") {
          return { ...h, is_start: true, weight: 1 };
        }

        if (editTool === "goal") {
          return { ...h, is_goal: true, weight: 1 };
        }
      }

      if (editTool === "start" && h.is_start) return { ...h, is_start: false };
      if (editTool === "goal" && h.is_goal) return { ...h, is_goal: false };

      return h;
    });

    setHexes(newHexes);
  };

  // -------------------------
  // DYNAMIC TIMER (PLAY/PAUSE)
  // -------------------------
  useEffect(() => {
    if (envMode !== "dynamic") return;
    if (!frames || frames.length === 0) return;
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length) return prev;
        return prev + 1;
      });
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [frames, intervalSeconds, envMode, isPlaying]);

  // -------------------------
  // APPLY FRAME GRID UPDATES
  // -------------------------
  useEffect(() => {
    if (envMode !== "dynamic") return;
    if (!frames || frames.length === 0) return;

    const f = frames[frameIndex];
    if (f && f.grid) {
      const startNode = results?.start;
      const goalNode = results?.goal;

      const updatedHexes = f.grid.map((cell) => {
        const isStart =
          startNode && cell.q === startNode.q && cell.r === startNode.r;
        const isGoal =
          goalNode && cell.q === goalNode.q && cell.r === goalNode.r;

        return {
          q: cell.q,
          r: cell.r,
          weight: cell.weight,
          is_start: isStart,
          is_goal: isGoal,
        };
      });

      setHexes(updatedHexes);
    }
  }, [frameIndex, frames, envMode, results]);

  // -------------------------
  // TRAIN RL
  // -------------------------
  const handleTrain = async () => {
    try {
      await trainRL("static");
      alert("✓ RL Model Loaded!");
    } catch {
      alert("✗ Training Failed");
    }
  };

  // -------------------------
  // RUN ALL
  // -------------------------
  const handleRunAll = async () => {
    setLoading(true);

    try {
      let payload;

      if (envMode === "static") {
        payload = { env_mode: "static", hexes };
      } else {
        payload = {
          env_mode: "dynamic",
          radius: dynamicRadius,
          frame_count: frameCount,
          steps_per_frame: stepsPerFrame,
        };
      }

      const res = await runAllAlgorithms(payload);

      setResults(res.data);
      setActiveView("astar");
      setEditMode(false);

      if (envMode === "dynamic") {
        setFrames(res.data.frames);
        setFrameIndex(0);
        setIsPlaying(true);
      } else {
        setHexes(res.data.hexes);
      }
    } catch (err) {
      console.log(err);
      alert("✗ Error running algorithms");
    }

    setLoading(false);
  };

  // -------------------------
  // PATH DISPLAY LOGIC
  // -------------------------
  const getDynamicPathUntilFrame = () => {
    if (!results) return [];

    const fullPath = results?.[activeView]?.path || [];

    if (envMode !== "dynamic") return fullPath;

    const visibleSteps = (frameIndex + 1) * stepsPerFrame + 1;
    return fullPath.slice(0, Math.min(fullPath.length, visibleSteps));
  };

  const displayPath = getDynamicPathUntilFrame();
  const displayExplored = results?.[activeView]?.explored || [];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Adaptive Pathfinding</h1>
      <p>A* • DQN • Hybrid RL on Hexagonal Grids</p>

      {/* ENV MODE */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ fontWeight: "bold" }}>
          Environment:{" "}
          <select
            value={envMode}
            onChange={(e) => {
              setEnvMode(e.target.value);
              setResults(null);
              setHexes([]);
              setEditMode(false);
              setFrames([]);
              setFrameIndex(0);
              setIsPlaying(true);
            }}
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic</option>
          </select>
        </label>
      </div>

      {/* STATIC CONTROLS */}
      {envMode === "static" && (
        <div style={{ marginBottom: "15px" }}>
          <button onClick={generateRandomGrid}>🎲 Random Grid</button>{" "}
          <button onClick={createCustomGrid}>🛠 Create Custom Grid</button>{" "}
          <button onClick={() => setEditMode(!editMode)}>
            {editMode ? "❌ Stop Editing" : "✏ Edit Grid"}
          </button>
        </div>
      )}

      {/* EDIT TOOL CONTROLS */}
      {envMode === "static" && editMode && (
        <div style={{ marginBottom: "15px" }}>
          <label>
            Tool:{" "}
            <select
              value={editTool}
              onChange={(e) => setEditTool(e.target.value)}
            >
              <option value="obstacle">Obstacle</option>
              <option value="weight">Weight</option>
              <option value="start">Set Start</option>
              <option value="goal">Set Goal</option>
            </select>
          </label>

          {editTool === "weight" && (
            <label style={{ marginLeft: "15px" }}>
              Weight:{" "}
              <input
                type="number"
                min={1}
                max={20}
                value={weightValue}
                onChange={(e) => setWeightValue(Number(e.target.value))}
              />
            </label>
          )}
        </div>
      )}

      {/* DYNAMIC CONTROLS */}
      {envMode === "dynamic" && (
        <div style={{ marginBottom: "15px" }}>
          <div>
            <label>
              Radius{" "}
              <input
                type="number"
                value={dynamicRadius}
                min={3}
                max={12}
                onChange={(e) => setDynamicRadius(Number(e.target.value))}
              />
            </label>
          </div>

          <div>
            <label>
              Frames{" "}
              <input
                type="number"
                value={frameCount}
                min={5}
                max={100}
                onChange={(e) => setFrameCount(Number(e.target.value))}
              />
            </label>
          </div>

          <div>
            <label>
              Steps/Frame{" "}
              <input
                type="number"
                value={stepsPerFrame}
                min={1}
                max={10}
                onChange={(e) => setStepsPerFrame(Number(e.target.value))}
              />
            </label>
          </div>

          <div>
            <label>
              Interval(s){" "}
              <input
                type="number"
                value={intervalSeconds}
                min={0.5}
                max={10}
                step={0.5}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              />
            </label>
          </div>

          {/* PLAY / PAUSE / RESET */}
          {frames.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <button onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>{" "}
              <button
                onClick={() => {
                  setFrameIndex(0);
                  setIsPlaying(false);
                }}
              >
                ⏮ Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAIN BUTTONS */}
      <div style={{ marginBottom: "15px" }}>
        <button onClick={handleTrain}>🧠 Train RL</button>{" "}
        <button onClick={handleRunAll} disabled={loading}>
          ▶ Run All
        </button>
      </div>

      {/* EXPLORED TOGGLE */}
      <div style={{ marginBottom: "15px" }}>
        <input
          type="checkbox"
          checked={showExplored}
          onChange={(e) => setShowExplored(e.target.checked)}
        />{" "}
        Show explored nodes
      </div>

      {/* GRID */}
      <div style={{ marginTop: "20px" }}>
        {hexes.length > 0 && (
          <HexGrid
            hexes={hexes}
            path={displayPath}
            explored={showExplored ? displayExplored : []}
            onHexClick={handleGridClick}
            editable={editMode}
            showExplored={showExplored}
          />
        )}
      </div>

      {/* RESULTS */}
      {results && (
        <div style={{ marginTop: "30px" }}>
          <h2>Algorithm View</h2>

          <button onClick={() => setActiveView("astar")}>ASTAR</button>{" "}
          <button onClick={() => setActiveView("dqn")}>DQN</button>{" "}
          <button onClick={() => setActiveView("hybrid")}>HYBRID</button>

          {envMode === "dynamic" && frames.length > 0 && (
            <p>
              Frame {frameIndex + 1} / {frames.length}
            </p>
          )}

          <MetricsChart results={results} />
        </div>
      )}
    </div>
  );
};

export default App;