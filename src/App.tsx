import { Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { ConfusablesPage } from "@/pages/confusables"
import { DashboardPage } from "@/pages/dashboard"
import { LearnPage } from "@/pages/learn"
import { ProgressPage } from "@/pages/progress"
import { QuizPage } from "@/pages/quiz"
import { SettingsPage } from "@/pages/settings"
import { TrendsPage } from "@/pages/trends"
import { WordsPage } from "@/pages/words"

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/confusables" element={<ConfusablesPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App
