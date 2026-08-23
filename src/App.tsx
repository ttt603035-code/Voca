import { Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { BookPage } from "@/pages/book-page"
import { FavoritesPage } from "@/pages/favorites-page"
import { InsightsPage } from "@/pages/insights"
import { ListPage } from "@/pages/list-page"
import { MistakesPage } from "@/pages/mistakes"
import { ReviewPage } from "@/pages/review"
import { SettingsPage } from "@/pages/settings"
import { SimilarGroupPage, SimilarPage } from "@/pages/similar"
import { TestPage } from "@/pages/test"
import { TodayPage } from "@/pages/today"
import { WordsPage } from "@/pages/words"

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TodayPage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/words/books/:bookId" element={<BookPage />} />
        <Route
          path="/words/books/:bookId/lists/:listId"
          element={<ListPage />}
        />
        <Route path="/words/favorites" element={<FavoritesPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/similar" element={<SimilarPage />} />
        <Route path="/similar/:id" element={<SimilarGroupPage />} />
        <Route path="/mistakes" element={<MistakesPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<TodayPage />} />
      </Route>
    </Routes>
  )
}

export default App
