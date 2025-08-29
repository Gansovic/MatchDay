/**
 * WelcomeStep Component
 * 
 * Professional welcome step with value proposition that makes amateur players
 * feel like they're joining something professional and exciting.
 */

'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OnboardingData } from '../types';

interface WelcomeStepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onNext,
  onBack,
  isFirst,
  isLast,
  currentStep,
  totalSteps
}) => {
  const { setValue, watch } = useFormContext<OnboardingData>();
  const acknowledged = watch('welcome.acknowledged');

  const handleGetStarted = () => {
    setValue('welcome.acknowledged', true);
    onNext();
  };

  return (
    <div className="text-center space-y-8">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="relative">
          <div className="text-6xl md:text-8xl mb-6 animate-bounce">🏆</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Welcome to the
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
            Professional Experience
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Transform your amateur sports experience into something that feels truly professional.
          Join thousands of athletes who've elevated their game with MatchDay.
        </p>
      </div>

      {/* Value Proposition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Professional Analytics
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Track your performance with detailed statistics, heat maps, and analytics 
            that rival professional sports broadcasts.
          </p>
          <div className="mt-4 text-sm text-blue-600 font-semibold">
            Real-time stats • Global rankings • Performance insights
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl text-white">🌍</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Global Community
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Connect with athletes worldwide. Compare your performance, join international
            tournaments, and climb global leaderboards.
          </p>
          <div className="mt-4 text-sm text-green-600 font-semibold">
            50+ countries • 10,000+ active players • Weekly tournaments
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl text-white">🏅</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Achievement System
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Earn badges, unlock achievements, and gain recognition for your accomplishments.
            Every game counts towards your legacy.
          </p>
          <div className="mt-4 text-sm text-purple-600 font-semibold">
            100+ achievements • Skill badges • Hall of fame
          </div>
        </div>
      </div>

      {/* Professional Features Highlight */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">
          What Makes This Professional?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Broadcast-Quality Stats</h4>
              <p className="text-blue-200 text-sm">
                Performance metrics that match what you see on ESPN and professional sports networks.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Smart League Matching</h4>
              <p className="text-blue-200 text-sm">
                AI-powered algorithms match you with leagues that fit your skill level and schedule perfectly.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Professional Presentation</h4>
              <p className="text-blue-200 text-sm">
                Every aspect designed to make you feel like the professional athlete you are inside.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Elite Community</h4>
              <p className="text-blue-200 text-sm">
                Join athletes who take their amateur sports seriously and strive for excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">
          Ready to Elevate Your Game?
        </h2>
        <p className="text-blue-100 mb-6 leading-relaxed">
          This quick 5-minute setup will create your professional athlete profile 
          and unlock access to the most advanced amateur sports platform available.
        </p>
        
        <div className="flex items-center justify-center space-x-4 text-sm text-blue-200 mb-6">
          <div className="flex items-center space-x-1">
            <span>⏱️</span>
            <span>5 minutes</span>
          </div>
          <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
          <div className="flex items-center space-x-1">
            <span>📱</span>
            <span>Mobile optimized</span>
          </div>
          <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
          <div className="flex items-center space-x-1">
            <span>🔒</span>
            <span>Secure & private</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
        <button
          onClick={handleGetStarted}
          className="group relative bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
        >
          <span className="relative z-10 flex items-center justify-center space-x-2">
            <span>Begin Professional Setup</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-green-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
        
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Takes less than 5 minutes
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Skip anytime • No commitment required
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="border-t border-gray-200 pt-8 mt-12">
        <div className="flex flex-wrap justify-center items-center space-x-8 opacity-60">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">50K+</div>
            <div className="text-sm text-gray-500">Active Athletes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">1M+</div>
            <div className="text-sm text-gray-500">Games Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">4.9★</div>
            <div className="text-sm text-gray-500">App Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">95%</div>
            <div className="text-sm text-gray-500">Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;