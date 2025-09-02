/*
  # Création des tables pour Ring Academy

  1. Nouvelles Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, nom de l'entreprise)
      - `code` (text, unique, code d'invitation)
      - `credits` (integer, crédits disponibles)
      - `calls_used` (integer, appels utilisés)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `users`
      - `id` (uuid, primary key)
      - `first_name` (text, prénom)
      - `last_name` (text, nom)
      - `email` (text, unique)
      - `password` (text, mot de passe)
      - `role` (text, 'manager' ou 'user')
      - `company_id` (uuid, référence vers companies)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence vers users)
      - `target` (text, type de prospect)
      - `difficulty` (text, niveau de difficulté)
      - `score` (integer, score obtenu)
      - `duration` (integer, durée en secondes)
      - `feedback` (text[], points positifs)
      - `recommendations` (text[], recommandations)
      - `improvements` (text[], axes d'amélioration)
      - `detailed_analysis` (text, analyse détaillée)
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques d'accès appropriées pour chaque table

  3. Index et triggers
    - Index sur les colonnes fréquemment utilisées
    - Triggers pour updated_at automatique
*/

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  credits integer DEFAULT 0 NOT NULL,
  calls_used integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS sur companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Trigger pour updated_at sur companies
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les recherches par code
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'user')),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS sur users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Trigger pour updated_at sur users
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Table sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  target text NOT NULL,
  difficulty text NOT NULL,
  score integer NOT NULL,
  duration integer NOT NULL,
  feedback text[] DEFAULT '{}' NOT NULL,
  recommendations text[] DEFAULT '{}' NOT NULL,
  improvements text[] DEFAULT '{}' NOT NULL,
  detailed_analysis text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS sur sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- Politiques RLS pour companies
CREATE POLICY "Utilisateurs authentifiés peuvent lire les entreprises"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Utilisateurs authentifiés peuvent créer des entreprises"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers peuvent modifier leur entreprise"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.company_id = companies.id 
      AND users.role = 'manager'
    )
  );

-- Politiques RLS pour users
CREATE POLICY "Utilisateurs peuvent lire les profils de leur entreprise"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Utilisateurs authentifiés peuvent créer des comptes"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Utilisateurs peuvent modifier leur propre profil"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Managers peuvent supprimer les utilisateurs de leur entreprise"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() AND role = 'manager'
    )
    AND id != auth.uid()
  );

-- Politiques RLS pour sessions
CREATE POLICY "Utilisateurs peuvent lire leurs propres sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers peuvent lire les sessions de leur entreprise"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT u1.id FROM users u1
      JOIN users u2 ON u1.company_id = u2.company_id
      WHERE u2.id = auth.uid() AND u2.role = 'manager'
    )
  );

CREATE POLICY "Utilisateurs peuvent créer leurs propres sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Utilisateurs peuvent modifier leurs propres sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());