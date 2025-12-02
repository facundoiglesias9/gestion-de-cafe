CREATE TABLE IF NOT EXISTS product_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON product_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON product_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON product_ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON product_ingredients FOR DELETE USING (true);
