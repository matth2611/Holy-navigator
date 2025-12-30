import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  Newspaper, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const NewsAnalysisPage = () => {
  const { getAuthHeaders } = useAuth();
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/analyze/history`, {
        headers: getAuthHeaders()
      });
      setHistory(response.data.analyses);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!headline.trim() || !content.trim()) {
      toast.error('Please enter both headline and content');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/analyze/news`, {
        news_headline: headline,
        news_content: content
      }, {
        headers: getAuthHeaders()
      });
      setResult(response.data);
      fetchHistory();
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadFromHistory = (item) => {
    setResult(item);
    setHeadline(item.news_headline);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6" data-testid="news-analysis-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
            <Newspaper className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">AI-Powered Analysis</span>
            <span className="premium-badge ml-2">Premium</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            News-Scripture Connection
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Discover how current events connect to biblical wisdom and eternal truths.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <div className="bg-card border border-border/40 rounded-2xl p-6 mb-6">
              <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
                Analyze News
              </h2>
              
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">News Headline</label>
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Enter the news headline..."
                    className="input-style"
                    data-testid="news-headline-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">News Content</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste or type the news article content..."
                    rows={6}
                    className="input-style resize-none"
                    data-testid="news-content-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={analyzing}
                  data-testid="analyze-btn"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Connection
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between"
                  data-testid="history-toggle"
                >
                  <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Recent Analyses
                  </h3>
                  <ChevronRight className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                </button>
                
                {showHistory && (
                  <div className="mt-4 space-y-2">
                    {history.slice(0, 5).map((item) => (
                      <button
                        key={item.analysis_id}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        data-testid={`history-item-${item.analysis_id}`}
                      >
                        <p className="font-medium text-sm truncate">{item.news_headline}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result Section */}
          <div>
            {analyzing ? (
              <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C5A059] mx-auto mb-4"></div>
                <p className="text-muted-foreground">Analyzing scripture connections...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
              </div>
            ) : result ? (
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden" data-testid="analysis-result">
                <div className="hero-gradient text-white p-6">
                  <h3 className="font-serif text-xl font-bold">{result.news_headline}</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Scripture References */}
                  <div>
                    <h4 className="text-sm font-sans font-medium tracking-widest uppercase text-muted-foreground mb-4">
                      Scripture Connections
                    </h4>
                    <div className="space-y-4">
                      {result.scripture_references?.map((ref, index) => (
                        <div key={index} className="bg-muted/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-[#C5A059]" />
                            <span className="font-semibold text-[#0A2463] dark:text-[#C5A059]">
                              {ref.reference}
                            </span>
                          </div>
                          {ref.text && (
                            <p className="font-serif italic text-foreground/80 mb-2">
                              "{ref.text}"
                            </p>
                          )}
                          {ref.connection && (
                            <p className="text-sm text-muted-foreground">
                              {ref.connection}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analysis */}
                  {result.analysis && (
                    <div>
                      <h4 className="text-sm font-sans font-medium tracking-widest uppercase text-muted-foreground mb-3">
                        Analysis
                      </h4>
                      <p className="text-foreground/80 leading-relaxed">
                        {result.analysis}
                      </p>
                    </div>
                  )}

                  {/* Spiritual Application */}
                  {result.spiritual_application && (
                    <div className="bg-[#0A2463]/5 dark:bg-[#C5A059]/5 rounded-xl p-4">
                      <h4 className="text-sm font-sans font-medium tracking-widest uppercase text-[#0A2463] dark:text-[#C5A059] mb-2">
                        Spiritual Application
                      </h4>
                      <p className="text-foreground/80">
                        {result.spiritual_application}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-muted-foreground">
                  Enter a news article to discover its biblical connections.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsAnalysisPage;
