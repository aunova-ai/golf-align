import type { LessonDrillTemplate } from "@/components/golfalign/types";

export const lessonDrillTemplates: LessonDrillTemplate[] = [
  {
    id: "lesson_intro_basic",
    courseType: "단기",
    category: "입문/초급",
    title: "입문 기본기 점검",
    duration: "1~2주",
    goal: "그립, 어드레스, 정렬, 리듬의 균형을 먼저 안정시킵니다.",
    recordGuide: "정면/측면 스윙 영상 1개, 리듬 3초 유지 여부, 불편한 부위 메모",
    drills: ["그립 압력 체크", "어드레스 정렬", "하프스윙", "리듬 3초 유지"]
  },
  {
    id: "lesson_short_game",
    courseType: "단기",
    category: "숏게임",
    title: "숏게임 집중",
    duration: "1~2주",
    goal: "퍼팅 방향성과 30m 이내 어프로치 거리감을 안정시킵니다.",
    recordGuide: "퍼팅 성공률, 거리별 어프로치 결과, 선택 이미지/영상 첨부",
    drills: ["1~2m 직선 퍼팅", "3~10m 거리감 퍼팅", "칩샷", "피치샷"]
  },
  {
    id: "lesson_miss_fix",
    courseType: "단기",
    category: "문제 교정",
    title: "반복 미스 교정",
    duration: "1~3주",
    goal: "슬라이스, 훅, 뒤땅, 탑핑 중 가장 큰 미스 하나를 먼저 줄입니다.",
    recordGuide: "같은 각도 재촬영, 미스 유형, 좋아진 동작과 급한 동작 메모",
    drills: ["미스 유형 진단", "빈스윙", "하프스윙", "단계별 풀스윙"]
  },
  {
    id: "lesson_beginner_complete",
    courseType: "장기",
    category: "입문/초급",
    title: "초급 완성 루틴",
    duration: "4~8주",
    goal: "기본기부터 아이언, 드라이버, 어프로치, 퍼팅까지 초급 필수 영역을 완성합니다.",
    recordGuide: "클럽별 영상, 거리 기준, 실수 유형, 주간 완료 여부 기록",
    drills: ["7번 아이언 하프스윙", "드라이버 티샷", "거리별 어프로치", "직선 퍼팅"]
  },
  {
    id: "lesson_swing_fix",
    courseType: "장기",
    category: "문제 교정",
    title: "영상 기반 스윙 교정",
    duration: "8~12주",
    goal: "정면/측면 영상 분석으로 셋업부터 임팩트까지 단계별로 교정합니다.",
    recordGuide: "비포&애프터 영상, 개선 사인, 반복 성공률 기록",
    drills: ["셋업 교정", "테이크어웨이", "전환 동작", "임팩트 체크"]
  },
  {
    id: "lesson_field_practice",
    courseType: "장기",
    category: "실전/라운드",
    title: "필드 실전 운영",
    duration: "8~12주",
    goal: "연습장 동작을 라운드 전략, 루틴, 스코어 관리로 연결합니다.",
    recordGuide: "홀별 실수, 벌타 원인, 클럽 선택, 다음 훈련 연결 메모",
    drills: ["티샷 전략", "코스 공략", "클럽 선택", "2퍼트 전략"]
  }
];
