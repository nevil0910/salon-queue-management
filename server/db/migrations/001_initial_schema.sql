CREATE TABLE salons (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  timezone text NOT NULL,
  currency_code char(3) NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE salon_settings (
  salon_id text PRIMARY KEY REFERENCES salons(id),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  localized_name jsonb NOT NULL,
  localized_description jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_minor_units integer NOT NULL CHECK (price_minor_units >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, id)
);

CREATE TABLE barbers (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  localized_name jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  availability text NOT NULL DEFAULT 'AVAILABLE'
    CHECK (availability IN ('AVAILABLE', 'ON_BREAK', 'UNAVAILABLE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, id)
);

CREATE TABLE staff_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id text NOT NULL REFERENCES salons(id),
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('OWNER', 'RECEPTION', 'BARBER')),
  barber_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, email),
  FOREIGN KEY (salon_id, barber_id) REFERENCES barbers(salon_id, id),
  CHECK ((role = 'BARBER' AND barber_id IS NOT NULL) OR (role <> 'BARBER' AND barber_id IS NULL))
);

CREATE TABLE operating_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id text NOT NULL REFERENCES salons(id),
  business_date date NOT NULL,
  next_token_sequence integer NOT NULL DEFAULT 1 CHECK (next_token_sequence > 0),
  next_queue_order bigint NOT NULL DEFAULT 1 CHECK (next_queue_order > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, business_date),
  UNIQUE (salon_id, id)
);

CREATE TABLE queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id text NOT NULL REFERENCES salons(id),
  operating_day_id uuid NOT NULL,
  token_sequence integer NOT NULL CHECK (token_sequence > 0),
  token text NOT NULL,
  queue_order bigint NOT NULL,
  customer_display_name text NOT NULL,
  phone_number text NOT NULL,
  normalized_phone text NOT NULL,
  barber_preference text NOT NULL CHECK (barber_preference IN ('ANY', 'SPECIFIC')),
  preferred_barber_id text,
  assigned_barber_id text,
  status text NOT NULL CHECK (status IN ('Waiting', 'Called', 'In Chair', 'Done', 'Cancelled', 'No-show')),
  source text NOT NULL CHECK (source IN ('ONLINE', 'WALK_IN')),
  status_link_token_hash text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  no_show_at timestamptz,
  cancellation_reason text,
  status_version integer NOT NULL DEFAULT 1,
  FOREIGN KEY (salon_id, operating_day_id) REFERENCES operating_days(salon_id, id),
  FOREIGN KEY (salon_id, preferred_barber_id) REFERENCES barbers(salon_id, id),
  FOREIGN KEY (salon_id, assigned_barber_id) REFERENCES barbers(salon_id, id),
  CHECK ((barber_preference = 'SPECIFIC' AND preferred_barber_id IS NOT NULL) OR
         (barber_preference = 'ANY' AND preferred_barber_id IS NULL)),
  CHECK ((status IN ('Called', 'In Chair', 'Done') AND assigned_barber_id IS NOT NULL) OR
         (status IN ('Waiting', 'Cancelled', 'No-show') AND assigned_barber_id IS NULL)),
  UNIQUE (operating_day_id, token_sequence),
  UNIQUE (operating_day_id, token),
  UNIQUE (operating_day_id, queue_order)
);

CREATE UNIQUE INDEX one_active_entry_per_phone_per_day
  ON queue_entries (operating_day_id, normalized_phone)
  WHERE status IN ('Waiting', 'Called', 'In Chair');

CREATE UNIQUE INDEX one_active_assignment_per_barber
  ON queue_entries (operating_day_id, assigned_barber_id)
  WHERE status IN ('Called', 'In Chair');

CREATE INDEX queue_entries_day_status_order
  ON queue_entries (operating_day_id, status, queue_order);

CREATE TABLE queue_entry_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id uuid NOT NULL REFERENCES queue_entries(id),
  service_id text NOT NULL,
  name_snapshot jsonb NOT NULL,
  price_minor_units_snapshot integer NOT NULL CHECK (price_minor_units_snapshot >= 0),
  duration_minutes_snapshot integer NOT NULL CHECK (duration_minutes_snapshot > 0),
  position integer NOT NULL CHECK (position >= 0),
  UNIQUE (queue_entry_id, position)
);

CREATE TABLE queue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id uuid NOT NULL REFERENCES queue_entries(id),
  from_status text,
  to_status text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('CUSTOMER', 'OWNER', 'RECEPTION', 'BARBER', 'SYSTEM')),
  actor_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX queue_events_entry_created ON queue_events (queue_entry_id, created_at);

CREATE TABLE barber_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id text NOT NULL REFERENCES barbers(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  started_by uuid REFERENCES staff_accounts(id),
  ended_by uuid REFERENCES staff_accounts(id),
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE UNIQUE INDEX one_open_break_per_barber ON barber_breaks (barber_id) WHERE ended_at IS NULL;

CREATE TABLE staff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_account_id uuid NOT NULL REFERENCES staff_accounts(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
