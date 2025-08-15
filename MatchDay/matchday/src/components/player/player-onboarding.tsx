/**
 * Player Onboarding Component
 * 
 * Professional multi-step onboarding flow that makes new users feel like
 * they're joining a professional platform. Collects essential player
 * information and sets up their profile.
 * 
 * @example
 * ```typescript
 * <PlayerOnboarding userId={userId} onComplete={() => router.push('/dashboard')} />
 * ```
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlayerService } from '@/lib/services/player.service';

interface PlayerOnboardingProps {
  userId: string;
  onComplete: () => void;
  className?: string;
}

interface OnboardingData {
  display_name: string;
  preferred_position: string;
  bio: string;
  date_of_birth: string;
  location: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferred_sports: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
  };
  goals: string[];
}

const STEPS = [
  { id: 1, title: 'Welcome', description: 'Get started with MatchDay' },
  { id: 2, title: 'Basic Info', description: 'Tell us about yourself' },
  { id: 3, title: 'Sports Profile', description: 'Your athletic background' },
  { id: 4, title: 'Preferences', description: 'What are you looking for?' },
  { id: 5, title: 'Complete', description: 'You\'re ready to play!' }
];

const SPORTS = [
  { id: 'soccer', name: 'Soccer', icon: '⚽' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'softball', name: 'Softball', icon: '🥎' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' }
];

const PLAYER_GOALS = [
  'Stay fit and active',
  'Make new friends',
  'Compete and win',
  'Learn new skills',
  'Join a community',
  'Play professionally'
];

export const PlayerOnboarding: React.FC<PlayerOnboardingProps> = ({
  userId,
  onComplete,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    display_name: '',
    preferred_position: '',
    bio: '',
    date_of_birth: '',
    location: '',
    experience_level: 'intermediate',
    preferred_sports: [],
    availability: {
      weekdays: false,
      weekends: false,
      evenings: false
    },
    goals: []
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const profile = await PlayerService.getInstance().updatePlayerProfile(userId, {
        display_name: data.display_name,
        preferred_position: data.preferred_position,
        bio: data.bio,
        date_of_birth: data.date_of_birth,
        location: data.location
      });
      
      // Store additional onboarding data in user preferences/metadata
      // This would typically be stored in a separate preferences table
      return profile;
    },
    onSuccess: () => {
      setCurrentStep(5);
      setTimeout(onComplete, 2000);
    }
  });

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    createProfileMutation.mutate(formData);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex flex-col items-center ${index < currentStep - 1 ? 'text-green-600' : index === currentStep - 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                index < currentStep - 1 ? 'bg-green-100 text-green-600' :
                index === currentStep - 1 ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-400'
              }`}>
                {index < currentStep - 1 ? '✓' : step.id}
              </div>
              <div className="text-xs mt-1 text-center hidden sm:block">
                <div className="font-medium">{step.title}</div>
                <div className="text-gray-500">{step.description}</div>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`hidden sm:block w-16 h-0.5 ${index < currentStep - 1 ? 'bg-green-300' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-6">🏆</div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to MatchDay!
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        You're about to join the most professional amateur sports platform. 
        Let's set up your player profile to get you matched with the perfect leagues and teammates.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Professional Stats
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Track your performance like a pro with detailed statistics and analytics
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
          <div className="text-3xl mb-2">🌍</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Global Rankings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Compare your skills with players from leagues worldwide
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
          <div className="text-3xl mb-2">🏅</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Achievement System
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Earn badges and recognition for your accomplishments
          </p>
        </div>
      </div>
      
      <button
        onClick={nextStep}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
      >
        Let's Get Started →
      </button>
    </div>
  );

  const renderBasicInfoStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Let's start with the basics so other players can get to know you
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Display Name *
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => updateFormData({ display_name: e.target.value })}
            placeholder="How should other players know you?"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateFormData({ location: e.target.value })}
            placeholder="City, State or ZIP code"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => updateFormData({ date_of_birth: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tell us about yourself
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => updateFormData({ bio: e.target.value })}
            placeholder="What makes you unique as a player? Any fun facts?"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          disabled={!formData.display_name}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderSportsProfileStep = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Sports Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help us understand your athletic background and preferences
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Which sports are you interested in? (Select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                onClick={() => updateFormData({
                  preferred_sports: formData.preferred_sports.includes(sport.id)
                    ? formData.preferred_sports.filter(s => s !== sport.id)
                    : [...formData.preferred_sports, sport.id]
                })}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.preferred_sports.includes(sport.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-1">{sport.icon}</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {sport.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Experience Level
            </label>
            <select
              value={formData.experience_level}
              onChange={(e) => updateFormData({ experience_level: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="beginner">Beginner - Just starting out</option>
              <option value="intermediate">Intermediate - Some experience</option>
              <option value="advanced">Advanced - Very experienced</option>
              <option value="expert">Expert - Played at high levels</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Position (if applicable)
            </label>
            <input
              type="text"
              value={formData.preferred_position}
              onChange={(e) => updateFormData({ preferred_position: e.target.value })}
              placeholder="e.g., Forward, Midfielder, Point Guard"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Goals & Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          This helps us recommend the perfect leagues and teams for you
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What are your main goals? (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLAYER_GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => updateFormData({
                  goals: formData.goals.includes(goal)
                    ? formData.goals.filter(g => g !== goal)
                    : [...formData.goals, goal]
                })}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  formData.goals.includes(goal)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {goal}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            When are you typically available?
          </label>
          <div className="space-y-2">
            {[
              { key: 'weekdays', label: 'Weekdays (Monday-Friday)' },
              { key: 'weekends', label: 'Weekends (Saturday-Sunday)' },
              { key: 'evenings', label: 'Evenings (After 6 PM)' }
            ].map((availability) => (
              <label key={availability.key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.availability[availability.key as keyof typeof formData.availability]}
                  onChange={(e) => updateFormData({
                    availability: {
                      ...formData.availability,
                      [availability.key]: e.target.checked
                    }
                  })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {availability.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={createProfileMutation.isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors"
        >
          {createProfileMutation.isPending ? 'Creating Profile...' : 'Complete Setup →'}
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="text-6xl mb-6 animate-bounce">🎉</div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to the Team!
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Your professional player profile has been created. You're now ready to:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
          <div className="text-3xl mb-2">🔍</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Discover Leagues
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Find compatible leagues that match your skill level and schedule
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Track Stats
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Monitor your performance and compare with players worldwide
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Earn Achievements
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Unlock badges and climb the global leaderboards
          </p>
        </div>
      </div>
      
      <p className="text-gray-500 dark:text-gray-400">
        Redirecting to your dashboard...
      </p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {renderStepIndicator()}
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {currentStep === 1 && renderWelcomeStep()}
          {currentStep === 2 && renderBasicInfoStep()}
          {currentStep === 3 && renderSportsProfileStep()}
          {currentStep === 4 && renderPreferencesStep()}
          {currentStep === 5 && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};