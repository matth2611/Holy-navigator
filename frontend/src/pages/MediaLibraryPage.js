import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Play, 
  Video, 
  Headphones, 
  Clock, 
  Calendar,
  User,
  Tag,
  Bell,
  X,
  CheckCircle,
  Circle
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MediaLibraryPage = () => {
  const { getAuthHeaders } = useAuth();
  const [videos, setVideos] = useState([]);
  const [audio, setAudio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await axios.get(`${API_URL}/media/all`, {
        headers: getAuthHeaders()
      });
      setVideos(response.data.videos);
      setAudio(response.data.audio);
      setNotice(response.data.notice);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackMedia = async (mediaId, isTracked) => {
    try {
      if (isTracked) {
        await axios.delete(`${API_URL}/media/track/${mediaId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Removed from watched list');
      } else {
        await axios.post(`${API_URL}/media/track/${mediaId}`, {}, {
          headers: getAuthHeaders()
        });
        toast.success('Marked as watched');
      }
      fetchMedia(); // Refresh to update status
    } catch (error) {
      toast.error('Failed to update watch status');
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
    <div className="min-h-screen bg-background py-12 px-6" data-testid="media-library-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
            <Video className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">Media Library</span>
            <span className="premium-badge ml-2">Premium</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            End Times & Prophecy Sermons
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Deepen your understanding of biblical prophecy with curated video and audio teachings from trusted Bible teachers.
          </p>
          
          {/* Weekly Update Notice */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#0A2463]/10 to-[#C5A059]/10 dark:from-[#C5A059]/20 dark:to-[#0A2463]/20 rounded-full border border-[#C5A059]/30">
            <Bell className="w-5 h-5 text-[#C5A059]" />
            <span className="text-sm font-medium">{notice}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="videos" className="flex items-center gap-2" data-testid="videos-tab">
              <Video className="w-4 h-4" />
              Video Sermons ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2" data-testid="audio-tab">
              <Headphones className="w-4 h-4" />
              Audio Sermons ({audio.length})
            </TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div 
                  key={video.id}
                  className="bg-card border border-border/40 rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300 card-hover"
                  data-testid={`video-card-${video.id}`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => setSelectedVideo(video)}
                        className="bg-[#C5A059] hover:bg-[#B49048] text-[#0A2463] rounded-full"
                        data-testid={`play-video-${video.id}`}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Watch Now
                      </Button>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-[#0A2463]/10 dark:bg-[#C5A059]/10 rounded-full text-xs font-medium text-[#0A2463] dark:text-[#C5A059]">
                        {video.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                      <User className="w-4 h-4" />
                      {video.preacher}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio">
            <div className="space-y-4">
              {audio.map((sermon) => (
                <div 
                  key={sermon.id}
                  className="bg-card border border-border/40 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-lg transition-all duration-300"
                  data-testid={`audio-card-${sermon.id}`}
                >
                  {/* Play Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setSelectedAudio(selectedAudio?.id === sermon.id ? null : sermon)}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        selectedAudio?.id === sermon.id
                          ? 'bg-[#C5A059] text-[#0A2463]'
                          : 'bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-[#0A2463] dark:text-[#C5A059] hover:bg-[#0A2463]/20 dark:hover:bg-[#C5A059]/20'
                      }`}
                      data-testid={`play-audio-${sermon.id}`}
                    >
                      <Headphones className="w-7 h-7" />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-[#0A2463]/10 dark:bg-[#C5A059]/10 rounded-full text-xs font-medium text-[#0A2463] dark:text-[#C5A059]">
                        {sermon.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sermon.duration}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold mb-1">
                      {sermon.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <User className="w-4 h-4" />
                      {sermon.preacher}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sermon.description}
                    </p>
                    
                    {/* Audio Player */}
                    {selectedAudio?.id === sermon.id && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-2">Now Playing</p>
                        <audio 
                          controls 
                          className="w-full" 
                          autoPlay
                          data-testid={`audio-player-${sermon.id}`}
                        >
                          <source src={sermon.audio_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Categories */}
        <div className="mt-16 text-center">
          <h3 className="font-serif text-xl font-semibold mb-4">Topics Covered</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {['Revelation', 'Daniel', 'Prophecy', 'Eschatology', 'Second Coming', 'Tribulation', 'Israel', 'End Times'].map((cat) => (
              <span 
                key={cat}
                className="px-4 py-2 bg-muted/50 rounded-full text-sm font-medium flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Video Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" data-testid="video-modal">
            <div className="bg-card rounded-2xl overflow-hidden max-w-4xl w-full">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-serif text-xl font-semibold">{selectedVideo.title}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedVideo(null)}
                  data-testid="close-video-modal"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="aspect-video">
                <iframe
                  src={selectedVideo.video_url}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  {selectedVideo.preacher}
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4" />
                  {selectedVideo.duration}
                </p>
                <p className="text-muted-foreground">{selectedVideo.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibraryPage;
