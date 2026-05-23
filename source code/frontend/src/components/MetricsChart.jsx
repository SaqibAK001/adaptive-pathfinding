import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MetricsChart = ({ results }) => {
  if (!results) return null;

  const data = [
    {
      name: "A*",
      Steps: results.astar?.steps || 0,
      Cost: results.astar?.cost || 0,
      Nodes: results.astar?.nodes || 0,
      Time: results.astar?.time_ms || 0,
    },
    {
      name: "DQN",
      Steps: results.dqn?.steps || 0,
      Cost: results.dqn?.cost || 0,
      Nodes: results.dqn?.nodes || 0,
      Time: results.dqn?.time_ms || 0,
    },
    {
      name: "Hybrid",
      Steps: results.hybrid?.steps || 0,
      Cost: results.hybrid?.cost || 0,
      Nodes: results.hybrid?.nodes || 0,
      Time: results.hybrid?.time_ms || 0,
    },
  ];

  return (
    <div style={{ width: "100%", height: 420 }}>
      <h2 style={{ fontWeight: "bold", marginBottom: "10px" }}>
        Performance Visualization
      </h2>

      <p style={{ marginBottom: "10px", color: "gray" }}>
        Steps, cost, explored nodes and time taken comparison
      </p>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={25}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Bar dataKey="Cost" fill="#f59e0b" />
          <Bar dataKey="Nodes" fill="#22c55e" />
          <Bar dataKey="Steps" fill="#3b82f6" />
          <Bar dataKey="Time" fill="#a855f7" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsChart;