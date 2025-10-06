/**
 * OnboardingWizard Component
 * 
 * Professional multi-step onboarding flow with form validation, smooth animations,
 * and broadcast-style design that makes amateur players feel like professionals.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { PlayerService } from '@matchday/services';
import { 
  OnboardingData, 
  OnboardingDataSchema, 
  ONBOARDING_STEPS,
  OnboardingStep as OnboardingStepType
} from './types';
import { WelcomeStep } from './steps/welcome-step';
import { ProfileStep } from './steps/profile-step';
import { SportsStep } from './steps/sports-step';
import { PreferencesStep } from './steps/preferences-step';
import { GoalsStep } from './steps/goals-step';
import { LeaguePreviewStep } from './steps/league-preview-step';
import { CompletionStep } from './steps/completion-step';

interface OnboardingWizardProps {
  userId: string;
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
  className?: string;
}

interface StepComponentProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  userId,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  // Initialize form with default values
  const methods = useForm<OnboardingData>({
    resolver: zodResolver(OnboardingDataSchema),
    mode: 'onBlur',
    defaultValues: {
      welcome: { acknowledged: false },
      profile: { 
        display_name: '', 
        location: '', 
        date_of_birth: '', 
        bio: '' 
      },
      sports: { 
        preferred_sports: ['football'], // Default to football
        experience_level: 'intermediate', 
        preferred_position: '' 
      },
      preferences: { 
        availability: { 
          weekdays: false, 
          weekends: false, 
          evenings: false 
        },
        travel_distance: 10,
        competitive_level: 'competitive'
      },
      goals: { 
        goals: [], 
        motivation: '' 
      },
      leaguePreview: { 
        interested_leagues: [],
        notification_preferences: { 
          email: true, 
          push: true, 
          sms: false 
        }
      },
      completion: { ready_to_play: false }
    }
  });

  // Create player profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const playerService = PlayerService.getInstance();
      
      // Update player profile with onboarding data
      const profileResult = await playerService.updatePlayerProfile(userId, {
        display_name: data.profile.display_name,
        bio: data.profile.bio,
        date_of_birth: data.profile.date_of_birth || null,
        location: data.profile.location || null,
        preferred_position: data.sports.preferred_position || null
      });

      if (!profileResult.success) {
        throw new Error(profileResult.error?.message || 'Failed to update profile');
      }

      // Store additional onboarding preferences
      // In a real app, you'd store this in a preferences table
      const preferences = {
        preferred_sports: data.sports.preferred_sports,
        experience_level: data.sports.experience_level,
        availability: data.preferences.availability,
        goals: data.goals.goals,
        travel_distance: data.preferences.travel_distance,
        competitive_level: data.preferences.competitive_level,
        notification_preferences: data.leaguePreview.notification_preferences
      };

      // Store in localStorage for now (in production, use a preferences service)
      localStorage.setItem(`player_preferences_${userId}`, JSON.stringify(preferences));

      return profileResult.data;
    },
    onSuccess: (data) => {
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      onComplete(methods.getValues());
    },
    onError: (error) => {
      console.error('Failed to complete onboarding:', error);
    }
  });

  // Step navigation with validation
  const handleNext = useCallback(async () => {
    const stepKey = currentStep.key;
    const stepData = methods.getValues(stepKey);
    
    // Validate current step
    const isValid = await methods.trigger(stepKey);
    if (!isValid) return;

    setIsTransitioning(true);
    setCompletedSteps(prev => new Set([...prev, currentStepIndex]));

    // If this is the last step, submit the form
    if (isLastStep) {
      const allData = methods.getValues();
      createProfileMutation.mutate(allData);
      return;
    }

    // Move to next step
    setTimeout(() => {
      setCurrentStepIndex(prev => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
      setIsTransitioning(false);
    }, 150);
  }, [currentStep, currentStepIndex, isLastStep, methods, createProfileMutation]);

  const handleBack = useCallback(() => {
    if (isFirstStep) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStepIndex(prev => Math.max(prev - 1, 0));
      setIsTransitioning(false);
    }, 150);
  }, [isFirstStep]);

  // Skip onboarding (if allowed)
  const handleSkip = useCallback(() => {
    if (onSkip && currentStep.isSkippable) {
      onSkip();
    }
  }, [onSkip, currentStep.isSkippable]);

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2 md:space-x-4">
        {ONBOARDING_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStepIndex;
          const isPast = index < currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                    font-bold text-sm md:text-base transition-all duration-300 transform
                    ${isCurrent ? 'scale-110 shadow-lg' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : 
                      isCurrent ? 'bg-blue-600 text-white' : 
                      isPast ? 'bg-gray-300 text-gray-600' : 'bg-gray-200 text-gray-400'}
                  `}
                >
                  {isCompleted ? (
                    <span className="text-lg">✓</span>
                  ) : (
                    <span className="text-xl">{step.icon}</span>
                  )}
                  
                  {isCurrent && (
                    <div className="absolute -inset-1 rounded-full bg-blue-600 opacity-20 animate-pulse"></div>
                  )}
                </div>
                
                <div className="hidden md:block text-center mt-2 max-w-20">
                  <div className={`text-xs font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {step.estimatedTime}
                  </div>
                </div>
              </div>
              
              {index < ONBOARDING_STEPS.length - 1 && (
                <div 
                  className={`
                    hidden md:block w-8 lg:w-12 h-0.5 transition-colors duration-300
                    ${isPast || isCompleted ? 'bg-green-300' : 'bg-gray-300'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  // Render current step component
  const renderStep = () => {
    const stepProps: StepComponentProps = {
      onNext: handleNext,
      onBack: handleBack,
      isFirst: isFirstStep,
      isLast: isLastStep,
      currentStep: currentStepIndex + 1,
      totalSteps: ONBOARDING_STEPS.length
    };

    const stepClass = `
      transition-all duration-300 transform
      ${isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
    `;

    switch (currentStep.key) {
      case 'welcome':
        return <div className={stepClass}><WelcomeStep {...stepProps} /></div>;
      case 'profile':
        return <div className={stepClass}><ProfileStep {...stepProps} /></div>;
      case 'sports':
        return <div className={stepClass}><SportsStep {...stepProps} /></div>;
      case 'preferences':
        return <div className={stepClass}><PreferencesStep {...stepProps} /></div>;
      case 'goals':
        return <div className={stepClass}><GoalsStep {...stepProps} /></div>;
      case 'leaguePreview':
        return <div className={stepClass}><LeaguePreviewStep {...stepProps} /></div>;
      case 'completion':
        return <div className={stepClass}><CompletionStep {...stepProps} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 ${className}`}>
      {/* Professional sports broadcast overlay */}
      <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-5"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full opacity-5 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-500 rounded-full opacity-5 animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-600/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-sm font-medium">LIVE ONBOARDING</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {currentStep.subtitle}
            </h1>
            <p className="text-blue-200 text-lg">
              {currentStep.description}
            </p>
            
            <div className="flex justify-center items-center space-x-4 mt-4">
              <span className="text-blue-300 text-sm">
                Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
              </span>
              <div className="w-32 bg-blue-900/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <StepIndicator />

          <FormProvider {...methods}>
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12">
              {renderStep()}
              
              {/* Skip option for skippable steps */}
              {currentStep.isSkippable && onSkip && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleSkip}
                    className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                  >
                    Skip this step
                  </button>
                </div>
              )}
            </div>
          </FormProvider>

          {/* Loading overlay */}
          {createProfileMutation.isPending && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 max-w-sm mx-auto text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Creating Your Professional Profile
                </h3>
                <p className="text-gray-600">
                  Setting up your athlete dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;