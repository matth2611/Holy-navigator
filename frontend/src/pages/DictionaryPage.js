import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from '../components/ui/input';
import { Search, Book, Languages } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DictionaryPage = () => {
  const [words, setWords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDictionary();
  }, []);

  const fetchDictionary = async () => {
    try {
      const response = await axios.get(`${API_URL}/bible/dictionary`);
      // Sort words alphabetically
      const sortedWords = [...response.data.words].sort((a, b) => 
        a.word.toLowerCase().localeCompare(b.word.toLowerCase())
      );
      setWords(sortedWords);
      if (sortedWords.length > 0) {
        setSelectedWord(sortedWords[0]);
      }
    } catch (error) {
      console.error('Error fetching dictionary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const response = await axios.get(`${API_URL}/bible/search?q=${encodeURIComponent(query)}`);
        setWords(response.data.results);
      } catch (error) {
        console.error('Error searching:', error);
      }
    } else {
      fetchDictionary();
    }
  };

  const filteredWords = words
    .filter(word =>
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A2463] dark:border-[#C5A059]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6" data-testid="dictionary-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
            <Book className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">Bible Dictionary</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Explore Biblical Terms
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Discover the deeper meaning of scripture through word studies and original language insights.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 input-style"
              data-testid="dictionary-search"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Word List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border/40 rounded-2xl p-4">
              <h3 className="font-serif text-lg font-semibold mb-4">Terms</h3>
              <div className="space-y-1">
                {filteredWords.map((word) => (
                  <button
                    key={word.word}
                    onClick={() => setSelectedWord(word)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedWord?.word === word.word
                        ? 'bg-[#0A2463]/10 text-[#0A2463] dark:bg-[#C5A059]/10 dark:text-[#C5A059] font-medium'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                    data-testid={`word-${word.word.toLowerCase()}`}
                  >
                    {word.word}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Word Detail */}
          <div className="lg:col-span-2">
            {selectedWord && (
              <div className="bg-card border border-border/40 rounded-2xl p-8" data-testid="word-detail">
                <h2 className="font-serif text-3xl font-bold mb-6" data-testid="word-title">
                  {selectedWord.word}
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-sm font-sans font-medium tracking-widest uppercase text-muted-foreground mb-2">
                    Definition
                  </h3>
                  <p className="text-lg leading-relaxed">
                    {selectedWord.definition}
                  </p>
                </div>

                {/* Original Languages */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {selectedWord.hebrew && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Languages className="w-4 h-4 text-[#C5A059]" />
                        <span className="text-sm font-medium">Hebrew</span>
                      </div>
                      <p className="font-serif text-xl">{selectedWord.hebrew}</p>
                    </div>
                  )}
                  {selectedWord.greek && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Languages className="w-4 h-4 text-[#C5A059]" />
                        <span className="text-sm font-medium">Greek</span>
                      </div>
                      <p className="font-serif text-xl">{selectedWord.greek}</p>
                    </div>
                  )}
                </div>

                {/* Scripture References */}
                {selectedWord.references && selectedWord.references.length > 0 && (
                  <div>
                    <h3 className="text-sm font-sans font-medium tracking-widest uppercase text-muted-foreground mb-3">
                      Scripture References
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWord.references.map((ref) => (
                        <span
                          key={ref}
                          className="px-3 py-1.5 bg-[#0A2463]/10 dark:bg-[#C5A059]/10 rounded-full text-sm font-medium text-[#0A2463] dark:text-[#C5A059]"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DictionaryPage;
