CREATE TABLE IF NOT EXISTS store_settings (
    id bigint primary key generated always as identity,
    store_name text not null default 'Café Manager',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default row if not exists
INSERT INTO store_settings (store_name)
SELECT 'Café Manager'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- Enable RLS (optional but good practice, though we might need policies)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Policy for reading (public)
CREATE POLICY "Enable read access for all users" ON store_settings FOR SELECT USING (true);

-- Policy for update (public for now for simplicity, or authenticated)
CREATE POLICY "Enable update for all users" ON store_settings FOR UPDATE USING (true);
