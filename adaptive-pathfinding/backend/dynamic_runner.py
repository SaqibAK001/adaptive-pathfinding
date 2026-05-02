import random
import time
from algorithms.astar import run_astar
from algorithms.hybrid import run_hybrid
from algorithms.rl_agent import dqn_policy_step


def generate_valid_cells(radius):
    valid = set()
    for q in range(-radius, radius + 1):
        for r in range(max(-radius, -q - radius), min(radius, -q + radius) + 1):
            valid.add((q, r))
    return valid


def generate_solvable_weights(valid_cells, start, goal, obstacle_ratio=0.18):
    while True:
        weights = {}

        for cell in valid_cells:
            if cell == start or cell == goal:
                weights[cell] = 1
                continue

            if random.random() < obstacle_ratio:
                weights[cell] = 0
            else:
                weights[cell] = random.choice([1, 1, 1, 2, 2, 3, 5])

        path, steps, cost, nodes_explored, explored_nodes = run_astar(
            start, goal, weights, valid_cells
        )

        if path and len(path) > 1:
            return weights


def apply_weight_changes(weights, valid_cells, start, goal, prob=0.25):
    for cell in valid_cells:
        if cell == start or cell == goal:
            continue

        if weights[cell] == 0:
            continue

        if random.random() < prob:
            weights[cell] = random.choice([1, 2, 3, 5])

    weights[start] = 1
    weights[goal] = 1


def weights_to_grid_list(weights):
    grid_list = []
    for (q, r), w in weights.items():
        grid_list.append({"q": q, "r": r, "weight": w})
    return grid_list


def compute_path_cost(weights, path):
    cost = 0
    for node in path[1:]:
        q, r = node["q"], node["r"]
        cost += weights.get((q, r), 1)
    return cost


def simulate_dynamic(radius=6, frame_count=25, steps_per_frame=2):
    valid_cells = generate_valid_cells(radius)

    start = (-radius, 0)
    goal = (radius, 0)

    weights = generate_solvable_weights(valid_cells, start, goal)

    astar_pos = start
    hybrid_pos = start
    dqn_pos = start

    astar_path = [{"q": astar_pos[0], "r": astar_pos[1]}]
    hybrid_path = [{"q": hybrid_pos[0], "r": hybrid_pos[1]}]
    dqn_path = [{"q": dqn_pos[0], "r": dqn_pos[1]}]

    astar_explored = []
    hybrid_explored = []
    dqn_explored = []

    frames = []

    # time tracking
    astar_time = 0
    hybrid_time = 0
    dqn_time = 0

    for frame in range(frame_count):
        for _ in range(steps_per_frame):

            # A*
            if astar_pos != goal:
                t0 = time.perf_counter()
                path, steps, cost, nodes_explored, explored_nodes = run_astar(
                    astar_pos, goal, weights, valid_cells
                )
                t1 = time.perf_counter()
                astar_time += (t1 - t0)

                astar_explored += explored_nodes

                if path and len(path) > 1:
                    nxt = path[-2]
                    astar_pos = nxt
                    astar_path.append({"q": astar_pos[0], "r": astar_pos[1]})

            # HYBRID
            if hybrid_pos != goal:
                t0 = time.perf_counter()
                h_path, h_steps, h_cost, h_nodes_explored, h_explored_nodes = run_hybrid(
                    hybrid_pos, goal, weights, valid_cells
                )
                t1 = time.perf_counter()
                hybrid_time += (t1 - t0)

                hybrid_explored += h_explored_nodes

                if h_path and len(h_path) > 1:
                    nxt = h_path[-2]
                    hybrid_pos = nxt
                    hybrid_path.append({"q": hybrid_pos[0], "r": hybrid_pos[1]})

            # DQN
            if dqn_pos != goal:
                t0 = time.perf_counter()
                nxt = dqn_policy_step(weights, dqn_pos, goal, valid_cells)
                t1 = time.perf_counter()
                dqn_time += (t1 - t0)

                if nxt is not None:
                    dqn_pos = nxt
                    dqn_path.append({"q": dqn_pos[0], "r": dqn_pos[1]})

        frames.append({
            "grid": weights_to_grid_list(weights),
            "positions": {
                "astar": {"q": astar_pos[0], "r": astar_pos[1]},
                "hybrid": {"q": hybrid_pos[0], "r": hybrid_pos[1]},
                "dqn": {"q": dqn_pos[0], "r": dqn_pos[1]}
            }
        })

        apply_weight_changes(weights, valid_cells, start, goal)

    astar_nodes = len(set(astar_explored))
    hybrid_nodes = len(set(hybrid_explored)) if hybrid_explored else 0
    dqn_nodes = 0

    astar_cost = compute_path_cost(weights, astar_path)
    hybrid_cost = compute_path_cost(weights, hybrid_path)
    dqn_cost = compute_path_cost(weights, dqn_path)

    return {
        "mode": "dynamic",
        "frames": frames,
        "start": {"q": start[0], "r": start[1]},
        "goal": {"q": goal[0], "r": goal[1]},
        "astar": {
            "path": astar_path,
            "explored": astar_explored,
            "steps": len(astar_path) - 1,
            "nodes": astar_nodes,
            "cost": astar_cost,
            "time_ms": round(astar_time * 1000, 3)
        },
        "hybrid": {
            "path": hybrid_path,
            "explored": hybrid_explored,
            "steps": len(hybrid_path) - 1,
            "nodes": hybrid_nodes,
            "cost": hybrid_cost,
            "time_ms": round(hybrid_time * 1000, 3)
        },
        "dqn": {
            "path": dqn_path,
            "explored": dqn_explored,
            "steps": len(dqn_path) - 1,
            "nodes": dqn_nodes,
            "cost": dqn_cost,
            "time_ms": round(dqn_time * 1000, 3)
        }
    }