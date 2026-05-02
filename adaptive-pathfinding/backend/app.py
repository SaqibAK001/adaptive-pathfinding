from flask import Flask, request, jsonify
from flask_cors import CORS
import time

from algorithms.astar import run_astar
from algorithms.hybrid import run_hybrid
from algorithms.rl_agent import run_dqn
from hex_grid import build_weights_from_hexes
from dynamic_runner import simulate_dynamic

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route("/api/train", methods=["POST"])
def train():
    return jsonify({"message": "Training not required (model already loaded)."})


@app.route("/api/run_all", methods=["POST"])
def run_all():
    data = request.get_json()
    env_mode = data.get("env_mode", "static")

    # -------------------------------
    # DYNAMIC MODE
    # -------------------------------
    if env_mode == "dynamic":
        radius = int(data.get("radius", 6))
        frame_count = int(data.get("frame_count", 25))
        steps_per_frame = int(data.get("steps_per_frame", 2))

        sim_data = simulate_dynamic(
            radius=radius,
            frame_count=frame_count,
            steps_per_frame=steps_per_frame
        )

        return jsonify(sim_data)

    # -------------------------------
    # STATIC MODE
    # -------------------------------
    hexes = data.get("hexes", [])

    if not hexes:
        return jsonify({"error": "No hexes provided"}), 400

    weights, start, goal, valid_cells = build_weights_from_hexes(hexes)

    # ---------------- A* ----------------
    t0 = time.perf_counter()
    path, steps, cost, nodes_explored, explored_nodes = run_astar(
        start, goal, weights, valid_cells
    )
    t1 = time.perf_counter()

    astar_result = {
        "path": [{"q": p[0], "r": p[1]} for p in path],
        "steps": steps,
        "cost": cost,
        "nodes": nodes_explored,
        "explored": explored_nodes,
        "time_ms": round((t1 - t0) * 1000, 3)
    }

    # ---------------- DQN ----------------
    t0 = time.perf_counter()
    dqn_result = run_dqn(weights, start, goal)
    t1 = time.perf_counter()
    dqn_result["time_ms"] = round((t1 - t0) * 1000, 3)

    # ---------------- HYBRID ----------------
    t0 = time.perf_counter()
    h_path, h_steps, h_cost, h_nodes_explored, h_explored_nodes = run_hybrid(
        start, goal, weights, valid_cells
    )
    t1 = time.perf_counter()

    hybrid_result = {
        "path": [{"q": p[0], "r": p[1]} for p in h_path],
        "steps": h_steps,
        "cost": h_cost,
        "nodes": h_nodes_explored,
        "explored": h_explored_nodes,
        "time_ms": round((t1 - t0) * 1000, 3)
    }

    return jsonify({
        "mode": "static",
        "hexes": hexes,
        "astar": astar_result,
        "dqn": dqn_result,
        "hybrid": hybrid_result
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)