/**
 * SportsStep Component
 * 
 * Visual sport selection with cards, experience level selection,
 * and position preferences with professional styling.
 */

'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OnboardingData, SPORTS, EXPERIENCE_LEVELS, FOOTBALL_POSITIONS } from '../types';

interface SportsStepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

export const SportsStep: React.FC<SportsStepProps> = ({
  onNext,
  onBack,
  isFirst,
  isLast,
  currentStep,
  totalSteps
}) => {
  const { 
    register, 
    setValue, 
    watch, 
    formState: { errors }, 
    trigger 
  } = useFormContext<OnboardingData>();

  const formData = watch('sports');
  const experienceLevel = formData?.experience_level || 'intermediate';
  const preferredPosition = formData?.preferred_position || '';

  // Auto-select football since it's the only sport
  React.useEffect(() => {
    setValue('sports.preferred_sports', ['football']);
  }, [setValue]);

  const canProceed = true; // Always true since football is auto-selected

  // No sport toggle needed - football is always selected

  const handleExperienceChange = (level: typeof experienceLevel) => {
    setValue('sports.experience_level', level);
  };

  const handleNext = async () => {
    const isValid = await trigger('sports');
    if (isValid) {
      onNext();
    }
  };

  // Get football positions
  const getFootballPositions = () => {
    return FOOTBALL_POSITIONS;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-green-100 rounded-full px-4 py-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-green-700 text-sm font-medium">SPORTS SELECTION</span>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900">
          Choose Your Sports
        </h2>
        <p className="text-gray-600 text-lg">
          Select the sports you want to play and tell us about your experience level.
          You can always add more sports later.
        </p>
      </div>

      {/* Sports Selection Grid */}
      <div>
        {/* Football Welcome */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Football!
          </h3>
          <p className="text-gray-600">
            Join thousands of football players in competitive leagues and friendly matches.
            The beautiful game awaits you!
          </p>
        </div>
      </div>

      {/* Experience Level Selection */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          What's Your Experience Level?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPERIENCE_LEVELS.map((level) => {
            const isSelected = experienceLevel === level.value;
            
            return (
              <button
                key={level.value}
                onClick={() => handleExperienceChange(level.value)}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
                  transform hover:scale-105 hover:shadow-lg
                  ${isSelected
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
                
                <div className="flex items-start space-x-4">
                  <span className="text-3xl">{level.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      {level.label}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {level.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Position Preferences */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          Preferred Position
          <span className="text-gray-400 ml-2 text-sm">(Optional)</span>
        </h3>
        
        <div className="space-y-4">
          <input
            {...register('sports.preferred_position')}
            type="text"
            placeholder="e.g., Midfielder, Forward, Goalkeeper..."
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
          />
          
          <div className="space-y-2">
            <span className="text-sm text-gray-500 block">Football positions:</span>
            <div className="flex flex-wrap gap-2">
              {getFootballPositions().map((position) => (
                <button
                  key={position}
                  onClick={() => setValue('sports.preferred_position', position)}
                  className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full transition-colors duration-200"
                >
                  {position}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Football Profile Preview */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center">
          <span className="mr-2">🎖️</span>
          Your Football Profile Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/70 rounded-xl p-4">
            <div className="font-semibold text-gray-700 mb-1">Sport</div>
            <div className="flex items-center space-x-1">
              <span className="text-lg">⚽</span>
              <span>Football</span>
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <div className="font-semibold text-gray-700 mb-1">Level</div>
            <div className="flex items-center space-x-1">
              <span>{EXPERIENCE_LEVELS.find(l => l.value === experienceLevel)?.icon}</span>
              <span>{EXPERIENCE_LEVELS.find(l => l.value === experienceLevel)?.label}</span>
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <div className="font-semibold text-gray-700 mb-1">Position</div>
            <div className="text-gray-600">
              {preferredPosition || 'Flexible'}
            </div>
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
              ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <span>Continue to Preferences</span>
          <span>→</span>
        </button>
      </div>

      {/* Progress Hint */}
      <div className="text-center text-gray-500 text-sm">
        Next: Set your availability and preferences
      </div>
    </div>
  );
};

export default SportsStep;