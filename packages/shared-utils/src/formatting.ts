export const formatScore = (homeScore?: number, awayScore?: number) => {
  if (homeScore === undefined || awayScore === undefined) {
    return 'vs';
  }
  return `${homeScore} - ${awayScore}`;
};

export const formatPlayerName = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return 'Unknown Player';
  if (!lastName) return firstName;
  if (!firstName) return lastName;
  return `${firstName} ${lastName}`;
};