-- Hostack Staff App v1 — PostgreSQL Schema
-- Run this in Supabase SQL Editor to set up the database

-- ─── STAFF TABLE ───────────────────────────────────────────────────
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL, -- References property in main system
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Manager', 'Housekeeper', 'Chef', 'Maintenance', etc.
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'deleted'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ─── SHIFT_TEMPLATES TABLE ────────────────────────────────────────
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  name TEXT NOT NULL, -- e.g. 'Morning Shift', 'Evening Shift'
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ─── CHECKLIST_TASKS TABLE ────────────────────────────────────────
CREATE TABLE checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  template_task_id UUID, -- References task template
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Service', 'Housekeeping', 'Maintenance', 'Safety', etc.
  estimated_minutes INT DEFAULT 30,
  due_time TIME,
  notes TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'escalated'
  photo_url TEXT,
  escalated_reason TEXT,
  escalated_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ─── INCIDENTS TABLE ───────────────────────────────────────────────
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'Maintenance', 'Safety', 'Guest Complaint', 'Other'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to UUID REFERENCES staff(id),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES staff(id),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ─── NOTIFICATIONS TABLE ──────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES checklist_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL, -- 'incident', 'escalation', 'assigned', 'update'
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- ─── INDEXES FOR PERFORMANCE ──────────────────────────────────────
CREATE INDEX idx_staff_property ON staff(property_id);
CREATE INDEX idx_checklist_staff ON checklist_tasks(staff_id);
CREATE INDEX idx_checklist_shift ON checklist_tasks(shift_id);
CREATE INDEX idx_checklist_status ON checklist_tasks(status);
CREATE INDEX idx_incidents_property ON incidents(property_id);
CREATE INDEX idx_incidents_staff ON incidents(staff_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_notifications_staff ON notifications(staff_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- ─── REALTIME SUBSCRIPTIONS ──────────────────────────────────────
-- Enable realtime for these tables in Supabase dashboard:
-- - checklist_tasks
-- - incidents
-- - notifications

-- ─── ROW LEVEL SECURITY (RLS) ────────────────────────────────────
-- Enable RLS on all tables, then add policies:
-- - Staff can only view/update their own data
-- - Managers can view all staff data for their property
-- - All data is scoped to property_id

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Staff can view their own record
CREATE POLICY "staff_view_own" ON staff
  FOR SELECT USING (auth.uid()::text = id::text);

-- Managers can view all staff at their property
CREATE POLICY "staff_view_property" ON staff
  FOR SELECT USING (property_id IN (
    SELECT property_id FROM staff WHERE id = auth.uid()::uuid AND role = 'Manager'
  ));

-- Checklist tasks filtered by staff
CREATE POLICY "tasks_view_own" ON checklist_tasks
  FOR SELECT USING (staff_id = auth.uid()::uuid);

-- Incidents visible to reporter and assigned manager
CREATE POLICY "incidents_view" ON incidents
  FOR SELECT USING (
    staff_id = auth.uid()::uuid OR
    assigned_to = auth.uid()::uuid OR
    role = 'Manager'
  );

-- Notifications visible to recipient
CREATE POLICY "notifications_view" ON notifications
  FOR SELECT USING (staff_id = auth.uid()::uuid);
