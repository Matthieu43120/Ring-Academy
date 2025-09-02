/*
  # Create consume_organization_simulation RPC Function

  1. New Functions
    - `consume_organization_simulation(p_organization_id)` - Safely consumes a simulation for an organization
  
  2. Security
    - Function uses security definer to bypass RLS for the specific operation
    - Includes validation to ensure only organization members can consume simulations
    - Implements proper credit consumption logic (1 credit per 3 simulations)
    - Prevents unauthorized access and manipulation
*/

-- Create function to safely consume a simulation for an organization
CREATE OR REPLACE FUNCTION consume_organization_simulation(p_organization_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_simulations_used INTEGER;
  current_credits INTEGER;
  user_org_id UUID;
  user_org_role TEXT;
BEGIN
  -- 1. Vérifier si l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Accès non autorisé: l''utilisateur doit être authentifié.';
  END IF;

  -- 2. Récupérer les détails de l'organisation de l'utilisateur
  SELECT organization_id, organization_role
  INTO user_org_id, user_org_role
  FROM public.users
  WHERE id = auth.uid();

  -- 3. Valider que l'utilisateur est bien membre de l'organisation spécifiée
  IF user_org_id IS NULL OR user_org_id != p_organization_id OR user_org_role IS NULL THEN
    RAISE EXCEPTION 'Accès non autorisé: l''utilisateur n''est pas membre de cette organisation.';
  END IF;

  -- 4. Récupérer les crédits et simulations_used actuels de l'organisation
  SELECT credits, simulations_used
  INTO current_credits, current_simulations_used
  FROM public.organizations
  WHERE id = p_organization_id;

  -- 5. Vérifier si l'organisation existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organisation non trouvée.';
  END IF;

  -- 6. Appliquer la logique de consommation de simulation
  current_simulations_used := current_simulations_used + 1;

  IF current_simulations_used >= 3 THEN
    IF current_credits <= 0 THEN
      RAISE EXCEPTION 'L''organisation n''a plus de crédits disponibles.';
    END IF;
    current_credits := current_credits - 1;
    current_simulations_used := 0; -- Réinitialiser pour la prochaine consommation de crédit
  END IF;

  -- 7. Mettre à jour l'organisation
  UPDATE public.organizations
  SET
    credits = current_credits,
    simulations_used = current_simulations_used,
    updated_at = NOW()
  WHERE id = p_organization_id;

END;
$$;

-- Accorder les droits d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION consume_organization_simulation(UUID) TO authenticated;