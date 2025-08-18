/**
 * Loading state for individual league dashboard
 */

import { Loader2 } from 'lucide-react';

export default function LeagueDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading league dashboard...</p>
      </div>
    </div>
  );
}