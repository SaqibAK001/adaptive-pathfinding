import numpy as np
from scipy.spatial.distance import cityblock

# Axial hex coordinates directions
DIRECTIONS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]

def hex_distance(q1, r1, q2, r2):
    return (abs(q1 - q2) + abs(r1 - r2) + abs((-q1-r1) - (-q2-r2))) // 2

def create_grid(size=10, scenario="static", seed=None):
    rng = np.random.default_rng(seed)
    grid = np.zeros((size, size), dtype=int)  # 0=free, 1=obstacle, 2=start, 3=goal
    start, goal = (0, 0), (size-1, size-1)
    grid[start] = 2
    grid[goal] = 3

    if scenario == "static":
        obs_mask = rng.random((size, size)) > 0.7
        obs_mask[start] = obs_mask[goal] = False
        grid[obs_mask] = 1
    elif scenario == "dynamic":
        # 30% obstacles, will shift during execution
        obs_mask = rng.random((size, size)) > 0.7
        obs_mask[start] = obs_mask[goal] = False
        grid[obs_mask] = 1
    elif scenario == "partially_unknown":
        obs_mask = rng.random((size, size)) > 0.65
        obs_mask[start] = obs_mask[goal] = False
        grid[obs_mask] = 1
    return grid, start, goal