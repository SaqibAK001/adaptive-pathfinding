import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import random
from collections import deque
from algorithms.rl_env import HexPathEnv

class DQNetwork(nn.Module):
    def __init__(self, state_dim=4, action_dim=6):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, 64), nn.ReLU(),
            nn.Linear(64, 64), nn.ReLU(),
            nn.Linear(64, action_dim)
        )
    def forward(self, x): return self.net(x)

class DQNAgent:
    def __init__(self, state_dim=4, action_dim=6, lr=1e-3, gamma=0.99, buffer_size=10000, batch_size=64):
        self.q_net = DQNetwork(state_dim, action_dim)
        self.target_net = DQNetwork(state_dim, action_dim)
        self.target_net.load_state_dict(self.q_net.state_dict())
        self.optimizer = optim.Adam(self.q_net.parameters(), lr=lr)
        self.gamma = gamma
        self.buffer = deque(maxlen=buffer_size)
        self.batch_size = batch_size
        self.eps = 1.0

    def act(self, state):
        if np.random.rand() < self.eps: return np.random.randint(0, 6)
        return self.q_net(torch.tensor(state, dtype=torch.float32).unsqueeze(0)).argmax().item()

    def remember(self, s, a, r, ns, done): self.buffer.append((s, a, r, ns, done))

    def replay(self):
        if len(self.buffer) < self.batch_size: return
        batch = random.sample(self.buffer, self.batch_size)
        states = torch.tensor([b[0] for b in batch], dtype=torch.float32)
        actions = torch.tensor([b[1] for b in batch]).unsqueeze(1)
        rewards = torch.tensor([b[2] for b in batch], dtype=torch.float32)
        next_states = torch.tensor([b[3] for b in batch], dtype=torch.float32)
        dones = torch.tensor([b[4] for b in batch], dtype=torch.float32)

        q_vals = self.q_net(states).gather(1, actions)
        next_q = self.target_net(next_states).max(1)[0].detach()
        targets = rewards + (1 - dones) * self.gamma * next_q

        loss = nn.MSELoss()(q_vals.squeeze(), targets)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

    def train(self, episodes=500, scenario="static"):
        env = HexPathEnv(scenario=scenario)
        for ep in range(episodes):
            state, _ = env.reset()
            while True:
                action = self.act(state)
                ns, reward, done, trunc, _ = env.step(action)
                self.remember(state, action, reward, ns, done or trunc)
                self.replay()
                state = ns
                if done or trunc: break
            self.eps = max(0.1, self.eps * 0.995)
            if ep % 10 == 0: self.target_net.load_state_dict(self.q_net.state_dict())
        
        torch.save(self.q_net.state_dict(), "models/dqn_qnet.pth")
        return {"status": "trained", "episodes": episodes}

def get_adaptive_heuristic():
    qnet = DQNetwork()
    try:
        qnet.load_state_dict(torch.load("models/dqn_qnet.pth", weights_only=True, map_location='cpu'))
    except: return None
    qnet.eval()
    def heuristic(current, goal, base_h):
        dq = (goal[0] - current[0]) / 10.0
        dr = (goal[1] - current[1]) / 10.0
        state = torch.tensor([dq, dr, 0.5, 0.0], dtype=torch.float32).unsqueeze(0)
        with torch.no_grad(): q_vals = qnet(state).squeeze()
        return base_h + max(0.0, q_vals.max().item() * 0.2)
    return heuristic

def run_dqn(start, goal, weights, valid_cells):
    try:
        qnet = DQNetwork()
        qnet.load_state_dict(torch.load("models/dqn_qnet.pth", weights_only=True, map_location='cpu'))
        qnet.eval()
    except: return [], 0, 0, 0, []

    current = start
    path = [start]
    visited = {start}
    total_cost = 0
    steps = 0
    max_steps = 150
    dirs = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
    
    while current != goal and steps < max_steps:
        dq = (goal[0] - current[0]) / 10.0
        dr = (goal[1] - current[1]) / 10.0
        state = torch.tensor([dq, dr, 0.5, 0.0], dtype=torch.float32).unsqueeze(0)
        
        with torch.no_grad(): action = qnet(state).argmax().item()
        
        dq_move, dr_move = dirs[action]
        neighbor = (current[0] + dq_move, current[1] + dr_move)
        
        if neighbor in valid_cells and weights.get(neighbor, 0) > 0:
            current = neighbor
            total_cost += weights.get(current, 1)
            if current not in visited:
                path.append(current)
                visited.add(current)
        steps += 1
        
    return path, len(path)-1, total_cost, len(path), list(visited)

def train_rl(episodes=500, lr=1e-3, gamma=0.99, scenario="static"):
    agent = DQNAgent(lr=lr, gamma=gamma)
    return agent.train(episodes=episodes, scenario=scenario)