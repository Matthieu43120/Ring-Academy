/*
  # Add Organization Credits RPC Function

  1. New Functions
    - `add_organization_credits(org_id, amount)` - Safely adds credits to an organization
  
  2. Security
    - Function uses security definer to bypass RLS for the specific operation
    - Includes validation to ensure only organization members/owners can add credits
    - Prevents negative credit amounts
*/

-- Create function to safely add credits to an organization
CREATE OR REPLACE FUNCTION add_organization_credits(
  org_id UUID,
  amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate that the amount is positive
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Le montant de crédits doit être positif';
  END IF;

  -- Validate that the current user is a member or owner of the organization
  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.organization_id = org_id
      AND u.organization_role IN ('member', 'owner')
  ) THEN
    RAISE EXCEPTION 'Vous n''êtes pas autorisé à modifier les crédits de cette organisation';
  END IF;

  -- Update the organization credits
  UPDATE public.organizations
  SET 
    credits = COALESCE(credits, 0) + amount,
    updated_at = NOW()
  WHERE id = org_id;

  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organisation non trouvée';
  END IF;
END;
$$;