import { useState } from "react";
import StudentDashboard from "@/components/student/StudentDashboard";
import StudyPlan from "@/components/student/StudyPlan";
import Exercises from "@/components/student/Exercises";
import LiveLessons from "@/components/student/LiveLessons";
import Achievements from "@/components/student/Achievements";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import AppShell from "@/components/layout/AppShell";
import Landing from "@/components/landing/Landing";
import { AppContext, useAppState } from "@/lib/state";

const Index = () => {
  const state = useAppState();
  const [page, setPage] = useState<string>("dashboard");

  if (!state.user) return (
    <AppContext.Provider value={state}>
      <Landing />
    </AppContext.Provider>
  );

  const renderPage = () => {
    if (state.user?.role === "teacher") return <TeacherDashboard />;
    switch (page) {
      case "plan": return <StudyPlan />;
      case "exercises": return <Exercises />;
      case "live": return <LiveLessons />;
      case "achievements": return <Achievements />;
      default: return <StudentDashboard onNavigate={setPage} />;
    }
  };

  return (
    <AppContext.Provider value={state}>
      <AppShell currentPage={page} onNavigate={setPage}>
        {renderPage()}
      </AppShell>
    </AppContext.Provider>
  );
};

export default Index;
