INSERT INTO activities (name, icon)
VALUES
  ('Lavar louça', '🍽️'),
  ('Passear com o cachorro', '🐕'),
  ('Arrumar a cama', '🛏️'),
  ('Tirar o lixo', '🗑️'),
  ('Fazer compras', '🛒')
ON CONFLICT DO NOTHING;
