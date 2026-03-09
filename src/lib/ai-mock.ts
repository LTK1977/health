import type { AIService, AIUserContext } from './ai-service';
import type { DailyDietPlan, Meal } from '@/types/diet';
import type { DailyExercisePlan, ExerciseItem } from '@/types/exercise';
import type { WeeklyReport } from '@/types/record';

// 한식 중심 식단 DB
const BREAKFAST_MENUS = [
  { name: '현미밥', amount: '1공기(210g)', macros: { calories: 310, protein: 6, carbs: 67, fat: 2 } },
  { name: '된장찌개', amount: '1그릇', macros: { calories: 80, protein: 6, carbs: 6, fat: 3 } },
  { name: '계란프라이', amount: '2개', macros: { calories: 180, protein: 12, carbs: 1, fat: 14 } },
  { name: '김치', amount: '1접시', macros: { calories: 20, protein: 1, carbs: 3, fat: 0 } },
  { name: '오트밀', amount: '1컵(80g)', macros: { calories: 300, protein: 11, carbs: 54, fat: 5 } },
  { name: '그릭요거트', amount: '1개(150g)', macros: { calories: 130, protein: 15, carbs: 8, fat: 4 } },
  { name: '바나나', amount: '1개', macros: { calories: 105, protein: 1, carbs: 27, fat: 0 } },
  { name: '삶은 달걀', amount: '2개', macros: { calories: 140, protein: 12, carbs: 1, fat: 10 } },
];

const LUNCH_MENUS = [
  { name: '닭가슴살 샐러드', amount: '1인분', macros: { calories: 280, protein: 35, carbs: 12, fat: 10 } },
  { name: '잡곡밥', amount: '2/3공기', macros: { calories: 230, protein: 5, carbs: 50, fat: 1 } },
  { name: '불고기', amount: '150g', macros: { calories: 250, protein: 22, carbs: 10, fat: 14 } },
  { name: '비빔밥', amount: '1인분', macros: { calories: 480, protein: 18, carbs: 72, fat: 12 } },
  { name: '닭가슴살 도시락', amount: '1인분', macros: { calories: 420, protein: 38, carbs: 45, fat: 8 } },
  { name: '참치김밥', amount: '1줄', macros: { calories: 380, protein: 15, carbs: 55, fat: 10 } },
  { name: '된장찌개 정식', amount: '1인분', macros: { calories: 450, protein: 20, carbs: 60, fat: 14 } },
  { name: '순두부찌개 정식', amount: '1인분', macros: { calories: 400, protein: 22, carbs: 48, fat: 14 } },
];

const DINNER_MENUS = [
  { name: '연어 스테이크', amount: '150g', macros: { calories: 280, protein: 30, carbs: 0, fat: 18 } },
  { name: '고구마', amount: '1개(200g)', macros: { calories: 180, protein: 2, carbs: 42, fat: 0 } },
  { name: '채소볶음', amount: '1접시', macros: { calories: 80, protein: 3, carbs: 10, fat: 3 } },
  { name: '두부스테이크', amount: '200g', macros: { calories: 200, protein: 18, carbs: 6, fat: 12 } },
  { name: '잡곡밥', amount: '1/2공기', macros: { calories: 170, protein: 4, carbs: 37, fat: 1 } },
  { name: '미역국', amount: '1그릇', macros: { calories: 45, protein: 3, carbs: 4, fat: 2 } },
  { name: '닭안심구이', amount: '150g', macros: { calories: 170, protein: 32, carbs: 0, fat: 4 } },
  { name: '콩나물무침', amount: '1접시', macros: { calories: 50, protein: 4, carbs: 5, fat: 2 } },
];

const SNACK_MENUS = [
  { name: '아몬드', amount: '15알(20g)', macros: { calories: 120, protein: 4, carbs: 4, fat: 10 } },
  { name: '프로틴바', amount: '1개', macros: { calories: 200, protein: 20, carbs: 22, fat: 7 } },
  { name: '사과', amount: '1개', macros: { calories: 95, protein: 0, carbs: 25, fat: 0 } },
  { name: '삶은 달걀', amount: '1개', macros: { calories: 70, protein: 6, carbs: 0, fat: 5 } },
  { name: '저지방 우유', amount: '200ml', macros: { calories: 80, protein: 7, carbs: 10, fat: 2 } },
];

// 운동 DB
const STRENGTH_EXERCISES: Record<string, ExerciseItem[]> = {
  chest: [
    { name: '푸시업', category: 'strength', muscleGroups: ['chest', 'arms'], sets: 3, reps: 12, restSeconds: 60, description: '가슴과 삼두근을 동시에 단련하는 기본 운동' },
    { name: '덤벨 벤치프레스', category: 'strength', muscleGroups: ['chest'], sets: 4, reps: 10, restSeconds: 90, weight: '10kg', description: '가슴 근육의 볼륨을 키우는 핵심 운동' },
    { name: '인클라인 푸시업', category: 'strength', muscleGroups: ['chest'], sets: 3, reps: 15, restSeconds: 60, description: '벤치나 계단을 이용한 초보자용 가슴 운동' },
  ],
  back: [
    { name: '슈퍼맨 홀드', category: 'strength', muscleGroups: ['back'], sets: 3, reps: 10, restSeconds: 60, description: '등 근육 강화에 효과적인 맨몸 운동' },
    { name: '덤벨 로우', category: 'strength', muscleGroups: ['back', 'arms'], sets: 4, reps: 10, restSeconds: 90, weight: '8kg', description: '등 전체와 이두근을 단련하는 운동' },
    { name: '밴드 풀다운', category: 'strength', muscleGroups: ['back'], sets: 3, reps: 12, restSeconds: 60, description: '광배근을 집중 자극하는 운동' },
  ],
  legs: [
    { name: '스쿼트', category: 'strength', muscleGroups: ['legs'], sets: 4, reps: 15, restSeconds: 90, description: '하체 전체를 단련하는 대표적인 운동' },
    { name: '런지', category: 'strength', muscleGroups: ['legs'], sets: 3, reps: 12, restSeconds: 60, description: '허벅지와 엉덩이를 집중 단련하는 운동' },
    { name: '카프레이즈', category: 'strength', muscleGroups: ['legs'], sets: 3, reps: 20, restSeconds: 45, description: '종아리 근육 강화 운동' },
  ],
  core: [
    { name: '플랭크', category: 'strength', muscleGroups: ['core'], sets: 3, durationMinutes: 1, restSeconds: 60, description: '코어 안정성을 키우는 기본 운동' },
    { name: '크런치', category: 'strength', muscleGroups: ['core'], sets: 3, reps: 20, restSeconds: 45, description: '복직근을 자극하는 기본 복근 운동' },
    { name: '러시안 트위스트', category: 'strength', muscleGroups: ['core'], sets: 3, reps: 16, restSeconds: 45, description: '복부 옆근육(복사근)을 강화하는 운동' },
    { name: '마운틴 클라이머', category: 'strength', muscleGroups: ['core', 'legs'], sets: 3, reps: 20, restSeconds: 60, description: '전신 코어와 유산소를 동시에 하는 운동' },
  ],
  shoulders: [
    { name: '숄더 프레스', category: 'strength', muscleGroups: ['shoulders'], sets: 3, reps: 12, restSeconds: 60, weight: '5kg', description: '어깨 전체를 발달시키는 기본 운동' },
    { name: '사이드 레터럴 레이즈', category: 'strength', muscleGroups: ['shoulders'], sets: 3, reps: 15, restSeconds: 45, weight: '3kg', description: '어깨 측면 삼각근 운동' },
  ],
};

const CARDIO_EXERCISES: ExerciseItem[] = [
  { name: '빠르게 걷기', category: 'cardio', muscleGroups: ['legs', 'core'], durationMinutes: 30, description: '체지방 감량에 효과적인 저강도 유산소 운동' },
  { name: '조깅', category: 'cardio', muscleGroups: ['legs', 'core'], durationMinutes: 20, description: '심폐 기능 향상과 체지방 감소에 효과적' },
  { name: '실내 자전거', category: 'cardio', muscleGroups: ['legs'], durationMinutes: 30, description: '관절 부담이 적은 유산소 운동' },
  { name: '줄넘기', category: 'cardio', muscleGroups: ['full_body'], durationMinutes: 15, description: '전신 유산소 운동으로 칼로리 소모가 높음' },
  { name: '버피 테스트', category: 'hiit', muscleGroups: ['full_body'], sets: 5, reps: 10, restSeconds: 30, description: '전신 고강도 유산소 운동' },
];

const MOTIVATIONAL_MESSAGES = [
  '오늘도 건강한 하루를 시작해 볼까요? 작은 실천이 큰 변화를 만듭니다! 💪',
  '어제보다 한 걸음 더 나아간 오늘의 당신, 정말 멋집니다!',
  '꾸준함이 최고의 능력입니다. 오늘도 계획대로 실천해 봐요!',
  '몸이 변하고 있어요. 거울보다 꾸준함을 믿으세요!',
  '오늘의 운동이 내일의 자신감이 됩니다. 함께 해봐요!',
  '건강한 식단은 최고의 투자입니다. 오늘도 잘 먹어봐요!',
  '포기하고 싶을 때가 변화가 시작되는 순간입니다!',
  '완벽하지 않아도 괜찮아요. 꾸준히 하는 것이 중요합니다!',
  '지금 이 순간 앱을 연 당신, 이미 절반은 성공한 거예요!',
  '느리더라도 앞으로 가고 있다면, 충분히 잘하고 있는 겁니다.',
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function sumMacros(items: { macros: { calories: number; protein: number; carbs: number; fat: number } }[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.macros.calories,
      protein: acc.protein + item.macros.protein,
      carbs: acc.carbs + item.macros.carbs,
      fat: acc.fat + item.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export const mockAIService: AIService = {
  async generateDailyDietPlan(context, date, _excludeMenus?): Promise<DailyDietPlan> {
    await new Promise((r) => setTimeout(r, 500)); // simulate delay

    const breakfastItems = pickRandom(BREAKFAST_MENUS, 3);
    const lunchItems = pickRandom(LUNCH_MENUS, 2);
    const dinnerItems = pickRandom(DINNER_MENUS, 3);
    const snackItems = pickRandom(SNACK_MENUS, 1);

    const meals: Meal[] = [
      { type: 'breakfast', items: breakfastItems, totalMacros: sumMacros(breakfastItems) },
      { type: 'lunch', items: lunchItems, totalMacros: sumMacros(lunchItems) },
      { type: 'dinner', items: dinnerItems, totalMacros: sumMacros(dinnerItems) },
      { type: 'snack', items: snackItems, totalMacros: sumMacros(snackItems) },
    ];

    const totalMacros = sumMacros(meals.map((m) => ({ macros: m.totalMacros })));

    return {
      id: `diet-${date}`,
      userId: context.profile.id,
      date,
      meals,
      totalMacros,
      targetCalories: context.targetCalories,
      note: `${context.profile.gender === 'male' ? '남성' : '여성'} 기준 일일 ${context.targetCalories}kcal 목표 식단입니다.`,
    };
  },

  async generateDailyExercisePlan(context, date, dayOfWeek): Promise<DailyExercisePlan> {
    await new Promise((r) => setTimeout(r, 300));

    const weeklyFreq = context.exercisePrefs.weeklyFrequency;
    // 일요일(0) 또는 주당 빈도에 따라 휴식일 결정
    const restDays = [0]; // 기본 일요일 휴식
    if (weeklyFreq <= 3) restDays.push(2, 4); // 화, 목 추가 휴식
    else if (weeklyFreq <= 4) restDays.push(3); // 수 추가 휴식

    if (restDays.includes(dayOfWeek)) {
      return {
        id: `exercise-${date}`,
        userId: context.profile.id,
        date,
        dayOfWeek,
        category: 'rest',
        title: '휴식일',
        exercises: [],
        totalDurationMinutes: 0,
        estimatedCaloriesBurned: 0,
        difficulty: 'beginner',
        isRestDay: true,
      };
    }

    // 근력 + 유산소 조합
    const muscleGroupRotation: (keyof typeof STRENGTH_EXERCISES)[] = ['chest', 'back', 'legs', 'core', 'shoulders'];
    const todayGroup = muscleGroupRotation[dayOfWeek % muscleGroupRotation.length];
    const strengthExercises = pickRandom(STRENGTH_EXERCISES[todayGroup] || STRENGTH_EXERCISES.core, 3);
    const cardio = pickRandom(CARDIO_EXERCISES, 1);

    const exercises: ExerciseItem[] = [...strengthExercises, cardio[0]];
    const titles: Record<string, string> = {
      chest: '가슴 근력 + 유산소',
      back: '등 근력 + 유산소',
      legs: '하체 근력 + 유산소',
      core: '코어 강화 + 유산소',
      shoulders: '어깨 근력 + 유산소',
    };

    return {
      id: `exercise-${date}`,
      userId: context.profile.id,
      date,
      dayOfWeek,
      category: 'strength',
      title: titles[todayGroup] || '전신 운동',
      exercises: [...strengthExercises, ...cardio],
      totalDurationMinutes: context.exercisePrefs.availableMinutes || 60,
      estimatedCaloriesBurned: 300 + Math.floor(Math.random() * 200),
      difficulty: 'beginner',
      isRestDay: false,
    };
  },

  async generateWeeklyReport(context): Promise<WeeklyReport> {
    await new Promise((r) => setTimeout(r, 400));

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    return {
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: today.toISOString().split('T')[0],
      avgCaloriesConsumed: context.targetCalories + Math.floor(Math.random() * 200 - 100),
      avgCaloriesTarget: context.targetCalories,
      dietComplianceRate: 70 + Math.floor(Math.random() * 25),
      exerciseComplianceRate: 65 + Math.floor(Math.random() * 30),
      weightStart: context.profile.weight,
      weightEnd: context.profile.weight - 0.3 - Math.random() * 0.4,
      weightChange: -(0.3 + Math.random() * 0.4),
      aiSummary: '이번 주 식단 관리와 운동을 꾸준히 실천하셨습니다. 전반적으로 칼로리 목표를 잘 지키고 계시며, 체중도 소폭 감소하고 있습니다.',
      aiRecommendation: '다음 주에는 단백질 섭취를 조금 더 늘려보세요. 근력 운동 후 30분 이내에 단백질을 섭취하면 근육 회복에 도움이 됩니다. 수분 섭취도 하루 2L 이상 유지해 주세요.',
    };
  },

  async getMotivationalMessage(): Promise<string> {
    return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
  },
};
