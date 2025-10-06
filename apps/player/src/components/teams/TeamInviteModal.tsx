/**
 * Team Invite Modal Component
 * 
 * Modal for team captains to generate invitation URLs for players to join their team.
 * Includes URL generation, WhatsApp sharing, and copy to clipboard functionality.
 */

'use client';

import React, { useState } from 'react';
import { X, Send, Loader2, Mail, Hash, MessageSquare, Users, Link, Copy, Check } from 'lucide-react';
import { SendInvitationForm } from '@matchday/database';
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
  token: string;
  invitationUrl: string;
  whatsappUrl: string;
  expiresAt: string;
  teamName: string;
}

const POSITION_OPTIONS = [
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defender', label: 'Defender' },
  { value: 'midfielder', label: 'Midfielder' },
  { value: 'forward', label: 'Forward' }
];

export const TeamInviteModal: React.FC<TeamInviteModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  onInvitationSent
}) => {
  const { session, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<SendInvitationForm>({
    email: '',
    position: '',
    jersey_number: undefined,
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationCreated, setInvitationCreated] = useState<InvitationData | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        position: '',
        jersey_number: undefined,
        message: ''
      });
      setErrors({});
      setInvitationCreated(null);
      setCopied(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation (optional for invitation URLs)
    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Jersey number validation
    if (formData.jersey_number !== undefined) {
      const jersey = Number(formData.jersey_number);
      if (isNaN(jersey) || jersey < 1 || jersey > 99) {
        newErrors.jersey_number = 'Jersey number must be between 1 and 99';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SendInvitationForm, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});

    try {
      // Check authentication
      if (!isAuthenticated) {
        throw new Error('You must be logged in to send invitations');
      }

      // Check if user is authenticated
      if (!session) {
        throw new Error('Authentication session expired. Please sign in again.');
      }

      const response = await fetch(`/api/teams/${teamId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: formData.email?.trim() || undefined,
          position: formData.position || undefined,
          jersey_number: formData.jersey_number || undefined,
          message: formData.message?.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.validationErrors) {
          const newErrors: FormErrors = {};
          errorData.validationErrors.forEach((error: { field: string; message: string }) => {
            newErrors[error.field as keyof FormErrors] = error.message;
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: errorData.message || 'Failed to create invitation' });
        }
        return;
      }

      const result = await response.json();
      setInvitationCreated(result.data);
      onInvitationSent();

    } catch (error) {
      console.error('Error creating invitation:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to create invitation' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!invitationCreated) return;

    try {
      await navigator.clipboard.writeText(invitationCreated.invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleWhatsAppShare = () => {
    if (!invitationCreated) return;
    window.open(invitationCreated.whatsappUrl, '_blank');
  };

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {invitationCreated ? 'Invitation Created!' : 'Invite Player'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invitationCreated ? 'Share this link to invite players' : `to ${teamName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {invitationCreated ? (
          /* Success View - Show generated URL and sharing options */
          <div className="p-6 space-y-6">
            {/* Success Message */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-300">
                    Invitation Ready!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Your invitation link is ready to share. It expires on {formatExpiryDate(invitationCreated.expiresAt)}.
                  </p>
                </div>
              </div>
            </div>

            {/* Invitation URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Link className="w-4 h-4 inline mr-2" />
                Invitation Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invitationCreated.invitationUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* WhatsApp Share */}
            <div>
              <button
                onClick={handleWhatsAppShare}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Share on WhatsApp
              </button>
            </div>

            {/* Close Button */}
            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View - Create invitation */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Email Field - Optional for URL sharing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="player@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty to create a general invitation URL
              </p>
            </div>

            {/* Position Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Preferred Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value="">Any position</option>
                {POSITION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Jersey Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Jersey Number
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={formData.jersey_number || ''}
                onChange={(e) => handleInputChange('jersey_number', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.jersey_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="1-99 (optional)"
                disabled={isSubmitting}
              />
              {errors.jersey_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.jersey_number}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty to let the player choose their own number
              </p>
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Personal Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Hi! We'd love to have you join our team..."
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional message to include with the invitation
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};