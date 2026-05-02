import torch
import torch.nn as nn
import numpy as np
import random
import os

HEX_DIRS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


class QNetwork(nn.Module):
    def __init__(self, input_dim=4, output_dim=6):
        super(QNetwork, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, output_dim)
        )

    def forward(self, x):
        return self.net(x)


def state_representation(current, goal, current_weight):
    """
    Must match training checkpoint input shape = 4
    """
    cq, cr = current
    gq, gr = goal

    # 4 inputs: q, r, distance, current_weight
    dist = abs(cq - gq) + abs(cr - gr)

    return np.array([cq, cr, dist, current_weight], dtype=np.float32)


def load_model(model_path="models/dqn_qnet.pth"):
    qnet = QNetwork()

    if os.path.exists(model_path):
        qnet.load_state_dict(torch.load(model_path, map_location=torch.device("cpu")))

    qnet.eval()
    return qnet


QNET = load_model()


def dqn_policy_step(weights, current, goal, valid_cells):
    """
    Returns next move from DQN policy.
    If invalid move chosen, fallback random valid move.
    """
    if current == goal:
        return current

    current_weight = weights.get(current, 1)

    state = state_representation(current, goal, current_weight)
    state_tensor = torch.tensor(state).unsqueeze(0)

    with torch.no_grad():
        q_values = QNET(state_tensor).numpy().flatten()

    action = int(np.argmax(q_values))
    dq, dr = HEX_DIRS[action]
    nxt = (current[0] + dq, current[1] + dr)

    # invalid move or obstacle
    if nxt not in valid_cells or weights.get(nxt, 1) == 0:
        neighbors = []
        for dq, dr in HEX_DIRS:
            cand = (current[0] + dq, current[1] + dr)
            if cand in valid_cells and weights.get(cand, 1) != 0:
                neighbors.append(cand)

        if not neighbors:
            return None

        return random.choice(neighbors)

    return nxt


def run_dqn(weights, start, goal, max_steps=200):
    valid_cells = set(weights.keys())
    current = start

    path = [{"q": current[0], "r": current[1]}]

    for _ in range(max_steps):
        if current == goal:
            break

        nxt = dqn_policy_step(weights, current, goal, valid_cells)

        if nxt is None:
            break

        current = nxt
        path.append({"q": current[0], "r": current[1]})

    return {
        "path": path,
        "explored": [],
        "steps": len(path) - 1,
        "nodes": 0,
        "cost": 0
    }


def get_adaptive_heuristic(weights, node, goal):
    """
    Hybrid algorithm expects this function.
    Returns heuristic cost estimate.
    """
    q1, r1 = node
    q2, r2 = goal

    dist = abs(q1 - q2) + abs(r1 - r2)
    w = weights.get(node, 1)

    return dist * w