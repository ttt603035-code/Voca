import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import App from "./App"
import "./index.css"
import { VocaProvider } from "@/store/voca-context"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <VocaProvider>
          <App />
          <Toaster position="top-center" richColors />
        </VocaProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
