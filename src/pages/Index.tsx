import { useState } from "react";
import { Navigate } from "react-router-dom";
import StudentDashboard from "@/components/student/StudentDashboard";
import StudyPlan from "@/components/student/StudyPlan";
import Exercises from "@/components/student/Exercises";
import LiveLessons from "@/components/student/LiveLessons";
import Achievements from "@/components/student/Achievements";
import Guide from "@/components/student/Guide";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import AppShell from "@/components/layout/AppShell";
import Landing from "@/components/landing/Landing";
import { AppContext, useAppState } from "@/lib/state";

const Index = () => {
  const state = useAppState();
  const [page, setPage] = useState<string>("dashboard");

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!state.session) {
    return (
      <AppContext.Provider value={state}>
        <Landing />
      </AppContext.Provider>
    );
  }

  if (!state.user) {
    // Signed in but profile/role still loading or missing
    return <Navigate to="/auth" replace />;
  }

  const renderPage = () => {
    if (state.user?.role === "teacher") return <TeacherDashboard />;
    switch (page) {
      case "plan": return <StudyPlan />;
      case "exercises": return <Exercises />;
      case "guide": return <Guide />;
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
