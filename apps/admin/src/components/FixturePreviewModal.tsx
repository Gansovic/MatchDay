'use client';

import { X, Calendar, Clock, MapPin } from 'lucide-react';

interface TimeSlot {
  id: string;
  time: string;
  label: string;
}

interface PreviewFixture {
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  match_time?: string;
  court_number?: number;
  matchday_number?: number;
  home_team?: {
    id: string;
    name: string;
    team_color?: string;
  };
  away_team?: {
    id: string;
    name: string;
    team_color?: string;
  };
}

interface PreviewData {
  fixtures: PreviewFixture[];
  matchdays: number;
  time_slots?: TimeSlot[];
}

interface FixturePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: PreviewData | null;
}

export default function FixturePreviewModal({
  isOpen,
  onClose,
  previewData
}: FixturePreviewModalProps) {
  if (!isOpen || !previewData) return null;

  // Group fixtures by matchday
  const fixturesByMatchday: { [key: number]: PreviewFixture[] } = {};
  previewData.fixtures.forEach(fixture => {
    const matchday = fixture.matchday_number || 0;
    if (!fixturesByMatchday[matchday]) {
      fixturesByMatchday[matchday] = [];
    }
    fixturesByMatchday[matchday].push(fixture);
  });

  const sortedMatchdays = Object.keys(fixturesByMatchday)
    .map(Number)
    .sort((a, b) => a - b);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    // timeString can be HH:MM or HH:MM:SS
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCourtLabel = (courtNumber?: number) => {
    if (!courtNumber) return '';
    return `Court ${courtNumber}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Fixture Preview</h2>
            <p className="text-sm text-gray-400 mt-1">
              {previewData.fixtures.length} matches across {previewData.matchdays} matchdays
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {sortedMatchdays.map(matchdayNum => {
              const matchdayFixtures = fixturesByMatchday[matchdayNum];
              // Get unique dates for this matchday
              const dates = [...new Set(matchdayFixtures.map(f => f.match_date))];

              return (
                <div key={matchdayNum} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Matchday {matchdayNum}
                  </h3>

                  {dates.map(date => {
                    const dateFixtures = matchdayFixtures.filter(f => f.match_date === date);

                    return (
                      <div key={date} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-300">
                            {formatDate(date)}
                          </span>
                        </div>

                        <div className="space-y-2 ml-6">
                          {dateFixtures.map((fixture, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-900 border border-gray-700 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between">
                                {/* Court Badge */}
                                {fixture.court_number && (
                                  <div className="flex-shrink-0 mr-3">
                                    <div className="bg-purple-900/30 border border-purple-700/50 rounded px-2 py-1">
                                      <span className="text-xs font-semibold text-purple-300">
                                        Court {fixture.court_number}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Teams */}
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex items-center gap-2 flex-1">
                                    <div
                                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: fixture.home_team?.team_color || '#374151'
                                      }}
                                    >
                                      <span className="text-white text-sm font-bold">
                                        {fixture.home_team?.name?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                    </div>
                                    <span className="text-white font-medium text-sm truncate">
                                      {fixture.home_team?.name || 'Home Team'}
                                    </span>
                                  </div>

                                  <span className="text-gray-500 text-sm font-medium px-2">vs</span>

                                  <div className="flex items-center gap-2 flex-1">
                                    <div
                                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: fixture.away_team?.team_color || '#374151'
                                      }}
                                    >
                                      <span className="text-white text-sm font-bold">
                                        {fixture.away_team?.name?.charAt(0).toUpperCase() || '?'}
                                      </span>
                                    </div>
                                    <span className="text-white font-medium text-sm truncate">
                                      {fixture.away_team?.name || 'Away Team'}
                                    </span>
                                  </div>
                                </div>

                                {/* Time */}
                                {fixture.match_time && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400 ml-4">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(fixture.match_time)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            This is a preview. No fixtures will be saved until you click "Generate Fixtures".
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
