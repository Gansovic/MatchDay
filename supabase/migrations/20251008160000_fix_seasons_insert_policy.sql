-- Fix Seasons RLS Policy for INSERT Operations
-- This migration adds a proper INSERT policy to allow authenticated users to create seasons

-- Drop the overly broad existing policy that doesn't properly handle INSERTs
DROP POLICY IF EXISTS "League admins can manage seasons" ON public.seasons;

-- Create separate policies for different operations

-- Allow everyone to view active seasons
CREATE POLICY "Anyone can view active seasons" ON public.seasons
    FOR SELECT
    USING (is_active = true);

-- Allow authenticated users to insert seasons
-- This matches the permissive behavior of the leagues table
CREATE POLICY "Authenticated users can create seasons" ON public.seasons
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Allow season creators to update their own seasons
CREATE POLICY "Season creators can update their seasons" ON public.seasons
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Allow season creators to delete their own seasons
CREATE POLICY "Season creators can delete their seasons" ON public.seasons
    FOR DELETE
    USING (created_by = auth.uid());

COMMENT ON POLICY "Authenticated users can create seasons" ON public.seasons IS
    'Allows any authenticated user to create seasons, matching the permissive behavior of leagues table';
