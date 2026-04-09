import time
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from algorithms.astar import run_astar
from algorithms.hybrid import run_hybrid
from algorithms.rl_agent import train_rl, run_dqn

app = Flask(__name__)
CORS(app)
os.makedirs("models", exist_ok=True)

@app.route("/")
def home():
    return jsonify({"status": "online"})

@app.route("/api/train", methods=["POST"])
def train():
    try:
        return jsonify(train_rl(episodes=300, scenario="static"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/run_all", methods=["POST"])
def run_all():
    data = request.get_json() or {}
    hex_list = data.get("hexes", [])
    
    weights = {}
    start = None
    goal = None
    valid_cells = set()
    
    for h in hex_list:
        q, r = h["q"], h["r"]
        w = h.get("weight", 1)
        weights[(q, r)] = w
        valid_cells.add((q, r))
        if h.get("is_start"): start = (q, r)
        if h.get("is_goal"): goal = (q, r)

    if not start or not goal:
        return jsonify({"error": "Missing start/goal"}), 400

    result = {}

    for algo_name, func in [("astar", run_astar), ("dqn", run_dqn), ("hybrid", run_hybrid)]:
        try:
            t0 = time.time()
            path, steps, cost, nodes, explored = func(start, goal, weights, valid_cells)
            result[algo_name] = {
                "path": [{"q": p[0], "r": p[1]} for p in path],
                "explored": [{"q": p[0], "r": p[1]} for p in explored],
                "metrics": {
                    "time": round(time.time() - t0, 6),
                    "steps": steps,
                    "cost": cost,
                    "nodes": nodes
                }
            }
        except Exception as e:
            print(f"{algo_name} error: {e}")
            result[algo_name] = {"error": str(e)}

    result["hexes"] = hex_list
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)