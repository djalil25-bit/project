import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Clock, CheckCircle2, Home, HeadphonesIcon, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const AccountPending = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll for verification status
  useEffect(() => {
    let intervalId;

    const checkVerificationStatus = async () => {
      try {
        const res = await api.get('/accounts/profile/');
        // If the profile endpoint returns a non-PENDING status
        if (res.data && res.data.status && res.data.status.toUpperCase() !== 'PENDING') {
          updateUser({ is_verified: res.data.is_verified, status: res.data.status });
          navigate(`/${user.role}-dashboard`);
        }
      } catch (err) {
        console.error("Error checking verification status", err);
      }
    };

    // If user exists but is pending, poll every 15 seconds
    if (user && user.status && user.status.toUpperCase() === 'PENDING') {
      intervalId = setInterval(checkVerificationStatus, 15000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, updateUser, navigate]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/accounts/profile/');
      if (res.data && res.data.status && res.data.status.toUpperCase() !== 'PENDING') {
         updateUser({ is_verified: res.data.is_verified, status: res.data.status });
         navigate(`/${user.role}-dashboard`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // If somehow they get here and are already verified, redirect them
  useEffect(() => {
    if (user && user.status && user.status.toUpperCase() !== 'PENDING') {
      navigate(`/${user.role}-dashboard`);
    }
  }, [user, navigate]);


  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      <div className="relative w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8 md:p-12 z-10">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#166534]/10 text-[#166534] rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-[#166534]/20 rounded-full animate-ping opacity-75"></div>
            <Clock size={48} className="animate-[spin_10s_linear_infinite] origin-center" />
            <ShieldCheck size={24} className="absolute bottom-0 right-0 bg-white text-[#166534] rounded-full" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Application Under Review
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Welcome, <span className="font-semibold text-gray-900">{user.full_name}</span>! 
            Your application as a <span className="font-semibold text-gray-900 capitalize">{user.role}</span> has been received.
          </p>
        </div>

        {/* Progress Timeline Stepper — Two-row grid layout */}
        <div className="mb-12">

          {/* ── ROW 1: Icons + connecting line ── */}
          <div className="relative flex items-center justify-between px-6 md:px-12">

            {/* Full grey track */}
            <div className="absolute inset-x-6 md:inset-x-12 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0"></div>
            {/* Green progress track (step 1 → step 2) */}
            <div className="absolute left-6 md:left-12 w-1/2 top-1/2 -translate-y-1/2 h-1 bg-[#166534] z-0"></div>

            {/* Icon 1 — Completed */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-[#166534] flex items-center justify-center text-white shadow-lg ring-4 ring-white">
              <CheckCircle2 size={22} />
            </div>

            {/* Icon 2 — In Progress */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#166534] shadow-md ring-4 ring-white">
              <div className="absolute inset-0 rounded-full border-2 border-[#166534] animate-pulse"></div>
              <ShieldCheck size={22} />
            </div>

            {/* Icon 3 — Locked */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-inner ring-4 ring-white">
              <Home size={20} />
            </div>

          </div>

          {/* ── ROW 2: Labels — completely separate, below the graphic ── */}
          <div className="grid grid-cols-3 pt-5 px-2">

            {/* Label 1 */}
            <div className="flex flex-col items-center text-center px-2">
              <span className="font-bold text-sm text-gray-900">Registration</span>
              <span className="text-xs text-gray-500 mt-0.5">Submitted</span>
            </div>

            {/* Label 2 */}
            <div className="flex flex-col items-center text-center px-2">
              <span className="font-bold text-sm text-[#166534]">Ministry Review</span>
              <span className="text-xs text-[#166534]/80 mt-0.5">In progress…</span>
            </div>

            {/* Label 3 */}
            <div className="flex flex-col items-center text-center px-2">
              <span className="font-semibold text-sm text-gray-400">Marketplace Access</span>
              <span className="text-xs text-gray-400 mt-0.5">Locked</span>
            </div>

          </div>

        </div>

        {/* What happens next section */}
        <div className="bg-emerald-50/50 rounded-xl p-6 mb-10 border border-emerald-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
            What happens next?
          </h3>
          <p className="text-gray-700 leading-relaxed">
            To ensure the integrity and security of the AgriGov platform, every account is thoroughly verified. 
            A Ministry specialist will review your submitted profile and documents within <strong className="text-gray-900">24–48 hours</strong>. 
            Once approved, you will gain full access to your personalized dashboard and marketplace features.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              className="flex items-center gap-1 hover:text-[#166534] transition-colors"
            >
              {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
              <span>Auto-refreshing status... (Click to force refresh)</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#166534] to-[#14532d] hover:from-[#14532d] hover:to-[#0f3f22] text-white font-medium rounded-lg shadow-lg shadow-green-900/20 transform transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Return to Home
          </button>
          <button 
            onClick={() => navigate('/contact')}
            className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <HeadphonesIcon size={18} />
            Contact Support
          </button>
        </div>
        
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
           <button 
              onClick={logout}
              className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2 mx-auto text-sm"
            >
              <LogOut size={16} />
              Sign out for now
            </button>
        </div>

      </div>
    </div>
  );
};

export default AccountPending;
