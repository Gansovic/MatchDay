/**
 * Types and validation schemas for the professional player onboarding flow
 */

import { z } from 'zod';

// Sport types with enhanced visual representation
export interface Sport {
  id: string;
  name: string;
  icon: string;
  category: 'team' | 'individual' | 'racquet';
  description?: string;
  popularPositions?: string[];
}

// Football-only sport configuration
export const SPORTS: Sport[] = [
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    category: 'team',
    description: 'The beautiful game - the world\'s most popular sport',
    popularPositions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
  }
];

// Football positions for easy reference
export const FOOTBALL_POSITIONS = [
  'Goalkeeper',
  'Centre-back',
  'Left-back',
  'Right-back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Left Winger',
  'Right Winger',
  'Striker',
  'Centre Forward'
];

// Player goals with professional focus
export const PLAYER_GOALS = [
  {
    id: 'fitness',
    title: 'Stay Fit & Active',
    description: 'Maintain peak physical condition',
    icon: '💪'
  },
  {
    id: 'social',
    title: 'Build Community',
    description: 'Connect with like-minded athletes',
    icon: '🤝'
  },
  {
    id: 'competitive',
    title: 'Compete & Win',
    description: 'Test skills against top competition',
    icon: '🏆'
  },
  {
    id: 'skills',
    title: 'Develop Skills',
    description: 'Master new techniques and strategies',
    icon: '🎯'
  },
  {
    id: 'professional',
    title: 'Feel Professional',
    description: 'Experience the pro athlete lifestyle',
    icon: '⭐'
  },
  {
    id: 'leadership',
    title: 'Lead Teams',
    description: 'Develop leadership and teamwork skills',
    icon: '👑'
  }
];

// Experience levels with detailed descriptions
export const EXPERIENCE_LEVELS = [
  {
    value: 'beginner',
    label: 'Rookie',
    description: 'New to the sport, eager to learn',
    icon: '🌱'
  },
  {
    value: 'intermediate',
    label: 'Veteran',
    description: 'Solid fundamentals, ready to compete',
    icon: '🎖️'
  },
  {
    value: 'advanced',
    label: 'Elite',
    description: 'Highly skilled, experienced competitor',
    icon: '⭐'
  },
  {
    value: 'expert',
    label: 'Legend',
    description: 'Exceptional ability, team leader',
    icon: '🏆'
  }
] as const;

// Validation schemas
export const WelcomeStepSchema = z.object({
  acknowledged: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge the welcome message to continue'
  })
});

export const ProfileStepSchema = z.object({
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine(date => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 100;
    }, 'You must be between 13 and 100 years old')
    .optional()
    .or(z.literal('')),
  
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

export const SportsStepSchema = z.object({
  // Football is automatically selected, no need for sport selection
  preferred_sports: z.array(z.string()).default(['football']),
  
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  
  preferred_position: z.string()
    .max(50, 'Position must be less than 50 characters')
    .optional()
    .or(z.literal(''))
});

export const PreferencesStepSchema = z.object({
  availability: z.object({
    weekdays: z.boolean(),
    weekends: z.boolean(),
    evenings: z.boolean()
  }).refine(
    data => data.weekdays || data.weekends || data.evenings,
    'Please select at least one availability option'
  ),
  
  travel_distance: z.number()
    .min(0, 'Distance must be positive')
    .max(100, 'Distance must be less than 100 miles')
    .optional(),
  
  competitive_level: z.enum(['casual', 'competitive', 'elite']).optional()
});

export const GoalsStepSchema = z.object({
  goals: z.array(z.string())
    .min(1, 'Please select at least one goal')
    .max(6, 'You can select up to 6 goals'),
  
  motivation: z.string()
    .max(300, 'Motivation must be less than 300 characters')
    .optional()
    .or(z.literal(''))
});

export const LeaguePreviewStepSchema = z.object({
  interested_leagues: z.array(z.string()).optional(),
  notification_preferences: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }).optional()
});

export const CompletionStepSchema = z.object({
  ready_to_play: z.boolean().refine(val => val === true, {
    message: 'You must be ready to play to complete onboarding'
  })
});

// Complete onboarding data schema
export const OnboardingDataSchema = z.object({
  welcome: WelcomeStepSchema,
  profile: ProfileStepSchema,
  sports: SportsStepSchema,
  preferences: PreferencesStepSchema,
  goals: GoalsStepSchema,
  leaguePreview: LeaguePreviewStepSchema,
  completion: CompletionStepSchema
});

// Type inference from schemas
export type WelcomeStepData = z.infer<typeof WelcomeStepSchema>;
export type ProfileStepData = z.infer<typeof ProfileStepSchema>;
export type SportsStepData = z.infer<typeof SportsStepSchema>;
export type PreferencesStepData = z.infer<typeof PreferencesStepSchema>;
export type GoalsStepData = z.infer<typeof GoalsStepSchema>;
export type LeaguePreviewStepData = z.infer<typeof LeaguePreviewStepSchema>;
export type CompletionStepData = z.infer<typeof CompletionStepSchema>;
export type OnboardingData = z.infer<typeof OnboardingDataSchema>;

// Onboarding step configuration
export interface OnboardingStep {
  id: number;
  key: keyof OnboardingData;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  estimatedTime: string;
  isSkippable?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    key: 'welcome',
    title: 'Welcome',
    subtitle: 'Welcome to MatchDay Pro',
    description: 'Join the professional amateur sports experience',
    icon: '🏆',
    estimatedTime: '30s'
  },
  {
    id: 2,
    key: 'profile',
    title: 'Profile',
    subtitle: 'Create Your Athlete Profile',
    description: 'Tell us about yourself as a player',
    icon: '👤',
    estimatedTime: '2 min'
  },
  {
    id: 3,
    key: 'sports',
    title: 'Sports',
    subtitle: 'Your Football Journey',
    description: 'Tell us about your football experience and preferences',
    icon: '⚽',
    estimatedTime: '1 min'
  },
  {
    id: 4,
    key: 'preferences',
    title: 'Preferences',
    subtitle: 'Set Your Availability',
    description: 'When and where you want to play',
    icon: '📅',
    estimatedTime: '1 min'
  },
  {
    id: 5,
    key: 'goals',
    title: 'Goals',
    subtitle: 'Define Your Objectives',
    description: 'What do you want to achieve?',
    icon: '🎯',
    estimatedTime: '1 min'
  },
  {
    id: 6,
    key: 'leaguePreview',
    title: 'Leagues',
    subtitle: 'Discover Compatible Leagues',
    description: 'See leagues that match your profile',
    icon: '🏅',
    estimatedTime: '2 min'
  },
  {
    id: 7,
    key: 'completion',
    title: 'Complete',
    subtitle: 'You\'re Ready to Play!',
    description: 'Welcome to the professional experience',
    icon: '🎉',
    estimatedTime: '30s'
  }
];

// Achievement for completing onboarding
export interface FirstBadgeAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export const WELCOME_ACHIEVEMENT: FirstBadgeAchievement = {
  id: 'first-steps',
  name: 'First Steps',
  description: 'Completed professional player onboarding',
  icon: '🥇',
  rarity: 'common',
  points: 100
};