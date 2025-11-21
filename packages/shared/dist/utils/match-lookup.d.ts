/**
 * Looks up a match by either UUID or sequential match number
 * Supports backward compatibility with UUID links and new sequential ID links
 */
export declare function findMatchByIdOrNumber(matchIdOrNumber: string): Promise<any>;
/**
 * Looks up a match for score updates (includes team captain info)
 */
export declare function findMatchForScoreUpdate(matchIdOrNumber: string): Promise<any>;
//# sourceMappingURL=match-lookup.d.ts.map