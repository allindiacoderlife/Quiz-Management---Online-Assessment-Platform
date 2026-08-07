import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { Folder, Plus, Pencil, Trash2, X, AlertCircle } from "lucide-react";

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create / Edit modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // "CREATE" or "EDIT"
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      setError(err.message || "Failed to load categories list");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode("CREATE");
    setCategoryId("");
    setName("");
    setDescription("");
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setModalMode("EDIT");
    setCategoryId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setModalError("");
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setModalError("");
    setSaving(true);

    try {
      if (modalMode === "CREATE") {
        const res = await api.post("/categories", { name: name.trim(), description });
        setCategories([...categories, { ...res.data, quizCount: 0 }]);
      } else {
        const res = await api.put(`/categories/${categoryId}`, { name: name.trim(), description });
        setCategories(
          categories.map((c) =>
            c.id === categoryId
              ? { ...c, name: res.data.name, description: res.data.description }
              : c
          )
        );
      }
      setShowModal(false);
    } catch (err) {
      setModalError(err.message || "Failed to save category details");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    const category = categories.find((c) => c.id === catId);
    if (category?.quizCount > 0) {
      alert(`Cannot delete category "${category.name}" because it contains ${category.quizCount} quizzes. Please remove or re-categorize the quizzes first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${category?.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${catId}`);
      setCategories(categories.filter((c) => c.id !== catId));
    } catch (err) {
      alert(err.message || "Failed to delete category");
    }
  };

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Quiz Categories</h1>
          <p className="text-sm text-slate-500 mt-1">Manage assessment focus areas, subjects, and topics</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <Folder className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-800">No Categories Defined</h3>
          <p className="mt-2 text-sm text-slate-500">Create a category to begin adding quizzes</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Folder className="h-5 w-5" />
                  </div>
                  
                  {/* Category actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                      title="Edit Category"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-slate-900 line-clamp-1">{cat.name}</h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                  {cat.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Associated Quizzes</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-800 font-bold">{cat.quizCount}</span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {modalMode === "CREATE" ? "New Category" : "Edit Category"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-semibold flex items-start gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              {/* Category Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript, React, Cyber Security"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  placeholder="Summarize what topics are assessed inside this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  disabled={saving}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-400 flex items-center justify-center"
                >
                  {saving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    "Save Category"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCategories;
