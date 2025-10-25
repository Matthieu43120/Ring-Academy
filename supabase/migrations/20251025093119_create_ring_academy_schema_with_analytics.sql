/*
  # Ring Academy Complete Schema with Enhanced Analytics

  1. New Tables
    - `organizations` - Organizations for group training
      - `id` (uuid, primary key)
      - `name` (text) - Organization name
      - `code` (text, unique) - Invitation code
      - `credits` (integer) - Available credits
      - `simulations_used` (integer) - Simulations used since last credit
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `users` - User profiles linked to Supabase Auth
      - `id` (uuid, primary key, references auth.users)
      - `first_name` (text) - First name
      - `last_name` (text) - Last name
      - `email` (text, unique) - Email
      - `phone` (text, nullable) - Phone number
      - `credits` (integer) - Personal credits
      - `simulations_left` (integer) - Remaining simulations
      - `organization_id` (uuid, nullable) - Reference to organization
      - `organization_role` (text, nullable) - Role in organization (owner/member)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `training_sessions` - Training session records with enhanced analytics
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to user
      - `target` (text) - Prospect type (secretary, hr, manager, sales)
      - `difficulty` (text) - Difficulty level (easy, medium, hard)
      - `score` (integer) - Overall score 0-100
      - `duration` (integer) - Duration in seconds
      - `feedback` (text[]) - Positive points (strengths)
      - `recommendations` (text[]) - Recommendations for improvement
      - `improvements` (text[]) - Areas to improve
      - `detailed_analysis` (text) - Detailed feedback from AI
      - `criteria_scores` (jsonb) - Detailed scores by criteria {accroche, ecoute, objections, clarte, conclusion}
      - `recurrent_errors` (text[]) - Recurrent errors detected by AI
      - `main_objective` (text) - Evaluation of main objective achievement
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Restrictive policies for data access
    - Users can only access their own data unless in same organization

  3. Indexes
    - Optimized indexes for frequent queries
    - GIN indexes for JSONB and array fields
*/

-- Function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================
-- ORGANIZATIONS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  credits integer DEFAULT 0 NOT NULL,
  simulations_used integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(code);

-- ====================
-- USERS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text DEFAULT NULL,
  credits integer DEFAULT 3 NOT NULL,
  simulations_left integer DEFAULT 1 NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  organization_role text DEFAULT NULL CHECK (organization_role IN ('owner', 'member', NULL)),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_role ON users(organization_role);

-- ====================
-- TRAINING_SESSIONS TABLE
-- ====================
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  target text NOT NULL CHECK (target IN ('secretary', 'hr', 'manager', 'sales')),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  duration integer NOT NULL CHECK (duration >= 0),
  feedback text[] DEFAULT '{}' NOT NULL,
  recommendations text[] DEFAULT '{}' NOT NULL,
  improvements text[] DEFAULT '{}' NOT NULL,
  detailed_analysis text DEFAULT NULL,
  criteria_scores jsonb DEFAULT NULL,
  recurrent_errors text[] DEFAULT NULL,
  main_objective text DEFAULT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_created_at ON training_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_sessions_score ON training_sessions(score);
CREATE INDEX IF NOT EXISTS idx_training_sessions_criteria_scores ON training_sessions USING GIN (criteria_scores);
CREATE INDEX IF NOT EXISTS idx_training_sessions_recurrent_errors ON training_sessions USING GIN (recurrent_errors);

-- ====================
-- RLS POLICIES - ORGANIZATIONS
-- ====================

CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Organization owners can update their organization"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_role = 'owner'
    )
  );

-- ====================
-- RLS POLICIES - USERS
-- ====================

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL 
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Organization owners can update member profiles"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_role = 'owner'
    )
  );

CREATE POLICY "Organization owners can remove members"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND organization_role = 'owner'
    )
    AND id != auth.uid()
  );

-- ====================
-- RLS POLICIES - TRAINING_SESSIONS
-- ====================

CREATE POLICY "Users can view their own sessions"
  ON training_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organization owners can view all organization sessions"
  ON training_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT u.id FROM users u
      WHERE u.organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() AND organization_role = 'owner'
      )
    )
  );

CREATE POLICY "Users can create their own sessions"
  ON training_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON training_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());