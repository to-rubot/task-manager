"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [taskName, setTaskName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [tasks, setTasks] = useState<
  {
    name: string;
    dueDate: string;
    completed: boolean;
    priority?: "high" | "medium" | "low";
  }[]
  >([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortOrder, setSortOrder] = useState<
  "added" | "due" | "priority"
>("added");
  const [prioritizeActive, setPrioritizeActive] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  useEffect(() => {
    const savedTasks = localStorage.getItem("task-manager-tasks");
  
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
  
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      } catch (error) {
        console.error("タスクの読み込みに失敗しました", error);
      }
    }
  
    setTasksLoaded(true);
  }, []);

  useEffect(() => {
    if (!tasksLoaded) return;
  
    localStorage.setItem(
      "task-manager-tasks",
      JSON.stringify(tasks)
    );
  }, [tasks, tasksLoaded]);

  const filteredTasks = tasks
  .map((task, index) => ({ task, index }))
  .filter(({ task }) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const today = new Date().toLocaleDateString("sv-SE");

  const isOverdue = (task: {
    dueDate: string;
    completed: boolean;
  }) => {
    return (
      !task.completed &&
      !!task.dueDate &&
      task.dueDate < today
    );
  };

  const isDueToday = (task: {
    dueDate: string;
    completed: boolean;
  }) => {
    return !task.completed && task.dueDate === today;
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (prioritizeActive && a.task.completed !== b.task.completed) {
      return a.task.completed ? 1 : -1;
    }
  
    if (sortOrder === "added") {
      return a.index - b.index;
    }
  
    if (sortOrder === "priority") {
      const priorityValue = {
        high: 3,
        medium: 2,
        low: 1,
      };
  
      const aPriority = priorityValue[a.task.priority ?? "medium"];
      const bPriority = priorityValue[b.task.priority ?? "medium"];
  
      return bPriority - aPriority || a.index - b.index;
    }
  
    if (!a.task.dueDate && !b.task.dueDate) {
      return a.index - b.index;
    }
    if (!a.task.dueDate) return 1;
    if (!b.task.dueDate) return -1;
  
    return (
      a.task.dueDate.localeCompare(b.task.dueDate) ||
      a.index - b.index
    );
  });

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;
  
  const activeCount = tasks.length - completedCount;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 text-3xl font-bold">
          タスク管理アプリ
        </h1>

        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">
              タスク名
            </label>

            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="例：資料を作る"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              期限
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker()}
              style={{ colorScheme: "dark" }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              優先度
            </label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value as "high" | "medium" | "low"
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="high">🔴 高</option>
              <option value="medium">🟡 中</option>
              <option value="low">🟢 低</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!taskName.trim()) return;

              setTasks((prev) => [
                ...prev,
                {
                  name: taskName,
                  dueDate,
                  completed: false,
                  priority
                },
              ]);

              setTaskName("");
              setDueDate("");
            }}
            className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black"
          >
            タスクを追加
          </button>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">
            タスク一覧（{tasks.length}件）
          </h2>

          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-400">並び替え</span>

            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "added" | "due")
              }
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="added">追加した順</option>
              <option value="due">期限が近い順</option>
              <option value="priority">優先度が高い順</option>
            </select>
          </div>

          <label className="mb-4 flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={prioritizeActive}
              onChange={(e) => setPrioritizeActive(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
              未完了のタスクを優先して表示
          </label>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-zinc-800 p-3 text-center">
              <p className="text-xs text-zinc-400">すべて</p>
              <p className="text-xl font-bold">{tasks.length}件</p>
            </div>

            <div className="rounded-lg bg-zinc-800 p-3 text-center">
              <p className="text-xs text-zinc-400">未完了</p>
              <p className="text-xl font-bold">{activeCount}件</p>
            </div>

            <div className="rounded-lg bg-zinc-800 p-3 text-center">
              <p className="text-xs text-zinc-400">完了済み</p>
              <p className="text-xl font-bold">{completedCount}件</p>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm"
            >
              すべて
            </button>

            <button
              type="button"
              onClick={() => setFilter("active")}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm"
            >
              未完了
            </button>

            <button
              type="button"
              onClick={() => setFilter("completed")}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm"
            >
              完了済み
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
              まだタスクはありません
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map(({ task, index }) => (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {
                        setTasks((prev) =>
                          prev.map((t, i) =>
                            i === index
                              ? { ...t, completed: !t.completed }
                              : t
                          )
                        );
                      }}
                    />

                    <p
                      className={
                        task.completed
                          ? "font-medium line-through text-zinc-500"
                          : "font-medium"
                      }
                    >
                      {task.name}
                    </p>
                  </div>

                  <p
                    className={`mt-1 text-sm ${
                      isOverdue(task)
                        ? "font-semibold text-red-400"
                        : isDueToday(task)
                        ? "font-semibold text-yellow-400"
                        : "text-zinc-400"
                    }`}
                  >
                    期限：{task.dueDate || "未設定"}
                    {isOverdue(task) && " ⚠️ 期限切れ"}
                    {isDueToday(task) && " 🟡 今日が期限"}
                  </p>

                  <p className="mt-1 text-sm">
                    優先度：
                    {task.priority === "high"
                      ? "🔴 高"
                      : task.priority === "low"
                      ? "🟢 低"
                      : "🟡 中"}
                  </p>

                  <button
                    onClick={() => {
                      const ok = window.confirm("このタスクを削除しますか？");
                    
                      if (!ok) return;
                    
                      setTasks((prev) => prev.filter((_, i) => i !== index));
                    }}
                    className="mt-3 rounded-lg border border-red-400 px-3 py-1 text-sm text-red-400 hover:bg-red-950"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}