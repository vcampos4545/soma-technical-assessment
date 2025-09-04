import { Todo } from "@prisma/client";

export interface TaskGraph {
  [taskId: number]: number[];
}

export interface CriticalPathResult {
  criticalPath: number[];
  maxDistance: number;
}

export interface GraphVisualization {
  nodes: Array<{
    id: number;
    label: string;
    level: number;
    dependencies: number[];
  }>;
  edges: Array<{ from: number; to: number }>;
}

/**
 * Builds an adjacency list representation of the task dependency graph
 */
export function buildTaskGraph(todos: Todo[]): TaskGraph {
  const graph: TaskGraph = {};

  for (const task of todos) {
    try {
      const deps = JSON.parse(task.dependencies || "[]");
      graph[task.id] = Array.isArray(deps) ? deps : [];
    } catch (error) {
      console.error("Error parsing dependencies for task", task.id, error);
      graph[task.id] = [];
    }
  }

  return graph;
}

/**
 * Checks if adding a dependency would cause a circular dependency
 */
export function wouldCauseCycle(
  graph: TaskGraph,
  A: number,
  B: number
): boolean {
  const queue = [B];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === A) return true; // cycle detected

    if (!visited.has(current)) {
      visited.add(current);
      for (const dep of graph[current] || []) {
        queue.push(dep);
      }
    }
  }
  return false;
}

/**
 * Calculate critical path using longest path algorithm
 */
export function calculateCriticalPath(
  graph: TaskGraph,
  todos: Todo[]
): CriticalPathResult {
  const inDegree: Record<number, number> = {};
  const distances: Record<number, number> = {};
  const predecessors: Record<number, number> = {};

  // Initialize
  todos.forEach((todo) => {
    inDegree[todo.id] = 0;
    distances[todo.id] = 0;
  });

  // Calculate in-degrees
  todos.forEach((todo) => {
    try {
      const deps = JSON.parse(todo.dependencies || "[]");
      deps.forEach((depId: number) => {
        inDegree[depId] = (inDegree[depId] || 0) + 1;
      });
    } catch (error) {
      console.error("Error parsing dependencies for critical path", error);
    }
  });

  // Topological sort with longest path
  const queue: number[] = [];
  todos.forEach((todo) => {
    if (inDegree[todo.id] === 0) {
      queue.push(todo.id);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift()!;

    try {
      const deps = JSON.parse(
        todos.find((t) => t.id === current)?.dependencies || "[]"
      );
      deps.forEach((depId: number) => {
        const newDistance = distances[current] + 1;
        if (newDistance > distances[depId]) {
          distances[depId] = newDistance;
          predecessors[depId] = current;
        }

        inDegree[depId]--;
        if (inDegree[depId] === 0) {
          queue.push(depId);
        }
      });
    } catch (error) {
      console.error("Error processing dependencies for critical path", error);
    }
  }

  // Find the longest path
  let maxDistance = 0;
  let endNode = 0;
  Object.entries(distances).forEach(([id, distance]) => {
    if (distance > maxDistance) {
      maxDistance = distance;
      endNode = parseInt(id);
    }
  });

  // Reconstruct the critical path in correct order (dependencies first)
  const criticalPath: number[] = [];
  let current = endNode;

  // First, collect all nodes in reverse order
  while (current !== 0) {
    criticalPath.push(current);
    current = predecessors[current] || 0;
  }

  // Then reverse to get correct order (dependencies first)
  criticalPath.reverse();

  return { criticalPath, maxDistance };
}

/**
 * Calculate earliest possible start date for each task based on dependencies
 */
export function calculateEarliestStartDates(
  graph: TaskGraph,
  todos: Todo[]
): Record<number, number> {
  const earliestStartDates: Record<number, number> = {};
  const visited = new Set<number>();

  const dfs = (taskId: number): number => {
    if (visited.has(taskId)) {
      return earliestStartDates[taskId];
    }

    visited.add(taskId);

    try {
      const deps = JSON.parse(
        todos.find((t) => t.id === taskId)?.dependencies || "[]"
      );
      if (deps.length === 0) {
        earliestStartDates[taskId] = 0;
        return 0;
      }

      let maxDependencyStart = 0;
      deps.forEach((depId: number) => {
        const depStart = dfs(depId);
        maxDependencyStart = Math.max(maxDependencyStart, depStart + 1);
      });

      earliestStartDates[taskId] = maxDependencyStart;
      return maxDependencyStart;
    } catch (error) {
      console.error(
        "Error calculating earliest start date for task",
        taskId,
        error
      );
      earliestStartDates[taskId] = 0;
      return 0;
    }
  };

  todos.forEach((todo) => {
    if (!visited.has(todo.id)) {
      dfs(todo.id);
    }
  });

  return earliestStartDates;
}

/**
 * Generate visualization data for the dependency graph
 */
export function generateGraphVisualization(
  graph: TaskGraph,
  todos: Todo[]
): GraphVisualization {
  const nodes = todos.map((todo) => ({
    id: todo.id,
    label: todo.title,
    level: 0, // Will be calculated
    dependencies: [],
  }));

  const edges: Array<{ from: number; to: number }> = [];

  // Calculate levels for each node
  const calculateLevel = (
    taskId: number,
    visited: Set<number> = new Set()
  ): number => {
    if (visited.has(taskId)) {
      return 0; // Prevent cycles
    }

    visited.add(taskId);

    // Get the dependencies for this task
    try {
      const deps = JSON.parse(
        todos.find((t) => t.id === taskId)?.dependencies || "[]"
      );

      if (deps.length === 0) {
        return 0; // No dependencies = level 0
      }

      // Find the maximum level of all dependencies and add 1
      let maxDependencyLevel = 0;
      deps.forEach((depId: number) => {
        const depLevel = calculateLevel(depId, new Set(visited));
        maxDependencyLevel = Math.max(maxDependencyLevel, depLevel);
      });

      return maxDependencyLevel + 1;
    } catch (error) {
      console.error("Error calculating level for task", taskId, error);
      return 0;
    }
  };

  nodes.forEach((node) => {
    node.level = calculateLevel(node.id);
    try {
      const deps = JSON.parse(
        todos.find((t) => t.id === node.id)?.dependencies || "[]"
      );
      node.dependencies = deps;
      deps.forEach((depId: number) => {
        edges.push({ from: depId, to: node.id });
      });
    } catch (error) {
      console.error("Error parsing dependencies for visualization", error);
    }
  });

  return { nodes, edges };
}
