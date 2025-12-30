import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  MessageCircle,
  Clock,
  Tag,
  BookOpen,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ForumPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', scripture_ref: '', tags: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/forum/posts`);
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetail = async (postId) => {
    try {
      const response = await axios.get(`${API_URL}/forum/posts/${postId}`);
      setSelectedPost(response.data.post);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/forum/posts`, {
        title: newPost.title,
        content: newPost.content,
        scripture_ref: newPost.scripture_ref || null,
        tags: newPost.tags ? newPost.tags.split(',').map(t => t.trim()) : []
      }, {
        headers: getAuthHeaders()
      });
      toast.success('Post created!');
      setIsCreateOpen(false);
      setNewPost({ title: '', content: '', scripture_ref: '', tags: '' });
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleUpvotePost = async (postId) => {
    try {
      await axios.post(`${API_URL}/forum/posts/${postId}/upvote`, {}, {
        headers: getAuthHeaders()
      });
      fetchPosts();
      if (selectedPost?.post_id === postId) {
        fetchPostDetail(postId);
      }
    } catch (error) {
      toast.error('Failed to upvote');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await axios.post(`${API_URL}/forum/posts/${selectedPost.post_id}/comments`, {
        content: newComment
      }, {
        headers: getAuthHeaders()
      });
      setNewComment('');
      fetchPostDetail(selectedPost.post_id);
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleUpvoteComment = async (commentId) => {
    try {
      await axios.post(`${API_URL}/forum/comments/${commentId}/upvote`, {}, {
        headers: getAuthHeaders()
      });
      fetchPostDetail(selectedPost.post_id);
    } catch (error) {
      toast.error('Failed to upvote');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A2463] dark:border-[#C5A059]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6" data-testid="forum-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
              <MessageSquare className="w-4 h-4 text-[#C5A059]" />
              <span className="font-medium">Community Forum</span>
              <span className="premium-badge ml-2">Premium</span>
            </div>
            <h1 className="font-serif text-4xl font-bold">Scripture Discussions</h1>
            <p className="text-muted-foreground mt-2">
              Share insights and learn from fellow believers
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-post-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Start a Discussion</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="What would you like to discuss?"
                    required
                    data-testid="post-title-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Share your thoughts..."
                    rows={4}
                    required
                    data-testid="post-content-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Scripture Reference (optional)</label>
                  <Input
                    value={newPost.scripture_ref}
                    onChange={(e) => setNewPost({ ...newPost, scripture_ref: e.target.value })}
                    placeholder="e.g., John 3:16"
                    data-testid="post-scripture-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (comma separated)</label>
                  <Input
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    placeholder="faith, prayer, wisdom"
                    data-testid="post-tags-input"
                  />
                </div>
                <Button type="submit" className="w-full btn-primary" data-testid="submit-post-btn">
                  Post Discussion
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Posts List */}
          <div className="lg:col-span-2 space-y-4">
            {posts.length === 0 ? (
              <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">No discussions yet</h3>
                <p className="text-muted-foreground">Be the first to start a conversation!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.post_id}
                  className="forum-post cursor-pointer"
                  onClick={() => fetchPostDetail(post.post_id)}
                  data-testid={`post-${post.post_id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-semibold mb-2 hover:text-[#0A2463] dark:hover:text-[#C5A059] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2 mb-4">
                        {post.content}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(post.created_at)}
                        </span>
                        <span className="text-muted-foreground">by {post.user_name}</span>
                        {post.scripture_ref && (
                          <span className="flex items-center gap-1 text-[#0A2463] dark:text-[#C5A059]">
                            <BookOpen className="w-4 h-4" />
                            {post.scripture_ref}
                          </span>
                        )}
                      </div>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-muted/50 rounded-full text-xs flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvotePost(post.post_id);
                        }}
                        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`upvote-post-${post.post_id}`}
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </button>
                      <span className="font-medium">{post.upvotes}</span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Post Detail / Sidebar */}
          <div className="lg:col-span-1">
            {selectedPost ? (
              <div className="bg-card border border-border/40 rounded-2xl sticky top-20" data-testid="post-detail">
                <div className="p-6 border-b border-border/40">
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    {selectedPost.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedPost.content}
                  </p>
                  {selectedPost.scripture_ref && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0A2463]/10 dark:bg-[#C5A059]/10 rounded-full text-sm text-[#0A2463] dark:text-[#C5A059]">
                      <BookOpen className="w-4 h-4" />
                      {selectedPost.scripture_ref}
                    </span>
                  )}
                </div>
                
                {/* Comments */}
                <div className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Comments ({comments.length})
                  </h4>
                  
                  <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                    {comments.map((comment) => (
                      <div key={comment.comment_id} className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{comment.user_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                          </div>
                          <button
                            onClick={() => handleUpvoteComment(comment.comment_id)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {comment.upvotes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                      data-testid="comment-input"
                    />
                    <Button type="submit" size="icon" data-testid="submit-comment-btn">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border/40 rounded-2xl p-8 text-center sticky top-20">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Select a discussion to view details and comments
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
