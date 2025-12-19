import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileText, CheckCircle, Briefcase, StickyNote, Users, Plus, Trash2, RefreshCw, X } from 'lucide-react';
import { supabase } from './supabaseClient';

const InternalSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserId = "user_1";

  const [formData, setFormData] = useState({
    title: "",
    type: "Files",
    owner: "",
    assigned_to: currentUserId,
    visibility: "public",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('search_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.owner?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "All" || item.type === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab, items]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.owner.trim()) return;

    try {
      const { data, error } = await supabase
        .from('search_items')
        .insert([formData])
        .select();
      if (error) throw error;
      if (data?.length) setItems([data[0], ...items]);
      setFormData({ title: "", type: "Files", owner: "", assigned_to: currentUserId, visibility: "public" });
      setShowForm(false);
    } catch (err) {
      setError('Failed to add item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const { error } = await supabase.from('search_items').delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const typeIcons = {
    Files: <FileText size={18} />,
    Tasks: <CheckCircle size={18} />,
    Projects: <Briefcase size={18} />,
    Notes: <StickyNote size={18} />,
    People: <Users size={18} />
  };

  const typeColors = {
    Files: 'bg-blue-50 text-blue-600',
    Tasks: 'bg-emerald-50 text-emerald-600',
    Projects: 'bg-violet-50 text-violet-600',
    Notes: 'bg-amber-50 text-amber-600',
    People: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center">
              <Search size={18} className="text-white" />
            </div>
            <span className="font-semibold text-stone-800 text-lg">search.</span>
          </div>
          <button
            onClick={fetchItems}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['All', 'Files', 'Tasks', 'Projects', 'Notes', 'People'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-500 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat !== 'All' && typeIcons[cat]}
              {cat}
            </button>
          ))}
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium transition-all text-sm"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New item'}
        </button>

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Title"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  placeholder="Owner"
                  className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  {['Files', 'Tasks', 'Projects', 'Notes', 'People'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                  className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="space-y-2">
          <p className="text-xs text-stone-400 font-medium mb-3">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
          </p>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-stone-400 text-sm">Loading...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map(item => (
              <div
                key={item.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${typeColors[item.type] || 'bg-stone-100 text-stone-600'}`}>
                    {typeIcons[item.type] || <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800 truncate">{item.title}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">{item.owner} · {item.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                      item.visibility === 'public'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {item.visibility}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white border border-dashed border-stone-200 rounded-2xl">
              <p className="text-stone-400">No items found.</p>
              <p className="text-stone-300 text-sm mt-1">Try a different search or add a new item.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-6 py-8 text-center">
        <p className="text-xs text-stone-300">Built with ♡</p>
      </footer>
    </div>
  );
};

export default InternalSearch;