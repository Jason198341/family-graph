-- ============================================================
-- Family Graph — 50가족 데모 시드 데이터
-- Supabase SQL Editor에서 실행
-- ============================================================

-- FK/트리거 일시 비활성 (직접 삽입용)
SET session_replication_role = 'replica';

DO $$
DECLARE
  -- ── 가족 이름 (50개) ──
  fnames text[] := ARRAY[
    '별빛 가족','해돋이 가족','무지개 가족','은하수 가족','햇살 가족',
    '달빛 가족','바다 가족','하늘 가족','꿈나무 가족','행복한 가족',
    '사랑 가족','희망 가족','웃음꽃 가족','아침이슬 가족','초록숲 가족',
    '구름다리 가족','보물섬 가족','반딧불 가족','꽃길 가족','산들바람 가족',
    '새벽별 가족','푸른하늘 가족','동화나라 가족','오솔길 가족','해바라기 가족',
    '소나기 가족','도토리 가족','민들레 가족','아이리스 가족','코스모스 가족',
    '라벤더 가족','올리브 가족','체리 가족','레몬 가족','피스타치오 가족',
    '카카오 가족','바닐라 가족','시나몬 가족','페퍼민트 가족','캐모마일 가족',
    '루바브 가족','자스민 가족','로즈마리 가족','세이지 가족','타임 가족',
    '바질 가족','오레가노 가족','딜 가족','커민 가족','사프란 가족'
  ];
  femojis text[] := ARRAY[
    '⭐','🌅','🌈','🌌','☀️','🌙','🌊','🦋','🌳','😊',
    '❤️','🌟','🌸','💧','🌿','☁️','🏝️','🪲','🌺','🍃',
    '✨','🦅','📚','🛤️','🌻','🌧️','🌰','🌼','💜','🌷',
    '💐','🫒','🍒','🍋','🥜','🍫','🍦','🫚','🌱','🍵',
    '🫐','🌹','🪴','🍂','⏰','🌿','🍕','🌾','🧂','🏵️'
  ];

  -- ── 아빠 이름 (50개) ──
  dads text[] := ARRAY[
    '김민수','이준호','박성민','최영호','정대현',
    '강지훈','조현우','윤서진','장동혁','임태우',
    '한상우','오재현','서민혁','신동우','권혁준',
    '황인호','안성준','송민기','전우진','류승환',
    '홍세준','고진우','문정훈','양승민','배준혁',
    '백찬호','허태민','남궁진','구자현','유동훈',
    '노경민','하성일','차민재','주영호','우진석',
    '탁승범','표재원','범석현','왕대호','마성진',
    '석준영','선우혁','제갈민','사공준','독고진',
    '남상우','방성민','피민혁','옥태현','빈준호'
  ];

  -- ── 엄마 이름 (50개) ──
  moms text[] := ARRAY[
    '김지연','이수진','박미영','최은주','정하나',
    '강서윤','조예진','윤미래','장소희','임채원',
    '한지민','오세영','서수현','신예지','권나영',
    '황보미','안소연','송채린','전혜진','류미선',
    '홍수빈','고은지','문서영','양해미','배지원',
    '백소영','허채연','남궁선','구민지','유서하',
    '노은채','하수민','차예린','주소연','우선미',
    '탁미진','표채원','범수진','왕은지','마서연',
    '석채린','선우빈','제갈은','사공미','독고연',
    '남은서','방미주','피수연','옥채원','빈지현'
  ];

  -- ── 아들 이름 (50개) ──
  sons text[] := ARRAY[
    '도윤','서준','시우','하준','지호',
    '주원','건우','예준','현우','준서',
    '민준','지한','도현','선우','유준',
    '승현','우진','재민','태윤','시현',
    '진우','연우','승우','은호','동현',
    '정우','수호','민성','원준','세준',
    '이준','한결','지율','은찬','규민',
    '찬영','태민','시원','재윤','지안',
    '현준','성민','재원','윤호','민규',
    '태현','도훈','승민','유찬','준혁'
  ];

  -- ── 딸 이름 (50개) ──
  girls text[] := ARRAY[
    '서연','서윤','지우','하은','서아',
    '하윤','지안','은서','수아','다은',
    '지유','채원','지윤','예은','수빈',
    '하린','소율','예린','지아','민서',
    '윤서','채은','서현','유진','시은',
    '예서','소은','다인','아린','서영',
    '이서','연우','나은','현서','유나',
    '미래','해인','소미','지현','채린',
    '하영','보은','민지','세은','가은',
    '다현','시연','예지','소연','나윤'
  ];

  -- ── 책 데이터 (40권) ──
  btitles text[] := ARRAY[
    '어린왕자','해리포터와 마법사의 돌','나미야 잡화점의 기적','아몬드','달러구트 꿈 백화점',
    '긴긴밤','마당을 나온 암탉','구름빵','엄마를 부탁해','82년생 김지영',
    '모모','나니아 연대기','꽃들에게 희망을','연금술사','멋진 신세계',
    '동물농장','갈매기의 꿈','채식주의자','소나기','운수 좋은 날',
    '데미안','시간을 파는 상점','비밀의 화원','빨간 머리 앤','오즈의 마법사',
    '톰 소여의 모험','보물섬','정글북','피노키오','이상한 나라의 앨리스',
    '피터 팬','로빈슨 크루소','걸리버 여행기','삼총사','레미제라블',
    '80일간의 세계 일주','해저 2만리','젊은 베르테르의 슬픔','앵무새 죽이기','위대한 개츠비'
  ];
  bauthors text[] := ARRAY[
    '생텍쥐페리','J.K. 롤링','히가시노 게이고','손원평','이미예',
    '루리','황선미','백희나','신경숙','조남주',
    '미하엘 엔데','C.S. 루이스','트리나 폴러스','파울로 코엘료','올더스 헉슬리',
    '조지 오웰','리처드 바크','한강','황순원','현진건',
    '헤르만 헤세','김선영','프랜시스 버넷','루시 모드 몽고메리','라이먼 프랭크 바움',
    '마크 트웨인','로버트 루이스 스티븐슨','러디어드 키플링','카를로 콜로디','루이스 캐럴',
    '제임스 매튜 배리','대니얼 디포','조나단 스위프트','알렉상드르 뒤마','빅토르 위고',
    '쥘 베른','쥘 베른','요한 볼프강 괴테','하퍼 리','F. 스콧 피츠제럴드'
  ];
  bpages int[] := ARRAY[
    120,320,400,264,300, 280,200,40,320,180,
    280,240,50,200,350,  140,120,250,30,25,
    240,280,320,400,260, 350,280,200,180,160,
    220,300,350,500,1200, 320,400,200,380,200
  ];
  bemojis text[] := ARRAY[
    '🌹','⚡','🏪','🧠','💤', '🌙','🐔','☁️','👩','👩‍💼',
    '⏰','🦁','🌸','✨','🔬', '🐷','🕊️','🥬','🌧️','🍀',
    '🦅','🕰️','🌿','👧','🌀', '🏴‍☠️','🗺️','🐯','🤥','🐰',
    '🧚','🏝️','🚢','⚔️','🕯️', '🌍','🐙','💔','🐦','🥂'
  ];

  -- ── 리뷰 템플릿 ──
  reviews text[] := ARRAY[
    '정말 감동적인 책이에요. 온 가족이 함께 읽으면 좋겠습니다.',
    '아이가 너무 좋아해서 매일 읽어달라고 해요! 강력 추천합니다.',
    '깊은 생각을 하게 만드는 좋은 책입니다. 토론거리가 풍부해요.',
    '재미있고 교훈적인 이야기. 아이와 함께 읽기 딱 좋아요!',
    '처음에는 어려웠지만 읽을수록 빠져들어요. 결말이 인상적입니다.',
    '우리 가족 올해의 책으로 선정했어요. 두고두고 다시 읽을 책.',
    '아이와 함께 토론하면서 읽기 좋은 책이에요. 시야가 넓어져요.',
    '문장이 아름답고 여운이 오래 남는 작품입니다. 필사하기 좋아요.',
    '짧지만 깊은 메시지가 담겨있어요. 한 번에 읽었습니다.',
    '번역이 잘 되어서 읽기 편했어요. 삽화도 예쁘고 아이가 좋아해요.',
    '가족 독서 모임에서 이 책으로 이야기꽃을 피웠어요.',
    '매일 잠자리에서 한 챕터씩 읽어주고 있어요. 아이가 기다려요.',
    '어른이 읽어도 배울 점이 많은 책. 세대를 초월하는 명작이네요.',
    '둘째 아이도 좋아해서 온 가족이 돌려가며 읽고 있습니다.',
    '독서 습관 들이기에 좋은 책이에요. 부담 없는 분량이 장점!'
  ];

  -- ── 추천 이유 템플릿 ──
  rec_reasons text[] := ARRAY[
    '우리 가족이 읽고 너무 좋았던 책이에요. 다른 가족들도 꼭 읽어보세요!',
    '아이의 상상력을 키워주는 최고의 책입니다. 적극 추천해요!',
    '가족끼리 대화 주제가 생겨서 좋았어요. 독서 후 토론 추천!',
    '올해 읽은 책 중 최고! 감동과 재미 두 마리 토끼를 잡았어요.',
    '초등학생부터 어른까지 누구나 즐길 수 있는 명작입니다.',
    '매일 조금씩 읽기 좋은 구성이에요. 독서 습관 만들기에 최적!',
    '읽고 나면 가족 사랑이 더 깊어지는 책이에요.',
    '서점에서 우연히 발견했는데 대박! 숨겨진 보석 같은 책.',
    '아이가 스스로 다 읽고 동생한테까지 추천하더라고요!',
    '부모님께도 선물했더니 좋아하셨어요. 전 세대 공감 가능!'
  ];

  -- ── 변수 ──
  fam_id uuid;
  p_id uuid;
  b_id uuid;
  person_arr uuid[];
  book_arr uuid[];
  fam_size int;
  k int;
  log_date date;
  colors text[] := ARRAY['#3b82f6','#ec4899','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#ef4444','#14b8a6'];

BEGIN

  FOR i IN 1..50 LOOP
    fam_id := gen_random_uuid();
    person_arr := ARRAY[]::uuid[];
    book_arr := ARRAY[]::uuid[];

    -- 가족 크기 결정: 2인 15, 3인 20, 4인 15
    IF i % 10 IN (1,2,3) THEN fam_size := 2;
    ELSIF i % 10 IN (4,5,6,7) THEN fam_size := 3;
    ELSE fam_size := 4;
    END IF;

    -- ── 가족 생성 ──
    INSERT INTO families (id, name, emoji, created_by, created_at)
    VALUES (fam_id, fnames[i], femojis[i], gen_random_uuid(),
            now() - ((random() * 80 + 10)::int) * interval '1 day');

    -- ── 아빠 ──
    p_id := gen_random_uuid();
    INSERT INTO persons (id, family_id, name, role, emoji, color, birth_year, goal_lines)
    VALUES (p_id, fam_id, dads[i], '아빠', '👨', '#3b82f6', 1975 + (i % 15), 50000 + (i * 500));
    person_arr := person_arr || p_id;

    -- ── 엄마 ──
    p_id := gen_random_uuid();
    INSERT INTO persons (id, family_id, name, role, emoji, color, birth_year, goal_lines)
    VALUES (p_id, fam_id, moms[i], '엄마', '👩', '#ec4899', 1978 + (i % 12), 45000 + (i * 400));
    person_arr := person_arr || p_id;

    -- ── 첫째 (3인, 4인 가족) ──
    IF fam_size >= 3 THEN
      p_id := gen_random_uuid();
      IF i % 2 = 0 THEN
        INSERT INTO persons (id, family_id, name, role, emoji, color, birth_year, goal_lines)
        VALUES (p_id, fam_id, sons[i], '아들', '👦', '#22c55e', 2008 + (i % 8), 30000);
      ELSE
        INSERT INTO persons (id, family_id, name, role, emoji, color, birth_year, goal_lines)
        VALUES (p_id, fam_id, girls[i], '딸', '👧', '#f59e0b', 2010 + (i % 6), 30000);
      END IF;
      person_arr := person_arr || p_id;
    END IF;

    -- ── 둘째 (4인 가족) ──
    IF fam_size >= 4 THEN
      p_id := gen_random_uuid();
      IF i % 2 = 1 THEN
        INSERT INTO persons (id, family_id, name, role, emoji, color, birth_year, goal_lines)
        VALUES (p_id, fam_id, sons[((i + 24) % 50) + 1], '아들', '👦', '#06b6d4', 2012 + (i % 5), 20000);
      ELSE
        INSERT INTO persons (id, family_id, name, role, emoji, color, birth_year, goal_lines)
        VALUES (p_id, fam_id, girls[((i + 24) % 50) + 1], '딸', '👧', '#a855f7', 2013 + (i % 4), 20000);
      END IF;
      person_arr := person_arr || p_id;
    END IF;

    -- ── 책 3~5권 per 가족 ──
    FOR j IN 1..(3 + (i % 3)) LOOP
      b_id := gen_random_uuid();
      k := ((i * 3 + j - 1) % 40) + 1;
      INSERT INTO books (id, family_id, title, author, total_pages, lines_per_page, emoji, color, current_page, completed)
      VALUES (
        b_id, fam_id, btitles[k], bauthors[k], bpages[k], 25,
        bemojis[k],
        colors[((i + j) % 8) + 1],
        LEAST((random() * bpages[k])::int, bpages[k]),
        random() > 0.7
      );
      book_arr := book_arr || b_id;
    END LOOP;

    -- ── 독서 기록 (최근 60일, 인당 65% 확률) ──
    FOR p_idx IN 1..array_length(person_arr, 1) LOOP
      FOR d IN 0..59 LOOP
        IF random() < 0.65 THEN
          log_date := CURRENT_DATE - d;
          INSERT INTO reading_logs (family_id, person_id, book_id, date, lines_read)
          VALUES (
            fam_id,
            person_arr[p_idx],
            book_arr[1 + (d % array_length(book_arr, 1))],
            log_date,
            (random() * 150 + 20)::int
          );
        END IF;
      END LOOP;
    END LOOP;

    -- ── 월별 목표 (1~3월) ──
    FOR p_idx IN 1..array_length(person_arr, 1) LOOP
      INSERT INTO reading_goals (family_id, person_id, month, target_lines) VALUES
        (fam_id, person_arr[p_idx], '2026-01', (random() * 2000 + 1500)::int),
        (fam_id, person_arr[p_idx], '2026-02', (random() * 2000 + 1500)::int),
        (fam_id, person_arr[p_idx], '2026-03', (random() * 2000 + 1500)::int);
    END LOOP;

    -- ── 개인별 책 진도 ──
    FOR p_idx IN 1..array_length(person_arr, 1) LOOP
      FOR b_idx IN 1..array_length(book_arr, 1) LOOP
        IF random() < 0.6 THEN
          INSERT INTO person_book_progress (family_id, person_id, book_id, current_page, completed)
          VALUES (
            fam_id,
            person_arr[p_idx]::text,
            book_arr[b_idx]::text,
            (random() * 300)::int,
            random() > 0.7
          );
        END IF;
      END LOOP;
    END LOOP;

    -- ── 리뷰 (가족당 1~2개) ──
    FOR j IN 1..(1 + (i % 2)) LOOP
      IF array_length(book_arr, 1) >= j THEN
        INSERT INTO book_reviews (id, family_id, person_id, book_id, rating, content, created_at)
        VALUES (
          fam_id::text || '-rev-' || j,
          fam_id,
          person_arr[((j - 1) % array_length(person_arr, 1)) + 1]::text,
          book_arr[j]::text,
          3 + (i + j) % 3,
          reviews[((i + j - 1) % 15) + 1],
          to_char(now() - ((random() * 45)::int) * interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        );
      END IF;
    END LOOP;

    -- ── 추천 (가족의 40%) ──
    IF i % 5 IN (0, 1) THEN
      k := ((i * 7) % 40) + 1;
      INSERT INTO book_recommendations (id, family_id, person_id, book_title, author, reason, emoji, created_at)
      VALUES (
        fam_id::text || '-rec-1',
        fam_id,
        person_arr[1]::text,
        btitles[k],
        bauthors[k],
        rec_reasons[((i - 1) % 10) + 1],
        '💯',
        to_char(now() - ((random() * 30)::int) * interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      );
    END IF;

  END LOOP;

  RAISE NOTICE '✅ 50가족 시드 데이터 삽입 완료!';
END;
$$;

-- FK/트리거 다시 활성화
SET session_replication_role = 'DEFAULT';
