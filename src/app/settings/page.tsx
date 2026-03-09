"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useStore } from "@/hooks/useStore";
import { calculateBMI, getBMICategory, calculateAge } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  User,
  Target,
  Bell,
  Moon,
  Shield,
  LogOut,
  ChevronRight,
  Edit3,
} from "lucide-react";
import type { ActivityLevel, GoalPace } from "@/types/user";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "좌식생활",
  light: "가벼운 활동",
  moderate: "보통 활동",
  active: "활동적",
  very_active: "매우 활동적",
};

const PACE_LABELS: Record<GoalPace, string> = {
  slow: "천천히",
  moderate: "보통",
  fast: "빠르게",
};

export default function SettingsPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const weightRecords = useStore((s) => s.weightRecords);

  // Profile edit dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editActivityLevel, setEditActivityLevel] = useState<ActivityLevel>("moderate");

  // Goal edit dialog state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [editTargetPeriod, setEditTargetPeriod] = useState("");
  const [editPace, setEditPace] = useState<GoalPace>("moderate");

  // App settings (UI only)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mealReminder, setMealReminder] = useState(true);
  const [exerciseReminder, setExerciseReminder] = useState(true);

  // Reset confirm dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.replace("/onboarding");
    }
  }, [user, router]);

  // Sync dark mode with document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Initialize edit forms when dialogs open
  useEffect(() => {
    if (profileDialogOpen && user) {
      setEditName(user.name);
      setEditHeight(String(user.profile.height));
      setEditWeight(String(user.profile.weight));
      setEditActivityLevel(user.profile.activityLevel);
    }
  }, [profileDialogOpen, user]);

  useEffect(() => {
    if (goalDialogOpen && user) {
      setEditTargetWeight(String(user.goal.targetWeight));
      setEditTargetPeriod(String(user.goal.targetPeriodMonths));
      setEditPace(user.goal.pace);
    }
  }, [goalDialogOpen, user]);

  if (!user) {
    return null;
  }

  // Derived values
  const currentWeight =
    weightRecords.length > 0
      ? weightRecords[weightRecords.length - 1].weight
      : user.profile.weight;
  const age = calculateAge(user.profile.birthDate);
  const bmi = calculateBMI(currentWeight, user.profile.height);
  const bmiCategory = getBMICategory(bmi);

  // Get user initials
  const initials = user.name
    .split("")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Profile save handler
  const handleProfileSave = () => {
    const height = parseFloat(editHeight);
    const weight = parseFloat(editWeight);
    if (!editName.trim() || isNaN(height) || isNaN(weight)) return;

    setUser({
      ...user,
      name: editName.trim(),
      profile: {
        ...user.profile,
        height,
        weight,
        activityLevel: editActivityLevel,
      },
    });
    setProfileDialogOpen(false);
  };

  // Goal save handler
  const handleGoalSave = () => {
    const targetWeight = parseFloat(editTargetWeight);
    const targetPeriod = parseInt(editTargetPeriod);
    if (isNaN(targetWeight) || isNaN(targetPeriod)) return;

    setUser({
      ...user,
      goal: {
        ...user.goal,
        targetWeight,
        targetPeriodMonths: targetPeriod,
        pace: editPace,
      },
    });
    setGoalDialogOpen(false);
  };

  // Data reset handler
  const handleDataReset = () => {
    localStorage.removeItem("health-app-storage");
    setResetDialogOpen(false);
    router.replace("/");
  };

  // Full restart handler
  const handleRestart = () => {
    localStorage.removeItem("health-app-storage");
    setRestartDialogOpen(false);
    router.replace("/");
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-foreground" />
          <h1 className="text-xl font-bold text-foreground">설정</h1>
        </div>

        {/* Profile Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-blue-500" />
              프로필
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-lg font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {user.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user.profile.gender === "male" ? "남성" : "여성"} · {age}세
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">키</p>
                <p className="text-sm font-semibold text-foreground">
                  {user.profile.height}cm
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">현재 체중</p>
                <p className="text-sm font-semibold text-foreground">
                  {currentWeight.toFixed(1)}kg
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">BMI</p>
                <p className="text-sm font-semibold text-foreground">{bmi}</p>
                <Badge variant="outline" className={`text-xs ${bmiCategory.color}`}>
                  {bmiCategory.label}
                </Badge>
              </div>
            </div>

            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" className="w-full" />
                }
              >
                <Edit3 className="size-4 mr-1" />
                프로필 수정
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>프로필 수정</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>이름</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>키 (cm)</Label>
                    <Input
                      type="number"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      placeholder="170"
                      min="100"
                      max="250"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>체중 (kg)</Label>
                    <Input
                      type="number"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="70"
                      step="0.1"
                      min="30"
                      max="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>활동 수준</Label>
                    <Select
                      value={editActivityLevel}
                      onValueChange={(value) =>
                        setEditActivityLevel(value as ActivityLevel)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="활동 수준 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">좌식생활</SelectItem>
                        <SelectItem value="light">가벼운 활동</SelectItem>
                        <SelectItem value="moderate">보통 활동</SelectItem>
                        <SelectItem value="active">활동적</SelectItem>
                        <SelectItem value="very_active">매우 활동적</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleProfileSave}>저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Separator />

        {/* Goal Section Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-emerald-500" />
              나의 목표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">현재</p>
                  <p className="text-lg font-bold text-foreground">
                    {currentWeight.toFixed(1)}kg
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">목표</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {user.goal.targetWeight}kg
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <Badge variant="secondary">
                  {user.goal.targetPeriodMonths}개월
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {PACE_LABELS[user.goal.pace]}
                </p>
              </div>
            </div>

            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" className="w-full" />
                }
              >
                <Edit3 className="size-4 mr-1" />
                목표 수정
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>목표 수정</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>목표 체중 (kg)</Label>
                    <Input
                      type="number"
                      value={editTargetWeight}
                      onChange={(e) => setEditTargetWeight(e.target.value)}
                      placeholder="65"
                      step="0.1"
                      min="30"
                      max="300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>목표 기간</Label>
                    <Select
                      value={editTargetPeriod}
                      onValueChange={(value) => value && setEditTargetPeriod(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="기간을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3개월</SelectItem>
                        <SelectItem value="6">6개월</SelectItem>
                        <SelectItem value="9">9개월</SelectItem>
                        <SelectItem value="12">12개월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>감량 속도</Label>
                    <Select
                      value={editPace}
                      onValueChange={(value) => setEditPace(value as GoalPace)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="속도를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">천천히</SelectItem>
                        <SelectItem value="moderate">보통</SelectItem>
                        <SelectItem value="fast">빠르게</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleGoalSave}>저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Separator />

        {/* App Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-amber-500" />
              앱 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Dark Mode */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Moon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">다크 모드</span>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
            <Separator />

            {/* Notifications */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">알림 설정</span>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={() => setNotificationsEnabled(!notificationsEnabled)}
              />
            </div>
            <Separator />

            {/* Meal Reminder */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">식사 리마인더</span>
              </div>
              <Switch
                checked={mealReminder}
                onCheckedChange={() => setMealReminder(!mealReminder)}
              />
            </div>
            <Separator />

            {/* Exercise Reminder */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">운동 리마인더</span>
              </div>
              <Switch
                checked={exerciseReminder}
                onCheckedChange={() => setExerciseReminder(!exerciseReminder)}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4 text-slate-500" />
              데이터 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" className="w-full justify-between" />
                }
              >
                <span>데이터 초기화</span>
                <ChevronRight className="size-4" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>데이터 초기화</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground py-2">
                  모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  정말 초기화하시겠습니까?
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setResetDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button variant="destructive" onClick={handleDataReset}>
                    초기화
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">앱 정보</span>
              <span className="text-sm text-muted-foreground">1.0.0 (MVP)</span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Logout / Reset Section */}
        <Dialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
          <DialogTrigger
            render={
              <Button
                variant="destructive"
                className="w-full"
              />
            }
          >
            <LogOut className="size-4 mr-1" />
            처음부터 다시 시작
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>처음부터 다시 시작</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              모든 데이터가 삭제되고 온보딩부터 다시 시작합니다.
              정말 진행하시겠습니까?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRestartDialogOpen(false)}
              >
                취소
              </Button>
              <Button variant="destructive" onClick={handleRestart}>
                다시 시작
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
