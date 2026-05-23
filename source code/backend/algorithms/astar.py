import heapq

DIRECTIONS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]

def hex_distance(q1, r1, q2, r2):
    return (abs(q1 - q2) + abs(r1 - r2) + abs((-q1-r1) - (-q2-r2))) // 2

def run_astar(start, goal, weights, valid_cells, adaptive_heuristic=None):
    open_set = [(0, 0, start[0], start[1])]
    came_from = {}
    g_score = {start: 0}
    nodes_explored = 0
    explored_nodes = []

    while open_set:
        _, _, q, r = heapq.heappop(open_set)
        current = (q, r)
        nodes_explored += 1
        explored_nodes.append(current)

        if current == goal:
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            # Calculate total weighted cost
            total_cost = sum(weights.get(node, 1) for node in path)
            return path, len(path)-1, total_cost, nodes_explored, explored_nodes

        for dq, dr in DIRECTIONS:
            nq, nr = q + dq, r + dr
            neighbor = (nq, nr)
            
            if neighbor in valid_cells and weights.get(neighbor, 0) > 0:
                step_cost = weights[neighbor]
                tentative_g = g_score.get(current, float('inf')) + step_cost
                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    g_score[neighbor] = tentative_g
                    h = hex_distance(nq, nr, goal[0], goal[1])
                    if adaptive_heuristic: h = adaptive_heuristic(neighbor, goal, h)
                    f = tentative_g + h
                    heapq.heappush(open_set, (f, tentative_g, nq, nr))
                    came_from[neighbor] = current
    
    return [], 0, 0, nodes_explored, explored_nodes