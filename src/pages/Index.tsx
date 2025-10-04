import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Users, MessageSquare, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] gradient-glow"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect neon-border animate-glow-pulse">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Connect. Learn. Grow.</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-scale-in">
              Find Your Perfect{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Open Source Mentor
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Connect with experienced developers who mentor on your favorite open source projects.
              Get guidance, grow your skills, and contribute with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 shadow-neon hover:shadow-glow hover:scale-105 transition-bounce"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/repositories")}
                className="text-lg px-8 py-6 neon-border glass-effect hover:bg-primary/10"
              >
                Browse Projects
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 container mx-auto px-4 relative">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            How MentorMatch Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to start your open source mentorship journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="neon-border glass-effect hover:shadow-glow transition-smooth group animate-scale-in">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto shadow-neon group-hover:shadow-glow transition-smooth">
                <BookOpen className="h-8 w-8 text-primary group-hover:animate-float" />
              </div>
              <h3 className="text-xl font-bold">Explore Projects</h3>
              <p className="text-muted-foreground">
                Browse through popular open source repositories and find projects that match your interests
              </p>
            </CardContent>
          </Card>

          <Card className="neon-border glass-effect hover:shadow-glow transition-smooth group animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto shadow-neon group-hover:shadow-glow transition-smooth">
                <Users className="h-8 w-8 text-accent group-hover:animate-float" />
              </div>
              <h3 className="text-xl font-bold">Find Mentors</h3>
              <p className="text-muted-foreground">
                Connect with experienced developers who actively contribute to and mentor on those projects
              </p>
            </CardContent>
          </Card>

          <Card className="neon-border glass-effect hover:shadow-glow transition-smooth group animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto shadow-neon group-hover:shadow-glow transition-smooth">
                <MessageSquare className="h-8 w-8 text-secondary group-hover:animate-float" />
              </div>
              <h3 className="text-xl font-bold">Start Learning</h3>
              <p className="text-muted-foreground">
                Get personalized guidance through real-time chat and contribute meaningfully to open source
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-30"></div>
        <div className="absolute inset-0 cyber-grid opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Join our community of learners and mentors making open source more accessible
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 shadow-neon hover:shadow-glow transition-bounce animate-scale-in"
            style={{ animationDelay: "0.2s" }}
          >
            Join MentorMatch Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
