import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileText, CheckCircle, Briefcase, StickyNote, Users, Shield, User, Plus, Trash2, AlertCircle, Loader } from 'lucide-react';
import { supabase } from './supabaseClient';


const InternalSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Fetch items from Supabase on mount
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
      
      // Transform data for compatibility
      const transformedData = data.map(item => ({
        ...item,
        assignedTo: item.assigned_to
      }));
      
      setItems(transformedData);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };
  // 1.3 Privacy Architecture Logic
  const filteredResults = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "All" || item.type === activeTab;
      const hasPermission = isAdmin || item.visibility === "public" || item.assignedTo === currentUserId;
      return matchesSearch && matchesTab && hasPermission;
    });
  }, [searchTerm, activeTab, isAdmin, items]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.owner.trim()) {
      alert("Please fill in title and owner fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('search_items')
        .insert([{
          title: formData.title,
          type: formData.type,
          owner: formData.owner,
          assigned_to: formData.assigned_to,
          visibility: formData.visibility
        }])
        .select();

      if (error) throw error;

      // Add new item to local state with shape normalization
      if (data && data.length > 0) {
        const normalized = {
          ...data[0],
          assignedTo: data[0].assigned_to
        };
        setItems([normalized, ...items]);
      }
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item');
    }
    setFormData({
      title: "",
      type: "Files",
      owner: "",
      assigned_to: currentUserId,
      visibility: "public",
    });
    setShowForm(false);
  };

  const handleDeleteItem = async (id) => {
    try {
      const { error } = await supabase
        .from('search_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
    setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar - Enhanced Navigation */}
      <div className="w-64 bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6 hidden md:flex flex-col border-r border-slate-700">
        <div className="mb-12">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Search size={24} />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">InternalOS</span>
          </h1>
          <p className="text-xs text-gray-400">Enterprise Search Platform</p>
        </div>

        <nav className="space-y-2 flex-1">
          <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-4">Menu</div>
          <div className="text-white hover:bg-slate-800/50 cursor-pointer px-3 py-2 rounded-lg transition-colors">Search</div>
          <div className="text-gray-400 hover:text-white hover:bg-slate-800/50 cursor-pointer px-3 py-2 rounded-lg transition-colors">Dashboard</div>
          <div className="text-gray-400 hover:text-white hover:bg-slate-800/50 cursor-pointer px-3 py-2 rounded-lg transition-colors">Analytics</div>
        </nav>

        {/* Admin Toggle */}
        <div className="mt-auto pt-6 border-t border-slate-700">
          <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg w-full transition-all font-medium ${
              isAdmin 
                ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border border-red-500/50 hover:from-red-500/30 hover:to-red-600/30' 
                : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isAdmin ? <Shield size={16}/> : <User size={16}/>}
            <span>{isAdmin ? "Admin View" : "Employee View"}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="mb-10">
            <h2 className="text-4xl font-bold text-white mb-2">Internal Search</h2>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
              Find files, tasks, and people instantly
            </p>
          </header>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-4 text-gray-500" size={20} />
            <input 
              type="text"
              placeholder="Search by title or owner..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder-gray-500 hover:border-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Item / Refresh Buttons */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              {showForm ? 'Cancel' : 'Add New Item'}
            </button>
            <button
              onClick={fetchItems}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all border border-slate-600"
            >
              Refresh
            </button>
          </div>

          {/* Add Item Form */}
          {showForm && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8 shadow-xl">
              <h3 className="text-white font-bold mb-4">Add New Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Item title"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Owner</label>
                    <input
                      type="text"
                      name="owner"
                      value={formData.owner}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option>Files</option>
                      <option>Tasks</option>
                      <option>Projects</option>
                      <option>Notes</option>
                      <option>People</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Visibility</label>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option>public</option>
                      <option>private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Assigned To</label>
                    <select
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="user_1">user_1</option>
                      <option value="user_2">user_2</option>
                      <option value="user_3">user_3</option>
                      <option value="admin_only">admin_only</option>
                      <option value="all">all</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all"
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Files', 'Tasks', 'Projects', 'Notes', 'People'].map((cat) => {
              const icons = {
                'All': <Search size={18}/>,
                'Files': <FileText size={18}/>,
                'Tasks': <CheckCircle size={18}/>,
                'Projects': <Briefcase size={18}/>,
                'Notes': <StickyNote size={18}/>,
                'People': <Users size={18}/>
              };
              
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === cat 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-slate-700'
                  }`}
                >
                  {icons[cat]} {cat}
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/50 rounded-lg mb-6">
              <AlertCircle size={20} className="text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader size={32} className="text-blue-500 animate-spin" />
                <p className="text-gray-400">Loading items...</p>
              </div>
            </div>
          )}

          {/* Results Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Results ({filteredResults.length})</p>
              <p className="text-xs text-gray-500">{items.length} total items</p>
            </div>
            {!loading && filteredResults.length > 0 ? (
              filteredResults.map(item => (
                <div key={item.id} className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 rounded-lg group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-blue-300 transition-all">
                      {item.type === "Files" && <FileText size={20}/>}
                      {item.type === "Tasks" && <CheckCircle size={20}/>}
                      {item.type === "Projects" && <Briefcase size={20}/>}
                      {item.type === "Notes" && <StickyNote size={20}/>}
                      {item.type === "People" && <Users size={20}/>}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">{item.title}</h3>
                      <p className="text-xs text-gray-500">{item.type} • {item.owner}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                      item.visibility === 'public' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.visibility}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                <p className="text-gray-500 text-lg">No matching records found.</p>
                <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalSearch;