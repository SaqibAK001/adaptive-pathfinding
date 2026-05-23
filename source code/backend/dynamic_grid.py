import random


def generate_hex_cells(radius=6):
    valid_cells = set()
    for q in range(-radius, radius + 1):
        for r in range(max(-radius, -q - radius), min(radius, -q + radius) + 1):
            valid_cells.add((q, r))
    return valid_cells


def generate_weights(valid_cells, obstacle_ratio=0.20):
    """
    0 = obstacle
    1/2/3/5 = weights
    """
    weights = {}
    for cell in valid_cells:
        if random.random() < obstacle_ratio:
            weights[cell] = 0
        else:
            weights[cell] = random.choice([1, 1, 1, 2, 2, 3, 5])
    return weights


def apply_dynamic_changes(weights, valid_cells, start, goal,
                          weight_change_prob=0.25):
    """
    Dynamic mode changes ONLY weights, not obstacles.
    Obstacles remain fixed.
    """
    for cell in valid_cells:
        if cell == start or cell == goal:
            continue

        # if obstacle, don't change it
        if weights.get(cell, 1) == 0:
            continue

        # change only weight
        if random.random() < weight_change_prob:
            weights[cell] = random.choice([1, 2, 3, 5])

    # ensure start/goal always safe
    weights[start] = 1
    weights[goal] = 1

    return weights


def weights_to_hex_list(weights, start, goal):
    hex_list = []
    for (q, r), w in weights.items():
        hex_list.append({
            "q": q,
            "r": r,
            "weight": w,
            "is_start": (q, r) == start,
            "is_goal": (q, r) == goal
        })
    return hex_list