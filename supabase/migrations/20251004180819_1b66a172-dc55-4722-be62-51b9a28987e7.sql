-- Update the check constraint on mentorship_requests to allow 'completed' status
ALTER TABLE mentorship_requests 
DROP CONSTRAINT IF EXISTS mentorship_requests_status_check;

ALTER TABLE mentorship_requests 
ADD CONSTRAINT mentorship_requests_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'));