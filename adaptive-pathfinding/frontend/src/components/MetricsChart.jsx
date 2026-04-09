import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MetricsChart = ({ results }) => {
  if (!results) return null;

  const data = [
    {
      name: "A*",
      Steps: results.astar?.metrics?.steps || 0,
      Cost: results.astar?.metrics?.cost || 0,
      Nodes: results.astar?.metrics?.nodes || 0,
    },
    {
      name: "DQN",
      Steps: results.dqn?.metrics?.steps || 0,
      Cost: results.dqn?.metrics?.cost || 0,
      Nodes: results.dqn?.metrics?.nodes || 0,
    },
    {
      name: "Hybrid",
      Steps: results.hybrid?.metrics?.steps || 0,
      Cost: results.hybrid?.metrics?.cost || 0,
      Nodes: results.hybrid?.metrics?.nodes || 0,
    },
  ];

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">
          Performance Visualization
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Steps, cost and explored nodes comparison
        </p>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data} barSize={35}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: "#334155", fontWeight: 600 }} />
            <YAxis tick={{ fill: "#64748B" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                background: "#FFFFFF",
                boxShadow: "0px 4px 14px rgba(0,0,0,0.08)",
              }}
            />
            <Legend />
            <Bar dataKey="Steps" fill="#2563EB" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Cost" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Nodes" fill="#16A34A" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricsChart;