import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Calendar, Activity, DollarSign, Save, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { EnhancedInput } from '../components/ui/EnhancedInput';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalTrades: number;
  totalTransactions: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/settings/profile');
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUpdatingProfile(true);

    try {
      const { data } = await api.put('/settings/profile', { name, email });
      setProfile({ ...profile!, ...data });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await api.put('/settings/password', { oldPassword, newPassword });
      setPasswordSuccess('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Profile Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your account information and security</p>
        </div>
      </div>

      {/* Account Overview */}
      <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg shadow-slate-900/50">
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" /> Account Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="text-sm font-bold text-slate-200">
                  {profile ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Trades</p>
                <p className="text-sm font-bold text-slate-200">{profile?.totalTrades || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Transactions</p>
                <p className="text-sm font-bold text-slate-200">{profile?.totalTransactions || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Update Profile */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg shadow-slate-900/50">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Profile Information
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <EnhancedInput
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your name"
            />

            <EnhancedInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg shadow-slate-900/50">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" /> Change Password
          </h2>

          {passwordError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="relative">
              <EnhancedInput
                label="Current Password"
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <EnhancedInput
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <EnhancedInput
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdatingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Update Password
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
