"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [taskName, setTaskName] = useState("");
  const [taskNameError, setTaskNameError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingPriority, setEditingPriority] = useState<
    "high" | "medium" | "low"
  >("medium");
  const [editingCategory, setEditingCategory] = useState<
    "work" | "study" | "personal" | "unset"
  >("unset");
  const [editingMemo, setEditingMemo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [category, setCategory] = useState<
    "work" | "study" | "personal"
  >("work");
  const [taskMemo, setTaskMemo] = useState("");
  const [tasks, setTasks] = useState<
  {
    name: string;
    dueDate: string;
    completed: boolean;
    priority?: "high" | "medium" | "low";
    category?: "work" | "study" | "personal";
    memo?: string;
  }[]
  >([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<
    ("high" | "medium" | "low")[]
  >(["high", "medium", "low"]);
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "work" | "study" | "personal" | "unset"
  >("all");
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
    const matchesStatus =
      filter === "all" ||
      (filter === "active" && !task.completed) ||
      (filter === "completed" && task.completed);

    const matchesPriority = selectedPriorities.includes(
      task.priority ?? "medium"
    );

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "unset" && !task.category) ||
      task.category === selectedCategory;

    const matchesSearch = (task.name + " " + (task.memo ?? ""))
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    return (
      matchesStatus &&
      matchesPriority &&
      matchesSearch &&
      matchesCategory
    );
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

  const workCount = tasks.filter(
    (task) => task.category === "work"
  ).length;
  
  const studyCount = tasks.filter(
    (task) => task.category === "study"
  ).length;
  
  const personalCount = tasks.filter(
    (task) => task.category === "personal"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;
  
  const activeCount = tasks.length - completedCount;

  const overdueCount = tasks.filter((task) => isOverdue(task)).length;

  const dueTodayCount = tasks.filter((task) => isDueToday(task)).length;

  const progressRate =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  const deleteCompletedTasks = () => {
    if (completedCount === 0) return;

    const ok = window.confirm(
      `完了済みのタスク ${completedCount} 件をすべて削除しますか？`
    );

    if (!ok) return;

    setTasks(tasks.filter((task) => !task.completed));
  };

  const addTask = () => {
    if (!taskName.trim()) {
      setTaskNameError("タスク名を入力してください");
      return;
    }

    setTaskNameError("");

    setTasks((prev) => [
      ...prev,
      {
        name: taskName.trim(),
        dueDate,
        completed: false,
        priority,
        category,
        memo: taskMemo.trim() || undefined,
      },
    ]);

    setTaskName("");
    setDueDate("");
    setTaskMemo("");
  };

  const tabClass = (value: "all" | "active" | "completed") =>
    filter === value
      ? "rounded-lg bg-white px-3 py-2 text-sm font-medium text-black"
      : "rounded-lg border border-zinc-600 px-3 py-2 text-sm";

  const downloadBackup = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
    };
  
    const blob = new Blob(
      [JSON.stringify(backupData, null, 2)],
      { type: "application/json" }
    );
  
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
  
    link.href = url;
    link.download = `task-manager-backup-${
      new Date().toLocaleDateString("sv-SE")
    }.json`;
  
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    URL.revokeObjectURL(url);
  };

  const restoreBackup = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    try {
      const text = await file.text();
      const data = JSON.parse(text);
  
      if (
        data.version !== 1 ||
        !Array.isArray(data.tasks) ||
        !data.tasks.every(
          (task: unknown) =>
            typeof task === "object" &&
            task !== null &&
            "name" in task &&
            typeof task.name === "string" &&
            "dueDate" in task &&
            typeof task.dueDate === "string" &&
            "completed" in task &&
            typeof task.completed === "boolean" &&
            (!("priority" in task) ||
              task.priority === undefined ||
              ["high", "medium", "low"].includes(
                String(task.priority)
              )) &&
            (!("category" in task) ||
              task.category === undefined ||
              ["work", "study", "personal"].includes(
                String(task.category)
              )) &&
            (!("memo" in task) ||
              task.memo === undefined ||
              typeof task.memo === "string")
        )
      ) {
        alert("バックアップファイルの形式が正しくありません。");
        return;
      }
  
      const ok = window.confirm(
        "現在のタスクをバックアップの内容で置き換えます。よろしいですか？"
      );
  
      if (!ok) return;
  
      setTasks(data.tasks);
      alert("バックアップを復元しました！");
    } catch {
      alert("ファイルの読み込みに失敗しました。");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-8 text-3xl font-bold">
          タスク管理アプリ
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
          className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              タスク名
            </label>

            <input
              type="text"
              value={taskName}
              onChange={(e) => {
                setTaskName(e.target.value);
                if (taskNameError) setTaskNameError("");
              }}
              placeholder="例：資料を作る"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />

            {taskNameError && (
              <p className="mt-2 text-sm text-red-400">{taskNameError}</p>
            )}
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

          <div>
            <label className="mb-2 block text-sm font-medium">
              カテゴリ
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value as "work" | "study" | "personal"
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="work">💼 仕事</option>
              <option value="study">📚 勉強</option>
              <option value="personal">🏠 プライベート</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              メモ（任意）
            </label>

            <textarea
              value={taskMemo}
              onChange={(e) => setTaskMemo(e.target.value)}
              placeholder="例：担当者に確認する"
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black"
          >
            タスクを追加
          </button>
        </form>

        <div className="mt-8">



          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              タスク一覧（{tasks.length}件）
            </h2>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={deleteCompletedTasks}
                className="rounded-lg border border-red-900 bg-red-950 px-3 py-1.5 text-sm text-red-300"
              >
                完了済みをすべて削除
              </button>
            )}
          </div>

          {(overdueCount > 0 || dueTodayCount > 0) && (
            <div className="mb-4 rounded-lg border border-red-900 bg-red-950 px-4 py-3 text-sm">
              {overdueCount > 0 && (
                <p className="text-red-300">
                  ⚠️ 期限切れが {overdueCount} 件あります
                </p>
              )}
              {dueTodayCount > 0 && (
                <p className="text-yellow-300">
                  🟡 今日が期限のタスクが {dueTodayCount} 件あります
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 タスク名・メモを検索..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

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

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-zinc-400">進捗</span>
              <span>
                {progressRate}%（{completedCount}／{tasks.length}件完了）
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${progressRate}%` }}
              />
            </div>
          </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-zinc-800 p-3 text-center">
                <p className="text-xs text-zinc-400">💼 仕事</p>
                <p className="text-xl font-bold">{workCount}件</p>
              </div>

              <div className="rounded-lg bg-zinc-800 p-3 text-center">
                <p className="text-xs text-zinc-400">📚 勉強</p>
                <p className="text-xl font-bold">{studyCount}件</p>
              </div>

              <div className="rounded-lg bg-zinc-800 p-3 text-center">
                <p className="text-xs text-zinc-400">🏠 プライベート</p>
                <p className="text-xl font-bold">{personalCount}件</p>
              </div>
            </div>

          <details className="mb-4 rounded-lg border border-zinc-700 p-4">
            <summary className="cursor-pointer text-sm font-medium">
              絞り込み（優先度・カテゴリ）
            </summary>
          <div className="mb-4">
            <p className="mb-3 text-sm font-medium">
              優先度で絞り込み
            </p>

            <div className="flex flex-wrap gap-4">
              {([
                { value: "high", label: "🔴 高" },
                { value: "medium", label: "🟡 中" },
                { value: "low", label: "🟢 低" },
              ] as const).map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                <input
                  type="checkbox"
                  checked={selectedPriorities.includes(item.value)}
                  onChange={(e) => {
                    setSelectedPriorities((prev) =>
                      e.target.checked
                      ? [...prev, item.value]
                      : prev.filter((p) => p !== item.value)
                    );
                  }}
                  className="h-4 w-4 accent-blue-600"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            カテゴリで絞り込み
          </label>

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value as
                  | "all"
                  | "work"
                  | "study"
                  | "personal"
                  | "unset"
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            >
              <option value="all">すべてのカテゴリ</option>
              <option value="work">💼 仕事</option>
              <option value="study">📚 勉強</option>
              <option value="personal">🏠 プライベート</option>
              <option value="unset">未設定</option>
            </select>
          </div>

        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setFilter("all");
            setSelectedPriorities(["high", "medium", "low"]);
            setSelectedCategory("all");
          }}
          className="mb-4 w-full rounded-lg border border-zinc-600 px-4 py-2 text-sm text-white hover:bg-zinc-800"
        >
          🔄 絞り込みをリセット
        </button>
          </details>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={tabClass("all")}
            >
              すべて
            </button>

            <button
              type="button"
              onClick={() => setFilter("active")}
              className={tabClass("active")}
            >
              未完了
            </button>

            <button
              type="button"
              onClick={() => setFilter("completed")}
              className={tabClass("completed")}
            >
              完了済み
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
              {tasks.length === 0
                ? "まだタスクはありません"
                : "条件に合うタスクがありません。絞り込みをリセットしてみてください"}
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

                    {editingIndex === index ? (
                      <div className="flex w-full flex-col gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full rounded-lg border border-blue-500 bg-zinc-950 px-3 py-2 text-white"
                        />

                        <div>
                          <label className="mb-1 block text-sm text-zinc-400">
                            期限
                          </label>
                          <input
                            type="date"
                            value={editingDueDate}
                            onChange={(e) => setEditingDueDate(e.target.value)}
                            style={{ colorScheme: "dark" }}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm text-zinc-400">
                            優先度
                          </label>
                          <select
                           value={editingPriority}
                           onChange={(e) =>
                            setEditingPriority(
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

                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">
                          カテゴリ
                        </label>

                        <select
                          value={editingCategory}
                          onChange={(e) =>
                            setEditingCategory(
                              e.target.value as
                                | "work"
                                | "study"
                                | "personal"
                                | "unset"
                            )
                          }
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                        >
                          <option value="work">💼 仕事</option>
                          <option value="study">📚 勉強</option>
                          <option value="personal">🏠 プライベート</option>
                          <option value="unset">未設定</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">
                          メモ
                        </label>
                        <textarea
                          value={editingMemo}
                          onChange={(e) => setEditingMemo(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                        />
                      </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingName.trim()) return;

                              setTasks((prev) =>
                                prev.map((t, i) =>
                                  i === index
                                    ? {
                                        ...t,
                                        name: editingName.trim(),
                                        dueDate: editingDueDate,
                                        priority: editingPriority,
                                        category: editingCategory === "unset" ? undefined : editingCategory,
                                        memo: editingMemo.trim() || undefined,
                                      }
                                    : t
                                )
                              );

                              setEditingIndex(null);
                            }}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white"
                          >
                            保存
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="rounded-lg border border-zinc-600 px-3 py-1 text-sm text-white"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={
                          task.completed
                            ? "font-medium line-through text-zinc-500"
                            : "font-medium"
                          }
                        >
                          {task.name}
                        </p>
                      )}
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

                  <p className="mt-1 text-sm text-zinc-400">
                    カテゴリ：
                    {task.category === "work"
                      ? "💼 仕事"
                      : task.category === "study"
                      ? "📚 勉強"
                      : task.category === "personal"
                      ? "🏠 プライベート"
                      : "未設定"}
                    </p>

                  {task.memo && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                      📝 {task.memo}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(index);
                      setEditingName(task.name);
                      setEditingDueDate(task.dueDate);
                      setEditingPriority(task.priority ?? "medium");
                      setEditingCategory(task.category ?? "unset");
                      setEditingMemo(task.memo ?? "");
                    }}
                    className="mt-3 mr-2 rounded-lg border border-blue-400 px-3 py-1 text-sm text-blue-400 hover:bg-blue-950"
                  >
                    編集
                  </button>

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

        <div className="mt-6 mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-lg font-semibold">
            データのバックアップ
          </h2>

          <button
            type="button"
            onClick={downloadBackup}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            📥 バックアップを保存
          </button>

          <label className="mt-3 block w-full cursor-pointer rounded-lg border border-blue-500 px-4 py-2 text-center font-medium text-blue-400 hover:bg-blue-950">
            📤 バックアップを復元

            <input
              type="file"
              accept=".json,application/json"
              onChange={restoreBackup}
              className="hidden"
            />
          </label>
        </div>
        </div>
      </div>
    </main>
  );
}