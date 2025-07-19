-- Create a function to get group payment analysis
CREATE OR REPLACE FUNCTION get_group_payment_analysis()
RETURNS TABLE (
  group_care TEXT,
  total_extracted_amount NUMERIC,
  payment_slip_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.group_care,
    COALESCE(SUM(ps.extracted_amount), 0) as total_extracted_amount,
    COUNT(ps.id) as payment_slip_count
  FROM seedcamp_people sp
  LEFT JOIN payment_slips ps ON sp.id = ps.person_id
  GROUP BY sp.group_care
  ORDER BY total_extracted_amount DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_group_payment_analysis() TO authenticated;
