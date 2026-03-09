-- 사용자 프로필
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE NOT NULL,
  height NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  body_fat NUMERIC,
  muscle_mass NUMERIC,
  activity_level TEXT NOT NULL DEFAULT 'sedentary',
  job_type TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 건강 상태
CREATE TABLE user_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  dietary_preference TEXT DEFAULT 'none',
  meals_per_day INTEGER DEFAULT 3,
  disliked_foods TEXT[] DEFAULT '{}',
  preferred_foods TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 선호
CREATE TABLE user_exercise_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  currently_exercising BOOLEAN DEFAULT FALSE,
  preferred_types TEXT[] DEFAULT '{}',
  weekly_frequency INTEGER DEFAULT 3,
  available_minutes INTEGER DEFAULT 60,
  equipment TEXT DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 목표
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_weight NUMERIC NOT NULL,
  target_body_fat NUMERIC,
  target_period_months INTEGER NOT NULL,
  pace TEXT DEFAULT 'moderate',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 식단 플랜
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meals JSONB NOT NULL,
  total_macros JSONB NOT NULL,
  target_calories NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 플랜
CREATE TABLE exercise_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  exercises JSONB NOT NULL,
  total_duration_minutes INTEGER,
  estimated_calories_burned NUMERIC,
  difficulty TEXT DEFAULT 'beginner',
  is_rest_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 식사 기록
CREATE TABLE diet_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  amount TEXT,
  macros JSONB NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 기록
CREATE TABLE exercise_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_name TEXT NOT NULL,
  category TEXT,
  sets INTEGER,
  reps INTEGER,
  weight NUMERIC,
  duration_minutes INTEGER,
  heart_rate INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 체중 기록
CREATE TABLE weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  body_fat NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_diet_plans_user_date ON diet_plans(user_id, date);
CREATE INDEX idx_exercise_plans_user_date ON exercise_plans(user_id, date);
CREATE INDEX idx_diet_records_user_date ON diet_records(user_id, date);
CREATE INDEX idx_exercise_records_user_date ON exercise_records(user_id, date);
CREATE INDEX idx_weight_records_user_date ON weight_records(user_id, date);
