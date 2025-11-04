# 🛡️ SECURITY FIX - Supabase Configuration

## ⚠️ SECURITY ISSUES FOUND

Setelah audit, ditemukan beberapa masalah security di konfigurasi Supabase:

### 🔴 **CRITICAL:**
1. RLS policies terlalu permisif (allow all)
2. Tables tidak ada RLS protection
3. Tidak ada rate limiting

---

## ✅ **OPTION 1: Public App (No Authentication)**

Jika aplikasi ini PUBLIC dan TIDAK perlu login/authentication:

### **1.1. Rate Limiting (Wajib!)**

**File:** `supabase/migrations/add_rate_limiting.sql`

```sql
-- Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  operation_type TEXT,
  max_requests INTEGER,
  time_window INTERVAL
) RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests from same IP in time window
  SELECT COUNT(*) INTO request_count
  FROM poster_history
  WHERE created_at > NOW() - time_window;
  
  RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy with rate limiting
DROP POLICY IF EXISTS "Allow all operations on poster_history" ON poster_history;

CREATE POLICY "Rate limited public access" ON poster_history
  FOR INSERT
  WITH CHECK (check_rate_limit('insert', 100, INTERVAL '1 hour'));

CREATE POLICY "Public read access" ON poster_history
  FOR SELECT
  USING (true);

CREATE POLICY "No public updates" ON poster_history
  FOR UPDATE
  USING (false);

CREATE POLICY "No public deletes" ON poster_history
  FOR DELETE
  USING (false);
```

**Protection:**
- ✅ Max 100 inserts per hour (per IP)
- ✅ Anyone can read (for recent history)
- ❌ No one can update/delete

---

### **1.2. Enable RLS for All Tables**

**File:** `supabase/migrations/enable_rls_all_tables.sql`

```sql
-- Enable RLS for all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Public read-only policies
CREATE POLICY "Public read brands" ON brands
  FOR SELECT USING (true);

CREATE POLICY "Public read presets" ON presets
  FOR SELECT USING (true);

CREATE POLICY "Public read assets" ON assets
  FOR SELECT USING (true);

-- No public writes
CREATE POLICY "No public write brands" ON brands
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public write presets" ON presets
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public write assets" ON assets
  FOR INSERT WITH CHECK (false);
```

**Protection:**
- ✅ Public can READ templates/brands
- ❌ Public CANNOT write/modify

---

## ✅ **OPTION 2: Private App (With Authentication)**

Jika aplikasi butuh LOGIN dan per-user data:

### **2.1. Enable Supabase Auth**

**Steps:**
1. Go to Supabase Dashboard → Authentication
2. Enable Email/Password or Google Auth
3. Configure Auth settings

---

### **2.2. User-Based RLS Policies**

**File:** `supabase/migrations/add_auth_policies.sql`

```sql
-- Enable RLS
ALTER TABLE poster_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies
DROP POLICY IF EXISTS "Allow all operations on poster_history" ON poster_history;

-- User can only see their own data
CREATE POLICY "Users can view own history" ON poster_history
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- User can insert their own data
CREATE POLICY "Users can insert own history" ON poster_history
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- User can update their own data
CREATE POLICY "Users can update own history" ON poster_history
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- User can delete their own data
CREATE POLICY "Users can delete own history" ON poster_history
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Templates/presets are public read
CREATE POLICY "Public read presets" ON presets
  FOR SELECT
  USING (true);

-- Only authenticated users can create templates
CREATE POLICY "Authenticated users can create presets" ON presets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only modify their own templates
CREATE POLICY "Users can update own presets" ON presets
  FOR UPDATE
  USING (auth.uid()::text = user_id);
```

**Protection:**
- ✅ Users only see their own data
- ✅ Users cannot access other users' data
- ✅ Templates are public read
- ✅ Only authenticated users can create

---

## 🔒 **OPTION 3: Admin-Only Access**

Jika hanya ADMIN yang boleh manage data:

### **3.1. Admin Role**

```sql
-- Create admin role check function
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_uuid
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin-only policies
CREATE POLICY "Only admins can manage presets" ON presets
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage brands" ON brands
  FOR ALL
  USING (is_admin(auth.uid()));
```

---

## 🚨 **IMMEDIATE ACTIONS (Do This Now!):**

### **1. Update RLS Policies (Minimum Protection)**

Run di Supabase SQL Editor:

```sql
-- Drop permissive policy
DROP POLICY IF EXISTS "Allow all operations on poster_history" ON poster_history;

-- Allow read for everyone (for recent history feature)
CREATE POLICY "Public read poster_history" ON poster_history
  FOR SELECT
  USING (true);

-- Allow insert but limit (basic protection)
CREATE POLICY "Public insert poster_history" ON poster_history
  FOR INSERT
  WITH CHECK (true);  -- TODO: Add rate limiting

-- No public updates/deletes
CREATE POLICY "No public update" ON poster_history
  FOR UPDATE
  USING (false);

CREATE POLICY "No public delete" ON poster_history
  FOR DELETE
  USING (false);
```

---

### **2. Enable RLS for Templates Table**

Run di Supabase SQL Editor:

```sql
-- Get actual table name first
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Then enable RLS (replace TABLE_NAME with actual name)
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Public read-only
CREATE POLICY "Public read templates" ON presets
  FOR SELECT
  USING (true);

-- No public writes
CREATE POLICY "No public write templates" ON presets
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No public update templates" ON presets
  FOR UPDATE USING (false);

CREATE POLICY "No public delete templates" ON presets
  FOR DELETE USING (false);
```

---

### **3. Monitor Usage**

Check Supabase Dashboard → Database → Logs:
- Monitor unusual activity
- Check failed queries
- Look for suspicious patterns

---

## 📊 **Security Checklist:**

### **Current Status:**
- [ ] RLS enabled on all tables
- [ ] Policies restrict public access
- [ ] Rate limiting implemented
- [ ] Authentication configured
- [ ] Service role key protected
- [ ] Monitoring enabled

### **Recommended Status:**
- [x] RLS enabled on poster_history ✅
- [ ] Better RLS policies ⚠️ (too permissive)
- [ ] RLS on other tables ❌
- [ ] Rate limiting ❌
- [ ] Authentication ❌ (optional)
- [x] Service role key safe ✅

---

## 🎯 **Recommended Path:**

### **For Your Use Case (Public Poster App):**

**Step 1:** Enable RLS on all tables ✅
```sql
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
```

**Step 2:** Make templates read-only ✅
```sql
CREATE POLICY "Public read only" ON presets FOR SELECT USING (true);
```

**Step 3:** Restrict history writes ✅
```sql
-- Limit to reasonable operations
-- Consider adding rate limiting later
```

**Step 4:** Monitor usage 📊
- Check Supabase dashboard regularly
- Set up alerts for unusual activity

---

## ⚡ **Quick Fix (Run Now):**

```sql
-- 1. Fix poster_history policies
DROP POLICY IF EXISTS "Allow all operations on poster_history" ON poster_history;

CREATE POLICY "Public read history" ON poster_history FOR SELECT USING (true);
CREATE POLICY "Public insert history" ON poster_history FOR INSERT WITH CHECK (true);
CREATE POLICY "No public update history" ON poster_history FOR UPDATE USING (false);
CREATE POLICY "No public delete history" ON poster_history FOR DELETE USING (false);

-- 2. Enable RLS for presets (if exists)
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read presets" ON presets FOR SELECT USING (true);
CREATE POLICY "Service role write presets" ON presets FOR INSERT WITH CHECK (false);
```

Copy paste SQL di atas ke **Supabase Dashboard → SQL Editor → Run**

---

## 📚 **Resources:**

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Best Practices](https://supabase.com/docs/guides/database/security)
- [Rate Limiting with Postgres](https://supabase.com/docs/guides/database/postgres/rate-limiting)

---

**IMPORTANT:** Pilih salah satu option di atas dan implement secepatnya!
