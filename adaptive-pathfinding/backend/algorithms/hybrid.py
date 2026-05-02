from algorithms.astar import run_astar
from algorithms.rl_agent import get_adaptive_heuristic


def run_hybrid(start, goal, weights, valid_cells):
    """
    Hybrid A* using adaptive heuristic from RL.
    A* passes 3 arguments: (node, goal, base_h)
    """

    def adaptive_h(node, goal_node, base_h):
        # return modified heuristic using RL adaptive method
        return get_adaptive_heuristic(weights, node, goal_node)

    return run_astar(start, goal, weights, valid_cells, adaptive_heuristic=adaptive_h)