/**
 * ProfileStep Component
 * 
 * Professional player profile setup with form validation and 
 * broadcast-style design elements.
 */

'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OnboardingData } from '../types';

interface ProfileStepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  onNext,
  onBack,
  isFirst,
  isLast,
  currentStep,
  totalSteps
}) => {
  const { 
    register, 
    formState: { errors }, 
    watch,
    trigger 
  } = useFormContext<OnboardingData>();

  const formData = watch('profile');
  const canProceed = formData?.display_name && formData.display_name.length >= 2;

  const handleNext = async () => {
    const isValid = await trigger('profile');
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-100 rounded-full px-4 py-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-blue-700 text-sm font-medium">ATHLETE REGISTRATION</span>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900">
          Create Your Professional Profile
        </h2>
        <p className="text-gray-600 text-lg">
          Let's build your athlete identity. This information will be visible to other players 
          and league organizers.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Display Name - Required */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <span className="mr-2">🏷️</span>
            Player Name
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              {...register('profile.display_name')}
              type="text"
              placeholder="How should other athletes know you?"
              className={`
                w-full px-4 py-4 text-lg border-2 rounded-xl bg-white transition-all duration-200
                focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none
                ${errors.profile?.display_name 
                  ? 'border-red-500 bg-red-50' 
                  : formData?.display_name 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
            />
            {formData?.display_name && !errors.profile?.display_name && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-green-500 text-xl">✓</span>
              </div>
            )}
          </div>
          {errors.profile?.display_name && (
            <p className="text-red-600 text-sm flex items-center space-x-1">
              <span>⚠️</span>
              <span>{errors.profile.display_name.message}</span>
            </p>
          )}
          <p className="text-gray-500 text-sm">
            This will be your public athlete name. Choose something memorable!
          </p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <span className="mr-2">📍</span>
            Location
            <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
          </label>
          <input
            {...register('profile.location')}
            type="text"
            placeholder="City, State or ZIP code"
            className={`
              w-full px-4 py-4 text-lg border-2 rounded-xl bg-white transition-all duration-200
              focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none
              ${errors.profile?.location 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          />
          {errors.profile?.location && (
            <p className="text-red-600 text-sm flex items-center space-x-1">
              <span>⚠️</span>
              <span>{errors.profile.location.message}</span>
            </p>
          )}
          <p className="text-gray-500 text-sm">
            Helps us recommend nearby leagues and teammates
          </p>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <span className="mr-2">🎂</span>
            Date of Birth
            <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
          </label>
          <input
            {...register('profile.date_of_birth')}
            type="date"
            className={`
              w-full px-4 py-4 text-lg border-2 rounded-xl bg-white transition-all duration-200
              focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none
              ${errors.profile?.date_of_birth 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          />
          {errors.profile?.date_of_birth && (
            <p className="text-red-600 text-sm flex items-center space-x-1">
              <span>⚠️</span>
              <span>{errors.profile.date_of_birth.message}</span>
            </p>
          )}
          <p className="text-gray-500 text-sm">
            Used for age-appropriate league recommendations and statistics
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <span className="mr-2">📝</span>
            Tell Us About Yourself
            <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
          </label>
          <textarea
            {...register('profile.bio')}
            rows={4}
            placeholder="What makes you unique as an athlete? Any fun facts, achievements, or what drives your passion for sports?"
            className={`
              w-full px-4 py-4 text-lg border-2 rounded-xl bg-white transition-all duration-200
              focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none
              ${errors.profile?.bio 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          />
          <div className="flex justify-between items-center">
            <div>
              {errors.profile?.bio && (
                <p className="text-red-600 text-sm flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors.profile.bio.message}</span>
                </p>
              )}
              <p className="text-gray-500 text-sm">
                Share your sports story - this appears on your athlete profile
              </p>
            </div>
            <span className="text-gray-400 text-sm">
              {formData?.bio?.length || 0}/500
            </span>
          </div>
        </div>
      </div>

      {/* Pro Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Pro Tips for Your Athlete Profile
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start space-x-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Use your real name or a memorable sports nickname that teammates will recognize</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Include your city to connect with local players and leagues</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>Write a bio that showcases your personality and passion for sports</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>All information can be updated later from your athlete dashboard</span>
          </li>
        </ul>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-500 text-lg flex-shrink-0">🔒</span>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Privacy Protected</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your information is secure and only shared with league organizers you choose to join.
              You can control your privacy settings and update information anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`
            flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold 
            transition-all duration-200 transform hover:scale-105
            ${canProceed
              ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <span>Continue to Sports Selection</span>
          <span>→</span>
        </button>
      </div>

      {/* Progress Hint */}
      <div className="text-center text-gray-500 text-sm">
        Next: Choose your sports and experience level
      </div>
    </div>
  );
};

export default ProfileStep;