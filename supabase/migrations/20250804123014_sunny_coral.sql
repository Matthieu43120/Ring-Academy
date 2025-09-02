@@ .. @@
 -- Table users
 CREATE TABLE IF NOT EXISTS users (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   first_name text NOT NULL,
   last_name text NOT NULL,
   email text UNIQUE NOT NULL,
-  password text NOT NULL,
-  role text NOT NULL CHECK (role IN ('manager', 'user')),
   company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
   created_at timestamptz DEFAULT now() NOT NULL,
   updated_at timestamptz DEFAULT now() NOT NULL
 );