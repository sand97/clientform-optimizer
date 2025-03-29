-- Create a function to handle the invitation email trigger
CREATE OR REPLACE FUNCTION handle_invitation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function to send the email
  PERFORM net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/send-invitation-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('invitation', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS send_invitation_email_trigger ON invitations;
CREATE TRIGGER send_invitation_email_trigger
  AFTER INSERT ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_email(); 