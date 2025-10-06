/**
 * Debug page for testing authentication issues
 * This page provides direct testing of Supabase auth to diagnose CORS issues
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/supabase-auth-provider';

export default function DebugAuthPage() {
  const { user, session, isLoading: authLoading } = useAuth();
  const [output, setOutput] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Load session info when auth state changes
  useEffect(() => {
    if (!authLoading) {
      setSessionInfo(session);
      console.log('🔍 Current dev auth session:', session);
    }
  }, [authLoading, user, session]);

  const addOutput = (message: string) => {
    setOutput(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  // Test 1: Direct fetch to auth endpoint
  const testDirectFetch = async () => {
    setIsLoading(true);
    addOutput('Starting direct fetch test...');
    
    try {
      // First test: GET request to settings
      addOutput('Test 1: GET /auth/v1/settings');
      const settingsResponse = await fetch('http://localhost:8000/auth/v1/settings', {
        method: 'GET',
        headers: {
          'apikey': 'wmIL9fNxipY7cwMtkAA6TGKvIB17LNZweLAlnttuyvc=',
          'Content-Type': 'application/json'
        }
      });
      addOutput(`Settings response: ${settingsResponse.status} ${settingsResponse.statusText}`);
      
      // Second test: OPTIONS preflight
      addOutput('Test 2: OPTIONS preflight for /auth/v1/token');
      const preflightResponse = await fetch('http://localhost:8000/auth/v1/token?grant_type=password', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'X-Client-Info,Content-Type,Authorization,apikey'
        }
      });
      addOutput(`Preflight response: ${preflightResponse.status} ${preflightResponse.statusText}`);
      const preflightHeaders = Array.from(preflightResponse.headers.entries());
      preflightHeaders.forEach(([key, value]) => {
        if (key.toLowerCase().includes('access-control')) {
          addOutput(`  ${key}: ${value}`);
        }
      });
      
      // Third test: POST request with X-Client-Info
      addOutput('Test 3: POST /auth/v1/token with X-Client-Info');
      const authResponse = await fetch('http://localhost:8000/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'wmIL9fNxipY7cwMtkAA6TGKvIB17LNZweLAlnttuyvc=',
          'X-Client-Info': 'matchday-web@1.0.0'
        },
        body: JSON.stringify({
          email: 'test@matchday.com',
          password: 'test123456'
        })
      });
      addOutput(`Auth response: ${authResponse.status} ${authResponse.statusText}`);
      const authData = await authResponse.text();
      addOutput(`Auth response body: ${authData}`);
      
    } catch (error) {
      addOutput(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        addOutput('This is likely a CORS error. Check browser console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Test 2: Test Supabase client (with X-Client-Info)
  const testSupabaseClient = async () => {
    setIsLoading(true);
    addOutput('Starting Supabase client test (original with X-Client-Info)...');
    
    try {
      // Dynamic import to avoid SSR issues
      const { supabase } = await import('@/lib/supabase/client');
      
      addOutput('Supabase client loaded');
      addOutput(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      addOutput(`Has anon key: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
      
      // Test auth.signInWithPassword
      addOutput('Attempting signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@matchday.com',
        password: 'test123456'
      });
      
      if (error) {
        addOutput(`Auth error: ${error.message}`);
        addOutput(`Error type: ${error.name}`);
        addOutput(`Error details: ${JSON.stringify(error, null, 2)}`);
      } else {
        addOutput('Auth successful!');
        addOutput(`User: ${data.user?.email}`);
      }
      
    } catch (error) {
      addOutput(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error) {
        addOutput(`Error stack: ${error.stack}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Test Supabase client without X-Client-Info
  const testSupabaseClientFixed = async () => {
    setIsLoading(true);
    addOutput('Starting Supabase client test (fixed without X-Client-Info)...');
    
    try {
      // Dynamic import to avoid SSR issues
      const { supabaseNoClientInfo } = await import('@/lib/supabase/client-fixed');
      
      addOutput('Fixed Supabase client loaded (no X-Client-Info header)');
      addOutput(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
      addOutput(`Has anon key: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
      
      // Test auth.signInWithPassword
      addOutput('Attempting signInWithPassword...');
      const { data, error } = await supabaseNoClientInfo.auth.signInWithPassword({
        email: 'admin@matchday.com',
        password: 'admin123'
      });
      
      if (error) {
        addOutput(`Auth error: ${error.message}`);
        addOutput(`Error type: ${error.name}`);
        addOutput(`Error details: ${JSON.stringify(error, null, 2)}`);
      } else {
        addOutput('Auth successful!');
        addOutput(`User: ${data.user?.email}`);
      }
      
    } catch (error) {
      addOutput(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error) {
        addOutput(`Error stack: ${error.stack}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Test 4: Check browser environment
  const checkEnvironment = () => {
    addOutput('Checking browser environment...');
    
    // Check if running in browser
    addOutput(`Running in browser: ${typeof window !== 'undefined'}`);
    
    // Check environment variables
    addOutput(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
    addOutput(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);
    
    // Check localStorage for auth tokens
    if (typeof window !== 'undefined') {
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth')
      );
      addOutput(`Auth keys in localStorage: ${authKeys.length > 0 ? authKeys.join(', ') : 'none'}`);
    }
    
    // Check network connectivity
    addOutput(`Navigator online: ${navigator.onLine}`);
  };

  const clearOutput = () => {
    setOutput([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={checkEnvironment}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Check Environment
            </button>
            <button
              onClick={testDirectFetch}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Direct Fetch
            </button>
            <button
              onClick={testSupabaseClient}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Supabase (Original)
            </button>
            <button
              onClick={testSupabaseClientFixed}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              Test Supabase (Fixed)
            </button>
            <button
              onClick={clearOutput}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Output
            </button>
          </div>
          {isLoading && (
            <div className="mt-4 text-blue-600">Testing in progress...</div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Output Console</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
            {output.length === 0 ? (
              <div className="text-gray-500">No output yet. Run a test to see results.</div>
            ) : (
              output.map((line, index) => (
                <div key={index} className="mb-1">{line}</div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Open browser Developer Tools (F12)</li>
            <li>Go to Network tab and enable "Preserve log"</li>
            <li>Click "Check Environment" to verify setup</li>
            <li>Click "Test Direct Fetch" to test raw HTTP requests</li>
            <li>Click "Test Supabase Client" to test the Supabase SDK</li>
            <li>Check Console tab for any additional errors</li>
            <li>Check Network tab for failed requests (red entries)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}