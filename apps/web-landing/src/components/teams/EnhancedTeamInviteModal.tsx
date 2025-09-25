/**
 * Enhanced Team Invite Modal Component
 * 
 * Modal for team captains with two invitation modes:
 * 1. Email Mode - Send invitation to specific email address
 * 2. Share Mode - Generate shareable link with invitation code for WhatsApp sharing
 */

'use client';

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  Mail, 
  Hash, 
  MessageSquare, 
  Users, 
  Link, 
  Copy, 
  Check,
  Share2,
  UserPlus
} from 'lucide-react';
import { SendInvitationForm } from '@/lib/types/database.types';
import { useAuth } from '@/components/auth/supabase-auth-provider';

interface TeamInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onInvitationSent: () => void;
}

interface FormErrors {
  email?: string;
  jersey_number?: string;
  general?: string;
}

interface InvitationData {
  id: string;
  code?: string;
  invitationUrl: string;
  whatsappUrl: string;
  whatsappMessage: string;
  expiresAt: string;
  teamName: string;
  invitationType: 'email' | 'code';
}

const POSITION_OPTIONS = [
  { value: 'goalkeeper', label: 'Goalkeeper', icon: '🥅' },
  { value: 'defender', label: 'Defender', icon: '🛡️' },
  { value: 'midfielder', label: 'Midfielder', icon: '⚽' },
  { value: 'forward', label: 'Forward', icon: '🎯' }
];

export const EnhancedTeamInviteModal: React.FC<TeamInviteModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  onInvitationSent
}) => {
  const [mode, setMode] = useState<'email' | 'share'>('share');
  const [formData, setFormData] = useState<SendInvitationForm>({
    email: '',
    position: '',
    jersey_number: undefined,
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [copyState, setCopyState] = useState<{ [key: string]: boolean }>({});
  const { session, isAuthenticated } = useAuth();

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setMode('share');
      setFormData({
        email: '',
        position: '',
        jersey_number: undefined,
        message: ''
      });
      setErrors({});
      setInvitationData(null);
      setCopyState({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation (only for email mode)
    if (mode === 'email') {
      if (!formData.email?.trim()) {
        newErrors.email = 'Email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
      }
    }

    // Jersey number validation (if provided)
    if (formData.jersey_number !== undefined && formData.jersey_number !== null) {
      const jersey = Number(formData.jersey_number);
      if (isNaN(jersey) || jersey < 1 || jersey > 99) {
        newErrors.jersey_number = 'Jersey number must be between 1 and 99';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});

    try {
      // Check authentication
      if (!isAuthenticated) {
        setErrors({ general: 'You must be signed in to send invitations' });
        return;
      }

      if (!session) {
        setErrors({ general: 'Authentication session expired. Please sign in again.' });
        return;
      }

      const requestBody = {
        invitationType: mode,
        ...(mode === 'email' && { email: formData.email?.trim() }),
        position: formData.position || undefined,
        jersey_number: formData.jersey_number || undefined,
        message: formData.message?.trim() || undefined
      };

      const response = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.validationErrors) {
          const validationErrors: FormErrors = {};
          result.validationErrors.forEach((error: any) => {
            validationErrors[error.field as keyof FormErrors] = error.message;
          });
          setErrors(validationErrors);
        } else {
          setErrors({ general: result.error || 'Failed to create invitation' });
        }
        return;
      }

      // Store invitation data for display
      setInvitationData(result.data);
      onInvitationSent();

    } catch (error) {
      console.error('Error creating invitation:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState({ ...copyState, [key]: true });
      setTimeout(() => {
        setCopyState({ ...copyState, [key]: false });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleWhatsAppShare = () => {
    if (!invitationData) return;
    window.open(invitationData.whatsappUrl, '_blank');
  };

  const handleCreateNew = () => {
    setInvitationData(null);
    setFormData({
      email: '',
      position: '',
      jersey_number: undefined,
      message: ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  // Success State - Show invitation details
  if (invitationData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🎉 Invitation Created!
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Team Info */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {invitationData.teamName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invitationData.invitationType === 'code' ? 'Shareable invitation created' : 'Email invitation sent'}
              </p>
            </div>

            {/* Invitation Details */}
            <div className="space-y-4">
              {/* Invitation URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invitation Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={invitationData.invitationUrl}
                    readOnly
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => handleCopy(invitationData.invitationUrl, 'url')}
                    className="px-3 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Copy link"
                  >
                    {copyState.url ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Invitation Code (if code-based) */}
              {invitationData.code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invitation Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={invitationData.code}
                      readOnly
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg text-center"
                    />
                    <button
                      onClick={() => handleCopy(invitationData.code!, 'code')}
                      className="px-3 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copyState.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* WhatsApp Share */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Share via WhatsApp
              </button>

              {/* Generic Share */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Join ${invitationData.teamName}!`,
                      text: `You've been invited to join ${invitationData.teamName} on MatchDay!`,
                      url: invitationData.invitationUrl
                    });
                  } else {
                    handleCopy(invitationData.invitationUrl, 'share');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                {navigator.share ? 'Share Link' : (copyState.share ? 'Link Copied!' : 'Copy Link')}
              </button>
            </div>

            {/* Create Another */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Create Another Invitation
              </button>
            </div>

            {/* Expiry Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This invitation expires on {new Date(invitationData.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Invite Player
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Invite someone to join {teamName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setMode('share')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'share'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Link className="w-4 h-4" />
                Share Link
              </div>
            </button>
            <button
              onClick={() => setMode('email')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'email'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Send Email
              </div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Mode Description */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {mode === 'share' 
                ? '🚀 Create a shareable link perfect for WhatsApp, SMS, or any messaging app. Anyone with the link can join your team!'
                : '📧 Send a personal invitation to a specific email address. They\'ll receive a direct invitation link.'
              }
            </p>
          </div>

          {/* Email Field - Only for email mode */}
          {mode === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="player@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>
          )}

          {/* Position Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Position
            </label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Any Position</option>
              {POSITION_OPTIONS.map((position) => (
                <option key={position.value} value={position.value}>
                  {position.icon} {position.label}
                </option>
              ))}
            </select>
          </div>

          {/* Jersey Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jersey Number
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={formData.jersey_number || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                jersey_number: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="Optional (1-99)"
            />
            {errors.jersey_number && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.jersey_number}</p>
            )}
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personal Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
              placeholder="Add a personal message (optional)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  {mode === 'share' ? <Link className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {mode === 'share' ? 'Create Link' : 'Send Invitation'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};