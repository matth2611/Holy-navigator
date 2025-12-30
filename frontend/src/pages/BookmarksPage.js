import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { BookMarked, Trash2, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const BookmarksPage = () => {
  const { getAuthHeaders } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookmarks`, {
        headers: getAuthHeaders()
      });
      setBookmarks(response.data.bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookmarkId) => {
    try {
      await axios.delete(`${API_URL}/bookmarks/${bookmarkId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Bookmark removed');
      fetchBookmarks();
    } catch (error) {
      toast.error('Failed to remove bookmark');
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
    <div className="min-h-screen bg-background py-12 px-6" data-testid="bookmarks-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
            <BookMarked className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">My Bookmarks</span>
          </div>
          <h1 className="font-serif text-4xl font-bold mb-4">Saved Passages</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Quick access to your favorite Bible chapters and verses.
          </p>
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
            <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-6">
              Start reading the Bible and bookmark your favorite passages.
            </p>
            <Link to="/bible">
              <Button className="btn-primary">
                <BookOpen className="w-4 h-4 mr-2" />
                Read Bible
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.bookmark_id}
                className="bg-card border border-border/40 rounded-2xl p-6 flex items-center justify-between gap-4 group hover:shadow-md transition-all"
                data-testid={`bookmark-${bookmark.bookmark_id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0A2463]/10 dark:bg-[#C5A059]/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#0A2463] dark:text-[#C5A059]" />
                  </div>
                  <div>
                    <Link 
                      to={`/bible/${encodeURIComponent(bookmark.book)}/${bookmark.chapter}`}
                      className="font-serif text-xl font-semibold hover:text-[#0A2463] dark:hover:text-[#C5A059] transition-colors"
                    >
                      {bookmark.book} {bookmark.chapter}
                      {bookmark.verse && `:${bookmark.verse}`}
                    </Link>
                    {bookmark.note && (
                      <p className="text-sm text-muted-foreground mt-1">{bookmark.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(bookmark.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/bible/${encodeURIComponent(bookmark.book)}/${bookmark.chapter}`}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      Read
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(bookmark.bookmark_id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    data-testid={`delete-bookmark-${bookmark.bookmark_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;
