-- Create notifications system for player activity updates
-- This migration creates a notifications table to track events like league approvals

-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'league_request_approved',
  'league_request_rejected', 
  'team_joined_league',
  'team_left_league',
  'match_scheduled',
  'match_result'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_title_length CHECK (LENGTH(title) > 0),
  CONSTRAINT valid_message_length CHECK (LENGTH(message) > 0)
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET read = TRUE 
  WHERE id = p_notification_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notifications when team league requests are approved/rejected
CREATE OR REPLACE FUNCTION notify_league_request_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status changes to approved or rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    -- Get team captain to notify
    DECLARE
      v_captain_id UUID;
      v_team_name TEXT;
      v_league_name TEXT;
      v_title TEXT;
      v_message TEXT;
    BEGIN
      -- Get team and league details
      SELECT t.captain_id, t.name INTO v_captain_id, v_team_name
      FROM teams t WHERE t.id = NEW.team_id;
      
      SELECT l.name INTO v_league_name
      FROM leagues l WHERE l.id = NEW.league_id;
      
      -- Create notification based on status
      IF NEW.status = 'approved' THEN
        v_title := 'League Request Approved! 🎉';
        v_message := v_team_name || ' has been approved to join ' || v_league_name || '.';
        IF NEW.review_message IS NOT NULL THEN
          v_message := v_message || ' Admin message: "' || NEW.review_message || '"';
        END IF;
        
        -- Create approval notification
        PERFORM create_notification(
          v_captain_id,
          'league_request_approved'::notification_type,
          v_title,
          v_message,
          jsonb_build_object(
            'team_id', NEW.team_id,
            'team_name', v_team_name,
            'league_id', NEW.league_id,
            'league_name', v_league_name,
            'request_id', NEW.id
          )
        );
        
        -- Also create team joined league notification
        PERFORM create_notification(
          v_captain_id,
          'team_joined_league'::notification_type,
          'Team Joined League! ⚽',
          v_team_name || ' is now competing in ' || v_league_name || '. Good luck!',
          jsonb_build_object(
            'team_id', NEW.team_id,
            'team_name', v_team_name,
            'league_id', NEW.league_id,
            'league_name', v_league_name
          )
        );
        
      ELSIF NEW.status = 'rejected' THEN
        v_title := 'League Request Update 📝';
        v_message := 'Your request for ' || v_team_name || ' to join ' || v_league_name || ' was not approved.';
        IF NEW.review_message IS NOT NULL THEN
          v_message := v_message || ' Admin feedback: "' || NEW.review_message || '"';
        END IF;
        
        -- Create rejection notification
        PERFORM create_notification(
          v_captain_id,
          'league_request_rejected'::notification_type,
          v_title,
          v_message,
          jsonb_build_object(
            'team_id', NEW.team_id,
            'team_name', v_team_name,
            'league_id', NEW.league_id,
            'league_name', v_league_name,
            'request_id', NEW.id
          )
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on team_league_requests
CREATE TRIGGER trigger_notify_league_request_status
  AFTER UPDATE ON team_league_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_league_request_status();

-- Add some sample data cleanup
COMMENT ON TABLE notifications IS 'Player notifications for league activities, team updates, and match events';