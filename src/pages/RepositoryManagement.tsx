import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Repository {
  id: string;
  name: string;
  description: string | null;
  github_url: string | null;
  language: string | null;
  stars: number | null;
  created_at: string;
}

const RepositoryManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    github_url: "",
    language: "",
    stars: 0,
  });

  useEffect(() => {
    checkAccess();
    fetchRepositories();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "mentor") {
      toast({
        title: "Access Denied",
        description: "Only mentors can manage repositories",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  };

  const fetchRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from("repositories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRepositories(data || []);
    } catch (error: any) {
      console.error("Error fetching repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load repositories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRepo) {
        const { error } = await supabase
          .from("repositories")
          .update(formData)
          .eq("id", editingRepo.id);

        if (error) throw error;

        toast({
          title: "Repository Updated!",
          description: "The repository has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("repositories")
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Repository Added!",
          description: "New repository has been added successfully",
        });
      }

      setDialogOpen(false);
      setEditingRepo(null);
      setFormData({
        name: "",
        description: "",
        github_url: "",
        language: "",
        stars: 0,
      });
      fetchRepositories();
    } catch (error: any) {
      console.error("Error saving repository:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (repo: Repository) => {
    setEditingRepo(repo);
    setFormData({
      name: repo.name,
      description: repo.description || "",
      github_url: repo.github_url || "",
      language: repo.language || "",
      stars: repo.stars || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this repository?")) return;

    try {
      const { error } = await supabase
        .from("repositories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Repository Deleted",
        description: "The repository has been removed",
      });

      fetchRepositories();
    } catch (error: any) {
      console.error("Error deleting repository:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setEditingRepo(null);
    setFormData({
      name: "",
      description: "",
      github_url: "",
      language: "",
      stars: 0,
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Repository Management</h1>
          </div>
          <Button onClick={openAddDialog} className="shadow-neon hover:shadow-glow transition-smooth">
            <Plus className="h-4 w-4 mr-2" />
            Add Repository
          </Button>
        </div>

        <Card className="neon-border glass-effect">
          <CardHeader>
            <CardTitle>Repositories</CardTitle>
            <CardDescription>
              Manage the repositories available on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : repositories.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No repositories yet. Add your first one!
              </p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Stars</TableHead>
                      <TableHead>GitHub URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell className="font-medium">{repo.name}</TableCell>
                        <TableCell>{repo.language || "N/A"}</TableCell>
                        <TableCell>{repo.stars || 0}</TableCell>
                        <TableCell>
                          {repo.github_url ? (
                            <a
                              href={repo.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(repo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(repo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRepo ? "Edit Repository" : "Add New Repository"}
            </DialogTitle>
            <DialogDescription>
              {editingRepo
                ? "Update the repository details"
                : "Add a new repository to the platform"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Repository Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., react"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the repository"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  value={formData.github_url}
                  onChange={(e) =>
                    setFormData({ ...formData, github_url: e.target.value })
                  }
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Primary Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  placeholder="e.g., JavaScript, Python"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stars">GitHub Stars</Label>
              <Input
                id="stars"
                type="number"
                value={formData.stars}
                onChange={(e) =>
                  setFormData({ ...formData, stars: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="shadow-neon hover:shadow-glow transition-smooth">
                {editingRepo ? "Update" : "Add"} Repository
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepositoryManagement;
