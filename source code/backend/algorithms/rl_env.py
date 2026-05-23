import numpy as np
import gymnasium as gym
from gymnasium import spaces
import random

class HexPathEnv(gym.Env):
    def __init__(self, valid_cells=None, obstacles=None, start=None, goal=None, scenario="static"):
        super().__init__()
        self.action_space = spaces.Discrete(6)
        self.observation_space = spaces.Box(low=-10, high=10, shape=(4,), dtype=np.float32)
        self.DIRECTIONS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
        
        if valid_cells is None:
            self.valid_cells = set()
            self.weights = {}
            size = 10
            for q in range(-size, size + 1):
                for r in range(-size, size + 1):
                    if abs(q + r) <= size:
                        self.valid_cells.add((q, r))
                        self.weights[(q, r)] = 0 if random.random() < 0.2 else random.choice([1, 2, 3, 5])
            
            self.start = (0, 0)
            self.goal = (size, -size)
        else:
            self.valid_cells = valid_cells
            self.weights = weights if 'weights' in locals() else {c: 1 for c in valid_cells}
            self.start = start
            self.goal = goal
            
        self.current = self.start

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current = self.start
        return self._get_obs(), {}

    def _get_obs(self):
        dq = (self.goal[0] - self.current[0])
        dr = (self.goal[1] - self.current[1])
        return np.array([dq / 10.0, dr / 10.0, 0.5, 0.0], dtype=np.float32)

    def step(self, action):
        dq, dr = self.DIRECTIONS[action]
        nq, nr = self.current[0] + dq, self.current[1] + dr
        neighbor = (nq, nr)

        if neighbor not in self.valid_cells or self.weights.get(neighbor, 0) == 0:
            return self._get_obs(), -10.0, True, False, {}

        self.current = neighbor
        step_cost = self.weights.get(neighbor, 1)
        reward = -step_cost
        terminated = self.current == self.goal
        if terminated: reward = 50.0

        return self._get_obs(), reward, terminated, False, {}