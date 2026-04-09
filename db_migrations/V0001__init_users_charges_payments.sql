
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(64) NOT NULL DEFAULT md5('1111'),
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  is_first_login BOOLEAN NOT NULL DEFAULT true,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE charges (
  id SERIAL PRIMARY KEY,
  plot VARCHAR(20) NOT NULL,
  service VARCHAR(50) NOT NULL,
  period VARCHAR(30) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  plot VARCHAR(20) NOT NULL,
  service VARCHAR(50) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Администраторы
INSERT INTO users (login, password_hash, role, is_first_login) VALUES
  ('admin1', md5('admin1111'), 'admin', false),
  ('admin2', md5('admin1111'), 'admin', false);

-- Участки 1–57
INSERT INTO users (login) SELECT generate_series(1,57)::text;

-- Участки с буквами (58а, 1а, 1б, 2в и т.д. — пример набора)
INSERT INTO users (login) VALUES
  ('1a'),('1b'),('2v'),('58a'),('58b'),('59');
