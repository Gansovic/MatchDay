export const formatScore = (homeScore, awayScore) => {
    if (homeScore === undefined || awayScore === undefined) {
        return 'vs';
    }
    return `${homeScore} - ${awayScore}`;
};
export const formatPlayerName = (firstName, lastName) => {
    if (!firstName && !lastName)
        return 'Unknown Player';
    if (!lastName)
        return firstName;
    if (!firstName)
        return lastName;
    return `${firstName} ${lastName}`;
};
