-- KujiHub 초기 스키마

CREATE TABLE IF NOT EXISTS kujis (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  price       INTEGER NOT NULL,
  board_size  INTEGER NOT NULL DEFAULT 80,
  status      TEXT NOT NULL DEFAULT 'active', -- active | sold_out | draft
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kuji_prizes (
  id            SERIAL PRIMARY KEY,
  kuji_id       INTEGER NOT NULL REFERENCES kujis(id) ON DELETE CASCADE,
  grade         TEXT NOT NULL,
  name          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#718096',
  chance        NUMERIC(5,4) NOT NULL,  -- 누적 확률 (0.0 ~ 1.0)
  display_order INTEGER NOT NULL DEFAULT 0
);

-- 상태가 있는 슬롯만 저장 (available 은 행 없음)
CREATE TABLE IF NOT EXISTS kuji_slots (
  kuji_id        INTEGER NOT NULL REFERENCES kujis(id) ON DELETE CASCADE,
  slot_number    INTEGER NOT NULL,
  status         TEXT NOT NULL,              -- locked | drawn
  grade          TEXT,
  grade_name     TEXT,
  grade_color    TEXT,
  locked_at      TIMESTAMPTZ,
  locked_user_id TEXT,
  completed_at   TIMESTAMPTZ,
  PRIMARY KEY (kuji_id, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_kuji_slots_kuji_id ON kuji_slots(kuji_id);

-- ── 시드 데이터 ────────────────────────────────────────────────

INSERT INTO kujis (title, description, price, board_size, status) VALUES
  ('원피스 - 새로운 시대의 서막',     'A상 루피 피규어 포함 80종의 풍부한 라인업', 12000, 80, 'active'),
  ('드래곤볼 EX - 천하제일무술대회',  'B상 무천도사 피규어 절찬 판매중',           13000, 80, 'active'),
  ('스파이 패밀리 - Mission Complete', '아냐 피규어는 벌써 매진 임박!',            11000, 80, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO kuji_prizes (kuji_id, grade, name, color, chance, display_order) VALUES
  (1, 'A', '킹 오브 아티스트 루피',   '#FFD700', 0.04, 1),
  (1, 'B', '배틀 레코드 조로',         '#C0C0C0', 0.12, 2),
  (1, 'C', '컬렉션 비주얼 보드',       '#FF3B30', 0.34, 3),
  (1, 'D', '러버 코스터',              '#4A90E2', 0.64, 4),
  (1, 'E', '클리어 파일 세트',         '#718096', 1.00, 5),

  (2, 'A', '드래곤볼 슈퍼 피규어',     '#FFD700', 0.04, 1),
  (2, 'B', '무천도사 피규어',           '#C0C0C0', 0.12, 2),
  (2, 'C', '배틀 씬 아크릴',           '#FF3B30', 0.34, 3),
  (2, 'D', '캐릭터 뱃지 세트',         '#4A90E2', 0.64, 4),
  (2, 'E', '클리어 파일',              '#718096', 1.00, 5),

  (3, 'A', '아냐 특제 피규어',          '#FFD700', 0.04, 1),
  (3, 'B', '로이드 포저 피규어',        '#C0C0C0', 0.12, 2),
  (3, 'C', '요르 포저 아크릴',          '#FF3B30', 0.34, 3),
  (3, 'D', '스파이 패밀리 뱃지',        '#4A90E2', 0.64, 4),
  (3, 'E', '미션 파일 세트',            '#718096', 1.00, 5)
ON CONFLICT DO NOTHING;
