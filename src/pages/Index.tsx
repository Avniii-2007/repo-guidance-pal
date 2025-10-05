import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Users, MessageSquare, Sparkles, Code, Zap, Users2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                OpenFuse
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                onClick={() => navigate("/auth")} 
                className="minimal-button px-6 !text-black dark:!text-white"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 aesthetic-grid opacity-30"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] gradient-glow"></div>
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            <div className="space-y-6 fade-in">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full ultra-card">
                <Sparkles className="h-5 w-5 text-primary animate-glow-pulse" />
                <span className="text-sm font-medium text-primary/80">Connect. Learn. Grow Together.</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-tight">
                Find Your{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">
                  Perfect Mentor
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Connect with experienced developers, get personalized guidance, and contribute meaningfully to open source projects.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center slide-up" style={{ animationDelay: "0.2s" }}>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="px-12 py-6 text-lg hover-lift modern-glow bg-primary hover:bg-primary/90"
              >
                Get Started
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/repositories")}
                className="px-12 py-6 text-lg minimal-button"
              >
                Browse Projects
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to accelerate your open source journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="ultra-card p-8 hover-lift scale-in group" style={{ animationDelay: "0.1s" }}>
              <div className="space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                  <BookOpen className="h-8 w-8 text-primary animate-float" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">Discover Projects</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Explore curated open source repositories across different technologies and find projects that spark your interest.
                  </p>
                </div>
              </div>
            </div>

            <div className="ultra-card p-8 hover-lift scale-in group" style={{ animationDelay: "0.2s" }}>
              <div className="space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
                  <Users2 className="h-8 w-8 text-accent animate-float" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">Connect with Mentors</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get matched with experienced contributors who are passionate about sharing their knowledge and helping others grow.
                  </p>
                </div>
              </div>
            </div>

            <div className="ultra-card p-8 hover-lift scale-in group" style={{ animationDelay: "0.3s" }}>
              <div className="space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                  <Zap className="h-8 w-8 text-primary animate-float" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">Accelerate Growth</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Receive personalized guidance, participate in code reviews, and make meaningful contributions with confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-subtle"></div>
        <div className="absolute inset-0 aesthetic-grid opacity-20"></div>
        
        <div className="container mx-auto px-6 text-center relative">
          <div className="max-w-3xl mx-auto space-y-8 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Level Up?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of developers who are growing their skills and making meaningful contributions to open source.
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="px-12 py-6 text-lg hover-lift modern-glow bg-primary hover:bg-primary/90"
              >
                Start Your Journey
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
