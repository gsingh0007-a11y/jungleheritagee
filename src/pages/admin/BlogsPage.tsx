import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    CheckCircle2,
    Clock,
    Loader2,
    Image as ImageIcon,
    Upload
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BlogBlock {
    id: string;
    type: "paragraph" | "heading" | "image";
    content: string;
    level?: 2 | 3; // For headings
    caption?: string; // For images
}

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string | BlogBlock[]; // Can be string (legacy) or array
    featured_image: string;
    category: string;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
}

export default function BlogsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [blocks, setBlocks] = useState<BlogBlock[]>([
        { id: crypto.randomUUID(), type: "paragraph", content: "" }
    ]);
    const [category, setCategory] = useState("");
    const [featuredImage, setFeaturedImage] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [uploading, setUploading] = useState(false);

    const uploadImage = async (file: File): Promise<string> => {
        const fileExt = file.name.split(".").pop();
        const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from("gallery")
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("gallery").getPublicUrl(fileName);
        return data.publicUrl;
    };

    const { data: blogs, isLoading } = useQuery({
        queryKey: ["admin-blogs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("blogs")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Blog[];
        },
    });

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleOpenDialog = (blog?: Blog) => {
        if (blog) {
            setEditingBlog(blog);
            setTitle(blog.title);
            setExcerpt(blog.excerpt || "");

            // Handle legacy content or new block content
            if (typeof blog.content === "string") {
                try {
                    const parsed = JSON.parse(blog.content);
                    setBlocks(Array.isArray(parsed) ? parsed : [{ id: crypto.randomUUID(), type: "paragraph", content: blog.content }]);
                } catch {
                    setBlocks([{ id: crypto.randomUUID(), type: "paragraph", content: blog.content }]);
                }
            } else if (Array.isArray(blog.content)) {
                setBlocks(blog.content);
            } else {
                setBlocks([{ id: crypto.randomUUID(), type: "paragraph", content: "" }]);
            }

            setCategory(blog.category || "");
            setFeaturedImage(blog.featured_image || "");
            setIsPublished(blog.is_published);
        } else {
            setEditingBlog(null);
            setTitle("");
            setExcerpt("");
            setBlocks([{ id: crypto.randomUUID(), type: "paragraph", content: "" }]);
            setCategory("");
            setFeaturedImage("");
            setIsPublished(false);
        }
        setIsDialogOpen(true);
    };

    const upsertBlogMutation = useMutation({
        mutationFn: async () => {
            const slug = generateSlug(title);
            const blogData = {
                title,
                slug,
                excerpt,
                content: JSON.stringify(blocks), // Store blocks as JSON string
                category,
                featured_image: featuredImage,
                is_published: isPublished,
                published_at: isPublished ? (editingBlog?.published_at || new Date().toISOString()) : null,
                updated_at: new Date().toISOString(),
            };

            if (editingBlog?.id) {
                const { error } = await supabase
                    .from("blogs")
                    .update(blogData)
                    .eq("id", editingBlog.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("blogs")
                    .insert([blogData]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
            setIsDialogOpen(false);
            toast({
                title: editingBlog ? "Post updated" : "Post created",
                description: `Your blog post has been ${editingBlog ? "updated" : "created"} successfully.`,
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save blog post",
            });
        },
    });

    const deleteBlogMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("blogs").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
            toast({ title: "Post deleted", description: "The blog post has been removed." });
        },
    });

    const filteredBlogs = blogs?.filter((blog) =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-medium">Blog Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create and manage articles for your resort website
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-grow max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search posts..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Article</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Published</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBlogs?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                No blog posts found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBlogs?.map((blog) => (
                                            <TableRow key={blog.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                                                            {blog.featured_image ? (
                                                                <img src={blog.featured_image} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center">
                                                                    <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="font-medium line-clamp-1">{blog.title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{blog.category || "General"}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {blog.is_published ? (
                                                        <div className="flex items-center gap-2 text-green-600">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span className="text-xs font-medium">Published</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-amber-500">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-xs font-medium">Draft</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {blog.published_at ? format(new Date(blog.published_at), "MMM dd, yyyy") : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenDialog(blog)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Preview
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to delete this post?")) {
                                                                        deleteBlogMutation.mutate(blog.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingBlog ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
                        <DialogDescription>
                            Write and format your article. Use images to make it engaging.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="The Ultimate Guide to Wilderness Sactuary..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Wildlife"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="image">Featured Image</Label>
                                <div className="flex gap-4">
                                    <div className="flex-grow">
                                        <Input
                                            id="image"
                                            value={featuredImage}
                                            onChange={(e) => setFeaturedImage(e.target.value)}
                                            placeholder="https://images.unsplash.com/..."
                                        />
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setUploading(true);
                                                    try {
                                                        const url = await uploadImage(file);
                                                        setFeaturedImage(url);
                                                        toast({ title: "Image uploaded successfully" });
                                                    } catch (error: any) {
                                                        toast({ variant: "destructive", title: "Upload failed", description: error.message });
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }
                                            }}
                                            disabled={uploading}
                                        />
                                        <Button variant="outline" type="button" disabled={uploading}>
                                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="excerpt">Excerpt / Summary</Label>
                            <Textarea
                                id="excerpt"
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="A short summary for the list view..."
                                rows={2}
                            />
                        </div>

                        <div className="grid gap-2 mb-6">
                            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Article Content</Label>
                            <div className="space-y-4">
                                {blocks.map((block, index) => (
                                    <div key={block.id} className="relative group p-4 border rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors">
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-6 w-6 rounded-full shadow-sm"
                                                onClick={() => {
                                                    if (index > 0) {
                                                        const newBlocks = [...blocks];
                                                        [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
                                                        setBlocks(newBlocks);
                                                    }
                                                }}
                                                disabled={index === 0}
                                            >
                                                <MoreVertical className="h-3 w-3 rotate-180" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-6 w-6 rounded-full shadow-sm"
                                                onClick={() => {
                                                    if (index < blocks.length - 1) {
                                                        const newBlocks = [...blocks];
                                                        [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
                                                        setBlocks(newBlocks);
                                                    }
                                                }}
                                                disabled={index === blocks.length - 1}
                                            >
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="flex-grow space-y-3">
                                                {block.type === "heading" && (
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            className="text-xs font-semibold bg-transparent border-none focus:ring-0 text-[hsl(var(--gold))]"
                                                            value={block.level}
                                                            onChange={(e) => {
                                                                const newBlocks = [...blocks];
                                                                newBlocks[index].level = parseInt(e.target.value) as any;
                                                                setBlocks(newBlocks);
                                                            }}
                                                        >
                                                            <option value={2}>Heading 2</option>
                                                            <option value={3}>Heading 3</option>
                                                        </select>
                                                        <Input
                                                            value={block.content}
                                                            onChange={(e) => {
                                                                const newBlocks = [...blocks];
                                                                newBlocks[index].content = e.target.value;
                                                                setBlocks(newBlocks);
                                                            }}
                                                            className="font-serif text-xl border-none p-0 focus-visible:ring-0 bg-transparent"
                                                            placeholder="Enter heading..."
                                                        />
                                                    </div>
                                                )}

                                                {block.type === "paragraph" && (
                                                    <Textarea
                                                        value={block.content}
                                                        onChange={(e) => {
                                                            const newBlocks = [...blocks];
                                                            newBlocks[index].content = e.target.value;
                                                            setBlocks(newBlocks);
                                                        }}
                                                        className="border-none p-0 focus-visible:ring-0 bg-transparent resize-none min-h-[100px]"
                                                        placeholder="Start writing..."
                                                    />
                                                )}

                                                {block.type === "image" && (
                                                    <div className="space-y-3">
                                                        <div className="flex gap-3">
                                                            <ImageIcon className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
                                                            <div className="flex-grow flex gap-2">
                                                                <Input
                                                                    value={block.content}
                                                                    onChange={(e) => {
                                                                        const newBlocks = [...blocks];
                                                                        newBlocks[index].content = e.target.value;
                                                                        setBlocks(newBlocks);
                                                                    }}
                                                                    className="border-none p-0 focus-visible:ring-0 bg-transparent"
                                                                    placeholder="Paste image URL here..."
                                                                />
                                                                <div className="relative">
                                                                    <Input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                                        onChange={async (e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                setUploading(true);
                                                                                try {
                                                                                    const url = await uploadImage(file);
                                                                                    const newBlocks = [...blocks];
                                                                                    newBlocks[index].content = url;
                                                                                    setBlocks(newBlocks);
                                                                                    toast({ title: "Image uploaded successfully" });
                                                                                } catch (error: any) {
                                                                                    toast({ variant: "destructive", title: "Upload failed", description: error.message });
                                                                                } finally {
                                                                                    setUploading(false);
                                                                                }
                                                                            }
                                                                        }}
                                                                        disabled={uploading}
                                                                    />
                                                                    <Button variant="outline" size="sm" type="button" disabled={uploading}>
                                                                        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Input
                                                            value={block.caption}
                                                            onChange={(e) => {
                                                                const newBlocks = [...blocks];
                                                                newBlocks[index].caption = e.target.value;
                                                                setBlocks(newBlocks);
                                                            }}
                                                            className="text-xs text-muted-foreground border-none p-0 focus-visible:ring-0 bg-transparent"
                                                            placeholder="Image caption (optional)..."
                                                        />
                                                        {block.content && (
                                                            <div className="mt-2 rounded-lg overflow-hidden border">
                                                                <img src={block.content} alt="Preview" className="max-h-48 w-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    if (blocks.length > 1) {
                                                        setBlocks(blocks.filter((_, i) => i !== index));
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full h-8"
                                    onClick={() => setBlocks([...blocks, { id: crypto.randomUUID(), type: "paragraph", content: "" }])}
                                >
                                    <Plus className="h-3 w-3 mr-2" /> Text
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full h-8"
                                    onClick={() => setBlocks([...blocks, { id: crypto.randomUUID(), type: "heading", content: "", level: 2 }])}
                                >
                                    <Plus className="h-3 w-3 mr-2" /> Heading
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full h-8"
                                    onClick={() => setBlocks([...blocks, { id: crypto.randomUUID(), type: "image", content: "", caption: "" }])}
                                >
                                    <Plus className="h-3 w-3 mr-2" /> Image
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed text-sm">
                            <div className="space-y-0.5">
                                <Label>Publish Article</Label>
                                <p className="text-muted-foreground">Make this post visible to everyone</p>
                            </div>
                            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => upsertBlogMutation.mutate()}
                            disabled={upsertBlogMutation.isPending || !title || blocks.length === 0}
                        >
                            {upsertBlogMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingBlog ? "Update Post" : "Create Post"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
