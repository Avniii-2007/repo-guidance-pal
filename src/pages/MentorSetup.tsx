import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Repository {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  bio: string | null;
  profile_pic: string | null;
  skills: string[] | null;
  interests: string[] | null;
}

const MentorSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: [] as string[],
    availability: "weekends",
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const [profileRes, reposRes, mentorReposRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("repositories").select("*").order("stars", { ascending: false }),
        supabase.from("mentor_repositories").select("repository_id").eq("mentor_id", session.user.id)
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setFormData({
          name: profileRes.data.name || "",
          bio: profileRes.data.bio || "",
          skills: profileRes.data.skills || [],
          availability: "weekends",
        });
      }

      if (reposRes.data) setRepositories(reposRes.data);
      if (mentorReposRes.data) {
        setSelectedRepos(mentorReposRes.data.map(r => r.repository_id));
      }
    } catch (error: unknown) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const toggleRepo = (repoId: string) => {
    setSelectedRepos(prev =>
      prev.includes(repoId) ? prev.filter(id => id !== repoId) : [...prev, repoId]
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          bio: formData.bio,
          skills: formData.skills,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Delete existing mentor_repositories
      await supabase
        .from("mentor_repositories")
        .delete()
        .eq("mentor_id", profile.id);

      // Insert new mentor_repositories
      if (selectedRepos.length > 0) {
        const { error: reposError } = await supabase
          .from("mentor_repositories")
          .insert(
            selectedRepos.map(repoId => ({
              mentor_id: profile.id,
              repository_id: repoId,
            }))
          );

        if (reposError) throw reposError;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      navigate("/dashboard");
    } catch (error: unknown) {
      console.error("Error saving:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-white">
            OpenFuse
          </h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Mentor Profile Setup</h2>
            <p className="text-muted-foreground">
              Complete your profile to start helping students in open source
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell students about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell students about your experience and what you can help with..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>Add your technical skills and areas of expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="e.g. React, Python, Machine Learning"
                />
                <Button onClick={addSkill} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Select Repositories</CardTitle>
              <CardDescription>Choose which projects you want to mentor for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-smooth cursor-pointer"
                    onClick={() => toggleRepo(repo.id)}
                  >
                    <Checkbox
                      checked={selectedRepos.includes(repo.id)}
                      onCheckedChange={() => toggleRepo(repo.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{repo.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {repo.description}
                      </div>
                      {repo.language && (
                        <Badge variant="outline" className="mt-1">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    {selectedRepos.includes(repo.id) && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MentorSetup;
