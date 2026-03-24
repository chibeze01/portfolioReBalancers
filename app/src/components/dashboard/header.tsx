import { Moon, Sun, TrendingUp, LogOut, User } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Separator } from "@/components/ui/separator"

interface HeaderProps {
  userEmail?: string
  onLogout: () => void
}

export function Header({ userEmail, onLogout }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold hidden sm:inline-block">Portfolio Balancer</span>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* Navigation */}
        <nav className="flex items-center gap-4 text-sm">
          <button
            className={`font-medium transition-colors hover:text-foreground ${
              location.pathname === "/" ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => navigate("/")}
          >
            Dashboard
          </button>
          <button
            className={`font-medium transition-colors hover:text-foreground ${
              location.pathname === "/rebalance" ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => navigate("/rebalance")}
          >
            Rebalance
          </button>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User info */}
          {userEmail && (
            <>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden md:inline-block">{userEmail}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
