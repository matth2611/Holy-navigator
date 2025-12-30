import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Heart, Calendar, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DevotionalPage = () => {
  const [devotional, setDevotional] = useState(null);
  const [allDevotionals, setAllDevotionals] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('today'); // 'today' or 'all'

  useEffect(() => {
    fetchTodayDevotional();
    fetchAllDevotionals();
  }, []);

  const fetchTodayDevotional = async () => {
    try {
      const response = await axios.get(`${API_URL}/devotional/today`);
      setDevotional(response.data);
    } catch (error) {
      console.error('Error fetching devotional:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDevotionals = async () => {
    try {
      const response = await axios.get(`${API_URL}/devotional/all`);
      setAllDevotionals(response.data.devotionals);
    } catch (error) {
      console.error('Error fetching devotionals:', error);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allDevotionals.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < allDevotionals.length - 1 ? prev + 1 : 0));
  };

  const currentDevotional = viewMode === 'today' ? devotional : allDevotionals[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A2463] dark:border-[#C5A059]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6" data-testid="devotional-page">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
            <Heart className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">Daily Devotional</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Nourish Your Soul
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Start each day with God's Word. Let these devotionals guide your heart and mind.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={viewMode === 'today' ? 'default' : 'outline'}
            onClick={() => setViewMode('today')}
            className="rounded-full"
            data-testid="today-btn"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
            className="rounded-full"
            data-testid="browse-all-btn"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Browse All
          </Button>
        </div>

        {/* Devotional Card */}
        {currentDevotional && (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-lg" data-testid="devotional-card">
            {/* Scripture Banner */}
            <div className="hero-gradient text-white p-8 md:p-12">
              <p className="text-sm font-sans font-medium tracking-widest uppercase text-[#C5A059] mb-4">
                {currentDevotional.scripture}
              </p>
              <blockquote className="font-serif text-2xl md:text-3xl italic leading-relaxed">
                "{currentDevotional.verse_text}"
              </blockquote>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6" data-testid="devotional-title">
                {currentDevotional.title}
              </h2>
              
              <div className="prose prose-lg max-w-none mb-8">
                <h3 className="font-serif text-lg font-semibold text-[#0A2463] dark:text-[#C5A059] mb-3">
                  Reflection
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {currentDevotional.reflection}
                </p>
                
                <h3 className="font-serif text-lg font-semibold text-[#0A2463] dark:text-[#C5A059] mb-3">
                  Prayer
                </h3>
                <p className="font-serif italic text-foreground/80 leading-relaxed">
                  {currentDevotional.prayer}
                </p>
              </div>

              {viewMode === 'today' && devotional?.date && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(devotional.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation for Browse All */}
        {viewMode === 'all' && allDevotionals.length > 0 && (
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={goToPrevious}
              className="rounded-full"
              data-testid="prev-devotional-btn"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {allDevotionals.length}
            </span>
            <Button
              variant="outline"
              onClick={goToNext}
              className="rounded-full"
              data-testid="next-devotional-btn"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevotionalPage;
