-- Update existing leagues to match requirements
UPDATE leagues SET 
  name = 'League1',
  description = 'Professional football league - Division 1'
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE leagues SET 
  name = 'LaLiga',
  description = 'Spanish professional football league'
WHERE id = '550e8400-e29b-41d4-a716-446655440002';