import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Bookmark,
  BookMarked,
  Menu,
  X,
  Search,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const BiblePage = () => {
  const { book, chapter } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, getAuthHeaders } = useAuth();
  
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(book || 'Genesis');
  const [currentChapter, setCurrentChapter] = useState(parseInt(chapter) || 1);
  const [verses, setVerses] = useState([]);
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  
  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchBooks();
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (book && chapter) {
      setCurrentBook(book);
      setCurrentChapter(parseInt(chapter));
    }
    fetchChapter();
  }, [book, chapter, currentBook, currentChapter]);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/bible/books`);
      setBooks(response.data.books);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchChapter = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/bible/chapter/${currentBook}/${currentChapter}`);
      setVerses(response.data.verses);
      setTranslation(response.data.translation || 'World English Bible');
    } catch (error) {
      console.error('Error fetching chapter:', error);
      toast.error('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await axios.get(`${API_URL}/bible/search/verses?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const goToSearchResult = (result) => {
    navigateToChapter(result.book, result.chapter);
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookmarks`, {
        headers: getAuthHeaders()
      });
      setBookmarks(response.data.bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const getCurrentBookInfo = () => {
    return books.find(b => b.name === currentBook) || { chapters: 1 };
  };

  const navigateToChapter = (bookName, chapterNum) => {
    setCurrentBook(bookName);
    setCurrentChapter(chapterNum);
    navigate(`/bible/${encodeURIComponent(bookName)}/${chapterNum}`);
    setSidebarOpen(false);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => {
    if (currentChapter > 1) {
      navigateToChapter(currentBook, currentChapter - 1);
    } else {
      const currentIndex = books.findIndex(b => b.name === currentBook);
      if (currentIndex > 0) {
        const prevBook = books[currentIndex - 1];
        navigateToChapter(prevBook.name, prevBook.chapters);
      }
    }
  };

  const goToNext = () => {
    const bookInfo = getCurrentBookInfo();
    if (currentChapter < bookInfo.chapters) {
      navigateToChapter(currentBook, currentChapter + 1);
    } else {
      const currentIndex = books.findIndex(b => b.name === currentBook);
      if (currentIndex < books.length - 1) {
        navigateToChapter(books[currentIndex + 1].name, 1);
      }
    }
  };

  const addBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/bookmarks`, {
        book: currentBook,
        chapter: currentChapter
      }, {
        headers: getAuthHeaders()
      });
      toast.success('Bookmark added!');
      fetchBookmarks();
    } catch (error) {
      toast.error('Failed to add bookmark');
    }
  };

  const isBookmarked = bookmarks.some(
    b => b.book === currentBook && b.chapter === currentChapter
  );

  const oldTestament = books.filter(b => b.testament === 'Old');
  const newTestament = books.filter(b => b.testament === 'New');

  return (
    <div className="min-h-screen bg-background" data-testid="bible-page">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2 bg-card border border-border rounded-lg shadow-lg"
        data-testid="sidebar-toggle"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-card border-r border-border z-30 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#C5A059]" />
                Books of the Bible
              </h2>
              
              {/* Old Testament */}
              <div className="mb-6">
                <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-muted-foreground mb-2">
                  Old Testament
                </h3>
                <div className="space-y-1">
                  {oldTestament.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => navigateToChapter(b.name, 1)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentBook === b.name
                          ? 'bg-[#0A2463]/10 text-[#0A2463] dark:bg-[#C5A059]/10 dark:text-[#C5A059] font-medium'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      data-testid={`book-${b.name}`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* New Testament */}
              <div>
                <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-muted-foreground mb-2">
                  New Testament
                </h3>
                <div className="space-y-1">
                  {newTestament.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => navigateToChapter(b.name, 1)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentBook === b.name
                          ? 'bg-[#0A2463]/10 text-[#0A2463] dark:bg-[#C5A059]/10 dark:text-[#C5A059] font-medium'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      data-testid={`book-${b.name}`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-3xl mx-auto px-6 py-8 lg:py-12">
            {/* Chapter Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl font-bold" data-testid="chapter-title">
                    {currentBook} {currentChapter}
                  </h1>
                  {translation && (
                    <p className="text-sm text-muted-foreground mt-1">{translation}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Search Button */}
                  <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid="search-btn">
                        <Search className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">Search Scripture</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSearch} className="mt-4">
                        <div className="flex gap-2">
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for words or phrases..."
                            className="flex-1"
                            data-testid="search-input"
                          />
                          <Button type="submit" disabled={searching} data-testid="search-submit">
                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>
                      </form>
                      
                      {searchResults.length > 0 && (
                        <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => goToSearchResult(result)}
                              className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              data-testid={`search-result-${idx}`}
                            >
                              <p className="font-semibold text-sm text-[#0A2463] dark:text-[#C5A059]">
                                {result.reference}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {result.text}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {searchQuery && searchResults.length === 0 && !searching && (
                        <p className="text-center text-muted-foreground mt-4 text-sm">
                          No results found. Try different keywords.
                        </p>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={addBookmark}
                    className={isBookmarked ? 'text-[#C5A059]' : ''}
                    data-testid="bookmark-btn"
                  >
                    {isBookmarked ? (
                      <BookMarked className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Chapter Selector */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: getCurrentBookInfo().chapters }, (_, i) => i + 1).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => navigateToChapter(currentBook, ch)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      ch === currentChapter
                        ? 'bg-[#0A2463] text-white dark:bg-[#C5A059] dark:text-[#0A2463]'
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                    }`}
                    data-testid={`chapter-${ch}`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Verses */}
            <div className="mb-12" data-testid="verses-container">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-pulse h-6 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="scripture-text space-y-4">
                  {verses.map((verse) => (
                    <p key={verse.verse} className="leading-loose" data-testid={`verse-${verse.verse}`}>
                      <sup className="verse-number">{verse.verse}</sup>
                      {verse.text}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <Button
                variant="outline"
                onClick={goToPrevious}
                className="rounded-full"
                data-testid="prev-chapter-btn"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={goToNext}
                className="rounded-full"
                data-testid="next-chapter-btn"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default BiblePage;
