import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="minimal-button">
        <div className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="minimal-button relative overflow-hidden group"
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-500 ${
        theme === "dark" ? "rotate-90 scale-0" : ""
      }`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-500 ${
        theme === "dark" ? "rotate-0 scale-100" : ""
      }`} />
      <span className="sr-only">Toggle theme</span>
      
      {/* Animated background */}
      <div className={`absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full scale-0 transition-all duration-300 ${
        theme === "light" ? "group-hover:scale-100" : ""
      }`} />
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full scale-0 transition-all duration-300 ${
        theme === "dark" ? "group-hover:scale-100" : ""
      }`} />
    </Button>
  )
}