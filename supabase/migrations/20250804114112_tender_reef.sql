-- Supprimer toutes les politiques SELECT existantes sur la table users pour éviter les conflits
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Organization owners can view members of their organization" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view all users" ON public.users;

-- Supprimer toutes les politiques SELECT existantes sur la table sessions pour éviter les conflits
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Organization owners can view all sessions of their organization members" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions and organization members sess" ON public.sessions;

-- Créer une seule politique SELECT simple pour la table users
-- Cette politique permet aux utilisateurs authentifiés de voir leur propre profil
-- et les profils des autres utilisateurs de la même organisation
CREATE POLICY "Users can view profiles in their organization"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur peut voir son propre profil
  id = auth.uid()
  OR
  -- L'utilisateur peut voir les profils des autres membres de son organisation
  (
    organization_id IS NOT NULL 
    AND organization_id = (
      SELECT u.organization_id 
      FROM auth.users au
      JOIN public.users u ON au.id = u.id
      WHERE au.id = auth.uid()
    )
  )
);

-- Créer une seule politique SELECT simple pour la table sessions
-- Cette politique permet aux utilisateurs de voir leurs propres sessions
-- et aux propriétaires d'organisation de voir les sessions de leur organisation
CREATE POLICY "Users can view sessions in their organization"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur peut voir ses propres sessions
  user_id = auth.uid()
  OR
  -- Les propriétaires d'organisation peuvent voir toutes les sessions de leur organisation
  EXISTS (
    SELECT 1
    FROM auth.users au
    JOIN public.users owner_u ON au.id = owner_u.id
    JOIN public.users member_u ON owner_u.organization_id = member_u.organization_id
    WHERE au.id = auth.uid()
    AND owner_u.organization_role = 'owner'
    AND member_u.id = sessions.user_id
  )
);