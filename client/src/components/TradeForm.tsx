import React, { useState, useEffect } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { useRuleStore } from '../store/ruleStore';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedInput } from './ui/EnhancedInput';
import { EnhancedSelect } from './ui/EnhancedSelect';
import { EnhancedTextarea } from './ui/EnhancedTextarea';
import { Modal } from './ui/Modal';
import { 
  Clock, LineChart, Target, Shield, ArrowUpCircle, ArrowDownCircle, 
  ChevronDown, Calculator, ShieldAlert, Check, Image as ImageIcon, 
  Save, PlusCircle, CheckCircle, FileText, X
} from 'lucide-react';

interface TradeFormProps {
  onClose: () => void;
  tradeToEdit?: any;
}

export default function TradeForm({ onClose, tradeToEdit }: TradeFormProps) {
  const { createTrade, updateTrade } = useTradeStore();
  const { rules, fetchRules } = useRuleStore();

  const [formData, setFormData] = useState({
    openTime: new Date().toISOString().slice(0, 16),
    exitTime: '',
    pair: '',
    direction: 'LONG',
    entryPrice: '',
    slPrice: '',
    tpPrice: '',
    exitPrice: '',
    pnl: '',
    strategy: '',
    screenshotUrl: '',
    notes: '',
    tags: '',
    isRuleViolated: false,
    ruleIds: [] as string[],
    status: 'CLOSED' as 'RUNNING' | 'CLOSED'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoCalculatePnL, setAutoCalculatePnL] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (tradeToEdit) {
      setFormData({
        openTime: tradeToEdit.openTime ? new Date(tradeToEdit.openTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        exitTime: tradeToEdit.exitTime ? new Date(tradeToEdit.exitTime).toISOString().slice(0, 16) : '',
        pair: tradeToEdit.pair || '',
        direction: tradeToEdit.direction || 'LONG',
        entryPrice: tradeToEdit.entryPrice?.toString() || '',
        slPrice: tradeToEdit.slPrice?.toString() || '',
        tpPrice: tradeToEdit.tpPrice?.toString() || '',
        exitPrice: tradeToEdit.exitPrice?.toString() || '',
        pnl: tradeToEdit.pnl !== null && tradeToEdit.pnl !== undefined ? tradeToEdit.pnl.toString() : '',
        strategy: tradeToEdit.strategy || '',
        screenshotUrl: tradeToEdit.screenshotUrl || '',
        notes: tradeToEdit.notes || '',
        tags: tradeToEdit.tags || '',
        isRuleViolated: tradeToEdit.isRuleViolated || false,
        ruleIds: tradeToEdit.tradeRules ? tradeToEdit.tradeRules.map((tr: any) => tr.ruleId) : [],
        status: tradeToEdit.status || 'CLOSED'
      });
      if (tradeToEdit.isRuleViolated) {
        setShowAdvanced(true);
      }
    }
  }, [tradeToEdit]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as any);
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  // Auto-calculate effect
  useEffect(() => {
    if (autoCalculatePnL && formData.entryPrice && formData.exitPrice) {
      const entry = parseFloat(formData.entryPrice);
      const exit = parseFloat(formData.exitPrice);
      
      let pnl = 0;
      // Note: In real life, size or amount is needed to calculate exact PnL. 
      // We assume basic difference * 1 for this demo, or user can manually adjust.
      if (formData.direction === 'LONG') {
        pnl = exit - entry;
      } else {
        pnl = entry - exit;
      }
      
      handleChange('pnl', pnl.toFixed(2));
    }
  }, [formData.exitPrice, formData.entryPrice, formData.direction, autoCalculatePnL]);

  // Update progress steps based on field completion
  useEffect(() => {
    if (formData.pair && formData.entryPrice && formData.pnl) {
      if (formData.strategy || formData.notes) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else {
      setCurrentStep(1);
    }
  }, [formData]);

  const handleChange = (eOrName: any, directValue?: any) => {
    if (typeof eOrName === 'string') {
      setFormData(prev => ({ ...prev, [eOrName]: directValue }));
      if (errors[eOrName]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[eOrName];
          return newErrors;
        });
      }
      return;
    }

    const e = eOrName as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'isRuleViolated' && !checked) {
      setFormData(prev => ({ ...prev, ruleIds: [] }));
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const strategyOptions = [
    '', 'Breakout', 'Pullback', 'Reversal', 'Trend Following', 'Range Trading', 'Scalping', 'Swing Trade', 'Other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.openTime) newErrors.openTime = 'Open Time is required';
    if (!formData.pair) newErrors.pair = 'Pair is required';
    if (!formData.entryPrice || parseFloat(formData.entryPrice) <= 0) {
      newErrors.entryPrice = 'Valid entry price required';
    }
    
    // PnL only required for CLOSED trades
    if (formData.status === 'CLOSED' && (formData.pnl === '' || formData.pnl === undefined)) {
      newErrors.pnl = 'PnL is required for closed trades';
    }

    if (formData.exitTime && new Date(formData.exitTime) <= new Date(formData.openTime)) {
      newErrors.exitTime = 'Exit time must be after open time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, screenshot: 'Only JPG, PNG, and WEBP images are allowed' }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, screenshot: 'File size must be less than 5MB' }));
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Clear any previous errors
    if (errors.screenshot) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.screenshot;
        return newErrors;
      });
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', selectedFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/screenshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('File upload error:', error);
      setErrors(prev => ({ ...prev, screenshot: 'Failed to upload file' }));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e.preventDefault) e.preventDefault();
    
    if (!validateForm()) return;
    setIsLoading(true);

    // Upload file if selected
    let screenshotUrl = formData.screenshotUrl;
    if (selectedFile) {
      const uploadedUrl = await uploadFile();
      if (uploadedUrl) {
        screenshotUrl = uploadedUrl;
      } else {
        setIsLoading(false);
        return; // Stop if upload failed
      }
    }

    const payload = {
      ...formData,
      screenshotUrl,
      openTime: new Date(formData.openTime).toISOString(),
      exitTime: formData.exitTime ? new Date(formData.exitTime).toISOString() : null,
      entryPrice: parseFloat(formData.entryPrice),
      slPrice: formData.slPrice ? parseFloat(formData.slPrice) : null,
      tpPrice: formData.tpPrice ? parseFloat(formData.tpPrice) : null,
      exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
      pnl: formData.pnl ? parseFloat(formData.pnl) : 0,
      status: formData.status,
      ruleIds: formData.isRuleViolated ? formData.ruleIds : []
    };

    let success = false;
    if (tradeToEdit) {
      success = await updateTrade(tradeToEdit.id, payload);
    } else {
      success = await createTrade(payload);
    }

    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } else {
      setErrors({ form: 'Failed to save trade. Please try again.' });
      setIsLoading(false);
    }
  };

  const activeRules = rules.filter(r => r.isActive);

  return (
    <Modal isOpen={true} onClose={onClose} size="lg" title={tradeToEdit ? '✏️ Edit Trade' : '📓 New Trade Journal'} showCloseButton={true}>
      <div className="relative">
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm z-50 rounded-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mt-4">Trade Saved!</h3>
              <p className="text-slate-400 mt-2">Keep tracking your journey 🚀</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">

        {errors.form && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-sm">{errors.form}</div>}
        {formData.ruleIds && formData.ruleIds.length > 0 && <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> ⚠️ Warning: Submitting this trade records {formData.ruleIds.length} rule violation(s).</motion.div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ===== SECTION 1: Essential Fields (Always Visible) ===== */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Open Time */}
              <EnhancedInput
                label="Open Time"
                type="datetime-local"
                name="openTime"
                value={formData.openTime}
                onChange={handleChange}
                required
                error={errors.openTime}
                className="text-sm"
              />
              
              {/* Exit Time */}
              <EnhancedInput
                label="Exit Time"
                type="datetime-local"
                name="exitTime"
                value={formData.exitTime}
                onChange={handleChange}
                error={errors.exitTime}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pair */}
              <EnhancedInput
                label="Pair"
                type="text"
                name="pair"
                placeholder="BTC/USDT"
                value={formData.pair}
                onChange={(e) => handleChange('pair', (e.target as HTMLInputElement).value.toUpperCase())}
                required
                error={errors.pair}
                className="text-sm uppercase"
              />
              
              {/* Direction - Compact Toggle */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Direction <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('direction', 'LONG')}
                    className={`
                      py-2 px-3 rounded-lg text-sm font-semibold transition-all
                      ${formData.direction === 'LONG'
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                        : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600'}
                    `}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('direction', 'SHORT')}
                    className={`
                      py-2 px-3 rounded-lg text-sm font-semibold transition-all
                      ${formData.direction === 'SHORT'
                        ? 'bg-red-500/20 border border-red-500 text-red-400'
                        : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600'}
                    `}
                  >
                    SHORT
                  </button>
                </div>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Position Status <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('status', 'CLOSED')}
                  className={`
                    py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${formData.status === 'CLOSED'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600'}
                  `}
                >
                  <CheckCircle className="w-4 h-4" />
                  CLOSED
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('status', 'RUNNING')}
                  className={`
                    py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${formData.status === 'RUNNING'
                      ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                      : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:border-slate-600'}
                  `}
                >
                  <Clock className="w-4 h-4" />
                  RUNNING
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {formData.status === 'RUNNING' ? '⚡ Position is still active' : '✓ Position is closed'}
              </p>
            </div>

            {/* Prices - 3 Column Grid */}
            <div className="grid grid-cols-3 gap-3">
              <EnhancedInput
                label="Entry"
                type="number"
                step="any"
                name="entryPrice"
                placeholder="0.00"
                value={formData.entryPrice}
                onChange={handleChange}
                required
                error={errors.entryPrice}
                className="text-sm"
              />
              <EnhancedInput
                label="Exit"
                type="number"
                step="any"
                name="exitPrice"
                placeholder="0.00"
                value={formData.exitPrice}
                onChange={handleChange}
                className="text-sm"
              />
              <EnhancedInput
                label={formData.status === 'RUNNING' ? 'PnL (Optional)' : 'PnL *'}
                type="number"
                step="any"
                name="pnl"
                placeholder="0"
                value={formData.pnl}
                onChange={handleChange}
                required={formData.status === 'CLOSED'}
                error={errors.pnl}
                className={`text-sm ${formData.pnl ? (parseFloat(formData.pnl) > 0 ? 'text-emerald-400 font-bold bg-emerald-500/5 border-emerald-500/30' : parseFloat(formData.pnl) < 0 ? 'text-red-400 font-bold bg-red-500/5 border-red-500/30' : '') : ''}`}
              />
            </div>

            {/* SL & TP - 2 Column Grid */}
            <div className="grid grid-cols-2 gap-3">
              <EnhancedInput
                label="Stop Loss"
                type="number"
                step="any"
                name="slPrice"
                placeholder="0.00"
                value={formData.slPrice}
                onChange={handleChange}
                className="text-sm"
              />
              <EnhancedInput
                label="Take Profit"
                type="number"
                step="any"
                name="tpPrice"
                placeholder="0.00"
                value={formData.tpPrice}
                onChange={handleChange}
                className="text-sm"
              />
            </div>
          </div>

          {/* ===== SECTION 2: Advanced (Collapsible) ===== */}
          <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/20">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-3 py-2.5 flex items-center justify-between bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-sm focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" /> Advanced & Media
                </span>
                {formData.ruleIds.length > 0 && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">{formData.ruleIds.length} Violations</span>}
              </div>
              <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </motion.div>
            </button>
            
            <motion.div
              initial={false}
              animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-4 border-t border-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  {/* Strategy */}
                  <EnhancedSelect
                    label="Strategy"
                    name="strategy"
                    value={formData.strategy}
                    onChange={handleChange}
                    options={strategyOptions.map(strat => ({ value: strat, label: strat || 'Select strategy' }))}
                    className="text-sm"
                  />

                  {/* Tags */}
                  <EnhancedInput
                    label="Tags"
                    type="text"
                    name="tags"
                    placeholder="FOMO, setup A"
                    value={formData.tags}
                    onChange={handleChange}
                    className="text-sm"
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-400" /> Chart Screenshot
                  </label>
                  
                  {filePreview || formData.screenshotUrl ? (
                    <div className="relative">
                      <img 
                        src={filePreview || formData.screenshotUrl} 
                        alt="Screenshot preview" 
                        className="w-full h-48 object-cover rounded-lg border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview('');
                          handleChange('screenshotUrl', '');
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors"
                      >
                        <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                        <span className="text-sm text-slate-400">Click to upload screenshot</span>
                        <span className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP (max 5MB)</span>
                      </label>
                    </div>
                  )}
                  
                  {errors.screenshot && (
                    <p className="text-red-400 text-xs mt-1">{errors.screenshot}</p>
                  )}
                </div>

                {/* Rule Violation */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-400"/> Rule Violations
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.isRuleViolated} onChange={(e) => handleChange('isRuleViolated', (e.target as HTMLInputElement).checked)} />
                      <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {formData.isRuleViolated && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-3">
                        {activeRules.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No active rules configured.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {activeRules.map((rule) => {
                              const isSelected = formData.ruleIds?.includes(rule.id);
                              return (
                                <button
                                  key={rule.id}
                                  type="button"
                                  onClick={() => {
                                    if (formData.ruleIds?.includes(rule.id)) {
                                      handleChange('ruleIds', formData.ruleIds.filter(id => id !== rule.id));
                                    } else {
                                      handleChange('ruleIds', [...(formData.ruleIds || []), rule.id]);
                                    }
                                  }}
                                  className={`
                                    px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1
                                    ${isSelected
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}
                                  `}
                                >
                                  {rule.title}
                                  {isSelected && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ===== SECTION 3: Notes (Compact) ===== */}
          <div className="space-y-1.5">
            <EnhancedTextarea
              label="Journal Notes"
              name="notes"
              placeholder="What went well? What was your emotion? What could be improved?"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              maxLength={500}
              className="text-sm"
            />
          </div>

          {/* ===== Submit Buttons (Compact) ===== */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-700/50">
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500 mr-auto">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">Ctrl+S</kbd> Save
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">Esc</kbd> Close
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 
                         hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all duration-300 shadow-lg ${
                isLoading 
                  ? 'bg-slate-600 cursor-not-allowed' 
                  : formData.ruleIds.length > 0 
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/25' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/25'
              }`}
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto" />
              ) : tradeToEdit ? (
                <span className="flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Update</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <PlusCircle className="w-4 h-4" /> {formData.ruleIds.length > 0 ? 'Save With Violations' : 'Save'}
                </span>
              )}
            </motion.button>
          </div>

        </form>
      </div>
      </div>
    </Modal>
  );
}
