import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Settings, Moon, Sun, LayoutGrid, LineChart as LineChartIcon, Bell, Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import ManageMonitorItem from './ManageMonitorItem';
import ConstantCardModal from './ConstantCardModal';
import DexRates from './DexRates';
import './App.css';
import 'react-grid-layout/css/styles.css';

interface MonitorSummary {
  monitor_id: string;
  monitor_name: string | null;
  url: string;
  unit: string | null;
  total_records: number;
  latest_value: number | null;
  latest_timestamp: string;
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
  change_count: number;
  hidden?: boolean;
  tags?: string[];
}

interface ConstantCard {
  id: string;
  name: string;
  value: number;
  unit: string | null;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

interface ChartData {
  monitor_id: string;
  monitor_name: string;
  url: string;
  data: Array<{
    timestamp: string;
    value: number | null;
    status: string;
  }>;
  summary: {
    total_points: number;
    date_range: string;
    value_range: {
      min: number | null;
      max: number | null;
      avg: number | null;
    };
    changes_detected: number;
    latest_value: number | null;
    latest_timestamp: string | null;
  };
}

// Alert level configurations (outside component to avoid re-creation)
const ALERT_LEVELS = {
  critical: { interval: 30, volume: 0.8, requireInteraction: true },
  high: { interval: 120, volume: 0.6, requireInteraction: false },
  medium: { interval: 300, volume: 0.3, requireInteraction: false },
  low: { interval: 900, volume: 0.1, requireInteraction: false }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [monitors, setMonitors] = useState<MonitorSummary[]>([]);
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'monitors' | 'pushover'>('monitors');
  const [pushoverUserKey, setPushoverUserKey] = useState('');
  const [pushoverApiToken, setPushoverApiToken] = useState('');
  const [hiddenMonitors, setHiddenMonitors] = useState<Set<string>>(new Set());
  const [monitorTags, setMonitorTags] = useState<Map<string, string[]>>(new Map());
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [monitorNames, setMonitorNames] = useState<Map<string, string>>(new Map());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detail' | 'dex'>('overview');
  const [gridLayout, setGridLayout] = useState<any[]>([]);
  const [miniChartData, setMiniChartData] = useState<Map<string, any[]>>(new Map());
  const [thresholds, setThresholds] = useState<Map<string, {upper?: number, lower?: number, level?: string}>>(new Map());
  const [showThresholdPopover, setShowThresholdPopover] = useState<string | null>(null);
  const [alertStates, setAlertStates] = useState<Map<string, {lastNotified: number, isActive: boolean}>>(new Map());
  const [monitorFormulas, setMonitorFormulas] = useState<Map<string, string>>(new Map());
  const [constants, setConstants] = useState<ConstantCard[]>([]);
  const [showConstantModal, setShowConstantModal] = useState(false);
  const [editingConstant, setEditingConstant] = useState<ConstantCard | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if already logged in
  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }

    // Load hidden monitors and tags from localStorage
    const savedHidden = localStorage.getItem('hiddenMonitors');
    if (savedHidden) {
      setHiddenMonitors(new Set(JSON.parse(savedHidden)));
    }
    const savedTags = localStorage.getItem('monitorTags');
    if (savedTags) {
      setMonitorTags(new Map(Object.entries(JSON.parse(savedTags))));
    }
    const savedNames = localStorage.getItem('monitorNames');
    if (savedNames) {
      setMonitorNames(new Map(Object.entries(JSON.parse(savedNames))));
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const savedLayout = localStorage.getItem('gridLayout');
    if (savedLayout) {
      setGridLayout(JSON.parse(savedLayout));
    }
    const savedThresholds = localStorage.getItem('thresholds');
    if (savedThresholds) {
      setThresholds(new Map(Object.entries(JSON.parse(savedThresholds))));
    }
    const savedFormulas = localStorage.getItem('monitorFormulas');
    if (savedFormulas) {
      setMonitorFormulas(new Map(Object.entries(JSON.parse(savedFormulas))));
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadMonitors();
      loadConstants();
      const interval = setInterval(() => {
        loadMonitors();
        loadConstants();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedMonitor) {
      loadChartData(selectedMonitor, days);
    }
  }, [selectedMonitor, days]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load Pushover config when modal opens
  useEffect(() => {
    if (showManageModal && settingsTab === 'pushover') {
      loadPushoverConfig();
    }
  }, [showManageModal, settingsTab]);

  // Alert checking loop
  useEffect(() => {
    if (!isAuthenticated || monitors.length === 0) return;

    const checkAlerts = () => {
      const notificationPermission = ('Notification' in window) ? Notification.permission : 'denied';
      console.log('[Alert Check] Running alert check, permission:', notificationPermission);

      monitors.forEach(monitor => {
        const config = thresholds.get(monitor.monitor_id);
        if (!config || (!config.upper && !config.lower)) return;

        const isBreached = isValueOutOfRange(monitor.latest_value, monitor.monitor_id);
        const state = alertStates.get(monitor.monitor_id);
        const level = config.level || 'medium';
        const alertConfig = ALERT_LEVELS[level as keyof typeof ALERT_LEVELS] || ALERT_LEVELS.medium;

        console.log(`[Alert Check] ${monitor.monitor_id}: breached=${isBreached}, value=${monitor.latest_value}, threshold=${JSON.stringify(config)}`);

        if (isBreached && monitor.latest_value !== null) {
          // New alert or time to repeat
          const now = Date.now();
          const shouldNotify = !state?.isActive ||
            (now - state.lastNotified) >= alertConfig.interval * 1000;

          console.log(`[Alert Check] ${monitor.monitor_id}: shouldNotify=${shouldNotify}, permission=${notificationPermission}`);

          if (shouldNotify) {
            if (('Notification' in window) && Notification.permission === 'granted') {
              showDesktopNotification(monitor, level, monitor.latest_value);
            } else if ('Notification' in window) {
              console.log('[Alert Check] Notification permission not granted, requesting...');
              requestNotificationPermission();
            }

            const newStates = new Map(alertStates);
            newStates.set(monitor.monitor_id, {
              lastNotified: now,
              isActive: true
            });
            setAlertStates(newStates);
          }
        } else if (state?.isActive) {
          // Clear alert state when value returns to normal
          const newStates = new Map(alertStates);
          newStates.set(monitor.monitor_id, {
            lastNotified: state.lastNotified,
            isActive: false
          });
          setAlertStates(newStates);
        }
      });
    };

    // Check immediately
    checkAlerts();

    // Then check every 10 seconds
    const interval = setInterval(checkAlerts, 10000);

    return () => clearInterval(interval);
  }, [monitors, thresholds, alertStates, isAuthenticated]);

  const loadMonitors = async () => {
    try {
      const response = await fetch('/api/monitors');
      const data = await response.json();
      setMonitors(data);
      if (data.length > 0 && !selectedMonitor) {
        setSelectedMonitor(data[0].monitor_id);
      }
      // Load mini chart data for each monitor (7 days)
      loadMiniChartData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load monitors:', error);
      setLoading(false);
    }
  };

  const loadMiniChartData = async (monitorList: MonitorSummary[]) => {
    const newMiniData = new Map();
    await Promise.all(
      monitorList.map(async (monitor) => {
        try {
          const response = await fetch(`/api/chart-data/${monitor.monitor_id}?days=7`);
          const data = await response.json();
          // Convert timestamp strings to Unix timestamps (milliseconds)
          const chartData = (data.data || []).map((point: any) => ({
            ...point,
            timestamp: new Date(point.timestamp).getTime()
          }));
          newMiniData.set(monitor.monitor_id, chartData);
        } catch (error) {
          console.error(`Failed to load mini chart for ${monitor.monitor_id}:`, error);
        }
      })
    );
    setMiniChartData(newMiniData);
  };

  const loadConstants = async () => {
    try {
      const response = await fetch('/api/constants');
      const data = await response.json();
      setConstants(data);
    } catch (error) {
      console.error('Failed to load constants:', error);
    }
  };

  const loadChartData = async (monitorId: string, daysParam: number) => {
    try {
      const response = await fetch(`/api/chart-data/${monitorId}?days=${daysParam}`);
      const data = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const formatValue = (value: number | null, unit: string | null) => {
    if (value === null) return 'N/A';
    const formatted = value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('auth', 'authenticated');
        localStorage.setItem('username', username);
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setLoginError('Failed to connect to server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
    setMonitors([]);
    setSelectedMonitor(null);
    setChartData(null);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const generateDefaultLayout = (monitors: MonitorSummary[]) => {
    return monitors.map((monitor, index) => {
      // Vary card sizes for visual interest
      let w = 1, h = 1;
      if (index % 7 === 0) { w = 2; h = 2; } // large
      else if (index % 5 === 0) { w = 2; h = 1; } // wide

      return {
        i: monitor.monitor_id,
        x: (index * 1) % 4,
        y: Math.floor(index / 4) * 1,
        w: w,
        h: h,
        minW: 1,
        minH: 1,
        maxW: 4,
        maxH: 3
      };
    });
  };

  const getMergedLayout = (monitors: MonitorSummary[], constants: ConstantCard[], savedLayout: any[]) => {
    // Create a map of saved layouts by id
    const savedLayoutMap = new Map(savedLayout.map(l => [l.i, l]));

    // Process monitors first
    const monitorLayouts = monitors.map((monitor, index) => {
      if (savedLayoutMap.has(monitor.monitor_id)) {
        return savedLayoutMap.get(monitor.monitor_id);
      } else {
        // New monitor - calculate position
        // Find the highest y position from existing layouts
        const existingLayouts = Array.from(savedLayoutMap.values());
        const maxY = existingLayouts.length > 0 ? Math.max(...existingLayouts.map(l => l.y + l.h)) : 0;

        let w = 1, h = 1;
        if (index % 7 === 0) { w = 2; h = 2; }
        else if (index % 5 === 0) { w = 2; h = 1; }

        const newLayout = {
          i: monitor.monitor_id,
          x: 0,
          y: maxY,
          w: w,
          h: h,
          minW: 1,
          minH: 1,
          maxW: 4,
          maxH: 3
        };
        // Add to saved layout map so next new items can use this position
        savedLayoutMap.set(monitor.monitor_id, newLayout);
        return newLayout;
      }
    });

    // Process constants
    const constantLayouts = constants.map((constant, index) => {
      const constId = `const-${constant.id}`;
      if (savedLayoutMap.has(constId)) {
        return savedLayoutMap.get(constId);
      } else {
        // New constant - calculate position
        const existingLayouts = Array.from(savedLayoutMap.values());
        const maxY = existingLayouts.length > 0 ? Math.max(...existingLayouts.map(l => l.y + l.h)) : 0;

        const newLayout = {
          i: constId,
          x: 0,
          y: maxY,
          w: 1,
          h: 1,
          minW: 1,
          minH: 1,
          maxW: 4,
          maxH: 3
        };
        // Add to saved layout map so next new items can use this position
        savedLayoutMap.set(constId, newLayout);
        return newLayout;
      }
    });

    return [...monitorLayouts, ...constantLayouts];
  };

  const onLayoutChange = (layout: any[]) => {
    // Don't save layout changes on mobile to prevent constants from moving to bottom
    if (isMobile) return;

    setGridLayout(layout);
    localStorage.setItem('gridLayout', JSON.stringify(layout));
  };

  const toggleHideMonitor = (monitorId: string) => {
    const newHidden = new Set(hiddenMonitors);
    if (newHidden.has(monitorId)) {
      newHidden.delete(monitorId);
    } else {
      newHidden.add(monitorId);
    }
    setHiddenMonitors(newHidden);
    localStorage.setItem('hiddenMonitors', JSON.stringify(Array.from(newHidden)));
  };

  const addTagToMonitor = (monitorId: string, tag: string) => {
    const newTags = new Map(monitorTags);
    const existing = newTags.get(monitorId) || [];
    if (!existing.includes(tag)) {
      newTags.set(monitorId, [...existing, tag]);
      setMonitorTags(newTags);
      localStorage.setItem('monitorTags', JSON.stringify(Object.fromEntries(newTags)));
    }
  };

  const removeTagFromMonitor = (monitorId: string, tag: string) => {
    const newTags = new Map(monitorTags);
    const existing = newTags.get(monitorId) || [];
    newTags.set(monitorId, existing.filter(t => t !== tag));
    setMonitorTags(newTags);
    localStorage.setItem('monitorTags', JSON.stringify(Object.fromEntries(newTags)));
  };

  const updateMonitorName = (monitorId: string, name: string) => {
    const newNames = new Map(monitorNames);
    if (name.trim()) {
      newNames.set(monitorId, name.trim());
    } else {
      newNames.delete(monitorId);
    }
    setMonitorNames(newNames);
    localStorage.setItem('monitorNames', JSON.stringify(Object.fromEntries(newNames)));
  };

  const updateMonitorFormula = async (monitorId: string, formula: string) => {
    // Save formula to backend AlertConfig
    try {
      const response = await fetch('/api/alerts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitor_id: monitorId,
          formula: formula.trim() || null,
          alert_level: thresholds.get(monitorId)?.level || 'medium',
          upper_threshold: thresholds.get(monitorId)?.upper,
          lower_threshold: thresholds.get(monitorId)?.lower
        })
      });

      if (response.ok) {
        // Update local state for UI display
        const newFormulas = new Map(monitorFormulas);
        if (formula.trim()) {
          newFormulas.set(monitorId, formula.trim());
        } else {
          newFormulas.delete(monitorId);
        }
        setMonitorFormulas(newFormulas);
        localStorage.setItem('monitorFormulas', JSON.stringify(Object.fromEntries(newFormulas)));
      } else {
        console.error('Failed to save formula to backend');
      }
    } catch (error) {
      console.error('Failed to save formula:', error);
    }
  };

  const saveConstant = async (constant: Partial<ConstantCard>) => {
    try {
      if (editingConstant) {
        // Update existing constant
        const response = await fetch(`/api/constants/${editingConstant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(constant)
        });
        if (response.ok) {
          await loadConstants();
          setShowConstantModal(false);
          setEditingConstant(null);
        }
      } else {
        // Create new constant
        const response = await fetch('/api/constants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(constant)
        });
        if (response.ok) {
          await loadConstants();
          setShowConstantModal(false);
        }
      }
    } catch (error) {
      console.error('Failed to save constant:', error);
      alert('Failed to save constant card');
    }
  };

  const deleteConstant = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this constant card?')) return;

    try {
      const response = await fetch(`/api/constants/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadConstants();
      }
    } catch (error) {
      console.error('Failed to delete constant:', error);
      alert('Failed to delete constant card');
    }
  };

  const updateThreshold = async (monitorId: string, upper?: number, lower?: number, level?: string) => {
    const newThresholds = new Map(thresholds);
    if (upper !== undefined || lower !== undefined) {
      const existing = newThresholds.get(monitorId);
      const thresholdData = {
        upper,
        lower,
        level: level || existing?.level || 'medium'
      };
      newThresholds.set(monitorId, thresholdData);

      // Save to backend
      try {
        await fetch('/api/alerts/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monitor_id: monitorId,
            upper_threshold: upper,
            lower_threshold: lower,
            alert_level: thresholdData.level
          })
        });
      } catch (error) {
        console.error('Failed to save threshold to backend:', error);
      }
    } else {
      newThresholds.delete(monitorId);

      // Delete from backend
      try {
        await fetch(`/api/alerts/config/${monitorId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to delete threshold from backend:', error);
      }
    }
    setThresholds(newThresholds);
    localStorage.setItem('thresholds', JSON.stringify(Object.fromEntries(newThresholds)));
  };

  const isValueOutOfRange = (value: number | null, monitorId: string): boolean => {
    if (value === null) return false;
    const threshold = thresholds.get(monitorId);
    if (!threshold) return false;
    if (threshold.upper !== undefined && value > threshold.upper) return true;
    if (threshold.lower !== undefined && value < threshold.lower) return true;
    return false;
  };

  const playAlertSound = (level: string) => {
    const config = ALERT_LEVELS[level as keyof typeof ALERT_LEVELS] || ALERT_LEVELS.medium;
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzaQ2PTNfzEGI3DN79ePPwoUXbTo7q1YEgpFnt/zwHAiBjeP1/TOgDIGI3DN79ePPwoUXbTo7q1YEgpFnt/zwHAiBjeP1/TOgDIGI3DN79ePPwoUXbTo7q1YEgpFnt/zwHAiBjeP1/TOgDIGI3DN79ePPwoUXbTo7q1YEgpFnt/zwHAiBjeP1/TOgDIGI3DN79ePPwoUXbTo7q1YEgpFnt/zwHAiBjeP1/TOgDIGI3DN79ePPwoUXbTo7q1YEgpFnt/zwHAiBjeP1/TO');
    audio.volume = config.volume;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  const showDesktopNotification = (monitor: MonitorSummary, level: string, value: number) => {
    if (!('Notification' in window)) {
      console.log('Desktop notifications not supported on this browser');
      return;
    }

    const config = ALERT_LEVELS[level as keyof typeof ALERT_LEVELS] || ALERT_LEVELS.medium;
    const threshold = thresholds.get(monitor.monitor_id);
    const displayName = monitorNames.get(monitor.monitor_id) || monitor.monitor_name || monitor.monitor_id;

    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };

    const icon = icons[level as keyof typeof icons] || '🟡';

    new Notification(`${icon} ${displayName} Alert`, {
      body: `Current: ${formatValue(value, monitor.unit)}\nThreshold: ${threshold?.upper ? `>${formatValue(threshold.upper, monitor.unit)}` : `<${formatValue(threshold?.lower || 0, monitor.unit)}`}`,
      icon: '/favicon.ico',
      tag: monitor.monitor_id,
      requireInteraction: config.requireInteraction
    });

    playAlertSound(level);
  };

  const loadPushoverConfig = async () => {
    try {
      const response = await fetch('/api/pushover/config');
      if (response.ok) {
        const config = await response.json();
        if (config) {
          setPushoverUserKey(config.user_key || '');
          setPushoverApiToken(config.api_token || '');
        }
      }
    } catch (error) {
      console.error('Failed to load Pushover config:', error);
    }
  };

  const savePushoverConfig = async () => {
    try {
      const response = await fetch('/api/pushover/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: pushoverUserKey,
          api_token: pushoverApiToken || null
        })
      });

      if (response.ok) {
        alert('Pushover configuration saved!');
      } else {
        alert('Failed to save Pushover configuration');
      }
    } catch (error) {
      console.error('Failed to save Pushover config:', error);
      alert('Error saving Pushover configuration');
    }
  };

  const testPushoverNotification = async () => {
    if (!pushoverUserKey) {
      alert('Please enter your Pushover User Key first');
      return;
    }

    try {
      const response = await fetch('/api/pushover/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_key: pushoverUserKey,
          api_token: pushoverApiToken || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Test notification sent! Check your Pushover app.');
      } else {
        const error = await response.json();
        alert(`Failed to send test notification: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Error sending test notification');
    }
  };

  const deleteMonitor = async (monitorId: string) => {
    if (!window.confirm('Are you sure you want to delete this monitor? This cannot be undone.')) {
      return;
    }
    try {
      await fetch(`/api/monitors/${monitorId}`, {
        method: 'DELETE',
      });
      await loadMonitors();
      if (selectedMonitor === monitorId) {
        setSelectedMonitor(null);
      }
    } catch (error) {
      console.error('Failed to delete monitor:', error);
    }
  };

  const updateUnit = async (unit: string) => {
    if (!selectedMonitor) return;
    try {
      await fetch(`/api/monitors/${selectedMonitor}/unit?unit=${encodeURIComponent(unit)}`, {
        method: 'PATCH',
      });
      await loadMonitors();
      setShowUnitModal(false);
      setEditingUnit('');
    } catch (error) {
      console.error('Failed to update unit:', error);
    }
  };

  // Filter monitors
  const allTags = Array.from(new Set(Array.from(monitorTags.values()).flat()));
  const visibleMonitors = monitors.filter(m => {
    const isHidden = hiddenMonitors.has(m.monitor_id);
    const tags = monitorTags.get(m.monitor_id) || [];
    const matchesTag = selectedTag === 'all' || tags.includes(selectedTag);
    return !isHidden && matchesTag;
  });

  const currentMonitor = monitors.find(m => m.monitor_id === selectedMonitor);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading monitors...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="login-container">
          <div className="login-card">
            <h1>Distill Webhook Visualiser</h1>
            <p className="login-subtitle">Please sign in to continue</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {loginError && <div className="login-error">{loginError}</div>}

              <button type="submit" className="login-btn">
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Distill Webhook Visualiser</h1>
            <p>Monitor your web data in real-time</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              className={`btn-secondary ${viewMode === 'overview' ? 'active' : ''}`}
              onClick={() => setViewMode('overview')}
              title="Overview"
              style={{ padding: '8px 12px' }}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`btn-secondary ${viewMode === 'detail' ? 'active' : ''}`}
              onClick={() => setViewMode('detail')}
              title="Detail view"
              style={{ padding: '8px 12px' }}
            >
              <LineChartIcon size={18} />
            </button>
            <button
              className={`btn-secondary ${viewMode === 'dex' ? 'active' : ''}`}
              onClick={() => setViewMode('dex')}
              title="DEX Rates"
              style={{ padding: '8px 12px' }}
            >
              <TrendingUp size={18} />
            </button>
            <button
              className="btn-secondary"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ padding: '8px 12px' }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {monitors.length === 0 ? (
        <div className="empty-state">
          <h2>No Monitors Yet</h2>
          <p>Start sending webhook data to see your monitors here.</p>
          <code>POST /webhook/distill</code>
        </div>
      ) : viewMode === 'overview' ? (
        <div className="bento-container">
          <GridLayout
            className="bento-grid"
            layout={gridLayout.length > 0 ? getMergedLayout(visibleMonitors, constants, gridLayout) : generateDefaultLayout(visibleMonitors)}
            cols={4}
            rowHeight={200}
            width={1600}
            onLayoutChange={onLayoutChange}
            isDraggable={!isMobile}
            isResizable={!isMobile}
            compactType={null}
            preventCollision={false}
          >
            {visibleMonitors.map((monitor) => {
              const displayName = monitorNames.get(monitor.monitor_id) || monitor.monitor_name || monitor.monitor_id;
              const tags = monitorTags.get(monitor.monitor_id) || [];
              const layout = gridLayout.find(l => l.i === monitor.monitor_id) ||
                            generateDefaultLayout([monitor])[0];
              const showChart = layout.h >= 2;
              const chartPoints = miniChartData.get(monitor.monitor_id) || [];
              const isAlert = isValueOutOfRange(monitor.latest_value, monitor.monitor_id);
              const threshold = thresholds.get(monitor.monitor_id);

              return (
                <div key={monitor.monitor_id} className={`bento-item ${isAlert ? 'alert' : ''}`}>
                  <div className="bento-header">
                    <div className="bento-title-section">
                      <h3>{displayName}</h3>
                      {tags.length > 0 && (
                        <div className="bento-tags">
                          {tags.map(tag => (
                            <span key={tag} className="bento-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="threshold-btn"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowThresholdPopover(showThresholdPopover === monitor.monitor_id ? null : monitor.monitor_id);
                      }}
                      title="Set thresholds"
                    >
                      <Bell size={14} />
                    </button>
                  </div>

                  {showThresholdPopover === monitor.monitor_id && (
                    <div
                      className="threshold-popover"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h4>Alert Settings</h4>
                      <div className="threshold-input-group">
                        <label>Upper Limit</label>
                        <input
                          type="number"
                          placeholder="Leave empty to disable"
                          defaultValue={threshold?.upper}
                          id={`upper-${monitor.monitor_id}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const upperInput = document.getElementById(`upper-${monitor.monitor_id}`) as HTMLInputElement;
                              const lowerInput = document.getElementById(`lower-${monitor.monitor_id}`) as HTMLInputElement;
                              const levelSelect = document.getElementById(`level-${monitor.monitor_id}`) as HTMLSelectElement;
                              const upper = upperInput.value ? parseFloat(upperInput.value) : undefined;
                              const lower = lowerInput.value ? parseFloat(lowerInput.value) : undefined;
                              const level = levelSelect.value;
                              updateThreshold(monitor.monitor_id, upper, lower, level);
                              setShowThresholdPopover(null);
                            }
                          }}
                        />
                      </div>
                      <div className="threshold-input-group">
                        <label>Lower Limit</label>
                        <input
                          type="number"
                          placeholder="Leave empty to disable"
                          defaultValue={threshold?.lower}
                          id={`lower-${monitor.monitor_id}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const upperInput = document.getElementById(`upper-${monitor.monitor_id}`) as HTMLInputElement;
                              const lowerInput = document.getElementById(`lower-${monitor.monitor_id}`) as HTMLInputElement;
                              const levelSelect = document.getElementById(`level-${monitor.monitor_id}`) as HTMLSelectElement;
                              const upper = upperInput.value ? parseFloat(upperInput.value) : undefined;
                              const lower = lowerInput.value ? parseFloat(lowerInput.value) : undefined;
                              const level = levelSelect.value;
                              updateThreshold(monitor.monitor_id, upper, lower, level);
                              setShowThresholdPopover(null);
                            }
                          }}
                        />
                      </div>
                      <div className="threshold-input-group">
                        <label>Alert Level</label>
                        <select
                          id={`level-${monitor.monitor_id}`}
                          defaultValue={threshold?.level || 'medium'}
                          className="alert-level-select"
                        >
                          <option value="critical">🔴 Critical (30s)</option>
                          <option value="high">🟠 High (2m)</option>
                          <option value="medium">🟡 Medium (5m)</option>
                          <option value="low">🟢 Low (15m)</option>
                        </select>
                      </div>
                      <div className="threshold-popover-actions">
                        <button
                          className="btn-secondary"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateThreshold(monitor.monitor_id, undefined, undefined);
                            setShowThresholdPopover(null);
                          }}
                        >
                          Clear
                        </button>
                        <button
                          className="btn-primary"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            const upperInput = document.getElementById(`upper-${monitor.monitor_id}`) as HTMLInputElement;
                            const lowerInput = document.getElementById(`lower-${monitor.monitor_id}`) as HTMLInputElement;
                            const levelSelect = document.getElementById(`level-${monitor.monitor_id}`) as HTMLSelectElement;
                            const upper = upperInput.value ? parseFloat(upperInput.value) : undefined;
                            const lower = lowerInput.value ? parseFloat(lowerInput.value) : undefined;
                            const level = levelSelect.value;
                            updateThreshold(monitor.monitor_id, upper, lower, level);
                            setShowThresholdPopover(null);
                          }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`bento-value ${isAlert ? 'alert' : ''}`}>
                    {formatValue(monitor.latest_value, monitor.unit)}
                  </div>

                  {showChart && chartPoints.length > 0 && (
                    <div className="bento-mini-chart">
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={chartPoints}>
                          <XAxis
                            dataKey="timestamp"
                            hide={true}
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            scale="time"
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="bento-stats">
                    <div className="bento-stat">
                      <span className="label">Min</span>
                      <span className="value">{formatValue(monitor.min_value, monitor.unit)}</span>
                    </div>
                    <div className="bento-stat">
                      <span className="label">Avg</span>
                      <span className="value">{formatValue(monitor.avg_value, monitor.unit)}</span>
                    </div>
                    <div className="bento-stat">
                      <span className="label">Max</span>
                      <span className="value">{formatValue(monitor.max_value, monitor.unit)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Constant Cards */}
            {constants.map((constant) => (
              <div key={`const-${constant.id}`} className="bento-item" style={{ borderLeft: `4px solid ${constant.color}` }}>
                <div className="bento-header">
                  <div className="bento-title-section">
                    <h3>{constant.name}</h3>
                    {constant.description && (
                      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
                        {constant.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', position: 'relative', zIndex: 100 }}>
                    <button
                      className="threshold-btn"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingConstant(constant);
                        setShowConstantModal(true);
                      }}
                      title="Edit constant"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="threshold-btn"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteConstant(constant.id);
                      }}
                      title="Delete constant"
                      style={{ color: 'var(--destructive)', pointerEvents: 'auto' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="bento-value" style={{ color: constant.color }}>
                  {constant.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                  {constant.unit && <span style={{ fontSize: '0.6em', marginLeft: '4px' }}>{constant.unit}</span>}
                </div>

                <div className="bento-stats" style={{ opacity: 0.5 }}>
                  <div className="bento-stat">
                    <span className="label">Type</span>
                    <span className="value">Constant</span>
                  </div>
                </div>
              </div>
            ))}
          </GridLayout>

          {/* Floating Action Button for Adding Constants */}
          <button
            className="fab"
            onClick={() => {
              setEditingConstant(null);
              setShowConstantModal(true);
            }}
            title="Add constant card"
          >
            <Plus size={20} />
          </button>
        </div>
      ) : viewMode === 'dex' ? (
        <DexRates />
      ) : (
        <div className="dashboard">
          {/* Sidebar */}
          <div className="sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Monitors ({visibleMonitors.length}/{monitors.length})</h3>
              <button className="manage-btn" onClick={() => setShowManageModal(true)} title="Manage monitors">
                <Settings size={16} />
              </button>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="tag-filter">
                <button
                  className={`tag-filter-btn ${selectedTag === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedTag('all')}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div className="monitor-list">
              {visibleMonitors.map(monitor => (
                <button
                  key={monitor.monitor_id}
                  className={`monitor-item ${selectedMonitor === monitor.monitor_id ? 'active' : ''}`}
                  onClick={() => setSelectedMonitor(monitor.monitor_id)}
                >
                  <div className="monitor-name">
                    {monitorNames.get(monitor.monitor_id) || monitor.monitor_name || monitor.monitor_id}
                  </div>
                  <div className="monitor-value">
                    {formatValue(monitor.latest_value, monitor.unit)}
                  </div>
                  {monitorTags.get(monitor.monitor_id) && monitorTags.get(monitor.monitor_id)!.length > 0 && (
                    <div className="monitor-tags">
                      {monitorTags.get(monitor.monitor_id)!.map(tag => (
                        <span key={tag} className="monitor-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {currentMonitor && (
              <>
                {/* Stats Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Latest Value</div>
                    <div className="stat-value">
                      {formatValue(currentMonitor.latest_value, currentMonitor.unit)}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Average</div>
                    <div className="stat-value">
                      {formatValue(currentMonitor.avg_value, currentMonitor.unit)}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Min / Max</div>
                    <div className="stat-value small">
                      {formatValue(currentMonitor.min_value, currentMonitor.unit)} / {formatValue(currentMonitor.max_value, currentMonitor.unit)}
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Changes</div>
                    <div className="stat-value">{currentMonitor.change_count}</div>
                  </div>
                </div>

                {/* Chart */}
                {chartData && (
                  <div className="chart-card">
                    <div className="chart-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <h2>{chartData.monitor_name}</h2>
                          {currentMonitor && (
                            <button
                              className="unit-edit-btn"
                              onClick={() => {
                                setEditingUnit(currentMonitor.unit || '');
                                setShowUnitModal(true);
                              }}
                              title="Edit unit"
                            >
                              <span style={{ fontSize: '14px', marginRight: '4px' }}>Unit:</span>
                              <strong>{currentMonitor.unit || 'none'}</strong>
                            </button>
                          )}
                        </div>
                        <a href={chartData.url} target="_blank" rel="noopener noreferrer" className="chart-url">
                          {chartData.url}
                        </a>
                      </div>
                      <div className="time-range-buttons">
                        {[1, 7, 30].map(d => (
                          <button
                            key={d}
                            className={`time-btn ${days === d ? 'active' : ''}`}
                            onClick={() => setDays(d)}
                          >
                            {d}D
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData.data.map(point => ({
                          ...point,
                          timestampMs: new Date(point.timestamp).getTime(),
                          timestampFormatted: new Date(point.timestamp).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }),
                          value: point.value || 0
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.004 286.32)" />
                          <XAxis
                            dataKey="timestampMs"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            scale="time"
                            tick={{ fontSize: 12, fill: 'oklch(0.552 0.016 285.938)' }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-GB', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            }}
                          />
                          <YAxis tick={{ fontSize: 12, fill: 'oklch(0.552 0.016 285.938)' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'oklch(1 0 0)',
                              border: '1px solid oklch(0.92 0.004 286.32)',
                              borderRadius: '0.65rem'
                            }}
                            labelFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleString('en-GB', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              });
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="oklch(0.646 0.222 41.116)"
                            strokeWidth={2}
                            dot={{ fill: 'oklch(0.646 0.222 41.116)', r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-summary">
                      <div className="summary-item">
                        <span>Total Points:</span> <strong>{chartData.summary.total_points}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Changes Detected:</span> <strong>{chartData.summary.changes_detected}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Min Value:</span> <strong>{chartData.summary.value_range.min?.toFixed(2) || 'N/A'}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Max Value:</span> <strong>{chartData.summary.value_range.max?.toFixed(2) || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Unit Edit Modal */}
      {showUnitModal && (
        <div className="modal-overlay" onClick={() => setShowUnitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Set Display Unit</h3>
            <p className="modal-description">Choose a unit for {currentMonitor?.monitor_name}</p>

            <div className="unit-options">
              {['%', '$', '€', '£', 'ETH', 'BTC', 'SOL', 'USDC'].map(u => (
                <button
                  key={u}
                  className={`unit-option ${editingUnit === u ? 'active' : ''}`}
                  onClick={() => setEditingUnit(u)}
                >
                  {u}
                </button>
              ))}
            </div>

            <div className="custom-unit-input">
              <label>Custom Unit:</label>
              <input
                type="text"
                value={editingUnit}
                onChange={(e) => setEditingUnit(e.target.value)}
                placeholder="Enter custom unit"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowUnitModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => updateUnit(editingUnit)}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Monitors Modal */}
      {showManageModal && (
        <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>Settings</h3>

            {/* Tab Navigation */}
            <div className="settings-tabs">
              <button
                className={`settings-tab ${settingsTab === 'monitors' ? 'active' : ''}`}
                onClick={() => setSettingsTab('monitors')}
              >
                Monitors
              </button>
              <button
                className={`settings-tab ${settingsTab === 'pushover' ? 'active' : ''}`}
                onClick={() => setSettingsTab('pushover')}
              >
                Pushover
              </button>
            </div>

            {/* Monitors Tab */}
            {settingsTab === 'monitors' && (
              <>
                <p className="modal-description">Hide, tag, or delete your monitors</p>
                <div className="manage-list">
                  {monitors.map(monitor => (
                    <ManageMonitorItem
                      key={monitor.monitor_id}
                      monitor={monitor}
                      customName={monitorNames.get(monitor.monitor_id) || ''}
                      formula={monitorFormulas.get(monitor.monitor_id) || ''}
                      tags={monitorTags.get(monitor.monitor_id) || []}
                      isHidden={hiddenMonitors.has(monitor.monitor_id)}
                      formatValue={formatValue}
                      onToggleHide={() => toggleHideMonitor(monitor.monitor_id)}
                      onDelete={() => deleteMonitor(monitor.monitor_id)}
                      onAddTag={(tag) => addTagToMonitor(monitor.monitor_id, tag)}
                      onRemoveTag={(tag) => removeTagFromMonitor(monitor.monitor_id, tag)}
                      onUpdateName={(name: string) => updateMonitorName(monitor.monitor_id, name)}
                      onUpdateFormula={(formula: string) => updateMonitorFormula(monitor.monitor_id, formula)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Pushover Tab */}
            {settingsTab === 'pushover' && (
              <div className="pushover-settings">
                <p className="modal-description">Configure Pushover notifications for alerts</p>

                <div className="pushover-form">
                  <div className="form-group">
                    <label>Pushover User Key *</label>
                    <input
                      type="password"
                      placeholder="Your 30-character user key"
                      value={pushoverUserKey}
                      onChange={(e) => setPushoverUserKey(e.target.value)}
                      className="pushover-input"
                    />
                    <small>Find this in your Pushover account settings</small>
                  </div>

                  <div className="form-group">
                    <label>API Token (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave empty to use default"
                      value={pushoverApiToken}
                      onChange={(e) => setPushoverApiToken(e.target.value)}
                      className="pushover-input"
                    />
                    <small>Use default token or create your own app in Pushover</small>
                  </div>

                  <div className="pushover-info">
                    <h4>How to get your Pushover User Key:</h4>
                    <ol>
                      <li>Sign up or log in at <a href="https://pushover.net" target="_blank" rel="noopener noreferrer">pushover.net</a></li>
                      <li>Your user key is shown on the main page</li>
                      <li>Copy and paste it above</li>
                    </ol>
                    <p><strong>Note:</strong> Pushover costs $5 one-time on iOS/Android after 7-day trial</p>
                  </div>

                  <div className="pushover-actions">
                    <button className="btn-secondary" onClick={testPushoverNotification}>
                      Test Notification
                    </button>
                    <button className="btn-primary" onClick={savePushoverConfig}>
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowManageModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Constant Card Modal */}
      <ConstantCardModal
        show={showConstantModal}
        onClose={() => {
          setShowConstantModal(false);
          setEditingConstant(null);
        }}
        onSave={saveConstant}
        editingConstant={editingConstant}
      />
    </div>
  );
}

export default App;