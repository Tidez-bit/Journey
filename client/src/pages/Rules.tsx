import React, { useEffect, useState } from 'react';
import { useRuleStore } from '../store/ruleStore';
import { Shield, ShieldAlert, CheckCircle, Plus, Edit2, Trash2, X, BrainCircuit, ArrowDownCircle, ArrowUpCircle, Layers, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';
import { EnhancedInput } from '../components/ui/EnhancedInput';
import { EnhancedTextarea } from '../components/ui/EnhancedTextarea';

export default function Rules() {
  const { rules, ruleStats, fetchRules, fetchRuleStats, createRule, updateRule, deleteRule, toggleRuleActive, error, isLoading } = useRuleStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'ENTRY' });
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchRules();
    fetchRuleStats();
  }, [fetchRules, fetchRuleStats]);

  const handleOpenModal = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({ title: rule.title, description: rule.description || '', category: rule.category || 'ENTRY' });
    } else {
      setEditingRule(null);
      setFormData({ title: '', description: '', category: 'ENTRY' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;
    if (editingRule) {
      success = await updateRule(editingRule.id, formData);
    } else {
      success = await createRule(formData);
    }
    
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this rule? This cannot be undone.')) {
      await deleteRule(id);
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'ENTRY': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: <ArrowDownCircle className="w-3 h-3 mr-1"/>, fill: '#3B82F6' };
      case 'EXIT': return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: <ArrowUpCircle className="w-3 h-3 mr-1"/>, fill: '#A855F7' };
      case 'RISK': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: <ShieldAlert className="w-3 h-3 mr-1"/>, fill: '#EF4444' };
      case 'PSYCHOLOGY': return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: <BrainCircuit className="w-3 h-3 mr-1"/>, fill: '#06B6D4' };
      default: return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', icon: <Layers className="w-3 h-3 mr-1"/>, fill: '#64748B' };
    }
  };

  const filteredRules = filterCategory ? rules.filter(r => r.category === filterCategory) : rules;
  const sortedStatsRules = ruleStats?.rules ? [...ruleStats.rules].sort((a,b) => b.violations - a.violations) : [];
  const leastViolated = sortedStatsRules.length > 0 ? sortedStatsRules[sortedStatsRules.length - 1] : null;

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Trading Rules</h1>
          <p className="text-sm text-slate-400 mt-1">Discipline is the bridge between goals and accomplishment</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2.5 rounded-lg flex items-center transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 font-medium">
          <Plus className="w-5 h-5 mr-2" /> New Rule
        </button>
      </div>

      {/* 6.3 Violation Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck className="w-32 h-32 text-emerald-500" /></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-slate-400 font-medium">Compliance Rate</h3>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-bold text-slate-100 mb-2">{ruleStats?.complianceRate?.toFixed(1) || 0}%</p>
            <div className="w-full bg-slate-900 rounded-full h-2 mb-2">
              <div className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${ruleStats?.complianceRate || 0}%` }}></div>
            </div>
            <p className="text-xs text-slate-400">{ruleStats?.totalTrades || 0} Total Trades Analyzed</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertTriangle className="w-32 h-32 text-red-500" /></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-slate-400 font-medium">Most Violated Rule</h3>
          </div>
          <div className="relative z-10">
            {sortedStatsRules.length > 0 && sortedStatsRules[0].violations > 0 ? (
              <>
                <p className="text-xl font-bold text-slate-100 mb-1 truncate" title={sortedStatsRules[0].title}>{sortedStatsRules[0].title}</p>
                <p className="text-sm font-semibold text-red-400">{sortedStatsRules[0].violations} Violations ({sortedStatsRules[0].violationRate.toFixed(1)}%)</p>
              </>
            ) : (
              <p className="text-slate-500 italic mt-4">No violations recorded</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity"><CheckCircle className="w-32 h-32 text-blue-500" /></div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-slate-400 font-medium">Best Followed Rule</h3>
          </div>
          <div className="relative z-10">
            {leastViolated ? (
              <>
                <p className="text-xl font-bold text-slate-100 mb-1 truncate" title={leastViolated.title}>{leastViolated.title}</p>
                <p className="text-sm font-semibold text-emerald-400">Only {leastViolated.violations} Violations</p>
              </>
            ) : (
              <p className="text-slate-500 italic mt-4">Not enough data</p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rules List & Filters */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: '', label: 'All Rules', color: 'bg-blue-600' },
              { id: 'ENTRY', label: 'Entry', color: 'bg-blue-500' },
              { id: 'EXIT', label: 'Exit', color: 'bg-purple-500' },
              { id: 'RISK', label: 'Risk', color: 'bg-red-500' },
              { id: 'PSYCHOLOGY', label: 'Psychology', color: 'bg-cyan-500' }
            ].map(cat => (
              <button 
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)} 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                  filterCategory === cat.id 
                    ? `${cat.color} text-white border-transparent shadow-lg` 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRules.map(rule => {
              const theme = getCategoryTheme(rule.category || '');
              return (
                <div key={rule.id} className={`group bg-slate-800 border rounded-2xl p-5 transition-all duration-300 ${rule.isActive ? 'border-slate-700 hover:border-slate-500 hover:shadow-xl hover:shadow-slate-900/50' : 'border-slate-700/50 opacity-60 hover:opacity-100 bg-slate-800/50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-wider uppercase ${theme.bg} ${theme.text} ${theme.border}`}>
                      {theme.icon} {rule.category}
                    </span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(rule)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-md transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => toggleRuleActive(rule.id, rule.isActive)} 
                      className={`mt-1 flex-shrink-0 transition-colors ${rule.isActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'}`}
                      title={rule.isActive ? 'Deactivate Rule' : 'Activate Rule'}
                    >
                      {rule.isActive ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-500" />}
                    </button>
                    <div>
                      <h3 className={`font-bold mb-1.5 transition-colors ${rule.isActive ? 'text-slate-100' : 'text-slate-500 line-through'}`}>{rule.title}</h3>
                      {rule.description && (
                        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{rule.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredRules.length === 0 && (
              <div className="col-span-full text-center py-16 bg-slate-800/30 border border-slate-700 border-dashed rounded-2xl">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4 font-medium">No rules found in this category.</p>
                <button onClick={() => handleOpenModal()} className="text-blue-500 hover:text-blue-400 text-sm font-bold flex items-center justify-center mx-auto">
                  <Plus className="w-4 h-4 mr-1"/> Create your first rule
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* 6.3 Violation Charts & Top 5 */}
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
          
          {ruleStats?.rules && ruleStats.rules.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50">
              <h2 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-wider flex items-center"><Activity className="w-4 h-4 mr-2 text-blue-500"/> Violation Frequency</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedStatsRules.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="title" type="category" stroke="#94A3B8" fontSize={10} width={90} tickLine={false} axisLine={false} tickFormatter={(v) => v.length > 12 ? v.substring(0,12)+'...' : v} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} 
                      cursor={{fill: '#1E293B'}} 
                      formatter={(value: any) => [`${value} Violations`, 'Count']}
                    />
                    <Bar dataKey="violations" radius={[0, 4, 4, 0]} maxBarSize={30}>
                      {sortedStatsRules.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryTheme(entry.category).fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-slate-900/50">
            <h2 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wider">Top 5 Violated Rules</h2>
            <div className="space-y-3">
              {sortedStatsRules.slice(0, 5).map((r: any, idx: number) => {
                const theme = getCategoryTheme(r.category);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold ${theme.bg} ${theme.text}`}>
                        {idx + 1}
                      </div>
                      <span className="text-slate-200 truncate text-sm font-medium">{r.title}</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className="text-slate-400 text-xs mr-2">{r.violationRate.toFixed(0)}%</span>
                      <span className="text-red-400 font-bold text-sm bg-red-500/10 px-2 py-1 rounded-md">{r.violations}x</span>
                    </div>
                  </div>
                );
              })}
              {sortedStatsRules.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6 bg-slate-900/30 rounded-xl border border-slate-700/50 border-dashed">No violations recorded yet.</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 6.2 Add/Edit Rule Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRule ? 'Edit Rule' : 'New Rule'} size="md">
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Category</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'ENTRY', label: 'Entry', icon: ArrowDownCircle, color: 'blue' },
                { id: 'EXIT', label: 'Exit', icon: ArrowUpCircle, color: 'purple' },
                { id: 'RISK', label: 'Risk', icon: ShieldAlert, color: 'red' },
                { id: 'PSYCHOLOGY', label: 'Psychology', icon: BrainCircuit, color: 'cyan' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat.id})}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    formData.category === cat.id 
                      ? `bg-${cat.color}-500/20 border-${cat.color}-500 text-${cat.color}-400` 
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <cat.icon className="w-5 h-5" /> {cat.label}
                </button>
              ))}
            </div>
          </div>
          
          <EnhancedInput
            label="Rule Title"
            type="text"
            required 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            placeholder="e.g. Max 2% risk per trade"
          />
          
          <EnhancedTextarea
            label="Description (Optional)"
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
            placeholder="Explain the reasoning behind this rule..." 
            maxLength={500}
            rows={3}
          />

          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 
                         hover:bg-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 
                         text-white font-medium hover:from-blue-500 hover:to-blue-400
                         shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
