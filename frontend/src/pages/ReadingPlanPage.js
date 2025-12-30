import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  BookOpen, 
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Clock,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ReadingPlanPage = () => {
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const [todayReading, setTodayReading] = useState(null);
  const [progress, setProgress] = useState(null);
  const [allReadings, setAllReadings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today'); // 'today' or 'calendar'

  useEffect(() => {
    fetchTodayReading();
    if (isAuthenticated) {
      fetchProgress();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchAllReadings();
    }
  }, [viewMode, currentPage]);

  const fetchTodayReading = async () => {
    try {
      const response = await axios.get(`${API_URL}/reading-plan/today`);
      setTodayReading(response.data);
    } catch (error) {
      console.error('Error fetching today reading:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/reading-plan/progress`, {
        headers: getAuthHeaders()
      });
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchAllReadings = async () => {
    try {
      const response = await axios.get(`${API_URL}/reading-plan?page=${currentPage}&limit=31`);
      setAllReadings(response.data.readings);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  const markComplete = async (day) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to track progress');
      return;
    }

    try {
      await axios.post(`${API_URL}/reading-plan/complete/${day}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Reading completed!');
      fetchProgress();
    } catch (error) {
      toast.error('Failed to mark complete');
    }
  };

  const unmarkComplete = async (day) => {
    try {
      await axios.delete(`${API_URL}/reading-plan/complete/${day}`, {
        headers: getAuthHeaders()
      });
      toast.success('Reading unmarked');
      fetchProgress();
    } catch (error) {
      toast.error('Failed to unmark');
    }
  };

  const isDayComplete = (day) => {
    return progress?.completed_list?.includes(day);
  };

  const getMonthName = (page) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[(page - 1) % 12];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A2463] dark:border-[#C5A059]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6" data-testid="reading-plan-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
            <Target className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">Bible in a Year</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Read Through the Bible
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Journey through the entire Bible in one year with daily readings from the Old and New Testaments.
          </p>
        </div>

        {/* Progress Card */}
        {isAuthenticated && progress && (
          <div className="bg-gradient-to-br from-[#0A2463] to-[#0F172A] text-white rounded-2xl p-6 md:p-8 mb-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#C5A059]">{progress.completed_days}</div>
                <div className="text-sm text-white/70">Days Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#C5A059]">{progress.progress_percentage}%</div>
                <div className="text-sm text-white/70">Progress</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-8 h-8 text-orange-400" />
                  <span className="text-4xl font-bold">{progress.current_streak}</span>
                </div>
                <div className="text-sm text-white/70">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#C5A059]">{365 - progress.completed_days}</div>
                <div className="text-sm text-white/70">Days Remaining</div>
              </div>
            </div>
            <div className="mt-6">
              <Progress value={progress.progress_percentage} className="h-3 bg-white/20" />
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={viewMode === 'today' ? 'default' : 'outline'}
            onClick={() => setViewMode('today')}
            className="rounded-full"
            data-testid="today-view-btn"
          >
            <Clock className="w-4 h-4 mr-2" />
            Today's Reading
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className="rounded-full"
            data-testid="calendar-view-btn"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Full Calendar
          </Button>
        </div>

        {/* Today's Reading View */}
        {viewMode === 'today' && todayReading && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-lg" data-testid="today-reading-card">
              {/* Header */}
              <div className="hero-gradient text-white p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[#C5A059]">
                    Day {todayReading.day} of 365
                  </span>
                  <span className="text-sm text-white/70">{todayReading.date}</span>
                </div>
                <h2 className="font-serif text-3xl font-bold mb-2">{todayReading.theme}</h2>
              </div>

              {/* Readings */}
              <div className="p-8">
                <h3 className="text-sm font-sans font-medium tracking-widest uppercase text-muted-foreground mb-4">
                  Today's Readings
                </h3>
                <div className="space-y-4 mb-8">
                  {todayReading.readings.map((reading, idx) => (
                    <Link
                      key={idx}
                      to={`/bible/${encodeURIComponent(reading.book)}/1`}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors group"
                      data-testid={`reading-link-${idx}`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#0A2463]/10 dark:bg-[#C5A059]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-[#0A2463] dark:text-[#C5A059]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-serif text-xl font-semibold">
                          {reading.book} {reading.chapters}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reading.book.includes('Psalm') || reading.book.includes('Proverb') 
                            ? 'Old Testament Poetry' 
                            : ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'].includes(reading.book) 
                              ? 'Old Testament' 
                              : 'New Testament'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  ))}
                </div>

                {/* Mark Complete Button */}
                {isAuthenticated && (
                  <Button
                    onClick={() => isDayComplete(todayReading.day) 
                      ? unmarkComplete(todayReading.day) 
                      : markComplete(todayReading.day)
                    }
                    className={`w-full rounded-full ${
                      isDayComplete(todayReading.day)
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'btn-primary'
                    }`}
                    data-testid="mark-complete-btn"
                  >
                    {isDayComplete(todayReading.day) ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Completed!
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                )}

                {!isAuthenticated && (
                  <Link to="/login">
                    <Button className="w-full btn-primary">
                      Sign in to Track Progress
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-full"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <h3 className="font-serif text-2xl font-bold">{getMonthName(currentPage)}</h3>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Readings Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allReadings.map((reading) => (
                <div
                  key={reading.day}
                  className={`bg-card border rounded-xl p-4 transition-all ${
                    isDayComplete(reading.day)
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-border/40 hover:border-[#0A2463]/30 dark:hover:border-[#C5A059]/30'
                  }`}
                  data-testid={`day-card-${reading.day}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Day {reading.day}</span>
                      <h4 className="font-serif font-semibold">{reading.theme}</h4>
                    </div>
                    {isDayComplete(reading.day) && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    {reading.readings.map((r, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground">
                        {r.book} {r.chapters}
                      </p>
                    ))}
                  </div>

                  {isAuthenticated && (
                    <Button
                      variant={isDayComplete(reading.day) ? "outline" : "default"}
                      size="sm"
                      className="w-full rounded-full"
                      onClick={() => isDayComplete(reading.day) 
                        ? unmarkComplete(reading.day) 
                        : markComplete(reading.day)
                      }
                    >
                      {isDayComplete(reading.day) ? 'Completed' : 'Mark Complete'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C5A059]/10 mb-4">
            <Trophy className="w-4 h-4 text-[#C5A059]" />
            <span className="text-sm font-medium">Stay Consistent</span>
          </div>
          <h3 className="font-serif text-2xl font-bold mb-4">
            Tips for Success
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border border-border/40 rounded-xl p-6">
              <Clock className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Set a Daily Time</h4>
              <p className="text-sm text-muted-foreground">Choose a consistent time each day for your reading</p>
            </div>
            <div className="bg-card border border-border/40 rounded-xl p-6">
              <BookOpen className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Read Both Passages</h4>
              <p className="text-sm text-muted-foreground">Old and New Testament together for full context</p>
            </div>
            <div className="bg-card border border-border/40 rounded-xl p-6">
              <Flame className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Keep Your Streak</h4>
              <p className="text-sm text-muted-foreground">Build momentum with consecutive days of reading</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingPlanPage;
