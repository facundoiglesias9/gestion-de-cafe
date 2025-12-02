CREATE TABLE IF NOT EXISTS transactions (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    type text not null check (type in ('income', 'expense')),
    amount numeric not null,
    description text not null,
    category text,
    related_id uuid
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transactions FOR DELETE USING (true);
