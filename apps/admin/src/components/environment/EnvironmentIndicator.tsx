'use client'

/**
 * Environment Indicator Component for MatchDay Admin
 * 
 * Shows a clear visual indicator of the current environment and database connection
 * to prevent confusion between local and production databases.
 */

import { useEffect, useState } from 'react'
import { getEnvironmentDisplayName, getDatabaseDisplayName, validateEnvironment } from '@matchday/shared'

interface EnvironmentIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showInProduction?: boolean
}

export function EnvironmentIndicator({ 
  position = 'bottom-right', 
  showInProduction = false 
}: EnvironmentIndicatorProps) {
  const [envDisplay, setEnvDisplay] = useState<string>('')
  const [dbDisplay, setDbDisplay] = useState<string>('')
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [hasWarnings, setHasWarnings] = useState<boolean>(false)

  useEffect(() => {
    try {
      const result = validateEnvironment()
      
      if (result.config) {
        const envDisplayName = getEnvironmentDisplayName()
        const dbDisplayName = getDatabaseDisplayName()
        
        setEnvDisplay(envDisplayName)
        setDbDisplay(dbDisplayName)
        setHasWarnings(result.warnings.length > 0)
        
        // Show in development always, in production only if explicitly requested
        setIsVisible(result.config.isDevelopment || showInProduction)
      }
    } catch (error) {
      setEnvDisplay('❌ ERROR')
      setDbDisplay('Invalid Configuration')
      setIsVisible(true)
      setHasWarnings(true)
    }
  }, [showInProduction])

  if (!isVisible) {
    return null
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono max-w-xs backdrop-blur-sm border ${hasWarnings ? 'border-yellow-400' : 'border-gray-600'}`}
      role="status"
      aria-label="Environment status indicator"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">ADMIN:</span>
          <span>{envDisplay}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">DB:</span>
          <span className="truncate">{dbDisplay}</span>
        </div>
        {hasWarnings && (
          <div className="text-yellow-400 text-xs mt-1">
            ⚠️ Check console for warnings
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Environment Status Bar Component for Admin App
 * 
 * A more prominent indicator that can be placed at the top of the page
 */
export function EnvironmentStatusBar() {
  const [envDisplay, setEnvDisplay] = useState<string>('')
  const [dbDisplay, setDbDisplay] = useState<string>('')
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [isProduction, setIsProduction] = useState<boolean>(false)

  useEffect(() => {
    try {
      const result = validateEnvironment()
      
      if (result.config) {
        const envDisplayName = getEnvironmentDisplayName()
        const dbDisplayName = getDatabaseDisplayName()
        
        setEnvDisplay(envDisplayName)
        setDbDisplay(dbDisplayName)
        setIsProduction(result.config.isProduction || result.config.isRemote)
        
        // Show warning bar if using production database in development
        setIsVisible(result.config.isDevelopment && result.config.isRemote)
      }
    } catch (error) {
      setEnvDisplay('❌ ERROR')
      setDbDisplay('Invalid Configuration')
      setIsVisible(true)
      setIsProduction(false)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`w-full py-2 px-4 text-center text-sm font-medium ${
        isProduction
          ? 'bg-red-600 text-white'
          : 'bg-yellow-500 text-black'
      }`}
      role="banner"
      aria-label="Environment warning banner"
    >
      <div className="flex items-center justify-center gap-4">
        <span>🔧 ADMIN: {envDisplay}</span>
        <span>•</span>
        <span>{dbDisplay}</span>
        <span>•</span>
        <span className="font-bold">
          {isProduction ? 'PRODUCTION DATA' : 'DEVELOPMENT WARNING'}
        </span>
      </div>
    </div>
  )
}