'use client';

import Link from 'next/link';
import { use } from 'react';

interface AdminSeasonPageProps {
  params: Promise<{
    leagueId: string;
    seasonId: string;
  }>;
}

export default function AdminSeasonPage({ params }: AdminSeasonPageProps) {
  const { leagueId, seasonId } = use(params);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/leagues/${leagueId}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            ← Back to League
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Season Dashboard
          </h1>
          <p className="text-gray-400">Season ID: {seasonId}</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Page</h2>
          <p className="text-gray-400">
            This is a test page to confirm routing is working.
          </p>
        </div>
      </div>
    </div>
  );
}