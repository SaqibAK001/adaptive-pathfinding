def build_weights_from_hexes(hexes):
    weights = {}
    valid_cells = set()

    start = None
    goal = None

    for h in hexes:
        q = h["q"]
        r = h["r"]
        w = h["weight"]

        weights[(q, r)] = w
        valid_cells.add((q, r))

        if h.get("is_start"):
            start = (q, r)
        if h.get("is_goal"):
            goal = (q, r)

    if start is None:
        start = (-6, 0)
    if goal is None:
        goal = (6, 0)

    weights[start] = 1
    weights[goal] = 1

    return weights, start, goal, valid_cells