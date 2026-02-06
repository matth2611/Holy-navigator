import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  User, 
  Mail, 
  Crown, 
  BookMarked, 
  PenLine, 
  MessageSquare,
  Settings,
  Bell,
  BellRing,
  Palette,
  Book,
  Calendar,
  Save,
  Check,
  Loader2,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';
import { usePushNotifications } from '../hooks/usePushNotifications';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ProfilePage = () => {
  const { user, token, getAuthHeaders, isPremium, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readingProgress, setReadingProgress] = useState(null);
  
  const [name, setName] = useState('');
  const [settings, setSettings] = useState({
    notification_email: true,
    notification_forum: true,
    preferred_translation: 'WEB',
    theme_preference: 'system'
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    daily_devotional: true,
    daily_news: true,
    reading_plan_reminder: true,
    weekly_sermon_updates: true,
    reminder_time: '07:00'
  });

  // Push notification hook
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    permission: pushPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    sendTestNotification
  } = usePushNotifications(token, isPremium);

  useEffect(() => {
    fetchProfile();
    fetchReadingProgress();
    fetchNotificationPrefs();
  }, []);

  const fetchNotificationPrefs = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/preferences`, {
        headers: getAuthHeaders()
      });
      setNotificationPrefs(response.data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`, {
        headers: getAuthHeaders()
      });
      setProfile(response.data);
      setName(response.data.name);
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadingProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/reading-progress`, {
        headers: getAuthHeaders()
      });
      setReadingProgress(response.data);
    } catch (error) {
      console.error('Error fetching reading progress:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save profile settings
      await axios.put(`${API_URL}/profile`, {
        name,
        ...settings
      }, {
        headers: getAuthHeaders()
      });
      
      // Save notification preferences
      await axios.put(`${API_URL}/notifications/preferences`, notificationPrefs, {
        headers: getAuthHeaders()
      });
      
      updateUser({ name });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-background py-12 px-6" data-testid="profile-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2463]/10 dark:bg-[#C5A059]/10 text-sm mb-4">
            <User className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">My Profile</span>
          </div>
          <h1 className="font-serif text-4xl font-bold mb-4">Account Settings</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Manage your profile, preferences, and track your spiritual journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar - Stats */}
          <div className="md:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-card border border-border/40 rounded-2xl p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#0A2463] to-[#0F172A] flex items-center justify-center">
                {profile?.picture ? (
                  <img src={profile.picture} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-[#C5A059]" />
                )}
              </div>
              <h3 className="font-serif text-xl font-bold">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {isPremium && (
                <div className="mt-3">
                  <span className="premium-badge">
                    <Crown className="w-3 h-3" /> Premium Member
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3" />
                Member since {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
              </p>
            </div>

            {/* Stats Card */}
            <div className="bg-card border border-border/40 rounded-2xl p-6">
              <h3 className="font-serif text-lg font-semibold mb-4">Your Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <BookMarked className="w-4 h-4" />
                    Bookmarks
                  </span>
                  <span className="font-semibold">{profile?.stats?.bookmarks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <PenLine className="w-4 h-4" />
                    Journal Entries
                  </span>
                  <span className="font-semibold">{profile?.stats?.journals || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                    Forum Posts
                  </span>
                  <span className="font-semibold">{profile?.stats?.forum_posts || 0}</span>
                </div>
              </div>
            </div>

            {/* Reading Progress */}
            {readingProgress && (
              <div className="bg-card border border-border/40 rounded-2xl p-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Reading Progress</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Bible Completion</span>
                    <span className="font-medium">{readingProgress.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0A2463] to-[#C5A059]"
                      style={{ width: `${readingProgress.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Books Started</span>
                    <span>{readingProgress.books_started} / {readingProgress.total_books}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chapters Bookmarked</span>
                    <span>{readingProgress.chapters_bookmarked}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Settings */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Settings */}
            <div className="bg-card border border-border/40 rounded-2xl p-6">
              <h3 className="font-serif text-xl font-semibold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#C5A059]" />
                Profile Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                    data-testid="name-input"
                  />
                </div>

                <div>
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2 mt-2 p-3 bg-muted/30 rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-card border border-border/40 rounded-2xl p-6">
              <h3 className="font-serif text-xl font-semibold mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#C5A059]" />
                Preferences
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label>Bible Translation</Label>
                  <Select
                    value={settings.preferred_translation}
                    onValueChange={(value) => setSettings({ ...settings, preferred_translation: value })}
                  >
                    <SelectTrigger className="mt-2" data-testid="translation-select">
                      <SelectValue placeholder="Select translation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEB">World English Bible (WEB)</SelectItem>
                      <SelectItem value="KJV">King James Version (KJV)</SelectItem>
                      <SelectItem value="ASV">American Standard Version (ASV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Theme Preference</Label>
                  <Select
                    value={settings.theme_preference}
                    onValueChange={(value) => setSettings({ ...settings, theme_preference: value })}
                  >
                    <SelectTrigger className="mt-2" data-testid="theme-select">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border/40 rounded-2xl p-6">
              <h3 className="font-serif text-xl font-semibold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#C5A059]" />
                Notifications & Reminders
              </h3>
              
              <div className="space-y-4">
                {/* Push Notifications - Premium Feature */}
                {isPremium && pushSupported && (
                  <div className="bg-gradient-to-r from-[#0A2463]/5 to-[#C5A059]/5 border border-[#C5A059]/20 rounded-xl p-4 mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#C5A059]/10">
                          <BellRing className="w-5 h-5 text-[#C5A059]" />
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            Daily News Push Notifications
                            <span className="premium-badge text-xs">Premium</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Receive a news headline with biblical relevance every day at 7:00 AM
                          </p>
                          {pushPermission === 'denied' && (
                            <p className="text-xs text-red-500 mt-2">
                              Notifications blocked. Please enable them in your browser settings.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {pushLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" />
                        ) : (
                          <Switch
                            checked={pushSubscribed}
                            onCheckedChange={async (checked) => {
                              try {
                                if (checked) {
                                  await subscribePush();
                                  toast.success('Push notifications enabled! You\'ll receive daily news at 7am.');
                                } else {
                                  await unsubscribePush();
                                  toast.success('Push notifications disabled');
                                }
                              } catch (error) {
                                toast.error(error.message || 'Failed to update push notifications');
                              }
                            }}
                            disabled={pushPermission === 'denied'}
                            data-testid="push-notification-switch"
                          />
                        )}
                        {pushSubscribed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await sendTestNotification();
                                toast.success('Test notification sent!');
                              } catch (error) {
                                toast.error('Failed to send test notification');
                              }
                            }}
                            className="text-xs"
                            data-testid="test-push-btn"
                          >
                            <Smartphone className="w-3 h-3 mr-1" />
                            Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Non-premium push notification promo */}
                {!isPremium && pushSupported && (
                  <div className="bg-muted/30 border border-border/40 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <BellRing className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-muted-foreground">Daily News Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Upgrade to Premium to receive daily news headlines with biblical connections.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Devotional Reminder</p>
                    <p className="text-sm text-muted-foreground">Get reminded to read your daily devotional</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.daily_devotional}
                    onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, daily_devotional: checked })}
                    data-testid="devotional-reminder-switch"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily News Updates</p>
                    <p className="text-sm text-muted-foreground">Include news in your daily notifications</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.daily_news}
                    onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, daily_news: checked })}
                    data-testid="daily-news-switch"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reading Plan Reminder</p>
                    <p className="text-sm text-muted-foreground">Daily reminder for Bible in a Year readings</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.reading_plan_reminder}
                    onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, reading_plan_reminder: checked })}
                    data-testid="reading-plan-reminder-switch"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Sermon Updates</p>
                    <p className="text-sm text-muted-foreground">Get notified when new sermons are added</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.weekly_sermon_updates}
                    onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, weekly_sermon_updates: checked })}
                    data-testid="sermon-updates-switch"
                  />
                </div>
                
                <div className="border-t border-border/40 pt-4 mt-4">
                  <Label>Reminder Time</Label>
                  <Select
                    value={notificationPrefs.reminder_time}
                    onValueChange={(value) => setNotificationPrefs({ ...notificationPrefs, reminder_time: value })}
                  >
                    <SelectTrigger className="mt-2" data-testid="reminder-time-select">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="06:00">6:00 AM</SelectItem>
                      <SelectItem value="07:00">7:00 AM</SelectItem>
                      <SelectItem value="08:00">8:00 AM</SelectItem>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="12:00">12:00 PM</SelectItem>
                      <SelectItem value="18:00">6:00 PM</SelectItem>
                      <SelectItem value="20:00">8:00 PM</SelectItem>
                      <SelectItem value="21:00">9:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border-t border-border/40 pt-4 mt-4">
                  <p className="text-sm font-medium mb-3">Email Notifications</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Forum Replies</p>
                      <p className="text-sm text-muted-foreground">Get notified about replies to your posts</p>
                    </div>
                    <Switch
                      checked={settings.notification_forum}
                      onCheckedChange={(checked) => setSettings({ ...settings, notification_forum: checked })}
                      data-testid="forum-notifications-switch"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-primary"
              data-testid="save-profile-btn"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
