/**
 * Basic Test to Verify Jest Setup
 */

describe('Basic Jest Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
  });

  it('should support async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});