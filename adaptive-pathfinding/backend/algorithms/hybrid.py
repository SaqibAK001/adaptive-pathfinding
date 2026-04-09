from algorithms.astar import run_astar
from algorithms.rl_agent import get_adaptive_heuristic

def run_hybrid(start, goal, weights, valid_cells):
    adaptive_h = get_adaptive_heuristic()
    if adaptive_h is None:
        return run_astar(start, goal, weights, valid_cells)
    return run_astar(start, goal, weights, valid_cells, adaptive_heuristic=adaptive_h)