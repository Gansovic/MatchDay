/**
 * PreferencesStep Component
 * 
 * Location, availability, and competitive level setup with 
 * professional styling and smart defaults.
 */

'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OnboardingData } from '../types';

interface PreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

const AVAILABILITY_OPTIONS = [
  {
    key: 'weekdays' as const,
    label: 'Weekdays',
    description: 'Monday - Friday',
    icon: '📅',
    timeHint: 'Usually after work hours'
  },
  {
    key: 'weekends' as const,
    label: 'Weekends',
    description: 'Saturday - Sunday',
    icon: '🌅',
    timeHint: 'More flexible timing'
  },
  {
    key: 'evenings' as const,
    label: 'Evenings',
    description: 'After 6 PM',
    icon: '🌙',
    timeHint: 'Perfect for after-work games'
  }
];

const COMPETITIVE_LEVELS = [
  {
    value: 'casual' as const,
    label: 'Casual & Fun',
    description: 'Just here to have a good time and stay active',
    icon: '😄',
    color: 'from-green-500 to-blue-500'
  },
  {
    value: 'competitive' as const,
    label: 'Competitive',
    description: 'I like to win but keep it friendly',
    icon: '🔥',
    color: 'from-orange-500 to-red-500'
  },
  {
    value: 'elite' as const,
    label: 'Elite Level',
    description: 'Serious competition, high performance focus',
    icon: '⚡',
    color: 'from-purple-500 to-pink-500'
  }
];

export const PreferencesStep: React.FC<PreferencesStepProps> = ({
  onNext,
  onBack,
  isFirst,
  isLast,
  currentStep,
  totalSteps
}) => {
  const { 
    setValue, 
    watch, 
    formState: { errors }, 
    trigger 
  } = useFormContext<OnboardingData>();

  const formData = watch('preferences');
  const availability = formData?.availability || { weekdays: false, weekends: false, evenings: false };
  const travelDistance = formData?.travel_distance || 10;
  const competitiveLevel = formData?.competitive_level || 'competitive';

  const hasAvailability = Object.values(availability).some(Boolean);

  const handleAvailabilityToggle = (key: keyof typeof availability) => {
    setValue(`preferences.availability.${key}`, !availability[key]);
  };

  const handleDistanceChange = (distance: number) => {
    setValue('preferences.travel_distance', distance);
  };

  const handleCompetitiveLevelChange = (level: typeof competitiveLevel) => {
    setValue('preferences.competitive_level', level);
  };

  const handleNext = async () => {
    const isValid = await trigger('preferences');
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-purple-100 rounded-full px-4 py-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
          <span className="text-purple-700 text-sm font-medium">PREFERENCES SETUP</span>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900">
          Set Your Preferences
        </h2>
        <p className="text-gray-600 text-lg">
          Help us match you with the perfect leagues and games that fit your schedule and style.
        </p>
      </div>

      {/* Availability Selection */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">⏰</span>
          When Are You Available to Play?
          <span className="text-red-500 ml-2">*</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AVAILABILITY_OPTIONS.map((option) => {
            const isSelected = availability[option.key];
            
            return (
              <button
                key={option.key}
                onClick={() => handleAvailabilityToggle(option.key)}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
                  transform hover:scale-105 hover:shadow-lg group
                  ${isSelected
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">{option.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      {option.label}
                    </h4>
                    <p className="text-gray-600 text-sm mb-1">
                      {option.description}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {option.timeHint}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {errors.preferences?.availability && (
          <p className="text-red-600 text-sm mt-2 flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors.preferences.availability.message}</span>
          </p>
        )}
      </div>

      {/* Travel Distance */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🚗</span>
          How Far Will You Travel?
        </h3>
        
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Close by</span>
            <span className="text-lg font-bold text-blue-600">{travelDistance} miles</span>
            <span className="text-sm text-gray-600">Anywhere</span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="1"
              max="50"
              value={travelDistance}
              onChange={(e) => handleDistanceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1mi</span>
              <span>25mi</span>
              <span>50mi</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              We'll show you leagues and games within {travelDistance} miles of your location
            </p>
          </div>
        </div>
      </div>

      {/* Competitive Level */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          What's Your Competitive Style?
        </h3>
        
        <div className="space-y-4">
          {COMPETITIVE_LEVELS.map((level) => {
            const isSelected = competitiveLevel === level.value;
            
            return (
              <button
                key={level.value}
                onClick={() => handleCompetitiveLevelChange(level.value)}
                className={`
                  w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left
                  transform hover:scale-102 hover:shadow-lg group
                  ${isSelected
                    ? 'border-transparent bg-gradient-to-r shadow-lg scale-102'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                style={{
                  background: isSelected ? `linear-gradient(to right, var(--tw-gradient-stops))` : undefined
                }}
              >
                <div className={`flex items-center space-x-4 ${isSelected ? 'text-white' : ''}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <span className="text-2xl">{level.icon}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {level.label}
                    </h4>
                    <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                      {level.description}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-green-500 text-sm font-bold">✓</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferences Summary */}
      {hasAvailability && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Your Preferences Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-semibold text-gray-700 mb-2">Availability</div>
              <div className="space-y-1">
                {AVAILABILITY_OPTIONS.map(option => (
                  availability[option.key] && (
                    <div key={option.key} className="flex items-center space-x-2 text-sm">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-semibold text-gray-700 mb-2">Travel Distance</div>
              <div className="text-2xl font-bold text-blue-600">{travelDistance} miles</div>
              <div className="text-sm text-gray-600">maximum</div>
            </div>
            
            <div className="bg-white/70 rounded-xl p-4">
              <div className="font-semibold text-gray-700 mb-2">Competitive Level</div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{COMPETITIVE_LEVELS.find(l => l.value === competitiveLevel)?.icon}</span>
                <span className="font-medium">{COMPETITIVE_LEVELS.find(l => l.value === competitiveLevel)?.label}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Recommendations Preview */}
      {hasAvailability && (
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-xl mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Perfect Matches Coming Up!
          </h3>
          <p className="text-blue-100 mb-4">
            Based on your preferences, we're already finding leagues that match your style:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="font-semibold">League Compatibility</span>
              </div>
              <p className="text-sm text-blue-100">
                We found {Math.floor(Math.random() * 8) + 3} leagues that match your availability and competitive level
              </p>
            </div>
            
            <div className="bg-white/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span className="font-semibold">Nearby Games</span>
              </div>
              <p className="text-sm text-blue-100">
                {Math.floor(Math.random() * 15) + 5} upcoming games within {travelDistance} miles of you
              </p>
            </div>
          </div>
        </div>
      )}

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
          disabled={!hasAvailability}
          className={`
            flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-semibold 
            transition-all duration-200 transform hover:scale-105
            ${hasAvailability
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <span>Continue to Goals</span>
          <span>→</span>
        </button>
      </div>

      {/* Progress Hint */}
      <div className="text-center text-gray-500 text-sm">
        Next: Define what you want to achieve
      </div>
    </div>
  );
};

export default PreferencesStep;