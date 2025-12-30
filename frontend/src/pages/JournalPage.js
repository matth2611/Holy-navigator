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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  PenLine, 
  Plus, 
  Calendar,
  BookOpen,
  Smile,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MOODS = [
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'peaceful', label: 'Peaceful', emoji: '☮️' },
  { value: 'joyful', label: 'Joyful', emoji: '😊' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔' },
  { value: 'hopeful', label: 'Hopeful', emoji: '✨' },
  { value: 'challenged', label: 'Challenged', emoji: '💪' },
];

const JournalPage = () => {
  const { getAuthHeaders } = useAuth();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ 
    title: '', 
    content: '', 
    scripture_ref: '', 
    mood: '' 
  });

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const response = await axios.get(`${API_URL}/journal`, {
        headers: getAuthHeaders()
      });
      setJournals(response.data.journals);
      if (response.data.journals.length > 0 && !selectedJournal) {
        setSelectedJournal(response.data.journals[0]);
      }
    } catch (error) {
      console.error('Error fetching journals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/journal`, {
        title: newEntry.title,
        content: newEntry.content,
        scripture_ref: newEntry.scripture_ref || null,
        mood: newEntry.mood || null
      }, {
        headers: getAuthHeaders()
      });
      toast.success('Journal entry saved!');
      setIsCreateOpen(false);
      setNewEntry({ title: '', content: '', scripture_ref: '', mood: '' });
      fetchJournals();
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };

  const handleDelete = async (journalId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await axios.delete(`${API_URL}/journal/${journalId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Entry deleted');
      if (selectedJournal?.journal_id === journalId) {
        setSelectedJournal(null);
      }
      fetchJournals();
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const getMoodEmoji = (mood) => {
    const found = MOODS.find(m => m.value === mood);
    return found ? found.emoji : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A2463] dark:border-[#C5A059]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6" data-testid="journal-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
              <PenLine className="w-4 h-4 text-[#C5A059]" />
              <span className="font-medium">Personal Journal</span>
              <span className="premium-badge ml-2">Premium</span>
            </div>
            <h1 className="font-serif text-4xl font-bold">My Spiritual Journal</h1>
            <p className="text-muted-foreground mt-2">
              Document your faith journey and reflections
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="new-entry-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">New Journal Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    placeholder="Give your entry a title..."
                    required
                    data-testid="journal-title-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Thoughts</label>
                  <Textarea
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                    placeholder="Write your reflections..."
                    rows={6}
                    required
                    data-testid="journal-content-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Scripture Reference</label>
                    <Input
                      value={newEntry.scripture_ref}
                      onChange={(e) => setNewEntry({ ...newEntry, scripture_ref: e.target.value })}
                      placeholder="e.g., Psalm 23"
                      data-testid="journal-scripture-input"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mood</label>
                    <Select
                      value={newEntry.mood}
                      onValueChange={(value) => setNewEntry({ ...newEntry, mood: value })}
                    >
                      <SelectTrigger data-testid="journal-mood-select">
                        <SelectValue placeholder="How are you feeling?" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((mood) => (
                          <SelectItem key={mood.value} value={mood.value}>
                            {mood.emoji} {mood.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary" data-testid="save-entry-btn">
                  Save Entry
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Journal List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border/40 rounded-2xl">
              <div className="p-4 border-b border-border/40">
                <h3 className="font-serif text-lg font-semibold">Entries</h3>
              </div>
              <div className="divide-y divide-border/40 max-h-[600px] overflow-y-auto">
                {journals.length === 0 ? (
                  <div className="p-8 text-center">
                    <PenLine className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No entries yet. Start journaling!
                    </p>
                  </div>
                ) : (
                  journals.map((journal) => (
                    <button
                      key={journal.journal_id}
                      onClick={() => setSelectedJournal(journal)}
                      className={`w-full text-left p-4 transition-colors ${
                        selectedJournal?.journal_id === journal.journal_id
                          ? 'bg-[#0A2463]/5 dark:bg-[#C5A059]/5'
                          : 'hover:bg-muted/30'
                      }`}
                      data-testid={`journal-entry-${journal.journal_id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {journal.mood && (
                              <span className="text-lg">{getMoodEmoji(journal.mood)}</span>
                            )}
                            <h4 className="font-medium truncate">{journal.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {journal.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(journal.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Journal Detail */}
          <div className="lg:col-span-2">
            {selectedJournal ? (
              <div className="bg-card border border-border/40 rounded-2xl" data-testid="journal-detail">
                <div className="p-6 border-b border-border/40 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {selectedJournal.mood && (
                        <span className="text-2xl">{getMoodEmoji(selectedJournal.mood)}</span>
                      )}
                      <h2 className="font-serif text-2xl font-bold">{selectedJournal.title}</h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedJournal.created_at)}
                      </span>
                      {selectedJournal.scripture_ref && (
                        <span className="flex items-center gap-1 text-[#0A2463] dark:text-[#C5A059]">
                          <BookOpen className="w-4 h-4" />
                          {selectedJournal.scripture_ref}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(selectedJournal.journal_id)}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid="delete-entry-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-6">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {selectedJournal.content}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
                <PenLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">Select an Entry</h3>
                <p className="text-muted-foreground">
                  Choose a journal entry to read, or create a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
