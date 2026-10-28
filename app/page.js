'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { themes, getThemePalette, key, worked, breakDuration, series, completion, points, calculateMemberStreaks } from '@/lib/metrics';

const paths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  projects: 'M3 7h18v13H3z M3 7V4h7l3 3',
  tasks: 'M5 3h14v18H5z M8 8l1 1 2-2 M13 8h3 M8 14l1 1 2-2 M13 14h3',
  calendar: 'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18',
  clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  team: 'M16 21v-3a4 4 0 0 0-8 0v3 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M19 11a3 3 0 0 1 3 3v4 M2 18v-4a4 4 0 0 1 3-3',
  leads: 'M4 4h16v13H8l-4 4z M8 8h8 M8 12h5',
  meetings: 'M3 6h12v12H3z M15 10l6-4v12l-6-4',
  announcements: 'M3 9v6h4l11 5V4L7 9z M7 15l2 6h3',
  analytics: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  search: 'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M6 18L18 6 M7 6h11v11',
  logout: 'M9 3H3v18h6 M9 12h12 M17 8l4 4-4 4',
  bell: 'M5 17h14l-2-4V8a5 5 0 0 0-10 0v5z M10 21h4',
  play: 'M8 5l11 7-11 7z',
  pause: 'M8 5v14 M16 5v14',
  stop: 'M7 6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z',
  download: 'M12 3v12 M8 11l4 4 4-4 M4 17v4h16v-4',
  upload: 'M12 15V3 M8 7l4-4 4 4 M4 17v4h16v-4',
  pulse: 'M2 12h4l3-7 4 14 3-7h6',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  check: 'M5 12l4 4L19 6',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  x: 'M18 6L6 18 M6 6l12 12',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  coffee: 'M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  dot: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  circle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  externalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  trophy: 'M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2 M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2 M4 5h16 M6 3v7a6 6 0 0 0 12 0V3 M9 21h6 M12 16v5',
  medal: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M8.21 13.89L7 23l5-3 5 3-1.21-9.11'
};

const Icon = ({ name, className = 'icon', size, style, strokeWidth = 2, fill }) => {
  const isFilled = Boolean(fill) || name === 'stop';
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: '-0.15em', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path
        d={paths[name] || paths.projects}
        fill={isFilled ? 'currentColor' : 'none'}
        stroke={isFilled ? 'none' : 'currentColor'}
        strokeWidth={isFilled ? 0 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const SyneoLogo = ({ size = 30, idPrefix = 'syneo' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
    style={{ flexShrink: 0, display: 'inline-block', filter: 'drop-shadow(0 2px 6px rgba(91, 76, 245, 0.22))' }}
  >
    <defs>
      <linearGradient id={`${idPrefix}-tl`} x1="56" y1="12" x2="24" y2="65" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#05d5ff" />
        <stop offset="48%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b46ff" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-br`} x1="68" y1="36" x2="40" y2="88" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2b8aff" />
        <stop offset="52%" stopColor="#7c4dff" />
        <stop offset="100%" stopColor="#e016ff" />
      </linearGradient>
    </defs>
    <path
      d="M 46.6 13.2 Q 47.8 12 49 13.2 L 59.4 23.6 Q 60.6 24.8 59.4 26 L 36.2 49.2 Q 35 50.4 36.2 51.6 L 47.8 63.2 Q 48.6 64 47.4 64 L 32.5 64 Q 29.8 64 27.9 62.1 L 17.5 51.7 Q 14.5 48.7 17.5 45.7 Z"
      fill={`url(#${idPrefix}-tl)`}
    />
    <path
      d="M 53.4 86.8 Q 52.2 88 51 86.8 L 40.6 76.4 Q 39.4 75.2 40.6 74 L 63.8 50.8 Q 65 49.6 63.8 48.4 L 52.2 36.8 Q 51.4 36 52.6 36 L 67.5 36 Q 70.2 36 72.1 37.9 L 82.5 48.3 Q 85.5 51.3 82.5 54.3 Z"
      fill={`url(#${idPrefix}-br)`}
    />
  </svg>
);

const SyneoWordmark = ({ height = 17, color = 'currentColor' }) => (
  <svg
    height={height}
    viewBox="98 180 600 80"
    fill={color}
    aria-label="SYNEO LABS"
    style={{ display: 'inline-block', width: 'auto', flexShrink: 0 }}
  >
    {/* S */}
    <path d="M 164 205 C 164 191 151 184 134 184 C 116 184 104 192 104 204 C 104 216 115 221 133 224 C 146 226 151 229 151 235 C 151 241 144 245 133 245 C 121 245 114 240 113 232 L 101 232 C 102 247 114 256 133 256 C 152 256 164 247 164 234 C 164 221 153 216 135 213 C 122 211 116 208 116 203 C 116 198 123 194 133 194 C 144 194 151 198 152 205 Z" />
    {/* Y */}
    <path d="M 169 185 L 194 223 L 194 255 L 206 255 L 206 219 L 183 185 Z" />
    <path d="M 214 185 L 202 204 L 209 214 L 228 185 Z" />
    {/* N + E Connected Bottom Bar */}
    <path d="M 235 206 L 235 255 L 247 255 L 247 224 Z" />
    <path d="M 235 185 L 281 255 L 331 255 L 331 244 L 288 244 L 249 185 Z" />
    <rect x="284" y="185" width="47" height="11" />
    <rect x="284" y="214" width="43" height="11" />
    {/* O */}
    <path d="M 366 184 L 366 196 C 379 196 389 206 389 220 C 389 234 379 244 366 244 C 353 244 343 234 343 220 L 331 220 C 331 240 346 256 366 256 C 386 256 401 240 401 220 C 401 200 386 184 366 184 Z" />
    {/* L */}
    <path d="M 432 185 L 432 255 L 481 255 L 481 244 L 444 244 L 444 185 Z" />
    {/* A */}
    <path d="M 513 185 L 486 255 L 499 255 L 519 201 L 539 255 L 552 255 L 525 185 Z" />
    {/* B */}
    <path d="M 559 185 L 559 196 L 589 196 C 596 196 601 200 601 205 C 601 210 596 214 589 214 L 559 214 L 559 225 L 592 225 C 600 225 605 229 605 235 C 605 240 600 244 592 244 L 559 244 L 559 255 L 593 255 C 608 255 618 247 618 235 C 618 227 613 221 605 219 C 611 216 614 211 614 204 C 614 192 604 185 590 185 Z" />
    {/* S */}
    <g transform="translate(526, 0)">
      <path d="M 164 205 C 164 191 151 184 134 184 C 116 184 104 192 104 204 C 104 216 115 221 133 224 C 146 226 151 229 151 235 C 151 241 144 245 133 245 C 121 245 114 240 113 232 L 101 232 C 102 247 114 256 133 256 C 152 256 164 247 164 234 C 164 221 153 216 135 213 C 122 211 116 208 116 203 C 116 198 123 194 133 194 C 144 194 151 198 152 205 Z" />
    </g>
  </svg>
);

const colors = ['#f1dcd5', '#d5e9d7', '#dedcf2', '#f6e8bf', '#d5e9ec'];
const initials = name => (name || '').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();

const Avatar = ({ user, big = false }) => {
  const bg = colors[(user?.name || '').length % 5];
  return (
    <span className={`avatar ${big ? 'big' : ''}`} style={{ background: bg }} title={user?.name || ''}>
      {initials(user?.name || '?')}
    </span>
  );
};

const duration = n => {
  n = Math.max(0, Math.floor(n));
  return [Math.floor(n / 3600), Math.floor(n / 60) % 60, n % 60]
    .map(x => String(x).padStart(2, '0'))
    .join(':');
};

const fmtDate = v => (v ? new Date(v.length === 10 ? v + 'T12:00:00' : v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date');
// ISO/epoch → value for <input type="datetime-local"> in the viewer's own time zone
const toLocalInput = v => {
  if (v === undefined || v === null || v === '') return '';
  const d = new Date(typeof v === 'number' ? v * 1000 : v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fmtTime = v => (v ? new Date(v).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '');
const isSuperAdminEmail = email => {
  const e = (email || '').toLowerCase().trim();
  return e === 'syneolabs@gmail.com';
};
const isTodayStandup = (s, refDate = new Date()) => {
  if (!s || (!s.created && !s.date)) return false;
  const refKey = key(refDate);
  if (s.date && s.date === refKey) return true;
  if ((s.created || '').slice(0, 10) === refKey) return true;
  try {
    if (s.created && key(new Date(s.created)) === refKey) return true;
  } catch {}
  return false;
};

export default function SyneolabApp() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [connError, setConnError] = useState('');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup' | 'requested'
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const navigate = targetPage => {
    setPage(targetPage);
    setFilter('All');
    setSearch('');
    setSidebarOpen(false);
  };
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [toastMsg, setToastMsg] = useState('');
  const [modal, setModal] = useState(null); // { type, id, data }
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceDefaults, setWorkspaceDefaults] = useState({
    defaultAccent: '#4f46e5',
    defaultDarkMode: false,
    defaultWeekStart: 'Sunday',
    defaultCurrency: 'USD'
  });
  const [accent, setAccent] = useState('#4f46e5');
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [weekStart, setWeekStart] = useState('Sunday');
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [perfPeriod, setPerfPeriod] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'
  const [perfDate, setPerfDate] = useState(() => key(new Date()));
  const [perfEmployee, setPerfEmployee] = useState('all');
  const [taskProjectFilter, setTaskProjectFilter] = useState('all');
  const [taskMemberFilter, setTaskMemberFilter] = useState('all');
  const [goalPeriodFilter, setGoalPeriodFilter] = useState('all'); // 'all' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
  const [goalMemberFilter, setGoalMemberFilter] = useState('all'); // 'all' | 'mine' | <userId>
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'tasks' | 'clock' | 'standups' | 'leads' | 'goals'
  const [activityEmployee, setActivityEmployee] = useState('all');
  const [liveAlert, setLiveAlert] = useState(null);
  const [settingsTab, setSettingsTab] = useState('Profile');
  const [chatMessages, setChatMessages] = useState([]);
  const [timesheetPerson, setTimesheetPerson] = useState('all');
  const [timesheetProject, setTimesheetProject] = useState('all');
  const [timesheetNoteFilter, setTimesheetNoteFilter] = useState('all'); // 'all' | 'with_notes' | 'active' | 'completed'
  const [timesheetSearch, setTimesheetSearch] = useState('');
  const [timesheetDateFilter, setTimesheetDateFilter] = useState('');
  const [timesheetLimit, setTimesheetLimit] = useState(50);
  const [streakFilter, setStreakFilter] = useState('all'); // 'all' | 'checked_in' | 'pending' | 'clocked_in'
  const [streakSearch, setStreakSearch] = useState('');
  const [streakBoardTab, setStreakBoardTab] = useState('checkin'); // 'checkin' | 'clock'
  const [gaugeMode, setGaugeMode] = useState('completion'); // 'completion' | 'breakdown'
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  // Core State
  const [state, setState] = useState({
    projects: [],
    tasks: [],
    leads: [],
    meetings: [],
    announcements: [],
    standups: [],
    goals: [],
    users: [],
    clocks: [],
    acknowledgements: [],
    activities: [],
    integrations: { gmail: false, sheets: false },
    jobs: [],
    beacon: { status: 'awake', lastPing: '', totalPings: 1, netGrowthBytes: 0 }
  });

  const toastTimerRef = useRef(null);
  const liveAlertTimerRef = useRef(null);
  const lastSeenActivityIdRef = useRef(null);
  const userRef = useRef(null);
  userRef.current = user;
  const csvInputRef = useRef(null);

  const showToast = msg => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 3500);
  };

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.11); // A5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {}
  };

  const applyTheme = (colorHex, isDark = darkMode) => {
    if (typeof document === 'undefined') return getThemePalette(colorHex, isDark);
    const palette = getThemePalette(colorHex, isDark);
    Object.entries(palette).forEach(([k, v]) => {
      if (k !== 'name') document.documentElement.style.setProperty('--' + k, v);
    });
    document.documentElement.dataset.theme = palette.name;
    document.documentElement.dataset.dark = isDark ? 'true' : 'false';
    return palette;
  };

  // Enforce Admin Workspace Default when logged out, and apply per-user preferences only after login
  const syncActivePreferences = (activeUser, defaults = workspaceDefaults) => {
    const defAccent = defaults?.defaultAccent || '#4f46e5';
    const defDark = Boolean(defaults?.defaultDarkMode);
    const defWeek = defaults?.defaultWeekStart || 'Sunday';
    const defCurr = defaults?.defaultCurrency || 'USD';

    if (!activeUser) {
      setAccent(defAccent);
      setDarkMode(defDark);
      setWeekStart(defWeek);
      setCurrency(defCurr);
      applyTheme(defAccent, defDark);
      return;
    }

    const userPrefs = activeUser.preferences || {};
    const localAccent = typeof localStorage !== 'undefined' ? localStorage.getItem(`accent_${activeUser.id}`) : null;
    const localDark = typeof localStorage !== 'undefined' ? localStorage.getItem(`darkMode_${activeUser.id}`) : null;
    const localWeek = typeof localStorage !== 'undefined' ? localStorage.getItem(`weekStart_${activeUser.id}`) : null;
    const localCurr = typeof localStorage !== 'undefined' ? localStorage.getItem(`currency_${activeUser.id}`) : null;

    const resolvedAccent = userPrefs.accent || localAccent || defAccent;
    const resolvedDark =
      userPrefs.darkMode !== undefined
        ? Boolean(userPrefs.darkMode)
        : localDark !== null
        ? localDark === 'true'
        : defDark;
    const resolvedWeek = userPrefs.weekStart || localWeek || defWeek;
    const resolvedCurr = userPrefs.currency || localCurr || defCurr;

    setAccent(resolvedAccent);
    setDarkMode(resolvedDark);
    setWeekStart(resolvedWeek);
    setCurrency(resolvedCurr);
    applyTheme(resolvedAccent, resolvedDark);
  };

  const toggleDarkMode = async () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    applyTheme(accent, nextDark);
    if (user) {
      try {
        localStorage.setItem(`darkMode_${user.id}`, String(nextDark));
        const res = await handleApi('/api/preferences', { darkMode: nextDark });
        setUser(prev => (prev ? { ...prev, preferences: res.preferences } : prev));
        if (res.workspaceDefaults) setWorkspaceDefaults(res.workspaceDefaults);
        showToast(`${nextDark ? 'Dark' : 'Light'} mode saved`);
      } catch {
        showToast(`${nextDark ? 'Dark' : 'Light'} mode enabled`);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      localStorage.removeItem('accent');
      localStorage.removeItem('weekStart');
      localStorage.removeItem('currency');
    } catch {}
    applyTheme('#4f46e5', false);
    fetchSession();
    fetch('/api/beacon?source=app-boot', { method: 'POST' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (mounted) {
      syncActivePreferences(user, workspaceDefaults);
    }
  }, [user, workspaceDefaults, mounted]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to connect to workspace database');
      setConnError('');
      const defaults = data.workspaceDefaults || workspaceDefaults;
      setWorkspaceDefaults(defaults);
      setUser(data.user);
      syncActivePreferences(data.user, defaults);
      setNeedsSetup(data.needsSetup);
      setSignupOpen(Boolean(data.signupOpen));
      if (data.user) {
        await refreshState(data.user);
      }
    } catch (e) {
      console.error(e);
      setConnError(e.message || 'Unable to connect to workspace database');
    } finally {
      setLoading(false);
    }
  };

  const refreshState = async (overrideUser) => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        const activeU = overrideUser || userRef.current;
        const incomingActs = data.activities || [];
        if (incomingActs.length > 0) {
          const newestId = incomingActs[0].id;
          if (!lastSeenActivityIdRef.current) {
            lastSeenActivityIdRef.current = newestId;
          } else if (newestId !== lastSeenActivityIdRef.current) {
            const prevIdx = incomingActs.findIndex(a => a.id === lastSeenActivityIdRef.current);
            const freshList = prevIdx === -1 ? incomingActs.slice(0, 5) : incomingActs.slice(0, prevIdx);
            lastSeenActivityIdRef.current = newestId;
            if (activeU?.role === 'admin' || activeU?.role === 'super_admin' || isSuperAdminEmail(activeU?.email)) {
              const empEvents = freshList.filter(a => a.actorId !== activeU.id);
              if (empEvents.length > 0) {
                setLiveAlert({ ...empEvents[0], extraCount: empEvents.length - 1 });
                playNotificationChime();
                if (liveAlertTimerRef.current) clearTimeout(liveAlertTimerRef.current);
                liveAlertTimerRef.current = setTimeout(() => setLiveAlert(null), 9000);
              }
            } else if (activeU) {
              const notifyEmp = freshList.find(a => {
                if (a.actorId === activeU.id || (a.actorRole !== 'admin' && a.actorRole !== 'super_admin')) return false;
                const tIds = Array.isArray(a.targetUserIds) ? a.targetUserIds : [];
                return (
                  a.targetUserId === activeU.id ||
                  a.targetUserId === 'all' ||
                  tIds.includes(activeU.id) ||
                  tIds.includes('all') ||
                  (a.category === 'announcements' && a.type !== 'announcement_completed')
                );
              });
              if (notifyEmp) {
                setLiveAlert(notifyEmp);
                playNotificationChime();
                if (liveAlertTimerRef.current) clearTimeout(liveAlertTimerRef.current);
                liveAlertTimerRef.current = setTimeout(() => setLiveAlert(null), 9000);
              }
            }
          }
        }
        setState(data);
        if (data.workspaceDefaults) {
          setWorkspaceDefaults(data.workspaceDefaults);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Re-sync session or workspace state immediately when the tab regains focus or becomes visible.
  useEffect(() => {
    const onSync = () => {
      if (document.visibilityState === 'hidden') return;
      setCurrentTime(Date.now() / 1000);
      if (user) refreshState();
      else fetchSession();
    };
    window.addEventListener('focus', onSync);
    document.addEventListener('visibilitychange', onSync);
    return () => {
      window.removeEventListener('focus', onSync);
      document.removeEventListener('visibilitychange', onSync);
    };
  }, [user]);

  // Timer Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 10s Real-Time Poll for Immediate Admin Notifications (skips hidden tabs to save MongoDB ops) + 10m Zero-Growth MongoDB Beacon
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      refreshState();
    }, 10000);
    const beaconInterval = setInterval(() => {
      fetch('/api/beacon?source=active-session', { method: 'POST' }).catch(() => {});
    }, 10 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(beaconInterval);
    };
  }, [user]);

  // Global K shortcut
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') setModal(null);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeClock = state.clocks?.find(c => c.user_id === user?.id && !c.end);
  const activeClockSeconds = activeClock ? worked(activeClock, currentTime) : 0;
  const activeBreakSeconds = activeClock ? breakDuration(activeClock, currentTime) : 0;
  const isSuperAdmin = Boolean(
    isSuperAdminEmail(user?.email) ||
    user?.role === 'super_admin' ||
    user?.isSuperAdmin
  );
  const isAdmin = Boolean(user?.role === 'admin' || isSuperAdmin);
  const isTargetSuperAdmin = u => Boolean(
    isSuperAdminEmail(u?.email) ||
    u?.role === 'super_admin' ||
    u?.isSuperAdmin
  );
  const isTargetAdmin = u => Boolean(
    u?.role === 'admin' ||
    u?.role === 'super_admin' ||
    isTargetSuperAdmin(u)
  );
  const isNotificationVisibleToUser = (a, activeU = user) => {
    if (!a || !activeU) return false;
    if (activeU.role === 'admin' || activeU.role === 'super_admin' || isSuperAdminEmail(activeU.email)) return true;
    if (a.actorId === activeU.id) return true;
    if (a.actorRole !== 'admin' && a.actorRole !== 'super_admin') return false;
    const tIds = Array.isArray(a.targetUserIds) ? a.targetUserIds : [];
    return (
      a.targetUserId === activeU.id ||
      a.targetUserId === 'all' ||
      tIds.includes(activeU.id) ||
      tIds.includes('all') ||
      (a.category === 'announcements' && a.type !== 'announcement_completed')
    );
  };
  const lastSeenActivityAt =
    user?.preferences?.lastSeenActivityAt ||
    (typeof localStorage !== 'undefined' && user ? localStorage.getItem(`lastSeenAct_${user.id}`) : '') ||
    '';
  const unreadActivities = (state.activities || []).filter(
    a =>
      a.actorId !== user?.id &&
      isNotificationVisibleToUser(a, user) &&
      (!lastSeenActivityAt || String(a.createdAt || '') > lastSeenActivityAt)
  );
  const markActivitiesSeen = () => {
    const nowIso = new Date().toISOString();
    if (user) {
      try {
        localStorage.setItem(`lastSeenAct_${user.id}`, nowIso);
      } catch {}
      setUser(prev =>
        prev ? { ...prev, preferences: { ...(prev.preferences || {}), lastSeenActivityAt: nowIso } } : prev
      );
      handleApi('/api/preferences', { lastSeenActivityAt: nowIso }).catch(() => {});
    }
  };
  const departments = (() => {
    const base =
      (Array.isArray(state.settings?.departments) && state.settings.departments.length
        ? state.settings.departments
        : null) ||
      (Array.isArray(workspaceDefaults?.departments) && workspaceDefaults.departments.length
        ? workspaceDefaults.departments
        : ['Engineering', 'Design', 'Marketing', 'Management']);
    const seen = new Set(base.map(d => String(d).toLowerCase()));
    const merged = [...base];
    (state.users || []).forEach(u => {
      const dep = String(u.department || '').trim();
      if (dep && !seen.has(dep.toLowerCase())) {
        seen.add(dep.toLowerCase());
        merged.push(dep);
      }
    });
    return merged;
  })();

  const handleCreateDepartment = async rawName => {
    const name = String(rawName || '').trim().slice(0, 40);
    if (!name) return null;
    if (departments.some(d => d.toLowerCase() === name.toLowerCase())) {
      const existing = departments.find(d => d.toLowerCase() === name.toLowerCase());
      showToast(`Department "${existing}" already exists`);
      return existing;
    }
    const nextDepts = [...departments, name];
    setWorkspaceDefaults(prev => ({ ...prev, departments: nextDepts }));
    setState(prev => ({
      ...prev,
      settings: prev.settings ? { ...prev.settings, departments: nextDepts } : { departments: nextDepts }
    }));
    showToast(`Department "${name}" created`);
    try {
      const res = await handleApi('/api/users', { action: 'addDepartment', name });
      if (Array.isArray(res?.departments)) {
        setWorkspaceDefaults(prev => ({ ...prev, departments: res.positions ? prev.departments : res.departments }));
        setState(prev => ({
          ...prev,
          settings: prev.settings ? { ...prev.settings, departments: res.departments } : { departments: res.departments }
        }));
      }
      refreshState();
      return name;
    } catch (err) {
      refreshState();
      showToast(err.message);
      return null;
    }
  };

  const handleRemoveDepartment = async deptName => {
    if (departments.length <= 1) {
      showToast('At least one department must remain in the workspace');
      return;
    }
    const assignedCount = (state.users || []).filter(u => u.department === deptName).length;
    const msg = assignedCount
      ? `Remove "${deptName}" from department options? (${assignedCount} member${assignedCount > 1 ? 's' : ''} currently have this department)`
      : `Remove "${deptName}" department?`;
    if (!confirm(msg)) return;
    const nextDepts = departments.filter(d => d !== deptName);
    if (filter === deptName) setFilter('All');
    setWorkspaceDefaults(prev => ({ ...prev, departments: nextDepts }));
    setState(prev => ({
      ...prev,
      settings: prev.settings ? { ...prev.settings, departments: nextDepts } : { departments: nextDepts }
    }));
    showToast(`Department "${deptName}" removed`);
    try {
      const res = await handleApi('/api/users', { action: 'removeDepartment', name: deptName });
      if (Array.isArray(res?.departments)) {
        setWorkspaceDefaults(prev => ({ ...prev, departments: res.departments }));
        setState(prev => ({
          ...prev,
          settings: prev.settings ? { ...prev.settings, departments: res.departments } : { departments: res.departments }
        }));
      }
      refreshState();
    } catch (err) {
      refreshState();
      showToast(err.message);
    }
  };

  const promptCreateDepartment = async onCreated => {
    const input = prompt('Enter new department name (e.g. Sales, Operations, QA, Support, HR):');
    if (!input || !input.trim()) return;
    const created = await handleCreateDepartment(input);
    if (created && typeof onCreated === 'function') {
      onCreated(created);
    }
  };

  const getUserPositions = u => {
    if (!u) return [];
    if (Array.isArray(u.positions) && u.positions.length > 0) {
      const cleaned = [
        ...new Set(
          u.positions
            .flatMap(p => String(p || '').split(/[,·]+/))
            .map(s => s.trim())
            .filter(Boolean)
        )
      ];
      if (cleaned.length > 0) return cleaned;
    }
    if (typeof u.position === 'string' && u.position.trim()) {
      const cleaned = [
        ...new Set(
          u.position
            .split(/[,·]+/)
            .map(s => s.trim())
            .filter(Boolean)
        )
      ];
      if (cleaned.length > 0) return cleaned;
    }
    return (isAdmin || u.id === user?.id) && (u.role === 'admin' || u.role === 'super_admin' || isSuperAdminEmail(u.email)) ? ['Founder', 'CEO'] : ['Team Member'];
  };

  const positions = (() => {
    const defaultPos = [
      'Founder',
      'CEO',
      'Co-Founder',
      'Marketing Head',
      'Analyst',
      'Engineering Lead',
      'Software Engineer',
      'Product Designer',
      'Project Manager',
      'Operations Lead'
    ];
    const base =
      (Array.isArray(state.settings?.positions) && state.settings.positions.length
        ? state.settings.positions
        : null) ||
      (Array.isArray(workspaceDefaults?.positions) && workspaceDefaults.positions.length
        ? workspaceDefaults.positions
        : defaultPos);
    const seen = new Set();
    const merged = [];
    ['Founder', 'CEO', ...base].forEach(p => {
      const clean = String(p || '').trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        merged.push(clean);
      }
    });
    (state.users || []).forEach(u => {
      getUserPositions(u).forEach(pos => {
        if (pos && !seen.has(pos.toLowerCase())) {
          seen.add(pos.toLowerCase());
          merged.push(pos);
        }
      });
    });
    return merged;
  })();

  const handleSaveMemberPositions = async (targetUser, rawPositionsInput, extraChanges = {}) => {
    if (!targetUser?.id) return;
    const rawList = Array.isArray(rawPositionsInput)
      ? rawPositionsInput.flatMap(p => String(p || '').split(/[,·]+/))
      : String(rawPositionsInput || '').split(/[,·]+/);
    const seen = new Set();
    const cleanList = [];
    for (const item of rawList) {
      const trimmed = item.trim().slice(0, 50);
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      cleanList.push(trimmed);
    }
    const finalPositions = cleanList.length
      ? cleanList
      : (targetUser.role === 'admin' || targetUser.role === 'super_admin' || isSuperAdminEmail(targetUser.email))
      ? ['Founder', 'CEO']
      : ['Team Member'];
    const joinedPosition = finalPositions.join(', ');

    // 0ms optimistic UI update across state.users, active modal, and current user
    setState(prev => ({
      ...prev,
      users: (prev.users || []).map(item =>
        item.id === targetUser.id
          ? { ...item, ...extraChanges, positions: finalPositions, position: joinedPosition }
          : item
      )
    }));
    if (targetUser.id === user?.id) {
      setUser(prev =>
        prev ? { ...prev, ...extraChanges, positions: finalPositions, position: joinedPosition } : prev
      );
    }
    setModal(prev =>
      prev && prev.type === 'person' && prev.data?.id === targetUser.id
        ? { ...prev, data: { ...prev.data, ...extraChanges, positions: finalPositions, position: joinedPosition } }
        : prev
    );

    try {
      await handleApi('/api/users', {
        action: 'update',
        id: targetUser.id,
        ...extraChanges,
        positions: finalPositions,
        position: joinedPosition
      });
      refreshState();
      showToast(`Positions updated: ${joinedPosition}`);
    } catch (err) {
      refreshState();
      showToast(err.message);
    }
  };

  const handleCreatePosition = async rawName => {
    const names = String(rawName || '')
      .split(/[,·]+/)
      .map(s => s.trim().slice(0, 50))
      .filter(Boolean);
    if (!names.length) return null;
    const name = names[0];
    if (positions.some(p => p.toLowerCase() === name.toLowerCase())) {
      const existing = positions.find(p => p.toLowerCase() === name.toLowerCase());
      showToast(`Position "${existing}" already exists`);
      return existing;
    }
    const nextPositions = [...positions, name];
    setWorkspaceDefaults(prev => ({ ...prev, positions: nextPositions }));
    setState(prev => ({
      ...prev,
      settings: prev.settings ? { ...prev.settings, positions: nextPositions } : { positions: nextPositions }
    }));
    showToast(`Position "${name}" created`);
    try {
      const res = await handleApi('/api/users', { action: 'addPosition', name });
      if (Array.isArray(res?.positions)) {
        setWorkspaceDefaults(prev => ({ ...prev, positions: res.positions }));
        setState(prev => ({
          ...prev,
          settings: prev.settings ? { ...prev.settings, positions: res.positions } : { positions: res.positions }
        }));
      }
      refreshState();
      return name;
    } catch (err) {
      refreshState();
      showToast(err.message);
      return null;
    }
  };

  const handleRemovePosition = async posName => {
    if (positions.length <= 1) {
      showToast('At least one position must remain in the workspace');
      return;
    }
    const assignedCount = (state.users || []).filter(u =>
      getUserPositions(u).some(p => p.toLowerCase() === posName.toLowerCase())
    ).length;
    const msg = assignedCount
      ? `Remove "${posName}" from position options? (${assignedCount} member${assignedCount > 1 ? 's' : ''} currently hold this position)`
      : `Remove "${posName}" position?`;
    if (!confirm(msg)) return;
    const nextPositions = positions.filter(p => p !== posName);
    setWorkspaceDefaults(prev => ({ ...prev, positions: nextPositions }));
    setState(prev => ({
      ...prev,
      settings: prev.settings ? { ...prev.settings, positions: nextPositions } : { positions: nextPositions }
    }));
    showToast(`Position "${posName}" removed`);
    try {
      const res = await handleApi('/api/users', { action: 'removePosition', name: posName });
      if (Array.isArray(res?.positions)) {
        setWorkspaceDefaults(prev => ({ ...prev, positions: res.positions }));
        setState(prev => ({
          ...prev,
          settings: prev.settings ? { ...prev.settings, positions: res.positions } : { positions: res.positions }
        }));
      }
      refreshState();
    } catch (err) {
      refreshState();
      showToast(err.message);
    }
  };

  const promptCreatePosition = async onCreated => {
    const input = prompt('Enter new position / job title (e.g. Founder, CEO, Marketing Head, Analyst, CTO):');
    if (!input || !input.trim()) return;
    const created = await handleCreatePosition(input);
    if (created && typeof onCreated === 'function') {
      onCreated(created);
    }
  };

  // Strict RBAC project list: Admins see all projects; Employees only see projects explicitly assigned to them
  const assignedProjects = isAdmin
    ? state.projects || []
    : (state.projects || []).filter(
        p =>
          p.lead === user?.id ||
          p.owner === user?.id ||
          (Array.isArray(p.members) && p.members.includes(user?.id)) ||
          (state.tasks || []).some(
            t =>
              t.project === p.id &&
              (t.assignee === user?.id || (Array.isArray(t.assignees) && t.assignees.includes(user?.id)))
          )
      );
  const isGoalAssignedToUser = (goal = {}, uidVal = user?.id) => {
    if (!uidVal || !goal) return false;
    const isTeamWide =
      (!goal.assignee || goal.assignee === 'all') &&
      (!Array.isArray(goal.assignees) || goal.assignees.length === 0);
    return (
      isTeamWide ||
      goal.owner === uidVal ||
      goal.assignee === uidVal ||
      (Array.isArray(goal.assignees) && goal.assignees.includes(uidVal))
    );
  };

  // Mirrors the server rules: admins change anything; members change tasks/leads/standups/goals they own, are assigned, or collaborate on.
  const canEdit = (kind, record = {}) =>
    isAdmin ||
    (['tasks', 'leads', 'standups', 'goals'].includes(kind) &&
      (!record.id ||
        record.owner === user?.id ||
        record.assignee === user?.id ||
        (Array.isArray(record.assignees) && record.assignees.includes(user?.id)) ||
        (kind === 'goals' && isGoalAssignedToUser(record, user?.id))));
  const canDelete = (kind, record = {}) =>
    isAdmin || (['tasks', 'leads', 'standups', 'goals'].includes(kind) && record.owner === user?.id);

  // Administrative scope control: only admin or the task's creator can change title, project, assignees, deadlines, and estimate
  const canManageTaskScope = (task = {}) => {
    if (isAdmin) return true;
    if (!task || !task.id) return true; // Brand new tasks can be configured by their creator
    return task.owner === user?.id;
  };

  // Timeline and deadline health helper for projects
  const getProjectTimeline = (p = {}) => {
    let timelinePct = 0;
    if (p.startDate && p.due) {
      const sTime = new Date(p.startDate).getTime();
      const eTime = new Date(p.due + 'T23:59:59').getTime();
      const nowTime = Date.now();
      if (eTime > sTime) {
        timelinePct = Math.min(100, Math.max(0, Math.round(((nowTime - sTime) / (eTime - sTime)) * 100)));
      } else {
        timelinePct = 100;
      }
    }
    let deadlineBadge = null;
    if (p.due) {
      const diffDays = Math.ceil((new Date(p.due + 'T23:59:59').getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (p.status === 'Completed') {
        deadlineBadge = { label: 'Delivered', cls: 'green' };
      } else if (diffDays < 0) {
        deadlineBadge = { label: `Overdue by ${Math.abs(diffDays)}d`, cls: 'red' };
      } else if (diffDays === 0) {
        deadlineBadge = { label: 'Due today', cls: 'yellow' };
      } else {
        deadlineBadge = { label: `${diffDays}d remaining`, cls: '' };
      }
    }
    return { timelinePct, deadlineBadge };
  };

  const formatMoney = v =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(Number(v) || 0);

  const handleApi = async (url, body, method = 'POST') => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const getDefaultGoalDue = (period = 'weekly') => {
    const d = new Date();
    if (period === 'daily') return key(d);
    if (period === 'weekly') {
      const endW = new Date(d);
      endW.setDate(d.getDate() + (7 - d.getDay()));
      return key(endW);
    }
    if (period === 'monthly') {
      const endM = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return key(endM);
    }
    const endQ = new Date(d.getFullYear(), d.getMonth() + 3, 0);
    return key(endQ);
  };

  const quickUpdateGoal = async (goal, patch, toastText = 'Goal progress synced with team') => {
    if (!goal?.id || !canEdit('goals', goal)) return;
    const prevGoals = state.goals || [];
    const nextGoal = { ...goal, ...patch };
    const targetVal = Math.max(1, Number(nextGoal.targetValue || 100));
    const curVal = Math.min(100, Math.max(0, Number(nextGoal.currentValue || 0)));
    nextGoal.currentValue = curVal;
    if (curVal >= targetVal) {
      nextGoal.status = 'Completed';
    } else if (nextGoal.status === 'Completed' && curVal < targetVal) {
      nextGoal.status = 'On track';
    }
    // 0ms optimistic UI update
    setState(prev => ({
      ...prev,
      goals: (prev.goals || []).map(g => (g.id === goal.id ? nextGoal : g))
    }));
    if (toastText) showToast(toastText);
    try {
      await handleApi('/api/record', { kind: 'goals', id: goal.id, body: nextGoal });
      refreshState();
    } catch (err) {
      setState(prev => ({ ...prev, goals: prevGoals }));
      showToast(err.message);
    }
  };

  // Clock Actions — 'stop' always requires a work summary note via the Clock-Out Modal
  const requestClockOut = () => {
    if (!activeClock) return;
    setModal({
      type: 'clockOut',
      data: {
        project: activeClock.project || '',
        task: activeClock.task || '',
        note: '',
        initialGoal: activeClock.note || '',
        markTaskStatus: ''
      }
    });
  };

  const handleClock = async (action, extra = {}) => {
    if (action === 'start') {
      const myTodayStandup = (state.standups || []).find(s => s.owner === user?.id && isTodayStandup(s));
      if (!myTodayStandup) {
        setModal({ type: 'clock', data: extra });
        return;
      }
    }
    if (action === 'stop' && (!extra.note || String(extra.note).trim().length < 3)) {
      requestClockOut();
      return;
    }
    try {
      await handleApi('/api/clock', { action, ...extra });
      if (action === 'stop') {
        setModal(null);
      }
      await refreshState();
      showToast(
        action === 'stop'
          ? 'Clocked out. Work summary note & shift hours saved.'
          : action === 'break'
          ? 'Break started — break timer is now running'
          : action === 'resume'
          ? 'Break ended — work timer resumed'
          : action === 'switch'
          ? 'Active focus switched'
          : 'Time tracker updated'
      );
    } catch (e) {
      showToast(e.message);
    }
  };

  // Export CSV (Least privilege: employees export only their own time entries / leads)
  const exportCSV = kind => {
    const dateStr = key(new Date());
    const visibleTimeRows = isAdmin ? state.clocks : state.clocks.filter(c => c.user_id === user.id);
    const rows =
      kind === 'leads'
        ? [
            ['Name', 'Company', 'Email', 'Phone', 'Value', 'Stage', 'Follow up', 'Source', 'Notes'],
            ...state.leads.map(l => [l.title, l.company, l.email, l.phone, l.value, l.stage, l.followup, l.source || '', l.description])
          ]
        : [
            ['Member', 'Project', 'Start UTC', 'End UTC', 'Work duration', 'Break duration', 'Break seconds', 'Focused hours', 'Note'],
            ...visibleTimeRows.map(c => [
              state.users.find(u => u.id === c.user_id)?.name || 'Unknown',
              state.projects.find(p => p.id === c.project)?.title || 'General work',
              new Date(c.start * 1000).toISOString(),
              c.end ? new Date(c.end * 1000).toISOString() : 'Active',
              duration(worked(c, currentTime)),
              duration(breakDuration(c, currentTime)),
              Math.round(breakDuration(c, currentTime)),
              (worked(c, currentTime) / 3600).toFixed(3),
              c.note
            ])
          ];
    const csvContent = rows
      .map(r => r.map(v => '"' + String(v ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"').join(','))
      .join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syneolab-${kind}-${dateStr}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Import Leads CSV
  const importLeadsCSV = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV file must have a header row and at least one lead row');
      const parseRow = row => {
        const out = [];
        let cur = '', inQ = false;
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === '"') {
            if (inQ && row[i + 1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
          } else if (ch === ',' && !inQ) {
            out.push(cur.trim());
            cur = '';
          } else cur += ch;
        }
        out.push(cur.trim());
        return out;
      };
      const headers = parseRow(lines[0]).map(h => h.toLowerCase());
      const idx = name => headers.findIndex(h => h.includes(name));
      const validStages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
      let imported = 0;
      for (const line of lines.slice(1, 101)) {
        const cols = parseRow(line);
        const title = cols[idx('name') >= 0 ? idx('name') : 0] || '';
        if (!title) continue;
        const rawStage = cols[idx('stage')] || 'New';
        const stage = validStages.find(s => s.toLowerCase() === rawStage.toLowerCase()) || 'New';
        await handleApi('/api/record', {
          kind: 'leads',
          body: {
            title,
            company: cols[idx('company')] || '',
            email: cols[idx('email')] || '',
            phone: cols[idx('phone')] || '',
            value: Number(String(cols[idx('value')] || '0').replace(/[^\d.]/g, '')) || 0,
            stage,
            followup: cols[idx('follow')] || '',
            source: cols[idx('source')] || 'CSV Import',
            description: cols[idx('note')] || ''
          }
        });
        imported++;
      }
      await refreshState();
      showToast(`Imported ${imported} lead${imported === 1 ? '' : 's'} into MongoDB`);
    } catch (err) {
      showToast(err.message || 'Could not import CSV');
    } finally {
      e.target.value = '';
    }
  };

  // Natural Language Lead Capture
  const parseLeadText = text => {
    const get = k => {
      const m = text.match(new RegExp('(?:^|[;\\n])\\s*' + k + '\\s*:\\s*([^;\\n]+)', 'i'));
      return m ? m[1].trim() : '';
    };
    return {
      title: get('Name') || text.split(/[;\n]/)[0].replace(/^name:\s*/i, '').slice(0, 100),
      company: get('Company'),
      email: get('Email') || (text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i) || [''])[0],
      phone: get('Phone'),
      value: get('Value').replace(/[^\d.]/g, '') || 0,
      description: get('Notes') || text,
      stage: 'New'
    };
  };

  // RENDER: Loading or Auth Page if not logged in
  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#f3f6f2' }} />;
  }

  if (!user) {
    return (
      <div className="auth">
        <div className="auth-art">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <SyneoLogo size={56} idPrefix="auth" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <SyneoWordmark height={24} color="#ffffff" />
              <span style={{ fontSize: 9.5, letterSpacing: '0.19em', color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>
                “WHERE CREATIVITY MEETS INNOVATIONS”
              </span>
            </div>
          </div>
          <div className="eyebrow" style={{ marginLeft: 0, color: '#8fbfa0' }}>
            A little structure. A lot of possibility.
          </div>
          <h1>Great work.<br />Better, together.</h1>
          <p>One thoughtful space for your people, projects, and everything that moves your business forward.</p>
        </div>
        <div className="auth-form">
          {connError ? (
            <div style={{ maxWidth: 380 }}>
              <div className="eyebrow" style={{ marginLeft: 0 }}>CONNECTION STATUS</div>
              <h2>Unable to reach database</h2>
              <p className="sub" style={{ marginBottom: 20 }}>
                {connError}. If using MongoDB Atlas, ensure your current IP address (or <code>0.0.0.0/0</code>) is added under <b>Security → Network Access</b>.
              </p>
              <button className="primary" onClick={() => { setLoading(true); fetchSession(); }}>
                Retry connection <Icon name="arrow" />
              </button>
            </div>
          ) : authMode === 'requested' && !needsSetup ? (
            <div>
              <div className="eyebrow" style={{ marginLeft: 0 }}>REQUEST SENT</div>
              <h2>Thanks — you're on the list.</h2>
              <p className="sub" style={{ marginBottom: 20 }}>
                An administrator needs to approve your account. Once approved, sign in with the email and password you just chose.
              </p>
              <button className="primary" onClick={() => setAuthMode('signin')}>
                Back to sign in <Icon name="arrow" />
              </button>
            </div>
          ) : authMode === 'signup' && !needsSetup ? (
            <form
              onSubmit={async e => {
                e.preventDefault();
                const payload = Object.fromEntries(new FormData(e.target));
                if (payload.password !== payload.confirm) return alert('The two passwords do not match.');
                try {
                  await handleApi('/api/signup', payload);
                  setAuthMode('requested');
                  fetchSession();
                } catch (err) {
                  alert(err.message);
                  fetchSession();
                }
              }}
            >
              <div className="eyebrow" style={{ marginLeft: 0 }}>SYNEOLAB WORKSPACE</div>
              <h2>Request access</h2>
              <p className="sub">For employees. An administrator will review your request before you can sign in.</p>
              <div className="field">
                <label>Full name</label>
                <input name="name" type="text" required autoComplete="name" />
              </div>
              <div className="field">
                <label>Work email</label>
                <input name="email" type="email" required autoComplete="username" />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Department</label>
                  <select name="department" defaultValue={departments[0] || 'Engineering'}>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Position / title</label>
                  <select name="position" defaultValue={positions.find(p => p !== 'CEO') || positions[0] || 'Analyst'}>
                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Password (12+ characters)</label>
                  <input name="password" type="password" required minLength="12" autoComplete="new-password" />
                </div>
                <div className="field">
                  <label>Confirm password</label>
                  <input name="confirm" type="password" required minLength="12" autoComplete="new-password" />
                </div>
              </div>
              <button className="primary" style={{ marginTop: 15 }}>
                Send request <Icon name="arrow" />
              </button>
              <p className="sub" style={{ marginTop: 18 }}>
                Already approved?{' '}
                <button type="button" className="auth-link" onClick={() => setAuthMode('signin')}>
                  Sign in
                </button>
              </p>
            </form>
          ) : (
            <form
              onSubmit={async e => {
                e.preventDefault();
                const payload = Object.fromEntries(new FormData(e.target));
                try {
                  const res = await handleApi(needsSetup ? '/api/setup' : '/api/login', payload);
                  setUser(res.user);
                  await refreshState();
                } catch (err) {
                  // Someone already created the workspace (e.g. in another tab): switch to sign-in.
                  if (needsSetup && /already configured/i.test(err.message)) {
                    setNeedsSetup(false);
                    alert('This workspace already has an administrator. Please sign in.');
                  } else {
                    alert(err.message);
                  }
                }
              }}
            >
              <div className="eyebrow" style={{ marginLeft: 0 }}>SYNEOLAB WORKSPACE</div>
              <h2>{needsSetup ? 'Make space for great work.' : 'Welcome back.'}</h2>
              <p className="sub">
                {needsSetup ? 'Create the administrator account for your company.' : 'Sign in to pick up where your team left off.'}
              </p>
              {needsSetup && (
                <div className="field">
                  <label>Your name</label>
                  <input name="name" type="text" required placeholder="Administrator name" />
                </div>
              )}
              <div className="field">
                <label>Work email</label>
                <input name="email" type="email" required autoComplete="username" />
              </div>
              <div className="field">
                <label>Password</label>
                <input name="password" type="password" required minLength="12" autoComplete={needsSetup ? 'new-password' : 'current-password'} />
              </div>
              {needsSetup && <p className="sub">Use at least 12 characters. This account manages your team.</p>}
              <button className="primary" style={{ marginTop: 15 }}>
                {needsSetup ? 'Create workspace' : 'Sign in'} <Icon name="arrow" />
              </button>
              {!needsSetup && (
                <p className="sub" style={{ marginTop: 18 }}>
                  {signupOpen ? (
                    <>
                      New employee?{' '}
                      <button type="button" className="auth-link" onClick={() => setAuthMode('signup')}>
                        Request access
                      </button>
                    </>
                  ) : (
                    'New employee? Sign-ups are currently closed — ask your administrator to add you.'
                  )}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- VIEWS ---

  const isUserAssignedToTask = (t, uid) =>
    Boolean(t && uid && (t.assignee === uid || (Array.isArray(t.assignees) && t.assignees.includes(uid))));

  const getProjectProgressPct = p => {
    if (!p || p.empty) return 0;
    const pTasks = state.tasks.filter(t => t.project === p.id);
    if (pTasks.length > 0) {
      return Math.round((pTasks.filter(t => t.status === 'Done').length / pTasks.length) * 100);
    }
    const milestones = Array.isArray(p.milestones) ? p.milestones : [];
    if (milestones.length > 0) {
      return Math.round((milestones.filter(m => m.done).length / milestones.length) * 100);
    }
    if (p.status === 'Completed') return 100;
    return Math.min(100, Math.max(0, Math.round(Number(p.progress || 0))));
  };

  // 1. Dashboard View
  const renderDashboard = () => {
    const todayStr = key(new Date());
    const doneTasks = state.tasks.filter(t => t.status === 'Done').length;
    const blockedTasks = state.tasks.filter(t => t.blocked && t.status !== 'Done');
    const overdueTasks = state.tasks.filter(t => t.due && t.due < todayStr && t.status !== 'Done');
    const dueLeads = state.leads.filter(l => l.followup && l.followup <= todayStr && !['Won', 'Lost'].includes(l.stage));
    const todayStandups = (state.standups || []).filter(s => isTodayStandup(s));
    const myTodayStandup = todayStandups.find(s => s.owner === user?.id);
    const uniqueCheckedInCount = new Set(todayStandups.map(s => s.owner)).size;
    const workingCount = state.clocks.filter(c => !c.end && !c.break_start).length;
    const breakCount = state.clocks.filter(c => !c.end && c.break_start).length;

    const nextMeeting = state.meetings
      .filter(m => new Date(m.end) > new Date())
      .sort((a, b) => a.start.localeCompare(b.start))[0];

    const maxTasks = Math.max(1, ...state.projects.map(p => state.tasks.filter(t => t.project === p.id).length));
    const comp = completion(state.tasks);

    // Calculate week start for weekly hours
    const nowD = new Date();
    const dayOfWeek = nowD.getDay(); // 0 is Sunday
    const mondayOffset = (dayOfWeek + 6) % 7;
    const weekStartD = new Date(nowD);
    weekStartD.setDate(nowD.getDate() - mondayOffset);
    const weekStartK = key(weekStartD);

    // Individual Member Streaks and Attendance Analytics
    const memberStreaksList = (state.users || []).map(u => {
      const streaks = calculateMemberStreaks(u.id, state.standups || [], state.clocks || [], todayStr, currentTime);
      const activeClock = (state.clocks || []).find(c => c.user_id === u.id && !c.end);
      const todayStandup = todayStandups.find(s => s.owner === u.id);
      const uWeekClocks = (state.clocks || []).filter(c => c.user_id === u.id && c.start && key(new Date(c.start * 1000)) >= weekStartK);
      const weekHours = uWeekClocks.reduce((sum, c) => sum + worked(c, currentTime) / 3600, 0);

      return {
        user: u,
        ...streaks,
        activeClock,
        todayStandup,
        weekHours
      };
    });

    const checkedInTodayMembersCount = memberStreaksList.filter(m => m.checkedToday).length;
    const clockedInNowMembersCount = memberStreaksList.filter(m => m.activeClock && !m.activeClock.break_start).length;
    const onBreakNowMembersCount = memberStreaksList.filter(m => m.activeClock?.break_start).length;

    // Leaderboard Rankings (Check-in Streak and Clock Attendance Streak)
    const checkinRanked = [...memberStreaksList].sort((a, b) => {
      if (b.checkinStreak !== a.checkinStreak) return b.checkinStreak - a.checkinStreak;
      if (b.bestCheckinStreak !== a.bestCheckinStreak) return b.bestCheckinStreak - a.bestCheckinStreak;
      return b.totalCheckins - a.totalCheckins;
    });
    const checkinRankMap = new Map();
    checkinRanked.forEach((m, idx) => checkinRankMap.set(m.user.id, idx + 1));

    const clockRanked = [...memberStreaksList].sort((a, b) => {
      if (b.clockStreak !== a.clockStreak) return b.clockStreak - a.clockStreak;
      if (b.bestClockStreak !== a.bestClockStreak) return b.bestClockStreak - a.bestClockStreak;
      return b.weekHours - a.weekHours;
    });
    const clockRankMap = new Map();
    clockRanked.forEach((m, idx) => clockRankMap.set(m.user.id, idx + 1));

    // Attach ranks
    memberStreaksList.forEach(m => {
      m.checkinRank = checkinRankMap.get(m.user.id) || 1;
      m.clockRank = clockRankMap.get(m.user.id) || 1;
    });

    const topCheckinMember = checkinRanked[0];
    const topClockMember = clockRanked[0];
    const maxCheckinStreak = Math.max(1, ...memberStreaksList.map(m => m.checkinStreak));
    const maxClockStreak = Math.max(1, ...memberStreaksList.map(m => m.clockStreak));

    // Filter members for the streak tracking board
    const filteredMemberStreaks = memberStreaksList.filter(m => {
      if (streakFilter === 'checked_in' && !m.checkedToday) return false;
      if (streakFilter === 'pending' && m.checkedToday) return false;
      if (streakFilter === 'clocked_in' && (!m.activeClock || m.activeClock.break_start)) return false;
      if (streakSearch) {
        const q = streakSearch.toLowerCase().trim();
        const matchesName = (m.user.name || '').toLowerCase().includes(q);
        const matchesDept = (m.user.department || '').toLowerCase().includes(q);
        const matchesPos = getUserPositions(m.user).some(pos => pos.toLowerCase().includes(q));
        if (!matchesName && !matchesDept && !matchesPos) return false;
      }
      return true;
    });

    const myMemberStreak = memberStreaksList.find(m => m.user.id === user?.id) || {
      user,
      checkinStreak: 0,
      checkedToday: false,
      bestCheckinStreak: 0,
      checkinRank: 1,
      clockStreak: 0,
      clockedToday: false,
      bestClockStreak: 0,
      clockRank: 1,
      last7Days: [],
      last14Days: [],
      weekHours: 0
    };

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Dashboard</h1>
            <p className="sub">Everything your team is building, in one calm place.</p>
          </div>
          <div className="actions">
            {myTodayStandup ? (
              <button onClick={() => setModal({ type: 'standups', id: myTodayStandup.id, data: myTodayStandup })}>
                <Icon name="check" size={14} /> Edit today's check-in
              </button>
            ) : (
              <button className="primary pulse-checkin-btn" onClick={() => setModal({ type: 'clock', data: {} })}>
                <Icon name="pulse" /> Daily check-in &amp; clock in
              </button>
            )}
            {isAdmin && (
              <button className={myTodayStandup ? "primary" : ""} onClick={() => setModal({ type: 'projects', data: {} })}>
                <Icon name="plus" /> Add project
              </button>
            )}
          </div>
        </div>

        <div className="stats dashboard-stats">
          <div className="stat green">
            <span>Total projects</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.projects.length}</span>
            <span className="sub">Every idea has a home</span>
          </div>
          <div className="stat">
            <span>Ended projects</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.projects.filter(p => p.status === 'Completed').length}</span>
            <span className="sub">Completed and delivered</span>
          </div>
          <div className="stat">
            <span>Running projects</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.projects.filter(p => p.status === 'Active').length}</span>
            <span className="sub">Moving forward together</span>
          </div>
          <div className="stat">
            <span>Pending projects</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.projects.filter(p => p.status === 'Planning').length}</span>
            <span className="sub">Awaiting their next chapter</span>
          </div>
        </div>

        {/* Executive Alignment & Attention Bar */}
        <div className="attention-bar">
          <button
            type="button"
            className={`attention-pill ${blockedTasks.length ? 'alert' : ''}`}
            onClick={() => { navigate('tasks'); setFilter('Blocked'); }}
          >
            <i className="dot" style={{ background: blockedTasks.length ? '#c6463d' : 'var(--green)' }} />
            <span><b>{blockedTasks.length}</b> Blocked tasks</span>
          </button>
          <button
            type="button"
            className={`attention-pill ${overdueTasks.length ? 'warn' : ''}`}
            onClick={() => { navigate('tasks'); setFilter('Overdue'); }}
          >
            <i className="dot" style={{ background: overdueTasks.length ? '#d69e2e' : 'var(--green)' }} />
            <span><b>{overdueTasks.length}</b> Overdue tasks</span>
          </button>
          <button
            type="button"
            className={`attention-pill ${dueLeads.length ? 'warn' : ''}`}
            onClick={() => { navigate('leads'); setFilter('Follow-up due'); }}
          >
            <i className="dot" style={{ background: dueLeads.length ? '#d69e2e' : 'var(--green)' }} />
            <span><b>{dueLeads.length}</b> Lead follow-ups due</span>
          </button>
          <button
            type="button"
            className="attention-pill"
            onClick={() => navigate('clock')}
          >
            <i className="dot" />
            <span><b>{workingCount}</b> Working · <b>{breakCount}</b> On break</span>
          </button>
          <button
            type="button"
            className="attention-pill"
            onClick={() => navigate('pulse')}
          >
            <i className="dot" style={{ background: 'var(--mid)' }} />
            <span><b>{uniqueCheckedInCount}</b> Team check-in{uniqueCheckedInCount === 1 ? '' : 's'} today · <b>{(state.goals || []).length}</b> Goals</span>
          </button>
        </div>

        {/* Individual Member Streaks & Live Attendance Analytics Bento */}
        {isAdmin ? (
          <section className="streak-dashboard-section">
            {/* Quick Metrics KPI Bar */}
            <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
              <div className="card-head" style={{ margin: 0, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 16 }}>Individual member streak &amp; attendance analytics</h3>
                    <span className="tag green" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <Icon name="shield" size={11} style={{ marginRight: 3 }} />Live Tracking
                    </span>
                  </div>
                  <p className="sub" style={{ margin: '3px 0 0' }}>
                    Live tracking of daily check-in streaks, clock-in consistency, and active shift presence across all team members.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="small" onClick={() => navigate('pulse')}>
                    <Icon name="pulse" size={12} /> Pulse &amp; Goals ↗
                  </button>
                  <button className="small" onClick={() => navigate('clock')}>
                    <Icon name="clock" size={12} /> Timesheets ↗
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 10, marginTop: 14 }}>
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                  <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="pulse" size={13} /> Check-ins today
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <strong style={{ fontSize: 20 }}>{checkedInTodayMembersCount} / {state.users.length}</strong>
                    <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                      {state.users.length ? Math.round((checkedInTodayMembersCount / state.users.length) * 100) : 0}% synced
                    </span>
                  </div>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                  <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="clock" size={13} /> Active presence
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <strong style={{ fontSize: 20 }}>{clockedInNowMembersCount} working</strong>
                    {onBreakNowMembersCount > 0 && <span style={{ fontSize: 11, color: '#d97706' }}>· {onBreakNowMembersCount} break</span>}
                  </div>
                </div>

                <div
                  style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer' }}
                  onClick={() => topCheckinMember?.user && setModal({ type: 'memberAnalytics', id: topCheckinMember.user.id, data: topCheckinMember.user })}
                  title="View member analytics"
                >
                  <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="flame" size={13} style={{ color: 'var(--green)' }} /> Top check-in streak
                  </span>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 15 }}>{topCheckinMember?.user?.name || '—'}</strong>
                    {topCheckinMember?.checkinStreak > 0 && (
                      <span className="tag green" style={{ padding: '2px 7px', fontSize: 11 }}>
                        <Icon name="trophy" size={10} style={{ marginRight: 3, color: '#f59e0b' }} />
                        {topCheckinMember.checkinStreak}d streak
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)', cursor: 'pointer' }}
                  onClick={() => topClockMember?.user && setModal({ type: 'memberAnalytics', id: topClockMember.user.id, data: topClockMember.user })}
                  title="View member analytics"
                >
                  <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="zap" size={13} style={{ color: '#8b5cf6' }} /> Top clock streak
                  </span>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 15 }}>{topClockMember?.user?.name || '—'}</strong>
                    {topClockMember?.clockStreak > 0 && (
                      <span className="tag purple" style={{ padding: '2px 7px', fontSize: 11 }}>
                        <Icon name="trophy" size={10} style={{ marginRight: 3, color: '#f59e0b' }} />
                        {topClockMember.clockStreak}d streak
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Dual-Card Section */}
            <div className="streak-bento-layout">
              {/* Card 1: Streak Leaderboards (following Image 2 Top Contributors Diagram Pattern) */}
              <div className="card streak-leaderboard-card">
                <div className="card-head">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>Streak Leaderboards</h3>
                    <span className="sub">Consistency rankings &amp; records</span>
                  </div>
                  <div className="streak-tab-toggle">
                    <button
                      type="button"
                      className={`streak-tab-btn ${streakBoardTab === 'checkin' ? 'active' : ''}`}
                      onClick={() => setStreakBoardTab('checkin')}
                    >
                      <Icon name="flame" size={12} /> Check-ins
                    </button>
                    <button
                      type="button"
                      className={`streak-tab-btn ${streakBoardTab === 'clock' ? 'active' : ''}`}
                      onClick={() => setStreakBoardTab('clock')}
                    >
                      <Icon name="zap" size={12} /> Attendance
                    </button>
                  </div>
                </div>

                <div className="streak-lead-list">
                  {(streakBoardTab === 'checkin' ? checkinRanked : clockRanked).map((m, idx) => {
                    const streakVal = streakBoardTab === 'checkin' ? m.checkinStreak : m.clockStreak;
                    const bestVal = streakBoardTab === 'checkin' ? m.bestCheckinStreak : m.bestClockStreak;
                    const maxVal = streakBoardTab === 'checkin' ? maxCheckinStreak : maxClockStreak;
                    const pct = maxVal > 0 ? Math.max(8, Math.round((streakVal / maxVal) * 100)) : 8;
                    const uPos = getUserPositions(m.user);

                    return (
                      <div
                        key={m.user.id}
                        className="streak-lead-row"
                        onClick={() => setModal({ type: 'memberAnalytics', id: m.user.id, data: m.user })}
                        title="Click to view full consistency analytics"
                      >
                        <span className={`streak-rank-badge ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}`}>
                          {idx === 0 ? <Icon name="trophy" size={12} style={{ color: '#f59e0b' }} /> : String(idx + 1).padStart(2, '0')}
                        </span>
                        <Avatar user={m.user} />
                        <div className="streak-lead-info">
                          <div className="streak-lead-title">
                            <span>{m.user.name}</span>
                            {isTargetSuperAdmin(m.user) ? (
                              <span className="tag super-admin-tag" style={{ fontSize: 8.5, padding: '1px 4px' }}>Super</span>
                            ) : isTargetAdmin(m.user) ? (
                              <span className="tag" style={{ fontSize: 8.5, padding: '1px 4px' }}>Admin</span>
                            ) : null}
                          </div>
                          <span className="streak-lead-sub">
                            {uPos[0] || m.user.department || 'Workspace'}
                          </span>
                          <div className={`streak-lead-progress ${streakBoardTab === 'clock' ? 'clock' : ''}`}>
                            <i style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="streak-lead-metric">
                          <strong>
                            <Icon name={streakBoardTab === 'checkin' ? 'flame' : 'zap'} size={12} style={{ color: streakBoardTab === 'checkin' ? 'var(--green)' : '#8b5cf6' }} />
                            {streakVal}d
                          </strong>
                          <small>Best: {bestVal}d</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <span className="sub" style={{ fontSize: 10 }}>Updated in real-time</span>
                  <button className="small" onClick={() => navigate('analytics')}>
                    <Icon name="analytics" size={11} /> Deep Analytics ↗
                  </button>
                </div>
              </div>

              {/* Card 2: Live Presence & 7-Day Consistency Matrix (following Image 3 Diagram Pattern) */}
              <div className="card member-habit-matrix">
                <div className="card-head" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>Team Habit &amp; Shift Matrix</h3>
                    <span className="sub">Live shift presence and 7-day consistency rhythms</span>
                  </div>
                </div>

                {/* Controls: Filter Pills & Search */}
                <div className="member-habit-controls">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      ['all', `All (${memberStreaksList.length})`],
                      ['checked_in', `Checked in (${checkedInTodayMembersCount})`],
                      ['pending', `Pending (${memberStreaksList.length - checkedInTodayMembersCount})`],
                      ['clocked_in', `Working (${clockedInNowMembersCount})`]
                    ].map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        className={`small ${streakFilter === k ? 'primary' : ''}`}
                        onClick={() => setStreakFilter(k)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ minWidth: 0, width: '100%', maxWidth: 240 }}>
                    <input
                      type="text"
                      placeholder="Search member or role…"
                      value={streakSearch}
                      onChange={e => setStreakSearch(e.target.value)}
                      style={{ padding: '6px 12px', fontSize: 11.5, borderRadius: 20, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Grid of Member Habit Cards */}
                <div className="member-habit-grid">
                  {filteredMemberStreaks.map(m => {
                    const uPos = getUserPositions(m.user);
                    const isTargetSuper = isTargetSuperAdmin(m.user);
                    const isTargetAdm = isTargetAdmin(m.user);
                    const maxMiniHours = Math.max(8, ...m.last7Days.map(d => d.hours || 0));

                    return (
                      <div key={m.user.id} className="member-habit-card">
                        {/* Card Header: Avatar, Name, Live Presence Badge */}
                        <div className="member-habit-card-head">
                          <div className="member-habit-identity">
                            <Avatar user={m.user} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <strong onClick={() => setModal({ type: 'person', id: m.user.id, data: m.user })}>
                                  {m.user.name}
                                </strong>
                                {isTargetSuper ? (
                                  <span className="tag super-admin-tag" style={{ fontSize: 9, padding: '1px 4px' }}>Super</span>
                                ) : isTargetAdm ? (
                                  <span className="tag" style={{ fontSize: 9, padding: '1px 4px' }}>Admin</span>
                                ) : null}
                              </div>
                              <span className="sub">{uPos[0] || m.user.department || 'Workspace'}</span>
                            </div>
                          </div>

                          {m.activeClock ? (
                            m.activeClock.break_start ? (
                              <span className="tag yellow" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Icon name="coffee" size={11} />Break ({duration(breakDuration(m.activeClock, currentTime))})
                              </span>
                            ) : (
                              <span className="tag green" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <i style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                                Working ({duration(worked(m.activeClock, currentTime))})
                              </span>
                            )
                          ) : (
                            <span className="tag" style={{ fontSize: 10, color: 'var(--muted)' }}>Off shift</span>
                          )}
                        </div>

                        {/* Habit Dials (Check-in and Clock streaks) */}
                        <div className="member-habit-stats">
                          <div className="habit-stat-box">
                            <span className="habit-stat-label">
                              <Icon name="flame" size={11} style={{ color: 'var(--green)' }} /> Check-in
                            </span>
                            <span className="habit-stat-val">
                              {m.checkinStreak}d streak
                              {m.checkedToday ? (
                                <span className="tag green" style={{ fontSize: 9, padding: '1px 5px' }}>Done</span>
                              ) : (
                                <span className="tag yellow" style={{ fontSize: 9, padding: '1px 5px' }}>Pending</span>
                              )}
                            </span>
                            <span className="habit-stat-sub" title={m.todayStandup ? `“${m.todayStandup.title}”` : `Record: ${m.bestCheckinStreak}d`}>
                              {m.todayStandup ? `“${m.todayStandup.title}”` : `Record: ${m.bestCheckinStreak}d`}
                            </span>
                          </div>

                          <div className="habit-stat-box">
                            <span className="habit-stat-label">
                              <Icon name="zap" size={11} style={{ color: '#8b5cf6' }} /> Attendance
                            </span>
                            <span className="habit-stat-val">
                              {m.clockStreak}d streak
                            </span>
                            <span className="habit-stat-sub">
                              {m.weekHours.toFixed(1)}h this week
                            </span>
                          </div>
                        </div>

                        {/* 7-Day Vertical Rhythm Capsules (Image 3 Diagram Pattern) */}
                        <div className="rhythm-7d-matrix">
                          <div className="rhythm-7d-head">
                            <span>7-Day Rhythm</span>
                            <span>{m.last7Days.filter(d => d.hasCheckin).length}/7 checked</span>
                          </div>
                          <div className="rhythm-7d-bars">
                            {m.last7Days.map(d => {
                              const fillPct = maxMiniHours > 0 && d.hours > 0 ? Math.min(100, Math.round((d.hours / maxMiniHours) * 100)) : (d.hasClock ? 35 : 0);
                              return (
                                <div
                                  key={d.date}
                                  className={`rhythm-7d-col ${d.isToday ? 'is-today' : ''}`}
                                  title={`${d.date} (${d.shortDay}): ${d.hasCheckin ? 'Check-in submitted' : 'No check-in'} · ${d.hours.toFixed(1)}h clocked`}
                                >
                                  <div className="rhythm-7d-track">
                                    {d.hasCheckin && <span className="rhythm-7d-check-dot" />}
                                    <div className="rhythm-7d-fill" style={{ height: `${Math.max(d.hours > 0 ? 15 : 0, fillPct)}%` }} />
                                  </div>
                                  <span className="rhythm-7d-day-label">{d.dayLabel}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="member-habit-foot">
                          <button
                            type="button"
                            className="small"
                            onClick={() => setModal({ type: 'memberAnalytics', id: m.user.id, data: m.user })}
                          >
                            <Icon name="analytics" size={12} /> Analytics
                          </button>
                          {m.todayStandup ? (
                            <button
                              type="button"
                              className="small"
                              onClick={() => setModal({ type: 'standups', id: m.todayStandup.id, data: m.todayStandup })}
                            >
                              Check-in ↗
                            </button>
                          ) : (
                            <span className="sub" style={{ fontSize: 10 }}>Rank #{m.checkinRank}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredMemberStreaks.length === 0 && (
                  <div className="empty" style={{ padding: '24px 16px' }}>
                    <strong>No members match this filter</strong>
                    Try choosing "All" or clearing the search box.
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="streak-dashboard-section">
            <div className="streak-bento-layout">
              {/* My Habit Streaks & All-Time Records */}
              <div className="card" style={{ padding: 20 }}>
                <div className="card-head" style={{ marginBottom: 14 }}>
                  <div>
                    <span className="eyebrow" style={{ margin: 0 }}>My Habits &amp; Personal Record</span>
                    <h3 style={{ margin: '3px 0 0', fontSize: 16 }}>My Consistency &amp; Team Rank</h3>
                  </div>
                  <button
                    className="small primary"
                    onClick={() =>
                      setModal(
                        myTodayStandup
                          ? { type: 'standups', id: myTodayStandup.id, data: myTodayStandup }
                          : { type: 'standups', data: { date: todayStr, mood: 'Focused' } }
                      )
                    }
                  >
                    {myTodayStandup ? "Edit today's check-in" : 'Post daily check-in'}
                  </button>
                </div>

                {/* 2 Bento KPI Tiles for Employee */}
                <div className="my-streak-hero" style={{ marginBottom: 16 }}>
                  <div className="my-streak-tile">
                    <div className="my-streak-tile-head">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="flame" size={14} style={{ color: 'var(--green)' }} /> Daily Check-in Streak
                      </span>
                      <span className="tag green" style={{ fontSize: 9.5 }}>Rank #{myMemberStreak.checkinRank}</span>
                    </div>
                    <div className="my-streak-tile-digits">{myMemberStreak.checkinStreak}<small style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginLeft: 5 }}>days</small></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="sub" style={{ fontSize: 10.5 }}>
                        {myMemberStreak.checkedToday ? (
                          <span style={{ color: 'var(--green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Icon name="check" size={11} />Checked in today!
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Icon name="pulse" size={11} />Pending check-in
                          </span>
                        )}
                      </span>
                      <span className="sub" style={{ fontSize: 10.5, fontWeight: 600 }}>Best: {myMemberStreak.bestCheckinStreak}d</span>
                    </div>
                  </div>

                  <div className="my-streak-tile">
                    <div className="my-streak-tile-head">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="zap" size={14} style={{ color: '#8b5cf6' }} /> Shift Consistency
                      </span>
                      <span className="tag purple" style={{ fontSize: 9.5 }}>Rank #{myMemberStreak.clockRank}</span>
                    </div>
                    <div className="my-streak-tile-digits">{myMemberStreak.clockStreak}<small style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginLeft: 5 }}>days</small></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="sub" style={{ fontSize: 10.5 }}>
                        {myMemberStreak.activeClock ? 'Currently clocked in' : `${myMemberStreak.weekHours.toFixed(1)}h this week`}
                      </span>
                      <span className="sub" style={{ fontSize: 10.5, fontWeight: 600 }}>Best: {myMemberStreak.bestClockStreak}d</span>
                    </div>
                  </div>
                </div>

                {/* 7-Day Rhythm Diagram */}
                <div className="rhythm-7d-matrix" style={{ marginTop: 8 }}>
                  <div className="rhythm-7d-head">
                    <span>7-Day Work &amp; Check-in Rhythm</span>
                    <span>{myMemberStreak.last7Days.filter(d => d.hasCheckin).length} of 7 days completed</span>
                  </div>
                  <div className="rhythm-7d-bars" style={{ height: 60 }}>
                    {myMemberStreak.last7Days.map(d => (
                      <div
                        key={d.date}
                        className={`rhythm-7d-col ${d.isToday ? 'is-today' : ''}`}
                        title={`${d.date} (${d.shortDay}): ${d.hasCheckin ? 'Check-in done' : 'No check-in'} · ${d.hours.toFixed(1)}h worked`}
                      >
                        <div className="rhythm-7d-track" style={{ height: 44 }}>
                          {d.hasCheckin && <span className="rhythm-7d-check-dot" />}
                          <div className="rhythm-7d-fill" style={{ height: `${d.hours > 0 ? Math.min(100, Math.round((d.hours / 8) * 100)) : (d.hasClock ? 40 : 0)}%` }} />
                        </div>
                        <span className="rhythm-7d-day-label">{d.dayLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Streak Leaderboard (Visible to Employee too!) */}
              <div className="card streak-leaderboard-card">
                <div className="card-head">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>Team Streak Leaderboard</h3>
                    <span className="sub">See where you stand among your peers</span>
                  </div>
                  <div className="streak-tab-toggle">
                    <button
                      type="button"
                      className={`streak-tab-btn ${streakBoardTab === 'checkin' ? 'active' : ''}`}
                      onClick={() => setStreakBoardTab('checkin')}
                    >
                      <Icon name="flame" size={12} /> Check-ins
                    </button>
                    <button
                      type="button"
                      className={`streak-tab-btn ${streakBoardTab === 'clock' ? 'active' : ''}`}
                      onClick={() => setStreakBoardTab('clock')}
                    >
                      <Icon name="zap" size={12} /> Attendance
                    </button>
                  </div>
                </div>

                <div className="streak-lead-list">
                  {(streakBoardTab === 'checkin' ? checkinRanked : clockRanked).slice(0, 6).map((m, idx) => {
                    const isMe = m.user.id === user?.id;
                    const streakVal = streakBoardTab === 'checkin' ? m.checkinStreak : m.clockStreak;
                    const bestVal = streakBoardTab === 'checkin' ? m.bestCheckinStreak : m.bestClockStreak;
                    const maxVal = streakBoardTab === 'checkin' ? maxCheckinStreak : maxClockStreak;
                    const pct = maxVal > 0 ? Math.max(8, Math.round((streakVal / maxVal) * 100)) : 8;

                    return (
                      <div
                        key={m.user.id}
                        className="streak-lead-row"
                        style={{
                          background: isMe ? 'color-mix(in srgb, var(--green) 12%, transparent)' : undefined,
                          borderLeft: isMe ? '3px solid var(--green)' : undefined
                        }}
                      >
                        <span className={`streak-rank-badge ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}`}>
                          {idx === 0 ? <Icon name="trophy" size={12} style={{ color: '#f59e0b' }} /> : String(idx + 1).padStart(2, '0')}
                        </span>
                        <Avatar user={m.user} />
                        <div className="streak-lead-info">
                          <div className="streak-lead-title">
                            <span>{m.user.name}</span>
                            {isMe && <span className="tag green" style={{ fontSize: 8.5, padding: '1px 5px' }}>You</span>}
                          </div>
                          <div className={`streak-lead-progress ${streakBoardTab === 'clock' ? 'clock' : ''}`}>
                            <i style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="streak-lead-metric">
                          <strong>
                            <Icon name={streakBoardTab === 'checkin' ? 'flame' : 'zap'} size={12} style={{ color: streakBoardTab === 'checkin' ? 'var(--green)' : '#8b5cf6' }} />
                            {streakVal}d
                          </strong>
                          <small>Record: {bestVal}d</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="bento-grid">
          {/* Project Analytics Pillars */}
          <section className="card project-analytics">
            <div className="card-head">
              <div>
                <h3>Project analytics</h3>
                <p className="sub">Task volume and completion, at a glance.</p>
              </div>
              <span className="mini-label">Completion %</span>
            </div>
            <div className="project-bars">
              {(state.projects.length
                ? state.projects.slice(0, 7)
                : Array.from({ length: 7 }, (_, i) => ({ id: `empty-${i}`, title: 'No project', empty: true }))
              ).map((p, i) => {
                const pTasks = p.empty ? [] : state.tasks.filter(t => t.project === p.id);
                const c = completion(pTasks);
                const pctVal = p.empty ? 0 : getProjectProgressPct(p);
                const colorVars = ['mid', 'green', 'soft', 'deep', 'mid', 'soft', 'green'];
                const barHeight = c.total ? 50 + (50 * c.total) / maxTasks : pctVal > 0 ? 60 : 50;
                return (
                  <button
                    key={p.id}
                    className="project-bar-item"
                    style={{
                      '--bar-height': `${barHeight}%`,
                      '--bar-color': `var(--${colorVars[i % colorVars.length]})`
                    }}
                    onClick={() => {
                      if (!p.empty) setModal({ type: 'projects', id: p.id, data: p });
                      else if (isAdmin) setModal({ type: 'projects', data: {} });
                    }}
                    aria-label={`${p.title}: ${pctVal}% complete, ${c.done} of ${c.total} tasks`}
                  >
                    <span className="bar-tooltip" role="tooltip">
                      <strong>{p.title}</strong>
                      <b>{pctVal}% complete</b>
                      <small>{c.total ? `${c.done} / ${c.total} tasks finished` : p.status || 'No tasks yet'}</small>
                    </span>
                    <span className="pill-track">
                      <span className="pill-fill" style={{ height: `${pctVal}%` }}></span>
                    </span>
                    <span className="pill-label">
                      {p.empty ? '—' : p.title.split(' ').map(x => x[0]).join('').slice(0, 3).toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="chart-foot">
              <span><i className="dot"></i>Completed tasks</span>
              <span><i className="dot striped"></i>Remaining tasks</span>
            </div>
          </section>

          {/* Up Next Reminder */}
          <section className="card reminder">
            <div>
              <div className="card-head">
                <h3>Reminders</h3>
                <Icon name="calendar" />
              </div>
              <span className="mini-label">{nextMeeting ? fmtDate(nextMeeting.start) : 'Your next conversation'}</span>
              {nextMeeting ? (
                <>
                  <h2>{nextMeeting.title}</h2>
                  <p className="sub">Time: {fmtTime(nextMeeting.start)} – {fmtTime(nextMeeting.end)}</p>
                  <div className="avatar-stack">
                    {(nextMeeting.attendees || []).slice(0, 4).map(uid => (
                      <Avatar key={uid} user={state.users.find(u => u.id === uid)} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty">
                  <strong>A moment to focus</strong>Your next meeting will appear here.
                </div>
              )}
            </div>
            {nextMeeting?.link ? (
              <a className="primary meeting-join" target="_blank" rel="noopener noreferrer" href={nextMeeting.link}>
                <Icon name="meetings" /> Join meeting ↗
              </a>
            ) : (
              <button className="primary" onClick={() => navigate('meetings')}>
                <Icon name="meetings" /> View meetings
              </button>
            )}
          </section>

          {/* Projects List */}
          <section className="card dashboard-projects">
            <div className="card-head">
              <h3>Projects</h3>
              <button className="small" onClick={() => navigate('projects')}>View all ↗</button>
            </div>
            {state.projects.slice(0, 5).map((p, i) => {
              const progressPct = getProjectProgressPct(p);
              return (
                <div key={p.id} className="list-row" onClick={() => setModal({ type: 'projects', id: p.id, data: p })} style={{ cursor: 'pointer' }}>
                  <div className={`project-symbol project-symbol-${i % 4}`}>
                    <Icon name={['folder', 'projects', 'tasks', 'pulse'][i % 4]} size={14} />
                  </div>
                  <div className="grow">
                    <strong>{p.title}</strong>
                    <span className="sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="play" size={10} />{fmtDate(p.startDate || p.created)}</span>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Icon name="calendar" size={10} />
                        {p.due ? `Due ${fmtDate(p.due)}` : 'No deadline'}
                      </span>
                    </span>
                  </div>
                  <span className="project-percent">{progressPct}%</span>
                </div>
              );
            })}
            {state.projects.length === 0 && (
              <div className="empty">
                <strong>Ideas start here</strong>Create your first project.
              </div>
            )}
          </section>

          {/* Team Collaboration */}
          <section className="card dashboard-team">
            <div className="card-head">
              <h3>Team collaboration</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="small" onClick={() => navigate('pulse')}>Goals & sync ↗</button>
                <button className="small" onClick={() => navigate('team')}>Team ↗</button>
              </div>
            </div>
            {state.users.slice(0, 4).map(u => {
              const isSelfOrAdmin = isAdmin || u.id === user.id;
              const activeTask = isSelfOrAdmin
                ? state.tasks.find(t => isUserAssignedToTask(t, u.id) && t.status !== 'Done')
                : null;
              const uGoals = isSelfOrAdmin
                ? (state.goals || []).filter(g => isGoalAssignedToUser(g, u.id))
                : [];
              const activeGoal = uGoals.find(g => g.status !== 'Completed') || uGoals[0];
              const uClock = state.clocks.find(c => c.user_id === u.id && !c.end);
              const uPositions = getUserPositions(u);
              const uMemberStreak = memberStreaksList.find(m => m.user.id === u.id);
              return (
                <div key={u.id} className="list-row" onClick={() => setModal({ type: 'person', id: u.id, data: u })} style={{ cursor: 'pointer' }}>
                  <Avatar user={u} />
                  <div className="grow">
                    <strong>{u.name}</strong>
                    <span className="sub">
                      {activeTask
                        ? activeTask.title
                        : activeGoal
                        ? `Goal: ${activeGoal.title}`
                        : uPositions.length
                        ? `${uPositions.join(' · ')} · ${u.department}`
                        : u.department}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {uMemberStreak?.checkinStreak > 0 && (
                      <span className="tag green" style={{ fontSize: 10.5, padding: '2px 7px' }} title={`${uMemberStreak.checkinStreak} day check-in streak`}>
                        <Icon name="flame" size={11} style={{ marginRight: 2 }} />
                        {uMemberStreak.checkinStreak}d
                      </span>
                    )}
                    <span className={`tag ${uClock ? (uClock.break_start ? 'yellow' : 'green') : activeTask ? 'yellow' : ''}`}>
                      {uClock ? (uClock.break_start ? 'On break' : 'Clocked in') : activeTask ? activeTask.status : 'Available'}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Project Progress Gauge */}
          <section className="card dashboard-progress">
            <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Project progress</h3>
                <span className="sub" style={{ fontSize: 10 }}>Overall task velocity &amp; completion</span>
              </div>
              <div className="gauge-mode-toggle">
                <button
                  type="button"
                  className={`gauge-toggle-btn ${gaugeMode === 'completion' ? 'active' : ''}`}
                  onClick={() => setGaugeMode('completion')}
                  title="View task completion rate"
                >
                  Completion ({comp.percent}%)
                </button>
                <button
                  type="button"
                  className={`gauge-toggle-btn ${gaugeMode === 'breakdown' ? 'active' : ''}`}
                  onClick={() => setGaugeMode('breakdown')}
                  title="View task status breakdown"
                >
                  All tasks ({comp.total})
                </button>
              </div>
            </div>
            <div className="gauge-wrap">
              <svg className="semi-gauge" viewBox="0 0 260 150" role="img" aria-label={`${comp.percent}% tasks completed`}>
                <defs>
                  <pattern id="gauge-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill="var(--bg)" />
                    <path d="M0 0V6" stroke="var(--stripe, var(--line))" strokeWidth="2" opacity="0.65" />
                  </pattern>
                  <linearGradient id="gauge-green-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="gauge-purple-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                {/* Background Semicircle Track */}
                <path d="M28 126 A102 102 0 0 1 232 126" fill="none" stroke="url(#gauge-stripes)" strokeWidth="28" strokeLinecap="round" />

                {gaugeMode === 'completion' ? (
                  /* Completion Mode: Arc is 100% in sync with the central % value */
                  comp.percent > 0 && (
                    <path
                      d="M28 126 A102 102 0 0 1 232 126"
                      pathLength="100"
                      fill="none"
                      stroke="url(#gauge-green-grad)"
                      strokeWidth="28"
                      strokeDasharray={`${comp.percent} 100`}
                      strokeLinecap="round"
                    />
                  )
                ) : (
                  /* Breakdown Mode: Clearly distinct emerald and purple segments */
                  <>
                    {comp.done > 0 && (
                      <path
                        d="M28 126 A102 102 0 0 1 232 126"
                        pathLength="100"
                        fill="none"
                        stroke="url(#gauge-green-grad)"
                        strokeWidth="28"
                        strokeDasharray={`${comp.doneShare * 100} 100`}
                        strokeLinecap={comp.ongoing > 0 ? 'round' : 'round'}
                      />
                    )}
                    {comp.ongoing > 0 && (
                      <path
                        d="M28 126 A102 102 0 0 1 232 126"
                        pathLength="100"
                        fill="none"
                        stroke="url(#gauge-purple-grad)"
                        strokeWidth="28"
                        strokeDasharray={`${comp.ongoingShare * 100} 100`}
                        strokeDashoffset={`-${comp.doneShare * 100}`}
                        strokeLinecap={comp.done > 0 ? 'round' : 'round'}
                      />
                    )}
                  </>
                )}
              </svg>
              <div className="gauge-label">
                <b>{comp.percent}%</b>
                <span>{gaugeMode === 'completion' ? 'Tasks completed' : `${comp.done} of ${comp.total} completed`}</span>
              </div>
            </div>

            {/* Segmented Distribution Bar */}
            <div className="gauge-distribution-bar" title={`Completed: ${comp.done} · In progress: ${comp.ongoing} · Pending: ${comp.pending}`}>
              {comp.done > 0 && (
                <div
                  className="dist-seg done"
                  style={{ width: `${comp.doneShare * 100}%` }}
                  title={`Completed: ${comp.done} (${Math.round(comp.doneShare * 100)}%)`}
                />
              )}
              {comp.ongoing > 0 && (
                <div
                  className="dist-seg ongoing"
                  style={{ width: `${comp.ongoingShare * 100}%` }}
                  title={`In progress: ${comp.ongoing} (${Math.round(comp.ongoingShare * 100)}%)`}
                />
              )}
              {comp.pending > 0 && (
                <div
                  className="dist-seg pending"
                  style={{ width: `${(comp.pending / (comp.total || 1)) * 100}%` }}
                  title={`Pending: ${comp.pending} (${Math.round(((comp.pending) / (comp.total || 1)) * 100)}%)`}
                />
              )}
            </div>

            <div className="gauge-legend">
              <span className="legend-item"><i className="dot" style={{ background: '#10b981' }}></i>Completed <b>{comp.done}</b> <small>({comp.percent}%)</small></span>
              <span className="legend-item"><i className="dot" style={{ background: '#8b5cf6' }}></i>In progress <b>{comp.ongoing}</b> <small>({Math.round(comp.ongoingShare * 100)}%)</small></span>
              <span className="legend-item"><i className="dot striped"></i>Pending <b>{comp.pending}</b> <small>({Math.round(((comp.pending) / (comp.total || 1)) * 100)}%)</small></span>
            </div>
          </section>

          {/* Time Tracker Card */}
          <section className={`card timer-card ${activeClock?.break_start ? 'is-on-break' : ''}`}>
            <div className="card-head">
              <h3>Time tracker</h3>
              <span className="timer-state">
                <i></i>{activeClock ? (activeClock.break_start ? 'On break' : 'Tracking') : 'Ready'}
              </span>
            </div>
            <p className="sub timer-project">
              {activeClock
                ? `${state.projects.find(p => p.id === activeClock.project)?.title || 'Focused work'} · In at ${fmtTime(activeClock.start * 1000)}`
                : 'Make a little space for focused work.'}
            </p>
            <div className="time-digits">{duration(activeClock?.break_start ? activeBreakSeconds : activeClockSeconds)}</div>
            {activeClock && (
              <div className="timer-metrics">
                <div className={`timer-metric ${!activeClock.break_start ? 'active' : ''}`}>
                  <span>Work time</span>
                  <b>{duration(activeClockSeconds)}</b>
                </div>
                <div className={`timer-metric ${activeClock.break_start ? 'active break' : ''}`}>
                  <span>Break time</span>
                  <b>{duration(activeBreakSeconds)}</b>
                </div>
              </div>
            )}
            <div className="timer-controls">
              {activeClock ? (
                <>
                  <button
                    onClick={() => handleClock(activeClock.break_start ? 'resume' : 'break')}
                    className="break-button"
                  >
                    <Icon name={activeClock.break_start ? 'play' : 'pause'} />
                    {activeClock.break_start ? 'Resume work' : 'Start break'}
                  </button>
                  <button className="stop" onClick={() => handleClock('stop')}>
                    <Icon name="stop" /> Clock out
                  </button>
                </>
              ) : (
                <>
                  <button className="start-button" onClick={() => setModal({ type: 'clock', data: {} })}>
                    <Icon name="play" /> {myTodayStandup ? 'Clock in' : 'Check in & Clock in'}
                  </button>
                  <button className="break-button" disabled title="Clock in to take a break">
                    <Icon name="pause" /> Break
                  </button>
                </>
              )}
            </div>
            <div className="timer-caption">
              {activeClock?.break_start
                ? 'Break timer is running on server. Work timer is paused until you resume or clock out.'
                : activeClock
                ? 'Runs on server even if you close this tab — stops only when you clock out.'
                : !myTodayStandup
                ? 'Daily check-in required at shift kickoff to maintain your streak.'
                : 'Checked in for today. Your timer keeps running on the server when you close this tab.'}
            </div>
          </section>
        </div>
      </>
    );
  };

  // 2. Tasks Kanban Board
  const renderTasks = () => {
    const todayStr = key(new Date());
    const isUserOnTask = (t, uid) =>
      t.assignee === uid || (Array.isArray(t.assignees) && t.assignees.includes(uid));

    let filtered = state.tasks.filter(t => {
      if (taskProjectFilter !== 'all' && (t.project || '') !== taskProjectFilter) return false;
      if (taskMemberFilter !== 'all' && !isUserOnTask(t, taskMemberFilter)) return false;
      if (filter === 'All') return true;
      if (filter === 'My tasks') return isUserOnTask(t, user.id);
      if (filter === 'High priority') return t.priority === 'High';
      if (filter === 'Blocked') return Boolean(t.blocked) && t.status !== 'Done';
      if (filter === 'Overdue') return Boolean(t.due && t.due < todayStr && t.status !== 'Done');
      if (filter === 'Due this week') {
        if (!t.due) return false;
        const d = new Date(t.due);
        const start = new Date(new Date().setHours(0, 0, 0, 0));
        return d >= start && d < new Date(Date.now() + 7 * 864e5);
      }
      return true;
    });

    const columns = ['To do', 'In progress', 'In review', 'Done'];
    const dots = ['#819281', '#d6b86a', '#9983bd', '#328264'];

    const moveTaskStatus = async (task, targetStatus) => {
      if (!task || task.status === targetStatus) return;
      if (!canEdit('tasks', task)) {
        showToast('Least-privilege RBAC: You cannot move tasks you do not own or are not assigned to.');
        return;
      }
      const prevStatus = task.status;
      const prevCompleted = task.completed_at;
      const updatedTask = {
        ...task,
        status: targetStatus,
        completed_at: targetStatus === 'Done' ? (task.completed_at || new Date().toISOString()) : null
      };
      // Instant 0ms optimistic UI update
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(item => (item.id === task.id ? updatedTask : item))
      }));
      showToast(`Task moved to ${targetStatus}`);
      try {
        await handleApi('/api/record', {
          kind: 'tasks',
          id: task.id,
          body: updatedTask
        });
        refreshState();
      } catch (err) {
        // Roll back on error
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(item => (item.id === task.id ? { ...item, status: prevStatus, completed_at: prevCompleted } : item))
        }));
        showToast(err.message);
      }
    };

    const onDropTask = (e, targetStatus) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('text/plain');
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;
      if (!canEdit('tasks', task)) {
        showToast('Least-privilege RBAC: You cannot move tasks you do not own or are not assigned to.');
        return;
      }
      if (task.status !== targetStatus) {
        moveTaskStatus(task, targetStatus);
      }
    };

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Tasks</h1>
            <p className="sub">A little clarity for every next step. Drag cards or click stage arrows to move work forward instantly.</p>
          </div>
          <div className="actions">
            <button
              className="primary"
              onClick={() =>
                setModal({
                  type: 'tasks',
                  data: {
                    project: taskProjectFilter !== 'all' ? taskProjectFilter : (assignedProjects[0]?.id || ''),
                    assignee: taskMemberFilter !== 'all' ? taskMemberFilter : user.id,
                    assignees: [taskMemberFilter !== 'all' ? taskMemberFilter : user.id],
                    startDate: todayStr,
                    due: todayStr,
                    status: 'To do',
                    priority: 'Medium'
                  }
                })
              }
            >
              <Icon name="plus" /> New task
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['All', 'My tasks', 'High priority', 'Blocked', 'Overdue', 'Due this week'].map(tab => (
              <button key={tab} className={filter === tab ? 'active' : ''} onClick={() => setFilter(tab)}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              aria-label="Filter by project"
              value={taskProjectFilter}
              onChange={e => setTaskProjectFilter(e.target.value)}
              style={{ width: 'auto', minWidth: 160, padding: '7px 11px', fontSize: 12 }}
            >
              <option value="all">{isAdmin ? 'All projects' : 'My assigned projects'}</option>
              {assignedProjects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {isAdmin ? (
              <select
                aria-label="Filter by assigned member"
                value={taskMemberFilter}
                onChange={e => setTaskMemberFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 160, padding: '7px 11px', fontSize: 12 }}
              >
                <option value="all">All team members</option>
                {state.users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            ) : (
              <span className="tag" title="RBAC Least Privilege: You only view tasks assigned to you or created by you.">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="lock" size={12} />Assigned &amp; Personal Scope · Least Privilege</span>
              </span>
            )}
          </div>
        </div>

        <div className="board">
          {columns.map((col, idx) => {
            const colTasks = filtered.filter(t => t.status === col);
            return (
              <section
                key={col}
                className="column"
                onDragOver={e => e.preventDefault()}
                onDrop={e => onDropTask(e, col)}
              >
                <div className="column-head">
                  <span>
                    <i className="dot" style={{ background: dots[idx] }}></i>
                    {col}
                  </span>
                  <span className="muted">{colTasks.length}</span>
                </div>
                {colTasks.map(t => {
                  const subtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
                  const subDone = subtasks.filter(s => s.done).length;
                  const comments = Array.isArray(t.comments) ? t.comments : [];
                  const taskHours = state.clocks
                    .filter(c => c.task === t.id)
                    .reduce((n, c) => n + worked(c, currentTime) / 3600, 0);
                  const isOverdue = t.due && t.due < todayStr && t.status !== 'Done';
                  const isDueToday = t.due && t.due === todayStr && t.status !== 'Done';
                  const proj = state.projects.find(p => p.id === t.project);
                  const assignedIds = [...new Set([t.assignee, ...(Array.isArray(t.assignees) ? t.assignees : [])].filter(Boolean))];
                  const editableTask = canEdit('tasks', t);
                  const canScopeTask = canManageTaskScope(t);
                  const isAssignedAdminTask = editableTask && !canScopeTask;
                  const taskStart = t.startDate || t.assigned_at || t.created;
                  const prevCol = idx > 0 ? columns[idx - 1] : null;
                  const nextCol = idx < columns.length - 1 ? columns[idx + 1] : null;

                  return (
                    <article
                      key={t.id}
                      className={`task ${t.blocked && t.status !== 'Done' ? 'is-blocked' : ''}`}
                      draggable={editableTask}
                      onDragStart={e => e.dataTransfer.setData('text/plain', t.id)}
                      style={editableTask ? undefined : { cursor: 'pointer', opacity: 0.92 }}
                      onClick={() => setModal({ type: 'tasks', id: t.id, data: t })}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`tag ${t.department === 'Design' ? 'purple' : ''}`}>
                            {t.department || 'General'}
                          </span>
                          {!editableTask && (
                            <span className="tag" style={{ fontSize: 10, padding: '2px 6px', opacity: 0.85 }} title="Assigned to another team member">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="lock" size={10} />View only</span>
                            </span>
                          )}
                          {isAssignedAdminTask && (
                            <span className="tag purple" style={{ fontSize: 10, padding: '2px 6px' }} title="Assigned by administrator: execution scope">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="lock" size={10} />Admin task</span>
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {t.blocked && t.status !== 'Done' && <span className="tag red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="flag" size={11} />Blocked</span>}
                          <span className="sub">
                            {t.priority === 'High' ? '↗ ' : ''}
                            {t.priority || 'Medium'}
                          </span>
                        </div>
                      </div>
                      <h4>{t.title}</h4>
                      {proj && <div className="sub" style={{ marginTop: -8, marginBottom: 8 }}>◈ {proj.title}</div>}
                      {t.blocked && t.blockerNote && t.status !== 'Done' && (
                        <div className="task-blocker-note" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="alert" size={12} />{t.blockerNote}</div>
                      )}
                      {subtasks.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                            <span>Checklist</span>
                            <b>{subDone}/{subtasks.length}</b>
                          </div>
                          <div className="progress">
                            <i style={{ width: `${Math.round((subDone / subtasks.length) * 100)}%` }}></i>
                          </div>
                        </div>
                      )}
                      {col === 'Done' && subtasks.length === 0 && (
                        <div className="progress"><i style={{ width: '100%' }}></i></div>
                      )}
                      {(taskHours > 0 || Number(t.estimateHours) > 0 || comments.length > 0 || t.deliverableUrl) && (
                        <div className="task-badges">
                          {(taskHours > 0 || Number(t.estimateHours) > 0) && (
                            <span className="sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Icon name="clock" size={11} />{taskHours.toFixed(1)}h{Number(t.estimateHours) > 0 ? ` / ${t.estimateHours}h` : ''}
                            </span>
                          )}
                          {comments.length > 0 && <span className="sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="chat" size={11} />{comments.length}</span>}
                          {t.deliverableUrl && <span className="sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="link" size={11} />Link</span>}
                        </div>
                      )}
                      <div className="task-meta" style={{ flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className="sub" title="Kickoff / Start date" style={{ fontSize: 11 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="play" size={10} />Start: {fmtDate(taskStart)}</span>
                          </span>
                          {(col === 'Done' || t.status === 'Done') ? (
                            <span className="tag green" title="Completion date" style={{ fontSize: 10, padding: '2px 7px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="check" size={11} />Done {fmtDate(t.completed_at || t.created)}</span>
                            </span>
                          ) : t.due ? (
                            <span
                              className={`tag ${isOverdue ? 'red' : isDueToday ? 'yellow' : ''}`}
                              style={{ fontSize: 10, padding: '2px 7px' }}
                              title="Task deadline"
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Icon name={isOverdue ? 'alert' : 'calendar'} size={10} />
                                {isOverdue ? `Overdue: ${fmtDate(t.due)}` : isDueToday ? 'Due today' : `Due: ${fmtDate(t.due)}`}
                              </span>
                            </span>
                          ) : (
                            <span className="sub muted" style={{ fontSize: 10 }}>No deadline</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {editableTask && (
                            <div
                              style={{ display: 'inline-flex', gap: 3 }}
                              onClick={e => e.stopPropagation()}
                            >
                              {prevCol && (
                                <button
                                  type="button"
                                  className="small"
                                  style={{ padding: '2px 6px', fontSize: 10.5, borderRadius: 6 }}
                                  title={`Move back to ${prevCol}`}
                                  onClick={() => moveTaskStatus(t, prevCol)}
                                >
                                  ←
                                </button>
                              )}
                              {nextCol && (
                                <button
                                  type="button"
                                  className="small"
                                  style={{ padding: '2px 7px', fontSize: 10.5, borderRadius: 6 }}
                                  title={`Move forward to ${nextCol}`}
                                  onClick={() => moveTaskStatus(t, nextCol)}
                                >
                                  {nextCol === 'Done' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="check" size={11} />Done</span> : '→'}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="avatar-stack">
                            {assignedIds.slice(0, 4).map(uid => (
                              <Avatar key={uid} user={state.users.find(u => u.id === uid)} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="empty">A clear space for what’s next.</div>
                )}
              </section>
            );
          })}
        </div>
      </>
    );
  };

  // 3. Projects View
  const renderProjects = () => {
    const todayStr = key(new Date());
    const list = state.projects.filter(p => {
      if (filter === 'All') return true;
      if (filter === 'My projects') {
        const teamIds = [...new Set([p.lead, p.owner, ...(Array.isArray(p.members) ? p.members : [])].filter(Boolean))];
        return teamIds.includes(user.id);
      }
      return p.status === filter;
    });
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Projects</h1>
            <p className="sub">
              {isAdmin
                ? 'From the first idea to the final detail. Assign team members and track milestones.'
                : 'Projects assigned to you under role-based least-privilege access.'}
            </p>
          </div>
          <div className="actions">
            {isAdmin ? (
              <button className="primary" onClick={() => setModal({ type: 'projects', data: { lead: user.id, members: [user.id] } })}>
                <Icon name="plus" /> Add project
              </button>
            ) : (
              <span className="tag" title="RBAC Least Privilege: Only projects assigned to you are visible.">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="lock" size={12} />Assigned Projects · Least Privilege</span>
              </span>
            )}
          </div>
        </div>

        <div className="tabs">
          {['All', 'My projects', 'Active', 'Planning', 'Completed'].map(t => (
            <button key={t} className={filter === t ? 'active' : ''} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="project-grid">
          {list.map(p => {
            const pTasks = state.tasks.filter(t => t.project === p.id);
            const pct = getProjectProgressPct(p);
            const loggedHours = state.clocks
              .filter(c => c.project === p.id)
              .reduce((n, c) => n + worked(c, currentTime) / 3600, 0);
            const blockedCount = pTasks.filter(t => t.blocked && t.status !== 'Done').length;
            const isOverdue = p.due && p.due < todayStr && p.status !== 'Completed';
            const milestones = Array.isArray(p.milestones) ? p.milestones : [];
            const mDone = milestones.filter(m => m.done).length;
            const leadUser = state.users.find(u => u.id === (p.lead || p.owner));
            const teamMemberIds = [...new Set([p.lead || p.owner, ...(Array.isArray(p.members) ? p.members : [])].filter(Boolean))];
            const teamUsers = teamMemberIds.map(uid => state.users.find(u => u.id === uid)).filter(Boolean);
            const { timelinePct, deadlineBadge } = getProjectTimeline(p);

            const health =
              p.status === 'Completed'
                ? { label: 'Delivered', cls: '' }
                : blockedCount > 0
                ? { label: `${blockedCount} Blocked`, cls: 'red' }
                : isOverdue
                ? { label: 'Overdue', cls: 'red' }
                : Number(p.targetHours) > 0 && loggedHours > Number(p.targetHours)
                ? { label: 'Over hours', cls: 'yellow' }
                : { label: 'On track', cls: '' };

            return (
              <article key={p.id} className="card">
                <div className="card-head">
                  <div className="project-symbol"><Icon name="folder" size={15} /></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`tag ${health.cls}`}>{health.label}</span>
                    {deadlineBadge && <span className={`tag ${deadlineBadge.cls}`}><Icon name="clock" size={11} />{deadlineBadge.label}</span>}
                    <span className="tag">{p.status}</span>
                  </div>
                </div>
                <h3>{p.title}</h3>
                {p.client && <div className="sub" style={{ marginTop: 4, fontWeight: 600 }}>Client: {p.client}</div>}
                <p className="sub" style={{ margin: '10px 0 14px' }}>
                  {p.description || 'Your next big thing.'}
                </p>

                {/* Assigned Project Team Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--line)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div className="avatar-stack">
                      {teamUsers.slice(0, 5).map(u => (
                        <Avatar key={u.id} user={u} />
                      ))}
                    </div>
                    <span className="sub" style={{ fontSize: 11 }}>
                      {teamUsers.length ? `${teamUsers.length} member${teamUsers.length === 1 ? '' : 's'}` : 'No members'}
                      {leadUser ? ` · Lead: ${leadUser.name.split(' ')[0]}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="small"
                    onClick={() =>
                      setModal({
                        type: 'tasks',
                        data: {
                          project: p.id,
                          startDate: todayStr,
                          due: p.due || todayStr,
                          assignee: isAdmin ? p.lead || user.id : user.id,
                          assignees: isAdmin ? (teamMemberIds.length ? teamMemberIds : [user.id]) : [user.id]
                        }
                      })
                    }
                    title={isAdmin ? 'Assign a new task to this project' : 'Add a personal task under this assigned project'}
                  >
                    {isAdmin ? '+ Task' : '+ My task'}
                  </button>
                </div>

                <div className="project-metrics-row">
                  <div>
                    <span className="sub">{isAdmin ? 'Tasks' : 'My project tasks'}</span>
                    <b>{pTasks.filter(t => t.status === 'Done').length}/{pTasks.length} ({pct}%)</b>
                  </div>
                  <div>
                    <span className="sub">{isAdmin ? 'Hours logged' : 'My hours'}</span>
                    <b>{loggedHours.toFixed(1)}h{Number(p.targetHours) > 0 ? ` / ${p.targetHours}h` : ''}</b>
                  </div>
                  {milestones.length > 0 && (
                    <div>
                      <span className="sub">Milestones</span>
                      <b>{mDone}/{milestones.length}</b>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                    <span>Task progress</span>
                    <b>{pct}%</b>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${pct}%` }}></i>
                  </div>
                  {p.startDate && p.due && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', marginBottom: 3 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="calendar" size={10} />Timeline elapsed
                        </span>
                        <span><b>{timelinePct}%</b> ({fmtDate(p.startDate)} → {fmtDate(p.due)})</span>
                      </div>
                      <div className="progress" style={{ height: 4, background: 'var(--line)' }}>
                        <i style={{ width: `${timelinePct}%`, background: timelinePct > pct && p.status !== 'Completed' ? '#cf4945' : 'var(--muted)' }}></i>
                      </div>
                    </div>
                  )}
                </div>
                <div className="list-row" style={{ marginTop: 15 }}>
                  <div className="grow" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
                      <span className="sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="play" size={11} /><b>Start:</b> {fmtDate(p.startDate || p.created)}
                      </span>
                      <span className="sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="calendar" size={11} /><b>Deadline:</b> {p.due ? fmtDate(p.due) : 'No deadline'}
                      </span>
                      {isAdmin && Number(p.budget) > 0 && <span className="sub"> · {formatMoney(p.budget)}</span>}
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="small"
                      onClick={() => {
                        setTaskProjectFilter(p.id);
                        navigate('tasks');
                      }}
                    >
                      Tasks ({pTasks.length})
                    </button>
                    <button className="small primary" onClick={() => setModal({ type: 'projects', id: p.id, data: p })}>
                      {isAdmin ? 'Assign & edit' : 'View project'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {list.length === 0 && (
            <div className="card empty" style={{ gridColumn: '1 / -1' }}>
              <strong>{isAdmin ? 'Room for your next idea' : 'No projects assigned yet'}</strong>
              {isAdmin
                ? 'Create your first project to get started.'
                : 'When an administrator assigns you to a project or project task, it will appear here automatically.'}
            </div>
          )}
        </div>
      </>
    );
  };

  // 4. Calendar View
  const renderCalendar = () => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const offset = weekStart === 'Monday' ? 1 : 0;
    const start = new Date(y, m, 1);
    const pad = (start.getDay() - offset + 7) % 7;
    const days = Array.from({ length: 42 }, (_, i) => new Date(y, m, 1 - pad + i));

    const EVENT_PALETTES = darkMode
      ? [
          { bg: 'rgba(37, 99, 235, 0.22)', border: 'rgba(96, 165, 250, 0.38)', accent: '#60a5fa', text: '#dbeafe', tagBg: 'rgba(37, 99, 235, 0.32)' },
          { bg: 'rgba(124, 58, 237, 0.22)', border: 'rgba(167, 139, 250, 0.38)', accent: '#a78bfa', text: '#ede9fe', tagBg: 'rgba(124, 58, 237, 0.32)' },
          { bg: 'rgba(22, 121, 77, 0.24)', border: 'rgba(74, 222, 128, 0.38)', accent: '#4ade80', text: '#dcfce7', tagBg: 'rgba(22, 121, 77, 0.34)' },
          { bg: 'rgba(220, 61, 67, 0.22)', border: 'rgba(248, 113, 113, 0.38)', accent: '#f87171', text: '#fee2e2', tagBg: 'rgba(220, 61, 67, 0.32)' },
          { bg: 'rgba(8, 127, 140, 0.24)', border: 'rgba(34, 211, 238, 0.38)', accent: '#22d3ee', text: '#cffafe', tagBg: 'rgba(8, 127, 140, 0.34)' },
          { bg: 'rgba(202, 122, 8, 0.22)', border: 'rgba(251, 191, 36, 0.38)', accent: '#fbbf24', text: '#fef3c7', tagBg: 'rgba(202, 122, 8, 0.32)' }
        ]
      : [
          { bg: '#e8f1fd', border: '#c3dafc', accent: '#2563eb', text: '#1d4ed8', tagBg: '#dbeafe' },
          { bg: '#f1ecfe', border: '#d8c9fb', accent: '#7c3aed', text: '#5b21b6', tagBg: '#ede9fe' },
          { bg: '#e6f4ec', border: '#bce3cc', accent: '#16794d', text: '#115e3b', tagBg: '#d1fae5' },
          { bg: '#fdeeed', border: '#f7c7c5', accent: '#dc3d43', text: '#9f2325', tagBg: '#fee2e2' },
          { bg: '#e3f6f8', border: '#b4e4ea', accent: '#087f8c', text: '#0b5c66', tagBg: '#cffafe' },
          { bg: '#fef3dc', border: '#f5da9c', accent: '#ca7a08', text: '#925405', tagBg: '#fef0c7' }
        ];

    const hashPaletteIndex = (ev, idx = 0) => {
      const seed = String(ev?.id || ev?.title || idx);
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      return ev?.type === 'tasks' ? 5 : h % EVENT_PALETTES.length;
    };

    const eventsOn = dStr => {
      const raw = [
        ...state.meetings.filter(ev => key(new Date(ev.start)) === dStr).map(x => ({ ...x, type: 'meetings' })),
        ...state.tasks.filter(t => t.due === dStr).map(x => ({ ...x, type: 'tasks' }))
      ];
      const used = new Set();
      return raw.map((ev, idx) => {
        let pIdx = hashPaletteIndex(ev, idx);
        while (used.has(pIdx) && used.size < EVENT_PALETTES.length) {
          pIdx = (pIdx + 1) % EVENT_PALETTES.length;
        }
        used.add(pIdx);
        return { ...ev, palette: EVENT_PALETTES[pIdx] };
      });
    };

    const selectedKey = key(selectedDay);
    const dayEvents = eventsOn(selectedKey);
    const upcomingMeetings = state.meetings
      .filter(ev => new Date(ev.start) > new Date())
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5);

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Calendar</h1>
            <p className="sub">Meetings, milestones, and a little breathing room.</p>
          </div>
          <div className="actions">
            <button onClick={() => { setMonth(new Date()); setSelectedDay(new Date()); }}>
              <Icon name="calendar" /> Today
            </button>
            {isAdmin && (
              <button className="primary" onClick={() => setModal({ type: 'meetings', data: {} })}>
                <Icon name="plus" /> New event
              </button>
            )}
          </div>
        </div>

        <div className="calendar-layout">
          <section className="card">
            <div className="calendar-head">
              <h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
              <div className="actions">
                <button
                  className="small"
                  aria-label="Previous month"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                >
                  ‹
                </button>
                <button
                  className="small"
                  aria-label="Next month"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                >
                  ›
                </button>
              </div>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={d} className="weekday">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(i + offset) % 7]}
                </div>
              ))}
              {days.map((d, i) => {
                const dKey = key(d);
                const evs = eventsOn(dKey);
                const isSelected = dKey === selectedKey;
                const isToday = dKey === key(new Date());
                const isOutside = d.getMonth() !== m;
                return (
                  <button
                    key={i}
                    className={`day ${isOutside ? 'outside' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDay(d)}
                  >
                    <span className="daynum">{d.getDate()}</span>
                    {evs.slice(0, 3).map((e, ei) => (
                      <span
                        key={ei}
                        className={`event-pill ${e.type === 'tasks' ? 'task-event' : ''}`}
                        style={{
                          background: e.palette.bg,
                          color: e.palette.text,
                          borderColor: e.palette.border,
                          borderLeftColor: e.palette.accent
                        }}
                      >
                        {e.title}
                      </span>
                    ))}
                    {evs.length > 3 && <span className="sub">More…</span>}
                  </button>
                );
              })}
            </div>
            <div className="legend">
              <span><i className="dot"></i>Meeting</span>
              <span><i className="dot" style={{ background: '#ca7a08' }}></i>Task deadline</span>
            </div>
          </section>

          <aside className="agenda">
            <section className="card">
              <p className="eyebrow" style={{ margin: '0 0 8px' }}>
                {selectedDay.toLocaleDateString(undefined, { weekday: 'long' })}
              </p>
              <h2 style={{ margin: '0 0 20px', fontSize: 24 }}>
                {selectedDay.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
              </h2>
              {dayEvents.length > 0 ? (
                dayEvents.map((e, idx) => (
                  <div
                    key={idx}
                    className="agenda-event"
                    onClick={() => setModal({ type: e.type, id: e.id, data: e })}
                    style={{
                      cursor: 'pointer',
                      background: e.palette.bg,
                      borderColor: e.palette.border,
                      borderLeftColor: e.palette.accent
                    }}
                  >
                    <span className="sub" style={{ color: e.palette.text, opacity: 0.8 }}>
                      {e.start ? fmtTime(e.start) : 'Task deadline'}
                    </span>
                    <strong style={{ color: e.palette.text }}>{e.title}</strong>
                    <span
                      className="tag"
                      style={{
                        background: e.palette.tagBg,
                        color: e.palette.text,
                        border: `1px solid ${e.palette.border}`
                      }}
                    >
                      {e.type === 'tasks' ? 'Task' : 'Meeting'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <strong>Your day, open</strong>No meetings or deadlines scheduled.
                </div>
              )}
            </section>
            <section className="card">
              <h3>Coming up</h3>
              {upcomingMeetings.map((e, idx) => {
                const pal = EVENT_PALETTES[hashPaletteIndex(e, idx)];
                return (
                  <div
                    key={e.id}
                    className="list-row"
                    onClick={() => setModal({ type: 'meetings', id: e.id, data: e })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      className="meeting-time"
                      style={{
                        background: pal.bg,
                        color: pal.text,
                        border: `1px solid ${pal.border}`
                      }}
                    >
                      <span>{new Date(e.start).toLocaleDateString(undefined, { month: 'short' })}</span>
                      <b>{new Date(e.start).getDate()}</b>
                    </div>
                    <div>
                      <strong>{e.title}</strong>
                      <span className="sub">{fmtTime(e.start)}</span>
                    </div>
                  </div>
                );
              })}
              {upcomingMeetings.length === 0 && (
                <div className="empty">
                  <strong>Nothing around the corner</strong>New meetings will show up here.
                </div>
              )}
            </section>
          </aside>
        </div>
      </>
    );
  };

  // Comprehensive Daily / Weekly / Monthly Employee Time Tracking, Performance & Activity Suite
  const renderEmployeePerformanceSuite = (context = 'analytics') => {
    const refDateObj = perfDate ? new Date(`${perfDate}T23:59:59`) : new Date();
    const periodDays = perfPeriod === 'daily' ? 1 : perfPeriod === 'weekly' ? 7 : 30;
    const targetHoursPerMember = perfPeriod === 'daily' ? 8 : perfPeriod === 'weekly' ? 40 : 160;
    const targetActiveDays = perfPeriod === 'daily' ? 1 : perfPeriod === 'weekly' ? 5 : 22;

    const startWindow = new Date(refDateObj);
    startWindow.setHours(0, 0, 0, 0);
    startWindow.setDate(startWindow.getDate() - (periodDays - 1));
    const startKey = key(startWindow);
    const endKey = key(refDateObj);
    const todayStr = key(new Date());

    const visibleMembers = isAdmin
      ? state.users.filter(u => perfEmployee === 'all' || u.id === perfEmployee)
      : state.users.filter(u => u.id === user.id);

    const periodClocksAll = state.clocks.filter(c => {
      if (!isAdmin && c.user_id !== user.id) return false;
      const k = key(new Date(c.start * 1000));
      return (k >= startKey && k <= endKey) || (!c.end && endKey >= todayStr && startKey <= todayStr);
    });

    const memberRows = visibleMembers.map(u => {
      const uClocks = periodClocksAll.filter(c => c.user_id === u.id);
      const workSec = uClocks.reduce((n, c) => n + worked(c, currentTime), 0);
      const breakSec = uClocks.reduce((n, c) => n + breakDuration(c, currentTime), 0);
      const workHours = workSec / 3600;
      const breakHours = breakSec / 3600;
      const totalSpanSec = workSec + breakSec;
      const breakRatio = totalSpanSec > 0 ? Math.round((breakSec / totalSpanSec) * 100) : 0;
      const sessions = uClocks.length;
      const completedShiftsList = uClocks.filter(c => Boolean(c.end));
      const completedShifts = completedShiftsList.length;
      const notesLogged = uClocks.filter(c => c.note && String(c.note).trim().length > 0).length;
      const completedNotesLogged = completedShiftsList.filter(c => c.note && String(c.note).trim().length > 0).length;
      const noteCompliancePct =
        completedShifts > 0
          ? Math.min(100, Math.round((completedNotesLogged / completedShifts) * 100))
          : sessions > 0 && notesLogged > 0
          ? 100
          : 100;
      const activeDays = new Set(
        uClocks
          .filter(c => worked(c, currentTime) > 0 || !c.end)
          .map(c => key(new Date(c.start * 1000)))
      ).size;
      const avgShiftHours = sessions > 0 ? workHours / sessions : 0;

      // Daily overtime calculation (>8h in a single day)
      const byDay = {};
      uClocks.forEach(c => {
        const dKey = key(new Date(c.start * 1000));
        byDay[dKey] = (byDay[dKey] || 0) + worked(c, currentTime) / 3600;
      });
      const overtimeHours = Object.values(byDay).reduce((sum, h) => sum + Math.max(0, h - 8), 0);
      const utilizationPct = targetHoursPerMember > 0 ? Math.round((workHours / targetHoursPerMember) * 100) : 0;

      // Tasks assigned to this member (either primary assignee or in assignees array)
      const memberTasks = state.tasks.filter(t => isUserAssignedToTask(t, u.id));
      const doneTasks = memberTasks.filter(t => t.status === 'Done').length;
      const inProgressTasks = memberTasks.filter(t => t.status === 'In progress' || t.status === 'In review').length;
      const todoTasks = memberTasks.filter(t => t.status === 'To do').length;
      const blockedTasks = memberTasks.filter(t => t.blocked && t.status !== 'Done').length;
      const overdueTasks = memberTasks.filter(t => t.due && t.due < todayStr && t.status !== 'Done').length;
      const totalAssigned = memberTasks.length;
      const taskCompletionPct = totalAssigned > 0 ? Math.round((doneTasks / totalAssigned) * 100) : 0;
      const onTimeRate = totalAssigned > 0 ? Math.max(0, Math.round(((totalAssigned - overdueTasks) / totalAssigned) * 100)) : 100;

      // Composite Performance Score (0 - 100)
      const capScore = Math.min(100, Math.round((workHours / targetHoursPerMember) * 100));
      const attendanceScore = Math.min(100, Math.round((activeDays / targetActiveDays) * 100));
      const focusDiscipline = sessions > 0 ? (breakRatio <= 20 ? 100 : Math.max(40, 100 - (breakRatio - 20) * 2)) : 0;
      const effectiveTaskScore =
        totalAssigned > 0
          ? Math.min(100, Math.round(((doneTasks + inProgressTasks * 0.5) / totalAssigned) * 100))
          : capScore;
      const effectiveOnTime = totalAssigned > 0 ? onTimeRate : sessions > 0 ? 100 : 0;
      const effectiveNoteScore = completedShifts > 0 ? noteCompliancePct : sessions > 0 ? 100 : 0;
      const score =
        sessions === 0 && totalAssigned === 0
          ? 0
          : Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  capScore * 0.35 +
                    attendanceScore * 0.15 +
                    effectiveTaskScore * 0.25 +
                    effectiveOnTime * 0.15 +
                    ((focusDiscipline + effectiveNoteScore) / 2) * 0.10
                )
              )
            );

      return {
        user: u,
        uClocks,
        workHours,
        breakSec,
        breakHours,
        breakRatio,
        sessions,
        completedShifts,
        notesLogged,
        completedNotesLogged,
        noteCompliancePct,
        activeDays,
        avgShiftHours,
        overtimeHours,
        utilizationPct,
        totalAssigned,
        doneTasks,
        inProgressTasks,
        todoTasks,
        blockedTasks,
        overdueTasks,
        taskCompletionPct,
        onTimeRate,
        score
      };
    });

    const totalWorkHours = memberRows.reduce((n, r) => n + r.workHours, 0);
    const totalBreakSec = memberRows.reduce((n, r) => n + r.breakSec, 0);
    const avgScore = memberRows.length
      ? Math.round(memberRows.reduce((n, r) => n + r.score, 0) / memberRows.length)
      : 0;

    const filteredClocksForNotes = periodClocksAll.filter(c =>
      isAdmin ? (perfEmployee === 'all' || c.user_id === perfEmployee) : c.user_id === user.id
    );

    const activitiesList = (state.activities || []).filter(a => {
      if (!isNotificationVisibleToUser(a, user)) return false;
      if (isAdmin && activityEmployee !== 'all' && a.actorId !== activityEmployee) return false;
      if (activityFilter === 'tasks') return String(a.type || '').startsWith('task_') || a.category === 'tasks';
      if (activityFilter === 'goals') return String(a.type || '').startsWith('goal_') || a.category === 'goals';
      if (activityFilter === 'clock') return String(a.type || '').startsWith('clock_') || a.category === 'clocks';
      if (activityFilter === 'announcements') return String(a.type || '').startsWith('announcement_') || a.category === 'announcements';
      if (activityFilter === 'standups') return a.type === 'standup_posted' || a.category === 'standups';
      if (activityFilter === 'leads') return a.type === 'lead_updated' || a.category === 'leads';
      return true;
    });

    return (
      <>
        <section className="card" style={{ marginTop: 22 }}>
          <div className="card-head" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div>
              <span className="eyebrow" style={{ margin: 0 }}>
                {isAdmin ? 'Admin Executive Performance Intelligence' : 'Personal Time & Performance Metrics'}
              </span>
              <h3 style={{ marginTop: 4 }}>
                {perfPeriod === 'daily'
                  ? `Daily Employee Time & Performance (${fmtDate(endKey)})`
                  : perfPeriod === 'weekly'
                  ? `Weekly Employee Time & Performance (${fmtDate(startKey)} – ${fmtDate(endKey)})`
                  : `Monthly Employee Time & Performance (${fmtDate(startKey)} – ${fmtDate(endKey)})`}
              </h3>
              <p className="sub" style={{ marginTop: 4 }}>
                Complete breakdown of focused hours, break ratios, shift lengths, overtime, utilization vs. {targetHoursPerMember}h target, task execution, and clock-out work notes.
              </p>
            </div>
            <div className="actions" style={{ flexWrap: 'wrap', gap: 8 }}>
              <div className="period-switch">
                {[
                  ['daily', 'Daily (8h)'],
                  ['weekly', 'Weekly (40h)'],
                  ['monthly', 'Monthly (160h)']
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={perfPeriod === id ? 'active' : ''}
                    onClick={() => setPerfPeriod(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                aria-label="Reference date"
                value={perfDate}
                onChange={e => setPerfDate(e.target.value || key(new Date()))}
                style={{ width: 'auto', padding: '7px 10px', fontSize: 12 }}
              />
              {perfDate !== key(new Date()) && (
                <button type="button" className="small" onClick={() => setPerfDate(key(new Date()))}>
                  Today
                </button>
              )}
              {isAdmin && (
                <select
                  aria-label="Filter employee performance"
                  value={perfEmployee}
                  onChange={e => setPerfEmployee(e.target.value)}
                  style={{ width: 'auto', minWidth: 170 }}
                >
                  <option value="all">All employees ({state.users.length})</option>
                  {state.users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="stats" style={{ marginBottom: 18 }}>
            <div className="stat green">
              <span>{perfPeriod === 'daily' ? 'Daily' : perfPeriod === 'weekly' ? 'Weekly' : 'Monthly'} focused work</span>
              <span className="value">{totalWorkHours.toFixed(1)}<small>h</small></span>
              <span className="sub">
                Target: {(targetHoursPerMember * visibleMembers.length).toFixed(0)}h across {visibleMembers.length} {visibleMembers.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="stat">
              <span>Break time &amp; ratio</span>
              <span className="value">{duration(totalBreakSec)}</span>
              <span className="sub">
                {totalWorkHours * 3600 + totalBreakSec > 0
                  ? `${Math.round((totalBreakSec / (totalWorkHours * 3600 + totalBreakSec)) * 100)}% of total clocked span`
                  : 'No breaks logged in window'}
              </span>
            </div>
            <div className="stat">
              <span>Shifts &amp; work notes</span>
              <span className="value">{filteredClocksForNotes.length}</span>
              <span className="sub">
                {filteredClocksForNotes.filter(c => c.note && String(c.note).trim()).length} shift summary notes recorded
              </span>
            </div>
            <div className="stat">
              <span>Avg performance score</span>
              <span className="value">{avgScore}<small>/100</small></span>
              <span className="sub">
                {avgScore >= 85 ? 'Excellent team velocity' : avgScore >= 65 ? 'Steady delivery pace' : 'Capacity building'}
              </span>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Focused work</th>
                  <th>Break &amp; ratio</th>
                  <th>Shifts &amp; days</th>
                  <th>Avg shift / OT</th>
                  <th>Utilization ({targetHoursPerMember}h)</th>
                  <th>Tasks (Done / Active / Blocked)</th>
                  <th>On-time rate</th>
                  <th>Shift notes</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {memberRows.map(r => {
                  const scoreBadge =
                    r.score >= 85
                      ? { cls: 'green', label: 'Excellent' }
                      : r.score >= 65
                      ? { cls: '', label: 'Strong' }
                      : r.score >= 45
                      ? { cls: 'yellow', label: 'Building' }
                      : { cls: 'red', label: 'Low activity' };
                  return (
                    <tr key={r.user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar user={r.user} />
                          <div>
                            <strong>{r.user.name}</strong>
                            <div className="sub">
                              {r.user.position ? `${r.user.position} · ` : ''}{r.user.department}{isAdmin ? ` · ${r.user.role === 'admin' ? 'Admin' : 'Employee'}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{r.workHours.toFixed(1)}h</strong>
                        <div className="sub">of {targetHoursPerMember}h target</div>
                      </td>
                      <td>
                        <span>{duration(r.breakSec)}</span>
                        <div className="sub">{r.breakRatio}% break ratio</div>
                      </td>
                      <td>
                        <strong>{r.sessions}</strong> shifts
                        <div className="sub">{r.activeDays}/{targetActiveDays}d active</div>
                      </td>
                      <td>
                        <span>{r.avgShiftHours.toFixed(1)}h avg</span>
                        <div className="sub">
                          {r.overtimeHours > 0 ? (
                            <span style={{ color: 'var(--green)', fontWeight: 600 }}>+{r.overtimeHours.toFixed(1)}h OT</span>
                          ) : (
                            '0.0h OT'
                          )}
                        </div>
                      </td>
                      <td style={{ minWidth: 130 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <strong>{r.utilizationPct}%</strong>
                          <span className="sub">{r.workHours.toFixed(1)}/{targetHoursPerMember}h</span>
                        </div>
                        <div className="progress">
                          <i style={{ width: `${Math.min(100, r.utilizationPct)}%` }}></i>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className="tag green" title="Completed tasks">{r.doneTasks} done</span>
                          <span className="tag" title="In progress / review">{r.inProgressTasks} active</span>
                          {r.blockedTasks > 0 && (
                            <span className="tag red" title="Blocked tasks">{r.blockedTasks} blocked</span>
                          )}
                        </div>
                        <div className="sub" style={{ marginTop: 4 }}>
                          {r.totalAssigned} assigned ({r.taskCompletionPct}% completion)
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${r.onTimeRate >= 85 ? 'green' : r.onTimeRate >= 60 ? 'yellow' : 'red'}`}>
                          {r.onTimeRate}% on-time
                        </span>
                        {r.overdueTasks > 0 && (
                          <div className="sub" style={{ color: '#a13522', marginTop: 3 }}>{r.overdueTasks} overdue</div>
                        )}
                      </td>
                      <td>
                        <span className={`tag ${r.noteCompliancePct === 100 ? 'green' : 'yellow'}`}>
                          {r.notesLogged}/{r.completedShifts || r.sessions} notes
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ fontSize: 15 }}>{r.score}</strong>
                          <span className={`tag ${scoreBadge.cls}`}>{scoreBadge.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Shift-by-Shift Clock-Out Work Notes Log */}
          <div className="timesheet-notes-section" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            <div className="card-head" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15 }}>Shift Clock-Out Work Summaries &amp; Notes ({filteredClocksForNotes.length})</h4>
                <p className="sub" style={{ marginTop: 3 }}>
                  Every employee work summary submitted at clock-out during this {perfPeriod} window.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="tag green">
                  {filteredClocksForNotes.filter(c => c.note && String(c.note).trim()).length} with notes
                </span>
                <span className="tag">
                  {filteredClocksForNotes.filter(c => Boolean(c.end)).length} completed
                </span>
              </div>
            </div>
            {filteredClocksForNotes.length > 0 ? (
              <div className="table-wrap">
                <table className="timesheet-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date &amp; shift</th>
                      <th>Project &amp; task</th>
                      <th>Focused / Break</th>
                      <th>Clock-out work summary note</th>
                      {isAdmin && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClocksForNotes.slice(0, 25).map(c => {
                      const emp = state.users.find(u => u.id === c.user_id);
                      const proj = state.projects.find(p => p.id === c.project);
                      const tsk = c.task ? state.tasks.find(t => t.id === c.task) : null;
                      const wSec = worked(c, currentTime);
                      const bSec = breakDuration(c, currentTime);
                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="timesheet-member-cell">
                              <Avatar user={emp} />
                              <div>
                                <strong>{emp?.name || 'Unknown'}</strong>
                                {emp?.department && <div className="sub">{emp.department}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="shift-date-label">{fmtDate(new Date(c.start * 1000).toISOString())}</div>
                            <span className={`shift-time-pill ${!c.end ? 'active' : ''}`}>
                              {fmtTime(c.start * 1000)} → {c.end ? fmtTime(c.end * 1000) : 'Active now'}
                            </span>
                          </td>
                          <td>
                            <div className="shift-project-stack">
                              <span className="shift-project-badge">
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="folder" size={12} />{proj?.title || 'Assigned project'}</span>
                              </span>
                              {tsk ? (
                                <span className="shift-task-sub" title={tsk.title}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} />{tsk.title}</span>
                                </span>
                              ) : (
                                <span className="sub" style={{ fontSize: 11.5 }}>General project focus</span>
                              )}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div className="shift-duration-main">{duration(wSec)}</div>
                            <div className="shift-duration-sub">
                              {(wSec / 3600).toFixed(1)}h work · {bSec > 0 ? `${duration(bSec)} break` : 'No break'}
                            </div>
                          </td>
                          <td className="timesheet-note-cell">
                            {c.note && String(c.note).trim() ? (
                              <div className={`timesheet-note-box ${!c.end ? 'is-live' : ''}`}>
                                <div className="timesheet-note-meta">
                                  <span>{c.end ? <><Icon name="note" size={12} style={{ marginRight: 4 }} />Clock-out work summary</> : <><Icon name="zap" size={12} style={{ marginRight: 4 }} />Active session focus</>}</span>
                                  <span>{(wSec / 3600).toFixed(1)}h</span>
                                </div>
                                <div className="timesheet-note-text">{c.note}</div>
                              </div>
                            ) : (
                              <span className={`tag ${c.end ? 'yellow' : ''}`}>
                                {c.end ? 'No summary note' : 'Shift in progress — summary at clock-out'}
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="small"
                                onClick={() => setModal({ type: 'timeEntry', id: c.id, data: c })}
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">
                <strong>No shifts recorded in this {perfPeriod} window</strong>
                Adjust the date or period selector above to inspect earlier shifts.
              </div>
            )}
          </div>
        </section>

        {/* Real-Time Employee Activity & Task Change Audit Trail */}
        {context === 'analytics' && (
          <section className="card" style={{ marginTop: 22 }}>
            <div className="card-head" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div>
                <span className="eyebrow" style={{ margin: 0 }}>Real-Time Operations &amp; Notification Feed</span>
                <h3 style={{ marginTop: 4 }}>
                  {isAdmin ? 'Employee Task Changes, Clock-Outs, Announcements & Activity Audit Log' : 'My Recent Workspace Activity'}
                </h3>
                <p className="sub" style={{ marginTop: 4 }}>
                  {isAdmin
                    ? 'Instant tracking of every employee task status change, announcement completion, blocker alert, clock-in/clock-out work summary, standup, and lead update.'
                    : 'Only notifications assigned to you by Admin and your own workspace updates are displayed.'}
                </p>
              </div>
              <div className="actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div className="period-switch">
                  {[
                    ['all', 'All Events'],
                    ['tasks', 'Task Changes'],
                    ['goals', 'Goals'],
                    ['clock', 'Clock In / Out'],
                    ['announcements', 'Announcements'],
                    ['standups', 'Standups'],
                    ['leads', 'Leads']
                  ].map(([k, lbl]) => (
                    <button
                      key={k}
                      type="button"
                      className={activityFilter === k ? 'active' : ''}
                      onClick={() => setActivityFilter(k)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                {isAdmin && (
                  <select
                    aria-label="Filter activity by employee"
                    value={activityEmployee}
                    onChange={e => setActivityEmployee(e.target.value)}
                    style={{ width: 'auto', minWidth: 165 }}
                  >
                    <option value="all">All employees</option>
                    {state.users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Team member</th>
                    <th>Event</th>
                    <th>Activity &amp; work summary detail</th>
                  </tr>
                </thead>
                <tbody>
                  {activitiesList.slice(0, 40).map(act => {
                    const actor = state.users.find(u => u.id === act.actorId) || { name: act.actorName || 'Team member' };
                    const isClockOut = act.type === 'clock_out';
                    const isBlocker = act.type === 'task_blocker';
                    const isAnnDone = act.type === 'announcement_completed';
                    const isTask = String(act.type || '').startsWith('task_');
                    return (
                      <tr key={act.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }} className="sub">
                          {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'Just now'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar user={actor} />
                            <div>
                              <strong>{actor.name}</strong>
                              {isAdmin && <div className="sub">{act.actorRole === 'admin' ? 'Admin' : 'Employee'}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`tag ${isBlocker ? 'red' : isClockOut || isAnnDone || act.type === 'task_status' ? 'green' : isTask ? 'yellow' : ''}`}>
                            {String(act.type || 'activity').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <strong>{act.summary}</strong>
                          {act.detail && (
                            <div
                              style={{
                                marginTop: 4,
                                padding: isClockOut ? '6px 10px' : 0,
                                background: isClockOut ? 'var(--bg)' : 'transparent',
                                border: isClockOut ? '1px solid var(--line)' : 'none',
                                borderRadius: 8,
                                fontSize: 12.5,
                                color: 'var(--ink)'
                              }}
                            >
                              {act.detail}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {activitiesList.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty">No matching employee activity recorded yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </>
    );
  };

  // 5. Time Tracking View
  const renderClock = () => {
    const person = isAdmin ? (timesheetPerson === 'me' ? user.id : timesheetPerson) : user.id;
    const baseRows = state.clocks.filter(c => (isAdmin && person === 'all') || c.user_id === person);
    const searchQuery = timesheetSearch.trim().toLowerCase();

    const allRows = baseRows.filter(c => {
      if (timesheetProject !== 'all' && (c.project || '') !== timesheetProject) return false;
      if (timesheetDateFilter) {
        const entryDate = key(new Date(c.start * 1000));
        if (entryDate !== timesheetDateFilter) return false;
      }
      if (timesheetNoteFilter === 'with_notes' && !(c.note && String(c.note).trim())) return false;
      if (timesheetNoteFilter === 'active' && Boolean(c.end)) return false;
      if (timesheetNoteFilter === 'completed' && !c.end) return false;
      if (searchQuery) {
        const empName = (state.users.find(u => u.id === c.user_id)?.name || '').toLowerCase();
        const projTitle = (state.projects.find(p => p.id === c.project)?.title || '').toLowerCase();
        const taskTitle = (c.task ? state.tasks.find(t => t.id === c.task)?.title || '' : '').toLowerCase();
        const noteText = String(c.note || '').toLowerCase();
        if (
          !empName.includes(searchQuery) &&
          !projTitle.includes(searchQuery) &&
          !taskTitle.includes(searchQuery) &&
          !noteText.includes(searchQuery)
        ) {
          return false;
        }
      }
      return true;
    });

    const rows = allRows.slice(0, timesheetLimit);
    const filteredWorkSec = allRows.reduce((n, c) => n + worked(c, currentTime), 0);
    const filteredBreakSec = allRows.reduce((n, c) => n + breakDuration(c, currentTime), 0);
    const filteredSpanSec = filteredWorkSec + filteredBreakSec;
    const filteredBreakRatio = filteredSpanSec > 0 ? Math.round((filteredBreakSec / filteredSpanSec) * 100) : 0;
    const completedRowsCount = allRows.filter(c => Boolean(c.end)).length;
    const activeRowsCount = allRows.filter(c => !c.end).length;
    const notesRowsCount = allRows.filter(c => c.note && String(c.note).trim().length > 0).length;
    const completedWithNotesCount = allRows.filter(c => Boolean(c.end) && c.note && String(c.note).trim().length > 0).length;
    const notesCompliancePct =
      completedRowsCount > 0 ? Math.min(100, Math.round((completedWithNotesCount / completedRowsCount) * 100)) : 100;

    const manageEntry = async (action, c) => {
      const name = state.users.find(u => u.id === c.user_id)?.name || 'this person';
      if (!confirm(`Clock out ${name} now?`)) return;
      try {
        await handleApi('/api/timesheet', { action, id: c.id });
        await refreshState();
        showToast(`${name} was clocked out`);
      } catch (err) {
        showToast(err.message);
      }
    };
    const todayStr = key(new Date());
    const todayClocks = state.clocks.filter(c => {
      if (!isAdmin && c.user_id !== user.id) return false;
      const startKey = key(new Date(c.start * 1000));
      return startKey === todayStr || !c.end;
    });

    // Last 7 days attendance matrix
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        key: key(d),
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        isToday: i === 6
      };
    });

    const myTodayStandup = (state.standups || []).find(s => s.owner === user?.id && isTodayStandup(s));

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Time tracking</h1>
            <p className="sub">Make every focused hour count.</p>
          </div>
          <div className="actions">
            <button onClick={() => exportCSV('time')}>
              <Icon name="download" /> {isAdmin ? 'Export CSV' : 'Export my CSV'}
            </button>
            {!activeClock && (
              <button className="primary" onClick={() => setModal({ type: 'clock', data: {} })}>
                <Icon name="play" /> {myTodayStandup ? 'Clock in' : 'Check in & Clock in'}
              </button>
            )}
          </div>
        </div>

        <div className="stats">
          <div className="stat green">
            <span>Working now</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.clocks.filter(c => !c.end && !c.break_start).length}</span>
            <span className="sub">People in their flow</span>
          </div>
          <div className="stat">
            <span>On a break</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.clocks.filter(c => !c.end && c.break_start).length}</span>
            <span className="sub">Rest is part of good work</span>
          </div>
          <div className="stat">
            <span>{isAdmin ? 'Hours today' : 'My sessions'}</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">
              {isAdmin
                ? (todayClocks.reduce((n, c) => n + worked(c, currentTime) / 3600, 0)).toFixed(1)
                : state.clocks.filter(c => c.user_id === user.id).length}
            </span>
            <span className="sub">
              {isAdmin
                ? `Break today: ${duration(todayClocks.reduce((n, c) => n + breakDuration(c, currentTime), 0))}`
                : 'Total sessions logged'}
            </span>
          </div>
          <div className="stat">
            <span>Your hours today</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">
              {(todayClocks.filter(c => c.user_id === user.id).reduce((n, c) => n + worked(c, currentTime) / 3600, 0)).toFixed(1)}
            </span>
            <span className="sub">
              Break today: {duration(todayClocks.filter(c => c.user_id === user.id).reduce((n, c) => n + breakDuration(c, currentTime), 0))}
            </span>
          </div>
        </div>

        {/* Top Grid: Live Time Tracker + 7-Day Attendance & Capacity Matrix */}
        <div className="clock-top-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <section className={`card timer-card ${activeClock?.break_start ? 'is-on-break' : ''}`} style={{ flex: 1, minWidth: 0 }}>
              <div className="card-head">
                <h3>Time tracker</h3>
                <span className="timer-state">
                  <i></i>{activeClock ? (activeClock.break_start ? 'On break' : 'Tracking') : 'Ready'}
                </span>
              </div>
              <p className="sub timer-project">
                {activeClock
                  ? `${state.projects.find(p => p.id === activeClock.project)?.title || 'Focused work'} · In at ${fmtTime(activeClock.start * 1000)}`
                  : 'Ready when you are.'}
              </p>
              <div className="time-digits">{duration(activeClock?.break_start ? activeBreakSeconds : activeClockSeconds)}</div>
              {activeClock && (
                <>
                  <div className="timer-metrics">
                    <div className={`timer-metric ${!activeClock.break_start ? 'active' : ''}`}>
                      <span>Work time</span>
                      <b>{duration(activeClockSeconds)}</b>
                    </div>
                    <div className={`timer-metric ${activeClock.break_start ? 'active break' : ''}`}>
                      <span>Break time</span>
                      <b>{duration(activeBreakSeconds)}</b>
                    </div>
                  </div>
                  <div className="timer-switch-box">
                    <label className="sub" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>
                      Switch active focus (without clocking out)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <select
                        aria-label="Switch active project"
                        value={activeClock.project || ''}
                        onChange={e => handleClock('switch', { project: e.target.value, task: activeClock.task || '', note: activeClock.note || '' })}
                      >
                        {assignedProjects.length === 0 && (
                          <option value="">No assigned projects</option>
                        )}
                        {assignedProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                      <select
                        aria-label="Switch active task"
                        value={activeClock.task || ''}
                        onChange={e => handleClock('switch', { project: activeClock.project || '', task: e.target.value, note: activeClock.note || '' })}
                      >
                        <option value="">No specific task</option>
                        {state.tasks.filter(t => t.status !== 'Done').map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
              <div className="timer-controls">
                {activeClock ? (
                  <>
                    <button
                      onClick={() => handleClock(activeClock.break_start ? 'resume' : 'break')}
                      className="break-button"
                    >
                      <Icon name={activeClock.break_start ? 'play' : 'pause'} />
                      {activeClock.break_start ? 'Resume work' : 'Start break'}
                    </button>
                    <button className="stop" onClick={() => handleClock('stop')}>
                      <Icon name="stop" /> Clock out
                    </button>
                  </>
                ) : (
                  <button className="start-button" onClick={() => setModal({ type: 'clock', data: {} })}>
                    <Icon name="play" /> {myTodayStandup ? 'Clock in' : 'Check in & Clock in'}
                  </button>
                )}
              </div>
            </section>
            <div className="note" style={{ margin: 0 }}>
              Both work time and break time run on the server — even if you close this tab or sign out, your session continues until you clock out.
            </div>
          </div>

          {/* 7-Day Attendance & Capacity Matrix */}
          <section className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div>
              <div className="card-head" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3>{isAdmin ? 'Weekly team attendance & capacity (Last 7 days)' : 'My 7-day attendance & focus (Last 7 days)'}</h3>
                  <p className="sub" style={{ marginTop: 4 }}>
                    {isAdmin
                      ? 'Daily focused hours per team member vs. 40h weekly benchmark.'
                      : 'Your daily focused hours and break balance vs. 40h weekly benchmark.'}
                  </p>
                </div>
                <span className="tag">40h weekly target</span>
              </div>
              <div className="table-wrap">
                <table style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th>Team member</th>
                      {last7Days.map(d => (
                        <th key={d.key} style={{ textAlign: 'center', fontWeight: d.isToday ? 700 : 500 }}>
                          {d.label}
                        </th>
                      ))}
                      <th>7d Work</th>
                      <th>7d Break</th>
                      <th>Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isAdmin ? state.users : state.users.filter(u => u.id === user.id)).map(u => {
                      const uClocks = state.clocks.filter(c => c.user_id === u.id);
                      let weekWorkSec = 0;
                      let weekBreakSec = 0;
                      const dayHours = last7Days.map(d => {
                        const dayClocks = uClocks.filter(c => key(new Date(c.start * 1000)) === d.key);
                        const wSec = dayClocks.reduce((n, c) => n + worked(c, currentTime), 0);
                        const bSec = dayClocks.reduce((n, c) => n + breakDuration(c, currentTime), 0);
                        weekWorkSec += wSec;
                        weekBreakSec += bSec;
                        return wSec / 3600;
                      });
                      const weekHours = weekWorkSec / 3600;
                      const utilPct = Math.round((weekHours / 40) * 100);
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar user={u} />
                              <div>
                                <strong>{u.name}</strong>
                                <div className="sub">{u.department}</div>
                              </div>
                            </div>
                          </td>
                          {dayHours.map((hrs, idx) => (
                            <td key={last7Days[idx].key} style={{ textAlign: 'center' }}>
                              {hrs > 0 ? (
                                <span className={`tag ${hrs >= 7.5 ? 'green' : hrs >= 4 ? '' : 'yellow'}`}>
                                  {hrs.toFixed(1)}h
                                </span>
                              ) : (
                                <span className="sub">—</span>
                              )}
                            </td>
                          ))}
                          <td><strong>{weekHours.toFixed(1)}h</strong></td>
                          <td className="sub">{duration(weekBreakSec)}</td>
                          <td style={{ minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress" style={{ flex: 1, margin: 0 }}>
                                <i style={{ width: `${Math.min(100, utilPct)}%` }}></i>
                              </div>
                              <span className="sub" style={{ minWidth: 34 }}>{utilPct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Full-Width Executive Timesheet & Shift Work Notes Card */}
        <section className="card timesheet-card" style={{ marginTop: 22 }}>
          <div className="timesheet-header">
            <div>
              <span className="eyebrow" style={{ margin: 0 }}>
                {isAdmin ? 'Workspace Shift & Work Note Ledger' : 'Personal Shift & Work Note Ledger'}
              </span>
              <h3 style={{ marginTop: 4 }}>{isAdmin ? 'Timesheet & shift work notes' : 'My timesheet & shift notes'}</h3>
              <p className="sub" style={{ marginTop: 4 }}>
                Detailed breakdown of shift clock-in/out times, focused work hours, break durations, and shift wrap-up notes.
              </p>
            </div>
            <div className="timesheet-toolbar">
              <div className="period-switch">
                {[
                  ['all', `All (${baseRows.length})`],
                  ['with_notes', 'With notes'],
                  ['active', 'Active now'],
                  ['completed', 'Completed']
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={timesheetNoteFilter === id ? 'active' : ''}
                    onClick={() => {
                      setTimesheetNoteFilter(id);
                      setTimesheetLimit(50);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {isAdmin ? (
                <select
                  aria-label="Show time for"
                  value={timesheetPerson}
                  onChange={e => { setTimesheetPerson(e.target.value); setTimesheetLimit(50); }}
                  style={{ width: 'auto', minWidth: 160 }}
                >
                  <option value="all">Everyone ({state.users.length})</option>
                  <option value="me">My time ({user.name})</option>
                  {state.users.filter(u => u.id !== user.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              ) : (
                <span className="tag">Personal log · Least privilege</span>
              )}
              <select
                aria-label="Filter timesheet by project"
                value={timesheetProject}
                onChange={e => { setTimesheetProject(e.target.value); setTimesheetLimit(50); }}
                style={{ width: 'auto', minWidth: 155 }}
              >
                <option value="all">All projects</option>
                {state.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <input
                type="date"
                aria-label="Filter timesheet by date"
                value={timesheetDateFilter}
                onChange={e => { setTimesheetDateFilter(e.target.value); setTimesheetLimit(50); }}
                style={{ width: 'auto', padding: '7px 10px', fontSize: 12 }}
              />
              <input
                type="search"
                aria-label="Search shift notes or tasks"
                placeholder="Search notes, tasks, members…"
                value={timesheetSearch}
                onChange={e => { setTimesheetSearch(e.target.value); setTimesheetLimit(50); }}
                style={{ width: 'auto', minWidth: 200, padding: '7px 12px', fontSize: 12.5 }}
              />
              {(timesheetProject !== 'all' || timesheetNoteFilter !== 'all' || timesheetDateFilter || timesheetSearch) && (
                <button
                  type="button"
                  className="small"
                  onClick={() => {
                    setTimesheetProject('all');
                    setTimesheetNoteFilter('all');
                    setTimesheetDateFilter('');
                    setTimesheetSearch('');
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Filtered Summary KPI Strip */}
          <div className="timesheet-summary-strip">
            <div className="timesheet-summary-item">
              <span className="timesheet-summary-label">Matching shifts</span>
              <strong className="timesheet-summary-value">{allRows.length}</strong>
              <span className="sub">{completedRowsCount} completed · {activeRowsCount} active</span>
            </div>
            <div className="timesheet-summary-item">
              <span className="timesheet-summary-label">Total focused time</span>
              <strong className="timesheet-summary-value">{(filteredWorkSec / 3600).toFixed(1)}h</strong>
              <span className="sub">{duration(filteredWorkSec)} net work</span>
            </div>
            <div className="timesheet-summary-item">
              <span className="timesheet-summary-label">Total break time</span>
              <strong className="timesheet-summary-value">{duration(filteredBreakSec)}</strong>
              <span className="sub">{filteredBreakRatio}% of total clocked span</span>
            </div>
            <div className="timesheet-summary-item">
              <span className="timesheet-summary-label">Shift work notes</span>
              <strong className="timesheet-summary-value">{notesRowsCount}</strong>
              <span className="sub">{notesCompliancePct}% clock-out note compliance</span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="timesheet-table">
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>In → out</th>
                  <th>Project / task &amp; work note</th>
                  <th>Focused time</th>
                  <th>Break time</th>
                  <th>Status</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const emp = state.users.find(u => u.id === c.user_id);
                  const proj = state.projects.find(p => p.id === c.project);
                  const taskObj = c.task ? state.tasks.find(t => t.id === c.task) : null;
                  const wSec = worked(c, currentTime);
                  const bSec = breakDuration(c, currentTime);
                  const spanSec = wSec + bSec;
                  const bRatio = spanSec > 0 ? Math.round((bSec / spanSec) * 100) : 0;
                  const isLongActive = !c.end && currentTime - c.start > 36000;
                  return (
                    <tr key={c.id} className={!c.end ? 'is-active-shift-row' : ''}>
                      <td>
                        <div className="timesheet-member-cell">
                          <Avatar user={emp} />
                          <div>
                            <strong>{emp?.name || 'Unknown'}</strong>
                            <div className="sub">
                              {emp?.department || 'Workspace'}{isAdmin && emp?.position ? ` · ${emp.position.split(',')[0]}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="shift-date-label">{fmtDate(new Date(c.start * 1000).toISOString())}</div>
                        <span className={`shift-time-pill ${!c.end ? (c.break_start ? 'on-break' : 'active') : ''}`}>
                          {fmtTime(c.start * 1000)} → {c.end ? fmtTime(c.end * 1000) : 'Active now'}
                        </span>
                      </td>
                      <td className="timesheet-note-cell">
                        <div className="shift-project-row">
                          <span className="shift-project-badge">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="folder" size={12} />{proj?.title || 'Assigned project'}</span>
                          </span>
                          {taskObj && (
                            <span className="shift-task-sub">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} />{taskObj.title}</span>
                            </span>
                          )}
                        </div>
                        {c.note && String(c.note).trim() ? (
                          <div className={`timesheet-note-box ${!c.end ? 'is-live' : ''}`}>
                            <div className="timesheet-note-meta">
                              <span>{c.end ? <><Icon name="note" size={12} style={{ marginRight: 4 }} />Shift work summary note</> : <><Icon name="zap" size={12} style={{ marginRight: 4 }} />Active session focus</>}</span>
                              <span>{(wSec / 3600).toFixed(1)}h logged</span>
                            </div>
                            <div className="timesheet-note-text">{c.note}</div>
                          </div>
                        ) : (
                          <div className="timesheet-note-empty">
                            {c.end ? 'No clock-out work note recorded' : 'Session running — work summary required at clock-out'}
                          </div>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="shift-duration-main">{duration(wSec)}</div>
                        <div className="shift-duration-sub">{(wSec / 3600).toFixed(2)}h focused</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="shift-duration-main" style={{ fontWeight: 600 }}>{duration(bSec)}</div>
                        <div className="shift-duration-sub">{bSec > 0 ? `${bRatio}% of shift` : 'No break'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                          <span className={`tag ${c.end ? 'green' : c.break_start ? 'yellow' : 'purple'}`}>
                            {c.end ? 'Completed' : c.break_start ? 'On break' : 'Working'}
                          </span>
                          {isLongActive && (
                            <span className="tag red" title="Session running over 10 hours">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="alert" size={11} />10h+</span>
                            </span>
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {!c.end && (
                              <button className="small" onClick={() => manageEntry('stop', c)}>Clock out</button>
                            )}
                            <button className="small" onClick={() => setModal({ type: 'timeEntry', id: c.id, data: c })}>Edit</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6}>
                      <div className="empty">No time entries match the current filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {allRows.length > rows.length && (
            <div className="actions" style={{ justifyContent: 'center', marginTop: 15 }}>
              <button className="small" onClick={() => setTimesheetLimit(n => n + 50)}>
                Show more ({allRows.length - rows.length} older)
              </button>
            </div>
          )}
        </section>

        {renderEmployeePerformanceSuite('clock')}
      </>
    );
  };

  // 6. Team View
  const renderTeam = () => {
    const list = state.users.filter(u => filter === 'All' || u.department === filter);
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Team</h1>
            <p className="sub">The people behind the progress.</p>
          </div>
          <div className="actions">
            {isAdmin && (
              <>
                <button type="button" onClick={() => promptCreateDepartment()}>
                  <Icon name="plus" /> Create department
                </button>
                <button type="button" onClick={() => promptCreatePosition()}>
                  <Icon name="plus" /> Create position
                </button>
                <button className="primary" onClick={() => setModal({ type: 'users', data: {} })}>
                  <Icon name="plus" /> Add member
                </button>
              </>
            )}
          </div>
        </div>

        {isAdmin && state.settings && (() => {
          const limit = state.settings.memberLimit;
          const requests = state.requests || [];
          const used = state.users.length;
          const full = used + requests.length >= limit;
          const decide = async (action, r) => {
            if (action === 'reject' && !confirm(`Reject ${r.name}'s request? Their pending account will be deleted.`)) return;
            try {
              await handleApi('/api/users', { action, id: r.id });
              await refreshState();
              showToast(action === 'approve' ? `${r.name} can now sign in` : 'Request rejected');
            } catch (err) {
              alert(err.message);
            }
          };
          return (
            <>
              <div className="two-col" style={{ marginBottom: 18, alignItems: 'start' }}>
                <section className="card">
                  <div className="card-head">
                    <h3>Access requests</h3>
                    <span className={`tag ${requests.length ? 'yellow' : ''}`}>{requests.length} pending</span>
                  </div>
                  {requests.map(r => (
                    <div key={r.id} className="list-row">
                      <Avatar user={r} />
                      <div className="grow">
                        <strong>{r.name}</strong>
                        <span className="sub">
                          {r.email} · {r.position ? `${r.position} · ` : ''}{r.department} · {new Date(r.created).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="actions">
                        <button className="small primary" onClick={() => decide('approve', r)}>Approve</button>
                        <button className="small" onClick={() => decide('reject', r)}>Reject</button>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="empty">No requests waiting. Employees can ask to join from the sign-in page with “Request access”.</div>
                  )}
                </section>
                <section className="card">
                  <h3>Team size limit</h3>
                  <p className="sub" style={{ margin: '8px 0 14px' }}>
                    {used} active{requests.length ? ` + ${requests.length} pending` : ''} of {limit} seats.{' '}
                    {full ? 'Sign-up requests are closed.' : 'Sign-up requests are open.'}
                  </p>
                  <div className="progress" style={{ marginBottom: 16 }}>
                    <i style={{ width: `${Math.min(100, limit ? ((used + requests.length) / limit) * 100 : 100)}%` }}></i>
                  </div>
                  <form
                    style={{ display: 'flex', gap: 10, alignItems: 'end' }}
                    onSubmit={async e => {
                      e.preventDefault();
                      try {
                        await handleApi('/api/users', { action: 'limit', memberLimit: Number(new FormData(e.target).get('memberLimit')) });
                        await refreshState();
                        showToast('Team size limit saved');
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                  >
                    <div className="field" style={{ margin: 0, flex: 1 }}>
                      <label>Maximum accounts (0 = no sign-ups)</label>
                      <input key={limit} name="memberLimit" type="number" min="0" max="10000" required defaultValue={limit} />
                    </div>
                    <button className="primary">Save</button>
                  </form>
                </section>
              </div>

              <div className="two-col" style={{ marginBottom: 22, alignItems: 'start' }}>
                <section className="card">
                  <div className="card-head" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Workspace departments</h3>
                      <p className="sub" style={{ marginTop: 4 }}>
                        Create custom departments ({departments.length} active).
                      </p>
                    </div>
                    <form
                      style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                      onSubmit={async e => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const deptName = String(fd.get('newDepartment') || '').trim();
                        if (!deptName) return;
                        e.target.reset();
                        await handleCreateDepartment(deptName);
                      }}
                    >
                      <input
                        name="newDepartment"
                        type="text"
                        maxLength={40}
                        placeholder="e.g. Sales, QA, HR…"
                        style={{ width: 175 }}
                        required
                      />
                      <button className="primary small" type="submit">
                        <Icon name="plus" /> Add
                      </button>
                    </form>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {departments.map(d => {
                      const count = state.users.filter(u => u.department === d).length;
                      return (
                        <span
                          key={d}
                          className="tag"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 11px',
                            fontSize: 12.5
                          }}
                        >
                          <strong>{d}</strong>
                          <span className="sub" style={{ fontSize: 11 }}>{count}</span>
                          {departments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDepartment(d)}
                              title={`Remove ${d} department`}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--muted)',
                                padding: '0 2px',
                                height: 'auto',
                                fontSize: 13,
                                lineHeight: 1,
                                cursor: 'pointer'
                              }}
                            >
                              <Icon name="x" size={11} />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </section>

                <section className="card">
                  <div className="card-head" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Workspace positions &amp; titles</h3>
                      <p className="sub" style={{ marginTop: 4 }}>
                        Add or manage positions like CEO, Marketing Head, Analyst ({positions.length} active).
                      </p>
                    </div>
                    <form
                      style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                      onSubmit={async e => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const posName = String(fd.get('newPosition') || '').trim();
                        if (!posName) return;
                        e.target.reset();
                        await handleCreatePosition(posName);
                      }}
                    >
                      <input
                        name="newPosition"
                        type="text"
                        maxLength={50}
                        placeholder="e.g. CEO, Marketing Head, Analyst…"
                        style={{ width: 210 }}
                        required
                      />
                      <button className="primary small" type="submit">
                        <Icon name="plus" /> Add
                      </button>
                    </form>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {positions.map(p => {
                      const count = state.users.filter(u =>
                        getUserPositions(u).some(pos => pos.toLowerCase() === p.toLowerCase())
                      ).length;
                      return (
                        <span
                          key={p}
                          className="tag purple"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 11px',
                            fontSize: 12.5
                          }}
                        >
                          <strong>{p}</strong>
                          <span style={{ fontSize: 11, opacity: 0.75 }}>{count}</span>
                          {positions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePosition(p)}
                              title={`Remove ${p} position`}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'inherit',
                                opacity: 0.75,
                                padding: '0 2px',
                                height: 'auto',
                                fontSize: 13,
                                lineHeight: 1,
                                cursor: 'pointer'
                              }}
                            >
                              <Icon name="x" size={11} />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </section>
              </div>
            </>
          );
        })()}

        <div className="tabs">
          {['All', ...departments].map(d => (
            <button key={d} className={filter === d ? 'active' : ''} onClick={() => setFilter(d)}>
              {d}
            </button>
          ))}
        </div>

        <div className="team-grid">
          {list.map(u => {
            const canSeeDetailedStats = isAdmin || u.id === user.id;
            const todayStr = key(new Date());
            const uTasks = canSeeDetailedStats
              ? state.tasks.filter(t => isUserAssignedToTask(t, u.id))
              : [];
            const openTasks = uTasks.filter(t => t.status !== 'Done');
            const blockedCount = openTasks.filter(t => t.blocked).length;
            const overdueCount = openTasks.filter(t => t.due && t.due < todayStr).length;
            const onTimeRate = uTasks.length
              ? Math.max(0, Math.round(((uTasks.length - overdueCount) / uTasks.length) * 100))
              : 100;
            const liveClock = state.clocks.find(c => c.user_id === u.id && !c.end);
            const liveProject =
              canSeeDetailedStats && liveClock?.project
                ? state.projects.find(p => p.id === liveClock.project)?.title
                : null;
            const totalHours = canSeeDetailedStats
              ? state.clocks
                  .filter(c => c.user_id === u.id)
                  .reduce((n, c) => n + worked(c, currentTime) / 3600, 0)
              : 0;
            const uPositions = getUserPositions(u);
            const uStreaks = calculateMemberStreaks(u.id, state.standups || [], state.clocks || [], todayStr, currentTime);
            const doneTasksCount = uTasks.filter(t => t.status === 'Done').length;
            const taskCompletionRate = uTasks.length ? Math.round((doneTasksCount / uTasks.length) * 100) : 0;

            return (
              <article key={u.id} className="card person">
                {/* Live attendance chip in top right */}
                <div className="person-header-status">
                  {liveClock ? (
                    liveClock.break_start ? (
                      <span className="person-presence-chip on-break" title="Member is currently on break">
                        <i className="status-dot dot-break" />
                        <span>On break</span>
                      </span>
                    ) : (
                      <span className="person-presence-chip working" title={liveProject ? `Clocked in · Working on ${liveProject}` : 'Clocked in & active'}>
                        <i className="status-dot dot-working" />
                        <span>Clocked in</span>
                      </span>
                    )
                  ) : (
                    <span className="person-presence-chip offline" title="Not currently clocked in">
                      <i className="status-dot dot-offline" />
                      <span>Offline</span>
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="person-avatar-wrap">
                  <Avatar user={u} big />
                </div>

                {/* Name & Identity */}
                <h3>{u.name}</h3>
                <div className="person-role">
                  {uPositions.length > 0 ? uPositions.join(' · ') : (u.department || 'Team Member')}
                </div>
                <div className="person-email">{u.email}</div>

                {/* Curated Meta Badges */}
                <div className="person-tags">
                  {u.department && <span className="tag dept-tag">{u.department}</span>}
                  {isAdmin && (
                    isTargetSuperAdmin(u) ? (
                      <span className="tag super-admin-tag"><Icon name="zap" size={11} style={{ marginRight: 3 }} />Super Admin</span>
                    ) : isTargetAdmin(u) ? (
                      <span className="tag admin-tag">Admin</span>
                    ) : null
                  )}
                  {uStreaks?.checkinStreak > 0 && (
                    <span className="tag streak-tag" title={`${uStreaks.checkinStreak}-day daily check-in streak`}>
                      <Icon name="flame" size={11} /> {uStreaks.checkinStreak}d streak
                    </span>
                  )}
                  {canSeeDetailedStats && (
                    <>
                      <span className={`tag ${onTimeRate >= 85 ? 'green' : 'yellow'}`} title="On-time deliverable rate">
                        {onTimeRate}% on-time
                      </span>
                      {blockedCount > 0 && <span className="tag red">{blockedCount} blocked</span>}
                    </>
                  )}
                </div>

                {/* Live shift banner if actively tracking */}
                {liveClock && (
                  <div className="person-live-banner">
                    <Icon name={liveClock.break_start ? "coffee" : "zap"} size={12} />
                    <span>
                      {liveClock.break_start
                        ? 'Break timer running'
                        : liveProject
                        ? <>Working on <b>{liveProject}</b></>
                        : 'Focused work session'}
                    </span>
                  </div>
                )}

                {/* Performance Bento Container */}
                {canSeeDetailedStats && (
                  <div className="person-stats-card">
                    <div className="person-stats-grid">
                      <div className="p-stat">
                        <span className="p-stat-val">{openTasks.length}</span>
                        <span className="p-stat-label">Open tasks</span>
                      </div>
                      <div className="p-stat-divider" />
                      <div className="p-stat">
                        <span className="p-stat-val">{doneTasksCount}</span>
                        <span className="p-stat-label">Completed</span>
                      </div>
                      <div className="p-stat-divider" />
                      <div className="p-stat">
                        <span className="p-stat-val">{totalHours.toFixed(1)}h</span>
                        <span className="p-stat-label">Tracked</span>
                      </div>
                    </div>

                    <div className="p-progress-box">
                      <div className="p-progress-head">
                        <span>Task completion</span>
                        <b>{taskCompletionRate}%</b>
                      </div>
                      <div className="p-progress-bar">
                        <div
                          className="p-progress-fill"
                          style={{ width: `${taskCompletionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="person-actions">
                  <button
                    type="button"
                    className="p-btn analytics-btn"
                    onClick={() => setModal({ type: 'memberAnalytics', id: u.id, data: u })}
                    title="View detailed employee analytics, streaks & work rhythm"
                  >
                    <Icon name="analytics" size={13} />
                    <span>Analytics</span>
                  </button>
                  <button
                    type="button"
                    className="p-btn profile-btn"
                    onClick={() => setModal({ type: 'person', id: u.id, data: u })}
                    title={isAdmin ? 'Edit member profile & assigned positions' : 'View member profile'}
                  >
                    <Icon name="settings" size={13} />
                    <span>{isAdmin ? 'Profile & roles' : 'View profile'}</span>
                  </button>
                </div>
              </article>
            );
          })}
          {list.length === 0 && (
            <div className="card empty" style={{ gridColumn: '1 / -1' }}>
              <strong>No people in this department</strong>
            </div>
          )}
        </div>
      </>
    );
  };

  // 7. Leads View
  const renderLeads = () => {
    const todayStr = key(new Date());
    const list = state.leads.filter(l => {
      if (filter === 'All') return true;
      if (filter === 'Follow-up due') {
        return !['Won', 'Lost'].includes(l.stage) && l.followup && l.followup <= todayStr;
      }
      return l.stage === filter;
    });
    const openLeads = state.leads.filter(l => !['Won', 'Lost'].includes(l.stage));
    const pipelineVal = openLeads.reduce((n, l) => n + Number(l.value || 0), 0);
    const weightedPipelineVal = openLeads.reduce(
      (n, l) => n + Number(l.value || 0) * (Math.min(100, Math.max(0, Number(l.probability ?? 50))) / 100),
      0
    );
    const wonLeads = state.leads.filter(l => l.stage === 'Won');
    const wonVal = wonLeads.reduce((n, l) => n + Number(l.value || 0), 0);

    const updateLeadStage = async (lead, stage) => {
      if (!lead || lead.stage === stage) return;
      const prevStage = lead.stage;
      const updatedLead = { ...lead, stage };
      setState(prev => ({
        ...prev,
        leads: prev.leads.map(item => (item.id === lead.id ? updatedLead : item))
      }));
      showToast(`Lead moved to ${stage}`);
      try {
        await handleApi('/api/record', {
          kind: 'leads',
          id: lead.id,
          body: updatedLead
        });
        refreshState();
      } catch (err) {
        setState(prev => ({
          ...prev,
          leads: prev.leads.map(item => (item.id === lead.id ? { ...item, stage: prevStage } : item))
        }));
        showToast(err.message);
      }
    };

    const convertLeadToProject = lead => {
      setModal({
        type: 'projects',
        data: {
          title: lead.company ? `${lead.company} — ${lead.title}` : lead.title,
          client: lead.company || lead.title,
          status: 'Planning',
          progress: 10,
          budget: Number(lead.value || 0),
          lead: lead.assignee || user.id,
          description: `Converted from Won lead (${lead.title}${lead.email ? ` · ${lead.email}` : ''}).\n${lead.notes || ''}`.trim()
        }
      });
    };

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Leads</h1>
            <p className="sub">{isAdmin ? 'Good conversations. New possibilities.' : 'Your assigned & captured opportunities.'}</p>
          </div>
          <div className="actions">
            {isAdmin && (
              <>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: 'none' }}
                  onChange={importLeadsCSV}
                />
                <button onClick={() => csvInputRef.current?.click()}>
                  <Icon name="upload" /> Import CSV
                </button>
              </>
            )}
            <button className="primary" onClick={() => setModal({ type: 'leads', data: {} })}>
              <Icon name="plus" /> Add lead
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat green">
            <span>{isAdmin ? 'Total leads' : 'My leads'}</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.leads.length}</span>
            <span className="sub">{isAdmin ? 'Every connection counts' : 'Assigned or captured by you'}</span>
          </div>
          <div className="stat">
            <span>{isAdmin ? 'Pipeline value' : 'My pipeline'}</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{formatMoney(pipelineVal)}</span>
            <span className="sub">
              {openLeads.length > 0
                ? `Weighted: ${formatMoney(Math.round(weightedPipelineVal))} (${openLeads.length} open)`
                : 'Open opportunities'}
            </span>
          </div>
          <div className="stat">
            <span>Won</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{wonLeads.length}</span>
            <span className="sub">{wonVal > 0 ? `${formatMoney(wonVal)} closed revenue` : 'New partnerships'}</span>
          </div>
          <div className="stat">
            <span>{state.integrations.sheets ? 'Sheets sync' : 'Lead storage'}</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{state.integrations.sheets ? 'Ready' : 'Active'}</span>
            <span className="sub">{state.integrations.sheets ? 'Synced with Google Sheets' : 'Saved in MongoDB · CSV ready'}</span>
          </div>
        </div>

        <div className="chat-layout">
          <section>
            <div className="actions" style={{ justifyContent: 'space-between', marginBottom: 15 }}>
              <div className="tabs">
                {['All', 'Follow-up due', 'New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => (
                  <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
                    {s}
                  </button>
                ))}
              </div>
              <button className="small" onClick={() => exportCSV('leads')}>
                <Icon name="download" /> Export CSV
              </button>
            </div>
            <div className="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lead / company</th>
                    <th>Contact</th>
                    <th>Value</th>
                    <th>Stage</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(l => {
                    const isFollowupOverdue = !['Won', 'Lost'].includes(l.stage) && l.followup && l.followup <= todayStr;
                    const owner = l.assignee ? state.users.find(u => u.id === l.assignee) : null;
                    return (
                      <tr key={l.id}>
                        <td>
                          <strong>{l.title}</strong>
                          {l.source && <span className="tag" style={{ marginLeft: 6 }}>{l.source}</span>}
                          <br />
                          <span className="sub">
                            {l.company || 'Independent'}
                            {owner ? ` · Owner: ${owner.name.split(' ')[0]}` : ''}
                            {l.followup ? ` · Follow up ${fmtDate(l.followup)}` : ''}
                          </span>
                          {isFollowupOverdue && (
                            <span className="tag red" style={{ marginLeft: 6 }}>Follow-up due</span>
                          )}
                        </td>
                        <td>{l.email || l.phone || '—'}</td>
                        <td>
                          {formatMoney(l.value)}
                          {Number(l.probability) > 0 && (
                            <div className="sub">{l.probability}% prob.</div>
                          )}
                        </td>
                        <td>
                          {canEdit('leads', l) ? (
                            <select
                              aria-label={`Stage for ${l.title}`}
                              value={l.stage}
                              onChange={e => updateLeadStage(l, e.target.value)}
                              style={{ padding: '5px 8px', fontSize: 11, width: 'auto', minWidth: 110 }}
                            >
                              {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="tag">{l.stage}</span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isAdmin && l.stage === 'Won' && (
                            <button
                              className="small primary"
                              style={{ marginRight: 6 }}
                              onClick={() => convertLeadToProject(l)}
                              title="Create a new project pre-filled from this Won lead"
                            >
                              → Project
                            </button>
                          )}
                          <button className="small" onClick={() => setModal({ type: 'leads', id: l.id, data: l })}>
                            {canEdit('leads', l) ? 'Open ↗' : 'View ↗'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty">
                          <strong>Your next opportunity starts here</strong>Add a lead or start a conversation in the capture panel.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Lead Assistant Chat Capture */}
          <section className="card chat">
            <div className="card-head">
              <div>
                <h3>Lead assistant <span className="tag">Capture</span></h3>
                <p className="sub" style={{ marginTop: 6 }}>From a quick note to a clear next step.</p>
              </div>
              <Icon name="leads" />
            </div>
            <div className="chat-log">
              <div className="bubble">
                Tell me about your new lead. I’ll organize the details into a card for you to review.<br /><br />
                Try: <b>Name: Maya Shah; Company: Acme; Email: maya@example.com; Value: 5000; Notes: Website redesign</b><br />
                <span className="sub">Structured capture · Instant preview</span>
              </div>
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`bubble ${m.user ? 'user' : ''}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                const text = new FormData(e.target).get('message');
                if (!text) return;
                setChatMessages(prev => [
                  ...prev,
                  { text, user: true },
                  { text: 'Your lead draft is ready. Review the details, then save it to your pipeline.' }
                ]);
                e.target.reset();
                const draft = parseLeadText(text);
                setModal({ type: 'leads', data: draft });
              }}
            >
              <textarea name="message" required placeholder="Add a name, company, contact details…" />
              <button className="primary" style={{ width: '100%', marginTop: 10 }}>
                Create lead draft ↗
              </button>
            </form>
          </section>
        </div>
      </>
    );
  };

  // 8. Meetings View
  const renderMeetings = () => {
    const isPast = filter === 'Past';
    const activeTab = isPast ? 'Past' : 'Upcoming';
    const list = state.meetings
      .filter(m => (isPast ? new Date(m.end) < new Date() : new Date(m.end) >= new Date()))
      .sort((a, b) => a.start.localeCompare(b.start));

    const toGCalUrl = m => {
      const fmt = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: m.title || 'Syneolab Meeting',
        dates: `${fmt(m.start)}/${fmt(m.end)}`,
        details: [m.description || '', m.link ? `\nJoin meeting: ${m.link}` : ''].join('').trim(),
        location: m.link || m.location || 'Google Meet'
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Meetings</h1>
            <p className="sub">{isAdmin ? 'Bring the right people into the same conversation.' : 'Your invited meetings & team sessions.'}</p>
          </div>
          {isAdmin && (
            <div className="actions">
              <a
                className="link-gen-btn"
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                style={{ height: 36, padding: '0 14px' }}
              >
                <Icon name="meetings" /> New Google Meet ↗
              </a>
              <button
                className="primary"
                onClick={() =>
                  setModal({
                    type: 'meetings',
                    data: {
                      attendees: state.users.map(u => u.id),
                      sendToEveryone: true,
                      autoRoom: true,
                      location: 'Google Meet'
                    }
                  })
                }
              >
                <Icon name="plus" /> Schedule meeting
              </button>
            </div>
          )}
        </div>

        <div className="tabs">
          {['Upcoming', 'Past'].map(t => (
            <button key={t} className={activeTab === t ? 'active' : ''} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="two-col">
          <section>
            {list.map(m => {
              const invitedAll = state.users.length > 0 && (m.attendees || []).length >= state.users.length;
              return (
                <article key={m.id} className="card meeting" style={{ marginBottom: 15 }}>
                  <div className="list-row">
                    <div className="meeting-time">
                      <span>{new Date(m.start).toLocaleDateString(undefined, { month: 'short' })}</span>
                      <b>{new Date(m.start).getDate()}</b>
                    </div>
                    <div className="grow">
                      <h3>{m.title}</h3>
                      <p className="sub">
                        {fmtDate(m.start)} · {fmtTime(m.start)} – {fmtTime(m.end)} · {m.location || 'Online'}
                      </p>
                    </div>
                    {invitedAll && <span className="tag purple">Everyone</span>}
                    <span className="tag">
                      {new Date(m.start) > new Date() ? 'Upcoming' : new Date(m.end) > new Date() ? 'Happening now' : 'Past'}
                    </span>
                  </div>
                  <p className="sub" style={{ marginTop: 20 }}>{m.description || 'A moment to connect and move forward.'}</p>
                  <div className="actions" style={{ justifyContent: 'space-between', marginTop: 15, flexWrap: 'wrap', gap: 10 }}>
                    <div className="avatar-stack">
                      {(m.attendees || []).map(uid => (
                        <Avatar key={uid} user={state.users.find(u => u.id === uid)} />
                      ))}
                    </div>
                    <div className="actions">
                      <a
                        className="link-gen-btn"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={m.calendarEventUrl || toGCalUrl(m)}
                      >
                        <Icon name="calendar" /> {m.calendarEventUrl ? 'Open in Calendar ↗' : '+ Google Calendar'}
                      </a>
                      <button className="small" onClick={() => setModal({ type: 'meetings', id: m.id, data: m })}>
                        Details
                      </button>
                      {m.link && (
                        <a className="link" target="_blank" rel="noopener noreferrer" href={m.link}>
                          Join meeting ↗
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            {list.length === 0 && (
              <div className="empty">
                <strong>Your schedule has breathing room</strong>Meetings appear here as soon as they are scheduled.
              </div>
            )}
          </section>

          <section className="card" style={{ alignSelf: 'start' }}>
            <h3>Automatic calendar & Meet sync</h3>
            <p className="sub" style={{ marginTop: 12 }}>
              Every scheduled meeting sends an executive HTML card plus a native <b>Google Calendar (.ics REQUEST)</b> invite so it automatically appears on everyone’s calendar with RSVP controls.
            </p>
            <div className="note" style={{ margin: '15px 0' }}>
              <div>Gmail + .ics Calendar Invite: <b>{state.integrations.gmail ? 'Active' : 'Setup needed'}</b></div>
              <div style={{ marginTop: 4 }}>
                Auto Google Meet API Webhook: <b>{state.integrations.calendar ? 'Connected' : 'Ready in Settings → Integrations'}</b>
              </div>
            </div>
            <div className="actions" style={{ flexWrap: 'wrap' }}>
              <button onClick={() => navigate('calendar')}>
                <Icon name="calendar" /> Open calendar
              </button>
              {isAdmin && (
                <button className="small" onClick={() => { setSettingsTab('Integrations'); navigate('settings'); }}>
                  Calendar sync setup ↗
                </button>
              )}
            </div>
          </section>
        </div>
      </>
    );
  };

  // 9. Announcements View
  const renderAnnouncements = () => {
    const totalMembers = state.users.length;
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Announcements</h1>
            <p className="sub">
              Company updates &amp; initiatives. Mark announcements as complete to confirm participation and notify administrators.
            </p>
          </div>
          <div className="actions">
            {isAdmin && (
              <button className="primary" onClick={() => setModal({ type: 'announcements', data: {} })}>
                <Icon name="plus" /> Post announcement
              </button>
            )}
          </div>
        </div>

        {state.announcements.map(a => {
          const ackRecords = state.acknowledgements.filter(x => x.record_id === a.id);
          const isAcked = ackRecords.some(x => x.user_id === user.id);
          const ackCount = ackRecords.length;
          const pct = totalMembers > 0 ? Math.round((ackCount / totalMembers) * 100) : 0;
          const author = state.users.find(u => u.id === a.owner);
          const completedMembers = ackRecords
            .map(ack => ({
              ack,
              member: state.users.find(u => u.id === ack.user_id)
            }))
            .filter(item => item.member);
          const pendingMembers = state.users.filter(u => !ackRecords.some(x => x.user_id === u.id));

          return (
            <article key={a.id} className="card announcement" style={{ marginBottom: 16 }}>
              <div className="card-head">
                <div className="profile">
                  <Avatar user={author} />
                  <div>
                    <h3>{a.title}</h3>
                    <span className="sub">{author?.name} · {fmtDate(a.created)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`tag ${isAcked ? 'green' : 'yellow'}`}>
                    {isAcked ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11} />Taking part / Completed</span> : 'Pending your completion'}
                  </span>
                  <span className={`tag ${a.priority === 'Important' ? 'yellow' : ''}`}>
                    {a.priority || 'Update'}
                  </span>
                </div>
              </div>
              <p style={{ margin: '15px 0', whiteSpace: 'pre-wrap' }}>{a.description}</p>

              {/* Team Participation & Completion Tracker (Admin Only) */}
              {isAdmin && (
                <div
                  style={{
                    margin: '14px 0',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--bg)',
                    border: '1px solid var(--line)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <strong style={{ fontSize: 12.5 }}>
                      Team Participation &amp; Completion Tracker
                    </strong>
                    <span className="sub" style={{ fontSize: 12, fontWeight: 600 }}>
                      {ackCount} of {totalMembers} team members completed ({pct}%)
                    </span>
                  </div>
                  <div className="progress" style={{ marginBottom: 10 }}>
                    <i style={{ width: `${pct}%` }}></i>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="sub" style={{ fontSize: 11, minWidth: 125, fontWeight: 600 }}>
                        Completed / Taking part ({completedMembers.length}):
                      </span>
                      {completedMembers.length > 0 ? (
                        completedMembers.map(({ ack, member }) => (
                          <span
                            key={member.id}
                            className="tag green"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px' }}
                            title={ack.at ? `Marked complete at ${new Date(ack.at).toLocaleString()}` : 'Marked complete'}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11} />{member.name}</span>
                            {ack.at && (
                              <small style={{ opacity: 0.78 }}>
                                ({new Date(ack.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                              </small>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="sub" style={{ fontSize: 11 }}>No team members have marked complete yet</span>
                      )}
                    </div>
                    {pendingMembers.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="sub" style={{ fontSize: 11, minWidth: 125 }}>
                          Pending ({pendingMembers.length}):
                        </span>
                        {pendingMembers.map(member => (
                          <span key={member.id} className="tag" style={{ fontSize: 11, opacity: 0.85 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} />{member.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="actions">
                <button
                  className={`small ${isAcked ? '' : 'primary'}`}
                  disabled={isAcked}
                  onClick={async () => {
                    const optimisticAck = {
                      record_id: a.id,
                      user_id: user.id,
                      at: new Date().toISOString()
                    };
                    setState(prev => ({
                      ...prev,
                      acknowledgements: [...prev.acknowledgements, optimisticAck]
                    }));
                    showToast('Marked as complete — Admin notified');
                    try {
                      await handleApi('/api/ack', { id: a.id });
                      refreshState();
                    } catch (err) {
                      setState(prev => ({
                        ...prev,
                        acknowledgements: prev.acknowledgements.filter(
                          x => !(x.record_id === a.id && x.user_id === user.id)
                        )
                      }));
                      showToast(err.message);
                    }
                  }}
                >
                  <><Icon name="check" size={13} style={{ marginRight: 4 }} />{isAcked ? 'Completed (Taking part)' : 'Mark as complete'}</>
                </button>
                <span className="sub">
                  {isAdmin
                    ? `${ackCount}/${totalMembers} completed · Admin notified on completion`
                    : isAcked
                    ? 'You marked this announcement as complete'
                    : 'Admin is notified when you mark complete'}
                </span>
                {isAdmin && (
                  <button className="small" onClick={() => setModal({ type: 'announcements', id: a.id, data: a })}>
                    Edit
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {state.announcements.length === 0 && (
          <div className="card empty">
            <strong>Everyone on the same page</strong>Company updates will appear here.
          </div>
        )}
      </>
    );
  };

  // 10. Analytics View
  const renderAnalytics = () => {
    const todayStr = key(new Date());
    const scopedClocks = isAdmin ? state.clocks : state.clocks.filter(c => c.user_id === user.id);
    const daysData = series(scopedClocks, analyticsDays, currentTime);
    const prevData = series(scopedClocks, analyticsDays, currentTime, analyticsDays);

    const sum = (xs, k) => xs.reduce((n, d) => n + d[k], 0);
    const hours = sum(daysData, 'hours');
    const oldHours = sum(prevData, 'hours');

    const trend = (curr, prev) => {
      if (!prev) return curr ? 'New activity this period' : 'No change from previous period';
      const pct = Math.round(((curr - prev) / prev) * 100);
      return `${pct >= 0 ? '↗' : '↘'} ${Math.abs(pct)}% vs previous ${analyticsDays} days`;
    };

    // Filter clocks for period
    const periodClocks = scopedClocks.filter(
      c => key(new Date(c.start * 1000)) >= daysData[0].date && key(new Date(c.start * 1000)) <= daysData.at(-1).date
    );

    const sparkPts = (vals) => {
      const pts = points(vals, 240, 50, 3);
      const line = pts.map(p => p.join(',')).join(' ');
      return (
        <svg className="sparkline" viewBox="0 0 240 50" preserveAspectRatio="none" aria-hidden="true">
          <polygon points={`3,50 ${line} 237,50`} fill="var(--light)" />
          <polyline points={line} fill="none" stroke="var(--mid)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    };

    // Donut data
    const projectGroups = state.projects
      .map(p => ({
        title: p.title,
        hours: periodClocks.filter(c => c.project === p.id).reduce((n, c) => n + worked(c, currentTime) / 3600, 0)
      }))
      .filter(p => p.hours > 0)
      .sort((a, b) => b.hours - a.hours);

    const knownProjectIds = new Set(state.projects.map(p => p.id));
    const otherHours = periodClocks
      .filter(c => !knownProjectIds.has(c.project || ''))
      .reduce((n, c) => n + worked(c, currentTime) / 3600, 0);
    if (otherHours > 0) projectGroups.push({ title: 'Other / unassigned', hours: otherHours });

    const totalDonutHours = projectGroups.reduce((n, p) => n + p.hours, 0);
    let donutOffset = 0;
    const shades = ['green', 'mid', 'soft', 'deep', 'stripe'];

    // 12-week Heatmap (84 days)
    const heatData = series(scopedClocks, 84, currentTime);
    const maxHeat = Math.max(1, ...heatData.map(d => d.hours));

    // Contributors (Admin sees all team members; Employee sees only their own profile)
    const contributors = (isAdmin ? state.users : state.users.filter(u => u.id === user.id))
      .map(u => ({
        ...u,
        hours: periodClocks.filter(c => c.user_id === u.id).reduce((n, c) => n + worked(c, currentTime) / 3600, 0),
        tasks: state.tasks.filter(t => isUserAssignedToTask(t, u.id) && t.status === 'Done').length
      }))
      .sort((a, b) => b.hours - a.hours);

    // Streak Analytics List & Rankings
    const streakAnalyticsList = (state.users || []).map(u => ({
      user: u,
      ...calculateMemberStreaks(u.id, state.standups || [], state.clocks || [], todayStr, currentTime)
    }));
    const checkinRankedAnalytics = [...streakAnalyticsList].sort((a, b) => {
      if (b.checkinStreak !== a.checkinStreak) return b.checkinStreak - a.checkinStreak;
      if (b.bestCheckinStreak !== a.bestCheckinStreak) return b.bestCheckinStreak - a.bestCheckinStreak;
      return b.totalCheckins - a.totalCheckins;
    });
    const clockRankedAnalytics = [...streakAnalyticsList].sort((a, b) => {
      if (b.clockStreak !== a.clockStreak) return b.clockStreak - a.clockStreak;
      if (b.bestClockStreak !== a.bestClockStreak) return b.bestClockStreak - a.bestClockStreak;
      return b.totalClockDays - a.totalClockDays;
    });

    const comp = completion(state.tasks);

    // Focus chart
    const maxFocus = Math.max(1, ...daysData.map(d => d.hours), ...prevData.map(d => d.hours));
    const currPts = points(daysData.map(d => d.hours), 720, 240, 24, maxFocus);
    const prevPts = points(prevData.map(d => d.hours), 720, 240, 24, maxFocus);

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Analytics</h1>
            <p className="sub">
              {isAdmin ? 'How the team is shaping up, and where the time goes.' : 'Your personal focused time, project breakdown, and task progress.'}
            </p>
          </div>
          <div className="actions">
            <div className="period-switch">
              {[7, 30, 90].map(n => (
                <button
                  key={n}
                  className={analyticsDays === n ? 'active' : ''}
                  onClick={() => setAnalyticsDays(n)}
                >
                  {n}D
                </button>
              ))}
            </div>
            <button onClick={() => exportCSV('time')}>
              <Icon name="download" /> {isAdmin ? 'Export CSV' : 'Export my CSV'}
            </button>
          </div>
        </div>

        <div className="stats analytics-stats">
          <section className="stat metric-card">
            <div className="metric-title">Hours tracked<span className="metric-dot"></span></div>
            <span className="value">{hours.toFixed(1)}</span>
            <span className="sub">{trend(hours, oldHours)}</span>
            {sparkPts(daysData.map(d => d.hours))}
          </section>
          <section className="stat metric-card">
            <div className="metric-title">Work sessions<span className="metric-dot"></span></div>
            <span className="value">{sum(daysData, 'sessions')}</span>
            <span className="sub">{trend(sum(daysData, 'sessions'), sum(prevData, 'sessions'))}</span>
            {sparkPts(daysData.map(d => d.sessions))}
          </section>
          <section className="stat metric-card">
            <div className="metric-title">{isAdmin ? 'Active contributors' : 'Active days'}<span className="metric-dot"></span></div>
            <span className="value">
              {isAdmin
                ? new Set(periodClocks.map(c => c.user_id)).size
                : daysData.filter(d => d.hours > 0).length}
            </span>
            <span className="sub">
              {isAdmin ? `of ${state.users.length} team members this period` : `of ${analyticsDays} days this period`}
            </span>
            {sparkPts(daysData.map(d => d.people))}
          </section>
          <section className="stat metric-card">
            <div className="metric-title">Average session<span className="metric-dot"></span></div>
            <span className="value">
              {periodClocks.length ? (hours / periodClocks.length).toFixed(1) : '0.0'}<small> h</small>
            </span>
            <span className="sub">Focused time, excluding breaks</span>
            {sparkPts(daysData.map(d => (d.sessions ? d.hours / d.sessions : 0)))}
          </section>
        </div>

        <div className="analytics-layout">
          {/* Daily Focus Trend Chart */}
          <section className="card throughput-card">
            <div className="card-head">
              <div>
                <h3>Focus trend</h3>
                <p className="sub">Daily focused hours · sessions grouped by clock-in date</p>
              </div>
              <div className="line-legend">
                <span><i></i>This period</span>
                <span><i></i>Previous</span>
              </div>
            </div>
            <div className="focus-chart">
              <svg viewBox="0 0 720 265" preserveAspectRatio="none" role="img" aria-label={`Daily focused hours over the last ${analyticsDays} days`}>
                <defs>
                  <linearGradient id="focus-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="var(--mid)" stopOpacity=".38" />
                    <stop offset="1" stopColor="var(--mid)" stopOpacity=".015" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map(i => (
                  <React.Fragment key={i}>
                    <line x1="24" y1={24 + i * 64} x2="696" y2={24 + i * 64} stroke="var(--line)" strokeDasharray="3 5" />
                    <text x="0" y={28 + i * 64} fill="var(--muted)" fontSize="9">
                      {((maxFocus * (3 - i)) / 3).toFixed(0)}
                    </text>
                  </React.Fragment>
                ))}
                <polygon points={`24,216 ${currPts.map(p => p.join(',')).join(' ')} 696,216`} fill="url(#focus-fill)" />
                <polyline points={prevPts.map(p => p.join(',')).join(' ')} fill="none" stroke="var(--stripe)" strokeWidth="1.8" strokeDasharray="5 5" />
                <polyline points={currPts.map(p => p.join(',')).join(' ')} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinejoin="round" />
                {[0, Math.floor(daysData.length / 3), Math.floor((daysData.length * 2) / 3), daysData.length - 1].map(i => (
                  <text
                    key={i}
                    x={currPts[i][0]}
                    y="253"
                    textAnchor={i === 0 ? 'start' : i === daysData.length - 1 ? 'end' : 'middle'}
                    fontSize="10"
                    fill="var(--muted)"
                  >
                    {fmtDate(daysData[i].date)}
                  </text>
                ))}
              </svg>
              <div className="chart-hotspots">
                {daysData.map(d => (
                  <button
                    key={d.date}
                    type="button"
                    className="chart-hotspot"
                    aria-label={`${fmtDate(d.date)}: ${d.hours.toFixed(1)} focused hours`}
                  >
                    <span>
                      {fmtDate(d.date)}
                      <b>{d.hours.toFixed(1)} h</b>
                      <small>{d.sessions} sessions{isAdmin ? ` · ${d.people} people` : ''}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="trend-footer">
              <span><b>{hours.toFixed(1)} h</b> of focused work</span>
              <span className="tag">{trend(hours, oldHours)}</span>
            </div>
          </section>

          {/* Time by Project Donut */}
          <section className="card time-project-card">
            <div className="card-head">
              <h3>Time by project</h3>
              <span className="mini-label">{analyticsDays} days</span>
            </div>
            <div className="donut-wrap">
              <svg viewBox="0 0 220 220" role="img" aria-label={`${totalDonutHours.toFixed(1)} focused hours by project`}>
                <circle cx="110" cy="110" r="82" fill="none" stroke="var(--light)" strokeWidth="27" />
                {projectGroups.map((g, i) => {
                  const startAngle = donutOffset;
                  const share = (g.hours / (totalDonutHours || 1)) * 100;
                  donutOffset += share;
                  return (
                    <circle
                      key={g.title}
                      cx="110"
                      cy="110"
                      r="82"
                      pathLength="100"
                      fill="none"
                      stroke={`var(--${shades[i % 5]})`}
                      strokeWidth="27"
                      strokeDasharray={`${Math.max(0.15, share - 1.3)} ${100 - Math.max(0.15, share - 1.3)}`}
                      strokeDashoffset={`-${startAngle}`}
                      transform="rotate(-90 110 110)"
                    >
                      <title>{`${g.title}: ${g.hours.toFixed(1)} hours (${Math.round(share)}%)`}</title>
                    </circle>
                  );
                })}
              </svg>
              <div className="donut-label">
                <b>{totalDonutHours.toFixed(1)}<small>h</small></b>
                <span>last {analyticsDays} days</span>
              </div>
            </div>
            <div className="donut-legend">
              {projectGroups.map((g, i) => (
                <div key={g.title}>
                  <span><i style={{ background: `var(--${shades[i % 5]})` }}></i>{g.title}</span>
                  <b>{g.hours.toFixed(1)}h</b>
                </div>
              ))}
              {projectGroups.length === 0 && (
                <p className="sub">Clock some focused time to see the breakdown.</p>
              )}
            </div>
          </section>

          {/* Heatmap & Contribution */}
          <section className="card heatmap-card">
            <div className="card-head">
              <div>
                <h3>{isAdmin ? 'Team activity' : 'My activity rhythm'}</h3>
                <p className="sub">A rhythm of small steps. Last 12 weeks.</p>
              </div>
              <div className="heat-legend">
                Less {[0, 1, 2, 3, 4].map(i => <i key={i} className={`heat-cell level-${i}`}></i>)} More
              </div>
            </div>
            <div className="heatmap">
              {heatData.map((d, i) => {
                const lvl = d.hours ? Math.min(4, Math.max(1, Math.ceil((d.hours / maxHeat) * 4))) : 0;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`heat-cell level-${lvl}`}
                    aria-label={`${fmtDate(d.date)}: ${d.hours.toFixed(1)} hours`}
                  >
                    <span>{fmtDate(d.date)}<b>{d.hours.toFixed(1)} focused hours</b></span>
                  </button>
                );
              })}
            </div>
            <div className="chart-foot">
              <span>{fmtDate(heatData[0].date)}</span>
              <span>{fmtDate(heatData.at(-1).date)}</span>
            </div>
            <div className="completion-strip" style={{ marginTop: 20 }}>
              <div><b>{comp.done}</b><span>Tasks completed <small>all time</small></span></div>
              <div><b>{comp.percent}%</b><span>Completion rate <small>all time</small></span></div>
              <div><b>{comp.ongoing}</b><span>Tasks in motion <small>right now</small></span></div>
            </div>
          </section>

          {/* Top Contributors (Admin sees Top 5; Employee sees their own focus summary) */}
          <section className="card contributors-card">
            <div className="card-head">
              <h3>{isAdmin ? 'Top contributors' : 'My focus summary'}</h3>
              <span className="mini-label">Focused hours</span>
            </div>
            {contributors.slice(0, 5).map((u, i) => (
              <div key={u.id} className="contributor">
                <span className="rank">{String(i + 1).padStart(2, '0')}</span>
                <Avatar user={u} />
                <div className="grow">
                  <strong>{u.name}</strong>
                  <div className="progress">
                    <i style={{ width: `${contributors[0]?.hours ? (u.hours / contributors[0].hours) * 100 : 0}%` }}></i>
                  </div>
                </div>
                <b>{u.hours.toFixed(1)}<small> h</small></b>
              </div>
            ))}
          </section>
        </div>

        {/* Team Streak & Habit Leaderboard Section */}
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-head" style={{ flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Team Streak &amp; Habit Leaderboard</h3>
                <span className="tag green" style={{ fontSize: 10.5 }}>
                  <Icon name="trophy" size={11} style={{ marginRight: 3, color: '#f59e0b' }} />
                  Consistency Rankings
                </span>
              </div>
              <p className="sub" style={{ margin: '3px 0 0' }}>
                All-time record streaks and consecutive daily check-ins across the team.
              </p>
            </div>
            <div className="streak-tab-toggle">
              <button
                type="button"
                className={`streak-tab-btn ${streakBoardTab === 'checkin' ? 'active' : ''}`}
                onClick={() => setStreakBoardTab('checkin')}
              >
                <Icon name="flame" size={12} /> Daily Check-ins
              </button>
              <button
                type="button"
                className={`streak-tab-btn ${streakBoardTab === 'clock' ? 'active' : ''}`}
                onClick={() => setStreakBoardTab('clock')}
              >
                <Icon name="zap" size={12} /> Shift Attendance
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
            {(streakBoardTab === 'checkin' ? checkinRankedAnalytics : clockRankedAnalytics).map((m, idx) => {
              const streakVal = streakBoardTab === 'checkin' ? m.checkinStreak : m.clockStreak;
              const bestVal = streakBoardTab === 'checkin' ? m.bestCheckinStreak : m.bestClockStreak;
              const maxVal = streakBoardTab === 'checkin'
                ? Math.max(1, ...checkinRankedAnalytics.map(x => x.checkinStreak))
                : Math.max(1, ...clockRankedAnalytics.map(x => x.clockStreak));
              const pct = maxVal > 0 ? Math.max(8, Math.round((streakVal / maxVal) * 100)) : 8;
              const uPos = getUserPositions(m.user);

              return (
                <div
                  key={m.user.id}
                  className="streak-lead-row"
                  style={{
                    background: 'var(--bg)',
                    borderRadius: 12,
                    border: '1px solid var(--line)',
                    padding: '12px 14px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setModal({ type: 'memberAnalytics', id: m.user.id, data: m.user })}
                >
                  <span className={`streak-rank-badge ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}`}>
                    {idx === 0 ? <Icon name="trophy" size={13} style={{ color: '#f59e0b' }} /> : String(idx + 1).padStart(2, '0')}
                  </span>
                  <Avatar user={m.user} />
                  <div className="streak-lead-info">
                    <div className="streak-lead-title">
                      <span>{m.user.name}</span>
                      {m.user.id === user?.id && <span className="tag green" style={{ fontSize: 8.5, padding: '1px 4px' }}>You</span>}
                    </div>
                    <span className="streak-lead-sub">
                      {uPos[0] || m.user.department || 'Workspace'} · Best: {bestVal}d
                    </span>
                    <div className={`streak-lead-progress ${streakBoardTab === 'clock' ? 'clock' : ''}`}>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="streak-lead-metric">
                    <strong>
                      <Icon name={streakBoardTab === 'checkin' ? 'flame' : 'zap'} size={12} style={{ color: streakBoardTab === 'checkin' ? 'var(--green)' : '#8b5cf6' }} />
                      {streakVal}d
                    </strong>
                    <small>{streakBoardTab === 'checkin' ? `${m.totalCheckins} check-ins` : `${m.totalClockDays} work days`}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {renderEmployeePerformanceSuite('analytics')}
      </>
    );
  };

  // 11. Settings View
  const renderSettings = () => {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Settings</h1>
            <p className="sub">A workspace that feels like yours.</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-tabs">
            {(isAdmin ? ['Profile', 'Appearance', 'Integrations'] : ['Profile', 'Appearance']).map(t => (
              <button
                key={t}
                className={settingsTab === t ? 'primary' : ''}
                onClick={() => setSettingsTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <section className="card">
            {settingsTab === 'Profile' && (
              <div>
                <h3>Your profile</h3>
                <div className="list-row" style={{ marginTop: 15 }}>
                  <Avatar user={user} big />
                  <div className="grow">
                    <strong>{user.name}</strong>
                    <span className="sub">
                      {getUserPositions(user).join(' · ')} · {user.department || 'General'} · {user.email} · {isAdmin ? 'Admin (Full Workspace Access)' : 'Employee (Least-Privilege Access)'}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {getUserPositions(user).map(pos => (
                        <span key={pos} className="tag purple">{pos}</span>
                      ))}
                      <span className="tag">{user.department || 'Management'}</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <div>
                        <strong>Set your positions / titles (Multiple allowed)</strong>
                        <div className="sub">Click pills to toggle multiple positions (e.g. Founder, CEO) or add custom titles below.</div>
                      </div>
                      <button
                        type="button"
                        className="small"
                        onClick={() =>
                          promptCreatePosition(created => {
                            const current = getUserPositions(user);
                            if (!current.some(p => p.toLowerCase() === created.toLowerCase())) {
                              handleSaveMemberPositions(user, [...current, created]);
                            }
                          })
                        }
                      >
                        + Create new position
                      </button>
                    </div>
                    <div className="member-pill-list" style={{ marginBottom: 12 }}>
                      {positions.map(pos => {
                        const current = getUserPositions(user);
                        const selected = current.some(p => p.toLowerCase() === pos.toLowerCase());
                        return (
                          <button
                            key={pos}
                            type="button"
                            className={`member-pill ${selected ? 'selected' : ''}`}
                            onClick={() => {
                              const next = selected
                                ? current.filter(p => p.toLowerCase() !== pos.toLowerCase())
                                : [...current, pos];
                              handleSaveMemberPositions(user, next.length ? next : ['CEO']);
                            }}
                          >
                            <span>{selected ? <Icon name="check" size={11} style={{ marginRight: 3 }} /> : <Icon name="plus" size={11} style={{ marginRight: 3 }} />}{pos}</span>
                          </button>
                        );
                      })}
                    </div>
                    <form
                      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}
                      onSubmit={async e => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const rawPositions = String(fd.get('positionsInput') || '').trim();
                        const dept = String(fd.get('department') || user.department || 'Management');
                        await handleSaveMemberPositions(user, rawPositions, { department: dept });
                      }}
                    >
                      <div className="field" style={{ margin: 0, flex: '2 1 240px' }}>
                        <label>Positions (comma-separated, e.g. Founder, CEO)</label>
                        <input
                          key={getUserPositions(user).join(', ')}
                          name="positionsInput"
                          type="text"
                          defaultValue={getUserPositions(user).join(', ')}
                          placeholder="Founder, CEO"
                        />
                      </div>
                      <div className="field" style={{ margin: 0, flex: '1 1 160px' }}>
                        <label>Department</label>
                        <select
                          key={`${departments.join('|')}__${user.department || ''}`}
                          name="department"
                          defaultValue={user.department || departments[0] || 'Management'}
                        >
                          {[...new Set([user.department, ...departments].filter(Boolean))].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <button className="primary" type="submit">
                        Save positions &amp; department
                      </button>
                    </form>
                  </div>
                )}

                <div className="note" style={{ marginTop: 18 }}>
                  <strong>Role &amp; Access Scope ({isAdmin ? 'Admin' : 'Employee'})</strong>
                  <div className="sub" style={{ marginTop: 6, lineHeight: 1.6 }}>
                    {isAdmin
                      ? 'Full executive permissions: manage projects & client budgets, assign work across the team, schedule meetings & calendar syncs, post announcements, view all timesheets, and administer workspace members & integrations.'
                      : 'Least-privilege employee scope: manage your own assigned tasks & personal tasks, capture & manage your own leads, clock in/out and view your own timesheet, post daily standups, and view active projects (budgets hidden), invited meetings, and team announcements.'}
                  </div>
                </div>
                <h3 style={{ margin: '25px 0 18px' }}>Change password</h3>
                <form
                  style={{ maxWidth: 400 }}
                  onSubmit={async e => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    try {
                      await handleApi('/api/password', Object.fromEntries(fd));
                      setUser(null);
                      showToast('Password changed. Please sign in again.');
                    } catch (err) {
                      showToast(err.message);
                    }
                  }}
                >
                  <div className="field">
                    <label>Current password</label>
                    <input name="current" type="password" required />
                  </div>
                  <div className="field">
                    <label>New password (12+ characters)</label>
                    <input name="password" type="password" required minLength="12" />
                  </div>
                  <button className="primary" style={{ marginTop: 10 }}>Update password</button>
                </form>
              </div>
            )}

            {settingsTab === 'Appearance' && (
              <div>
                <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <h3>Make yourself at home</h3>
                    <p className="sub" style={{ margin: '8px 0 18px' }}>
                      {isAdmin
                        ? 'Your selection sets the enforced Workspace Default theme (on Sign-In & for new employees) as well as your Admin view.'
                        : `Personal post-login preference — applies only to your account after signing in (Workspace Default: ${themes[workspaceDefaults.defaultAccent]?.name || 'Forest'}).`}
                    </p>
                  </div>
                  {!isAdmin && (
                    <button
                      type="button"
                      className="small"
                      onClick={async () => {
                        try {
                          localStorage.removeItem(`accent_${user.id}`);
                          localStorage.removeItem(`darkMode_${user.id}`);
                          localStorage.removeItem(`weekStart_${user.id}`);
                          localStorage.removeItem(`currency_${user.id}`);
                          const res = await handleApi('/api/preferences', { resetToDefault: true });
                          const updatedUser = { ...user, preferences: {} };
                          setUser(updatedUser);
                          if (res.workspaceDefaults) setWorkspaceDefaults(res.workspaceDefaults);
                          syncActivePreferences(updatedUser, res.workspaceDefaults || workspaceDefaults);
                          showToast('Reset to Admin Workspace Default theme');
                        } catch (err) {
                          showToast(err.message);
                        }
                      }}
                    >
                      Reset to Admin Default
                    </button>
                  )}
                </div>

                <div className="eyebrow" style={{ marginLeft: 0 }}>
                  {isAdmin ? 'Workspace Default & Admin Accent Color' : 'Your Personal Accent Color (Post-Login)'}
                </div>
                <div className="swatches">
                  {[
                    ['Syneo Brand', '#4f46e5'],
                    ['Forest', '#145c40'],
                    ['Ocean', '#285a80'],
                    ['Plum', '#644780'],
                    ['Ember', '#9b512d'],
                    ['Rose', '#b84b76'],
                    ['Sakura', '#d4688e']
                  ].map(([name, hex]) => (
                    <button
                      key={hex}
                      className="swatch"
                      aria-pressed={accent === hex}
                      onClick={async () => {
                        setAccent(hex);
                        localStorage.setItem(`accent_${user.id}`, hex);
                        const p = applyTheme(hex, darkMode);
                        try {
                          const res = await handleApi('/api/preferences', { accent: hex });
                          setUser(prev => (prev ? { ...prev, preferences: res.preferences } : prev));
                          if (res.workspaceDefaults) setWorkspaceDefaults(res.workspaceDefaults);
                          showToast(
                            isAdmin
                              ? `${p.name} set as Workspace Default & Admin theme`
                              : `${p.name} saved to your personal profile`
                          );
                        } catch {
                          showToast(`${p.name} theme applied`);
                        }
                      }}
                    >
                      <i style={{ '--swatch': hex }}></i>
                      {name}
                      {workspaceDefaults.defaultAccent === hex && !isAdmin && (
                        <small style={{ fontSize: 9, opacity: 0.75, marginLeft: 4 }}>(Default)</small>
                      )}
                    </button>
                  ))}
                </div>

                <div className="eyebrow" style={{ margin: '30px 0 12px' }}>
                  {isAdmin ? 'Workspace Default & Admin Appearance Mode' : 'Appearance Mode (Light / Dark)'}
                </div>
                <div className="actions">
                  <button
                    type="button"
                    className={!darkMode ? 'primary' : ''}
                    onClick={() => { if (darkMode) toggleDarkMode(); }}
                  >
                    <Icon name="sun" /> Light Mode
                  </button>
                  <button
                    type="button"
                    className={darkMode ? 'primary' : ''}
                    onClick={() => { if (!darkMode) toggleDarkMode(); }}
                  >
                    <Icon name="moon" /> Dark Mode
                  </button>
                </div>

                <div className="eyebrow" style={{ margin: '30px 0 12px' }}>Week starts on</div>
                <div className="actions">
                  {['Sunday', 'Monday'].map(d => (
                    <button
                      key={d}
                      className={weekStart === d ? 'primary' : ''}
                      onClick={async () => {
                        setWeekStart(d);
                        localStorage.setItem(`weekStart_${user.id}`, d);
                        try {
                          const res = await handleApi('/api/preferences', { weekStart: d });
                          setUser(prev => (prev ? { ...prev, preferences: res.preferences } : prev));
                          if (res.workspaceDefaults) setWorkspaceDefaults(res.workspaceDefaults);
                        } catch {}
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="eyebrow" style={{ margin: '30px 0 12px' }}>Lead currency</div>
                <select
                  style={{ maxWidth: 220 }}
                  value={currency}
                  onChange={async e => {
                    const val = e.target.value;
                    setCurrency(val);
                    localStorage.setItem(`currency_${user.id}`, val);
                    try {
                      const res = await handleApi('/api/preferences', { currency: val });
                      setUser(prev => (prev ? { ...prev, preferences: res.preferences } : prev));
                      if (res.workspaceDefaults) setWorkspaceDefaults(res.workspaceDefaults);
                    } catch {}
                    showToast('Currency updated');
                  }}
                >
                  {['USD', 'NPR', 'INR', 'EUR', 'GBP'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {settingsTab === 'Integrations' && (
              <div>
                <h3>Connected, thoughtfully</h3>
                <div className="list-row">
                  <div className="project-symbol">
                    <Icon name="pulse" />
                  </div>
                  <div className="grow">
                    <strong>24/7 MongoDB Atlas Keep-Alive Beacon (Zero Storage Growth)</strong>
                    <span className="sub">
                      Updates a single 110-byte heartbeat record in-place &amp; purges expired sessions so your 500MB DB stays 24/7 awake across weekends with 0B extra storage
                      {state.beacon?.lastPing ? ` · Last pulse: ${new Date(state.beacon.lastPing).toLocaleTimeString()} (${state.beacon.totalPings || 1} total)` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="small"
                    style={{ marginRight: 8 }}
                    onClick={async () => {
                      const res = await handleApi('/api/beacon?source=manual-admin', {});
                      await refreshState();
                      showToast(`MongoDB Beacon pulsed (${res.latencyMs || 0}ms · 0B storage added)`);
                    }}
                  >
                    Pulse now
                  </button>
                  <span className="tag green">24/7 Awake · 0B Growth</span>
                </div>
                <div className="list-row">
                  <div className="project-symbol">G</div>
                  <div className="grow">
                    <strong>Gmail SMTP & Native Calendar Invite (.ics)</strong>
                    <span className="sub">Sends executive HTML invites + native Google Calendar RSVP sync</span>
                  </div>
                  <span className={`tag ${state.integrations.gmail ? 'green' : 'yellow'}`}>
                    {state.integrations.gmail ? 'Configured' : 'Setup needed'}
                  </span>
                </div>
                <div className="list-row">
                  <div className="project-symbol"><Icon name="calendar" size={15} /></div>
                  <div className="grow">
                    <strong>Google Calendar & Auto Google Meet Room</strong>
                    <span className="sub">
                      {state.integrations.calendar
                        ? 'Auto-creates Google Calendar events & meet.google.com links'
                        : ' Gmail .ics sync is active · Add GOOGLE_CALENDAR_URL for auto meet.google.com links'}
                    </span>
                  </div>
                  <span className={`tag ${state.integrations.calendar ? 'green' : ''}`}>
                    {state.integrations.calendar ? 'Webhook active' : '.ics Sync active'}
                  </span>
                </div>
                <div className="list-row">
                  <div className="project-symbol">▦</div>
                  <div className="grow">
                    <strong>Google Sheets</strong>
                    <span className="sub">Automatically update your lead spreadsheet</span>
                  </div>
                  <span className={`tag ${state.integrations.sheets ? 'green' : 'yellow'}`}>
                    {state.integrations.sheets ? 'Configured' : 'Setup needed'}
                  </span>
                </div>
                <div className="note" style={{ margin: '20px 0' }}>
                  <strong>Automatic Calendar & Google Meet Sync:</strong> Every meeting automatically attaches a native <code>METHOD:REQUEST</code> iCalendar (<code>.ics</code>) invite that syncs directly into Gmail and Google Calendar. To also auto-generate <code>https://meet.google.com/xxx-xxxx-xxx</code> links on the server, deploy <code>integrations/google-calendar-meet.gs</code> in Google Apps Script and set <code>GOOGLE_CALENDAR_URL</code> in <code>.env.local</code>.
                </div>
                {isAdmin && state.jobs.length > 0 && (
                  <div style={{ marginBottom: 15 }}>
                    <h3 style={{ marginBottom: 10 }}>Delivery activity</h3>
                    {state.jobs.slice(0, 8).map(j => (
                      <div key={j.id} className="list-row">
                        <div className="grow">
                          <strong>
                            {j.kind === 'email'
                              ? j.payload?.type === 'task_assigned'
                                ? 'Task assignment email'
                                : j.payload?.type === 'announcement'
                                ? 'Announcement email'
                                : 'Meeting email'
                              : 'Sheets lead sync'}
                          </strong>
                          <span className="sub">{new Date(j.created).toLocaleString()}{j.error ? ` · ${j.error}` : ''}</span>
                        </div>
                        <span className={`tag ${j.status === 'sent' ? '' : 'yellow'}`}>{j.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <div className="actions">
                    <button
                      className="small"
                      onClick={async () => {
                        await handleApi('/api/jobs/retry', {});
                        await refreshState();
                        showToast('Queued for another delivery attempt');
                      }}
                    >
                      Retry pending setup / failed
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </>
    );
  };

  // 11b. Pulse & Goals View (Daily Standups + Collaborative Daily/Weekly/Monthly/Quarterly Goals & Team Sync)
  const renderPulse = () => {
    const todayStr = key(new Date());
    const standups = state.standups || [];
    const goals = isAdmin
      ? state.goals || []
      : (state.goals || []).filter(g => isGoalAssignedToUser(g, user.id));
    const todayStandups = standups.filter(s => isTodayStandup(s));
    const myTodayStandup = todayStandups.find(s => s.owner === user.id);
    const uniqueCheckedInOwners = new Set(todayStandups.map(s => s.owner));
    const activeBlockersCount =
      state.tasks.filter(t => t.blocked && t.status !== 'Done').length +
      todayStandups.filter(s => s.blockers && s.blockers.trim()).length +
      goals.filter(g => g.status === 'Blocked').length;

    const getGoalPct = g => {
      if (!g) return 0;
      if (g.status === 'Completed') return 100;
      const target = Math.max(1, Number(g.targetValue || 100));
      const cur = Math.max(0, Number(g.currentValue || 0));
      return Math.min(100, Math.round((cur / target) * 100));
    };

    const calcAvgPct = list =>
      list.length ? Math.round(list.reduce((sum, g) => sum + getGoalPct(g), 0) / list.length) : 0;

    const dailyGoals = goals.filter(g => (g.period || 'weekly') === 'daily');
    const weeklyGoals = goals.filter(g => (g.period || 'weekly') === 'weekly');
    const monthlyGoals = goals.filter(g => (g.period || 'weekly') === 'monthly');
    const quarterlyGoals = goals.filter(g => (g.period || 'weekly') === 'quarterly');
    const dailyWeeklyGoals = [...dailyGoals, ...weeklyGoals];
    const monthlyQuarterlyGoals = [...monthlyGoals, ...quarterlyGoals];

    const filteredGoals = goals.filter(g => {
      const gPeriod = (g.period || 'weekly').toLowerCase();
      if (goalPeriodFilter !== 'all' && gPeriod !== goalPeriodFilter) return false;
      if (!isAdmin) return isGoalAssignedToUser(g, user.id);
      if (goalMemberFilter === 'mine' && !isGoalAssignedToUser(g, user.id)) return false;
      if (goalMemberFilter !== 'all' && goalMemberFilter !== 'mine' && !isGoalAssignedToUser(g, goalMemberFilter)) {
        return false;
      }
      return true;
    });

    const filteredStandups = standups.filter(s => {
      if (filter === 'Today') return isTodayStandup(s);
      if (filter === 'With blockers') return Boolean(s.blockers && s.blockers.trim());
      if (filter === 'My check-ins') return s.owner === user.id;
      return true;
    });

    const openNewGoalModal = (period = 'weekly', assigneeId = isAdmin ? 'all' : user.id) => {
      const safeAssignee = isAdmin ? assigneeId : user.id;
      const assignees = safeAssignee && safeAssignee !== 'all' ? [safeAssignee] : state.users.map(u => u.id);
      setModal({
        type: 'goals',
        data: {
          period,
          status: 'On track',
          category: user.department || 'Company',
          assignee: safeAssignee,
          assignees,
          due: getDefaultGoalDue(period),
          currentValue: 0,
          targetValue: 100,
          unit: '%',
          subtasks: [],
          comments: []
        }
      });
    };

    const syncMembers = isAdmin ? state.users : state.users.filter(u => u.id === user.id);

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Pulse, goals & team sync</h1>
            <p className="sub">
              {isAdmin
                ? 'Collaborative daily, weekly & monthly goals, real-time employee check-ins, and total team alignment.'
                : 'Your assigned daily, weekly & monthly goals, check-ins, and personal progress sync.'}
            </p>
          </div>
          <div className="actions" style={{ flexWrap: 'wrap' }}>
            <button onClick={() => openNewGoalModal('daily', isAdmin ? 'all' : user.id)}>
              <Icon name="plus" /> Daily goal
            </button>
            <button onClick={() => openNewGoalModal('weekly', isAdmin ? 'all' : user.id)}>
              <Icon name="plus" /> Weekly goal
            </button>
            <button onClick={() => openNewGoalModal('monthly', isAdmin ? 'all' : user.id)}>
              <Icon name="plus" /> Monthly goal
            </button>
            {myTodayStandup ? (
              <button className="primary" onClick={() => setModal({ type: 'standups', id: myTodayStandup.id, data: myTodayStandup })}>
                <Icon name="check" size={14} /> Edit today's check-in
              </button>
            ) : (
              <button className="primary" onClick={() => setModal({ type: 'standups', data: { date: todayStr, mood: 'Focused' } })}>
                <Icon name="plus" /> Post daily check-in
              </button>
            )}
          </div>
        </div>

        <div className="stats">
          <div className="stat green">
            <span>Check-ins today</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{uniqueCheckedInOwners.size}/{state.users.length}</span>
            <span className="sub">
              {myTodayStandup ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={12} />You checked in today</span> : 'Daily team sync rhythm'}
            </span>
          </div>
          <div className="stat" style={{ cursor: 'pointer' }} onClick={() => setGoalPeriodFilter('daily')}>
            <span>{isAdmin ? 'Daily & weekly goals' : 'My daily & weekly goals'}</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{dailyWeeklyGoals.length}</span>
            <span className="sub">
              {dailyGoals.length} daily · {weeklyGoals.length} weekly ({calcAvgPct(dailyWeeklyGoals)}% avg)
            </span>
          </div>
          <div className="stat" style={{ cursor: 'pointer' }} onClick={() => setGoalPeriodFilter('monthly')}>
            <span>{isAdmin ? 'Monthly & OKRs' : 'My monthly & OKRs'}</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{monthlyQuarterlyGoals.length}</span>
            <span className="sub">
              {monthlyGoals.length} monthly · {quarterlyGoals.length} quarterly ({calcAvgPct(monthlyQuarterlyGoals)}% avg)
            </span>
          </div>
          <div className="stat">
            <span>Active blockers</span>
            <span className="arrow"><Icon name="arrow" /></span>
            <span className="value">{activeBlockersCount}</span>
            <span className="sub">{activeBlockersCount ? 'Needs attention' : 'Clear runway'}</span>
          </div>
        </div>

        {/* Total Team Sync & Goal Alignment Matrix (Admin sees all members; Employee sees only their own card) */}
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="card-head" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3>{isAdmin ? 'Total team sync & goal alignment' : 'My daily sync & goal alignment'}</h3>
              <p className="sub" style={{ margin: '2px 0 0' }}>
                {isAdmin
                  ? 'Live view of every member’s daily check-in, active clock status, and assigned daily/weekly/monthly goals.'
                  : 'Your daily check-in status, active clock session, and assigned daily/weekly/monthly goal completion.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {isAdmin && goalMemberFilter !== 'all' && (
                <button className="small" onClick={() => setGoalMemberFilter('all')}>
                  Show all members ({goals.length})
                </button>
              )}
              {isAdmin ? (
                <button className="small primary" onClick={() => openNewGoalModal('weekly', 'all')}>
                  + Assign goal to team
                </button>
              ) : (
                <span className="tag" title="RBAC Least Privilege: You only view your own goal alignment.">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="lock" size={12} />Personal &amp; Assigned Scope</span>
                </span>
              )}
            </div>
          </div>

          <div className="team-sync-grid">
            {syncMembers.map(u => {
              const checkedIn = todayStandups.find(s => s.owner === u.id);
              const uClock = state.clocks.find(c => c.user_id === u.id && !c.end);
              const memberGoals = goals.filter(g => isGoalAssignedToUser(g, u.id));
              const memberDaily = memberGoals.filter(g => (g.period || 'weekly') === 'daily').length;
              const memberWeekly = memberGoals.filter(g => (g.period || 'weekly') === 'weekly').length;
              const memberMonthly = memberGoals.filter(g => ['monthly', 'quarterly'].includes(g.period)).length;
              const memberDoneGoals = memberGoals.filter(g => getGoalPct(g) >= 100 || g.status === 'Completed').length;
              const memberAvgPct = calcAvgPct(memberGoals);
              const isSelectedMember = isAdmin && goalMemberFilter === u.id;

              return (
                <div
                  key={u.id}
                  className="team-sync-member-card"
                  style={isSelectedMember ? { borderColor: 'var(--green)', boxShadow: '0 0 0 2px var(--light)' } : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar user={u} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </strong>
                      <span className="sub" style={{ fontSize: 11 }}>
                        {u.position || u.department}
                      </span>
                    </div>
                    <span
                      className={`tag ${
                        uClock
                          ? uClock.break_start
                            ? 'yellow'
                            : 'green'
                          : checkedIn
                          ? 'green'
                          : 'yellow'
                      }`}
                    >
                      {uClock ? (uClock.break_start ? 'On break' : 'Working') : checkedIn ? 'Synced' : 'Pending'}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, padding: '6px 9px', borderRadius: 8, background: 'var(--white)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span className="sub" style={{ fontSize: 10.5 }}>Today’s check-in focus:</span>
                      {checkedIn && canEdit('standups', checkedIn) && (
                        <button
                          type="button"
                          className="icon-btn-ghost"
                          style={{ padding: '0 4px', fontSize: 11, height: 'auto', textDecoration: 'underline' }}
                          onClick={() => setModal({ type: 'standups', id: checkedIn.id, data: checkedIn })}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <strong style={{ fontSize: 12, fontWeight: 600 }}>
                      {checkedIn ? checkedIn.title : 'No check-in posted yet today'}
                    </strong>
                    {checkedIn?.blockers && (
                      <div style={{ color: '#ef4444', fontSize: 11, marginTop: 3, fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="alert" size={12} />Blocker: {checkedIn.blockers}</span>
                      </div>
                    )}
                    {!checkedIn && u.id === user.id && (
                      <button
                        type="button"
                        className="small primary"
                        style={{ marginTop: 6, width: '100%' }}
                        onClick={() => setModal({ type: 'standups', data: { date: todayStr, mood: 'Focused' } })}
                      >
                        <Icon name="plus" size={12} /> Check in now
                      </button>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span className="sub">
                        <b>{memberGoals.length}</b> goals ({memberDaily}D · {memberWeekly}W · {memberMonthly}M)
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--green)' }}>
                        {memberDoneGoals}/{memberGoals.length} done ({memberAvgPct}%)
                      </span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <i style={{ width: `${memberAvgPct}%` }}></i>
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
                      <button
                        type="button"
                        className="small"
                        style={{ flex: 1 }}
                        onClick={() => setGoalMemberFilter(isSelectedMember ? 'all' : u.id)}
                      >
                        {isSelectedMember ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11} />Showing goals</span> : `View goals (${memberGoals.length})`}
                      </button>
                      <button
                        type="button"
                        className="small"
                        onClick={() => openNewGoalModal('weekly', u.id)}
                        title={`Assign a goal to ${u.name}`}
                      >
                        + Assign goal
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="two-col">
          {/* Collaborative Daily / Weekly / Monthly Goals Board */}
          <section className="card">
            <div className="card-head" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3>{isAdmin ? 'Collaborative goals & OKRs' : 'My assigned & personal goals'}</h3>
                <p className="sub" style={{ margin: '2px 0 0' }}>
                  {isAdmin
                    ? 'Track daily targets, weekly sprints, monthly deliverables, and company OKRs together.'
                    : 'Goals assigned to you by Admin or created by you under least-privilege RBAC.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {isAdmin ? (
                  <select
                    value={goalMemberFilter}
                    onChange={e => setGoalMemberFilter(e.target.value)}
                    style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
                  >
                    <option value="all">All team members ({goals.length})</option>
                    <option value="mine">My assigned goals ({goals.filter(g => isGoalAssignedToUser(g, user.id)).length})</option>
                    {state.users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({goals.filter(g => isGoalAssignedToUser(g, u.id)).length})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="lock" size={12} />Assigned &amp; Personal Goals</span>
                )}
                <button
                  className="small primary"
                  onClick={() =>
                    openNewGoalModal(
                      goalPeriodFilter === 'all' ? 'weekly' : goalPeriodFilter,
                      isAdmin && goalMemberFilter !== 'all' && goalMemberFilter !== 'mine'
                        ? goalMemberFilter
                        : isAdmin
                        ? 'all'
                        : user.id
                    )
                  }
                >
                  + New goal
                </button>
              </div>
            </div>

            <div className="tabs" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${goals.length})` },
                { id: 'daily', label: `Daily (${dailyGoals.length})` },
                { id: 'weekly', label: `Weekly (${weeklyGoals.length})` },
                { id: 'monthly', label: `Monthly (${monthlyGoals.length})` },
                { id: 'quarterly', label: `Quarterly OKRs (${quarterlyGoals.length})` }
              ].map(t => (
                <button
                  key={t.id}
                  className={goalPeriodFilter === t.id ? 'active' : ''}
                  onClick={() => setGoalPeriodFilter(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {filteredGoals.map(g => {
              const target = Math.max(1, Number(g.targetValue || 100));
              const current = Math.max(0, Number(g.currentValue || 0));
              const pct = getGoalPct(g);
              const period = (g.period || 'weekly').toLowerCase();
              const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
              const goalAssignees = Array.isArray(g.assignees) && g.assignees.length
                ? g.assignees
                : g.assignee && g.assignee !== 'all'
                ? [g.assignee]
                : [];
              const assignedUsers = state.users.filter(u => goalAssignees.includes(u.id));
              const creator = state.users.find(u => u.id === g.owner);
              const linkedProject = g.project ? state.projects.find(p => p.id === g.project) : null;
              const subtasks = Array.isArray(g.subtasks) ? g.subtasks : [];
              const doneSubtasks = subtasks.filter(st => st.done).length;
              const comments = Array.isArray(g.comments) ? g.comments : [];
              const editableGoal = canEdit('goals', g);
              const goalStatus = g.status || (pct >= 100 ? 'Completed' : 'On track');

              return (
                <div key={g.id} className="goal-card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`goal-period-badge ${period}`}>{periodLabel}</span>
                      {g.category && <span className="tag">{g.category}</span>}
                      {linkedProject && <span className="tag purple">{linkedProject.title}</span>}
                      <span
                        className={`tag ${
                          goalStatus === 'Completed' || pct >= 100
                            ? 'green'
                            : goalStatus === 'Blocked'
                            ? 'red'
                            : goalStatus === 'At risk'
                            ? 'yellow'
                            : ''
                        }`}
                      >
                        {pct >= 100 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11} />Completed</span> : goalStatus}
                      </span>
                    </div>
                    <span className={`tag ${pct >= 80 ? 'green' : pct >= 40 ? '' : 'yellow'}`} style={{ fontWeight: 700 }}>
                      {current} / {target} {g.unit || '%'} ({pct}%)
                    </span>
                  </div>

                  <div
                    style={{ marginTop: 8, cursor: 'pointer' }}
                    onClick={() => setModal({ type: 'goals', id: g.id, data: g })}
                  >
                    <strong style={{ fontSize: 15, display: 'block' }}>{g.title}</strong>
                    {g.description && <p className="sub" style={{ margin: '4px 0 0' }}>{g.description}</p>}
                  </div>

                  <div className="progress" style={{ margin: '10px 0 8px', height: 8 }}>
                    <i style={{ width: `${pct}%` }}></i>
                  </div>

                  {/* Interactive Key Results / Subtasks Checklist right on the Goal Card */}
                  {subtasks.length > 0 && (
                    <div
                      style={{
                        margin: '8px 0',
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'var(--bg)',
                        border: '1px solid var(--line)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                        <strong style={{ fontSize: 11 }}>Key results & action steps</strong>
                        <span className="sub">{doneSubtasks}/{subtasks.length} completed</span>
                      </div>
                      {subtasks.map((st, idx) => (
                        <label
                          key={st.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 12,
                            padding: '3px 0',
                            cursor: editableGoal ? 'pointer' : 'default',
                            margin: 0
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(st.done)}
                            disabled={!editableGoal}
                            onChange={() => {
                              const nextSubtasks = subtasks.map((item, i) =>
                                i === idx ? { ...item, done: !item.done } : item
                              );
                              const nextDoneCount = nextSubtasks.filter(item => item.done).length;
                              const patch = { subtasks: nextSubtasks };
                              if ((g.unit || '%') === '%' && Number(g.targetValue || 100) === 100) {
                                patch.currentValue = Math.round((nextDoneCount / nextSubtasks.length) * 100);
                              }
                              quickUpdateGoal(g, patch, 'Key result updated & synced with team');
                            }}
                          />
                          <span style={{ textDecoration: st.done ? 'line-through' : 'none', opacity: st.done ? 0.65 : 1 }}>
                            {st.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--line)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {assignedUsers.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="avatar-stack">
                            {assignedUsers.slice(0, 4).map(u => (
                              <Avatar key={u.id} user={u} />
                            ))}
                          </div>
                          <span className="sub" style={{ fontSize: 11.5 }}>
                            {assignedUsers.map(u => u.name.split(' ')[0]).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="tag green" style={{ fontSize: 10.5 }}>Entire team</span>
                      )}
                      {creator && (
                        <span className="sub" style={{ fontSize: 11 }}>
                          · Set by {creator.name.split(' ')[0]}
                        </span>
                      )}
                      <span className="sub" style={{ fontSize: 11 }}>
                        · {g.due ? `Due ${fmtDate(g.due)}` : 'Ongoing'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {editableGoal && pct < 100 && (
                        <>
                          <button
                            type="button"
                            className="small"
                            onClick={() => {
                              const step = target <= 10 ? 1 : Math.max(1, Math.round(target * 0.1));
                              const nextVal = Math.min(target, Number((current + step).toFixed(2)));
                              quickUpdateGoal(
                                g,
                                { currentValue: nextVal },
                                `Progress updated to ${nextVal}/${target} ${g.unit || '%'}`
                              );
                            }}
                            title="Quickly bump progress by 10%"
                          >
                            +{target <= 10 ? `1` : `10%`}
                          </button>
                          <button
                            type="button"
                            className="small"
                            onClick={() =>
                              quickUpdateGoal(
                                g,
                                { currentValue: target, status: 'Completed' },
                                `Goal "${g.title}" marked complete!`
                              )
                            }
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="check" size={11} />Complete</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="small"
                        onClick={() => setModal({ type: 'goals', id: g.id, data: g })}
                      >
                        {comments.length > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 6 }}><Icon name="chat" size={11} />{comments.length} ·</span> : ''}
                        {editableGoal ? 'Update / Discuss' : 'View'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredGoals.length === 0 && (
              <div className="empty">
                <strong>No goals in this view yet</strong>
                Set daily focus targets, weekly team sprints, or monthly goals so everyone stays aligned and moving together.
              </div>
            )}
          </section>

          {/* Right Column: Daily Standup Check-Ins */}
          <div>
            <section className="card">
              <div className="card-head" style={{ flexWrap: 'wrap', gap: 10 }}>
                <h3>Daily check-ins</h3>
                <div className="tabs" style={{ margin: 0 }}>
                  {['All', 'Today', 'With blockers', 'My check-ins'].map(tab => (
                    <button
                      key={tab}
                      className={filter === tab ? 'active' : ''}
                      onClick={() => setFilter(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {filteredStandups.map(s => {
                const author = state.users.find(u => u.id === s.owner);
                const proj = s.project ? state.projects.find(p => p.id === s.project) : null;
                return (
                  <article key={s.id} className="standup-card">
                    <div className="list-row" style={{ borderTop: 0, paddingTop: 0 }}>
                      <Avatar user={author} />
                      <div className="grow">
                        <strong>{author?.name || 'Team member'}</strong>
                        <span className="sub">
                          {author?.position || author?.department || 'Workspace'} · {new Date(s.created).toLocaleString()}
                        </span>
                      </div>
                      {s.mood && <span className="tag">{s.mood}</span>}
                      {proj && <span className="tag purple">{proj.title}</span>}
                      <button className="small" onClick={() => setModal({ type: 'standups', id: s.id, data: s })}>
                        {canEdit('standups', s) ? 'Edit' : 'View'}
                      </button>
                    </div>
                    <div className="standup-body">
                      <div>
                        <span className="eyebrow" style={{ margin: 0 }}>Today’s focus</span>
                        <p style={{ margin: '4px 0 8px', fontWeight: 600 }}>{s.title}</p>
                      </div>
                      {s.yesterday && (
                        <div>
                          <span className="eyebrow" style={{ margin: 0 }}>Completed recently</span>
                          <p className="sub" style={{ margin: '4px 0 8px' }}>{s.yesterday}</p>
                        </div>
                      )}
                      {s.blockers && (
                        <div className="task-blocker-note">
                          <strong><Icon name="alert" size={12} style={{ marginRight: 4, verticalAlign: '-0.15em' }} />Blocker:</strong> {s.blockers}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {filteredStandups.length === 0 && (
                <div className="empty">
                  <strong>No check-ins here yet</strong>Share what you are focusing on today so the team stays aligned.
                </div>
              )}
            </section>
          </div>
        </div>
      </>
    );
  };

  // 12. Search Overlay View
  const renderSearchView = () => {
    const q = search.toLowerCase();
    const kinds = ['projects', 'tasks', 'leads', 'meetings', 'announcements', 'standups', 'goals'];
    const results = kinds.flatMap(k =>
      (state[k] || []).filter(r => JSON.stringify(r).toLowerCase().includes(q)).map(r => ({ k, r }))
    );

    return (
      <>
        <div className="page-head">
          <div>
            <h1>Search</h1>
            <p className="sub">Results for “{search}”</p>
          </div>
        </div>
        <section className="card">
          {results.map(({ k, r }) => (
            <div key={r.id} className="list-row">
              <div className="project-symbol"><Icon name={k === 'standups' || k === 'goals' ? 'pulse' : k} /></div>
              <div className="grow">
                <strong>{r.title}</strong>
                <span className="sub">{k}</span>
              </div>
              <button className="small" onClick={() => setModal({ type: k, id: r.id, data: r })}>
                Open ↗
              </button>
            </div>
          ))}
          {state.users.filter(u => u.name.toLowerCase().includes(q)).map(u => (
            <div key={u.id} className="list-row">
              <Avatar user={u} />
              <strong>{u.name}</strong>
              <button className="small" onClick={() => setModal({ type: 'person', id: u.id, data: u })}>
                Profile
              </button>
            </div>
          ))}
          {results.length === 0 && (
            <div className="empty"><strong>No matches yet</strong>Try a project, task, or person’s name.</div>
          )}
        </section>
      </>
    );
  };

  // Main View Router
  const renderCurrentView = () => {
    if (search) return renderSearchView();
    switch (page) {
      case 'dashboard': return renderDashboard();
      case 'projects': return renderProjects();
      case 'tasks': return renderTasks();
      case 'calendar': return renderCalendar();
      case 'clock': return renderClock();
      case 'team': return renderTeam();
      case 'leads': return renderLeads();
      case 'meetings': return renderMeetings();
      case 'announcements': return renderAnnouncements();
      case 'pulse': return renderPulse();
      case 'analytics': return renderAnalytics();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  // --- MODAL DIALOGS ---
  const renderModalContent = () => {
    if (!modal) return null;
    const { type, id, data = {} } = modal;

    // Individual Member Analytics Dialog
    if (type === 'memberAnalytics') {
      const targetUser = state.users.find(item => item.id === (data.id || id)) || data;
      const u = { ...targetUser, ...data };
      const uPositions = getUserPositions(u);
      const isSuper = isTargetSuperAdmin(u);
      const isTargetAdm = isTargetAdmin(u);

      // Tasks assigned to this individual
      const uTasks = state.tasks.filter(t => isUserAssignedToTask(t, u.id));
      const uDone = uTasks.filter(t => t.status === 'Done');
      const uOpen = uTasks.filter(t => t.status !== 'Done');
      const uBlocked = uTasks.filter(t => Boolean(t.blocked) && t.status !== 'Done');
      const todayStr = key(new Date());
      const uOverdue = uOpen.filter(t => t.due && t.due < todayStr);
      const onTimeRate = uTasks.length
        ? Math.max(0, Math.round(((uTasks.length - uOverdue.length) / uTasks.length) * 100))
        : 100;

      // Clocks & Hours for this individual
      const uClocks = state.clocks.filter(c => c.user_id === u.id);
      const totalWorkSec = uClocks.reduce((n, c) => n + worked(c, currentTime), 0);
      const totalBreakSec = uClocks.reduce((n, c) => n + breakDuration(c, currentTime), 0);
      const totalWorkHours = totalWorkSec / 3600;
      const totalBreakHours = totalBreakSec / 3600;
      const completedShifts = uClocks.filter(c => Boolean(c.end));
      const activeShift = uClocks.find(c => !c.end);
      const avgShiftHours = completedShifts.length > 0 ? totalWorkHours / completedShifts.length : totalWorkHours;
      const utilization = totalWorkSec + totalBreakSec > 0
        ? Math.round((totalWorkSec / (totalWorkSec + totalBreakSec)) * 100)
        : 100;

      // Composite Performance Score (0 - 100)
      const completionRatio = uTasks.length ? uDone.length / uTasks.length : 1;
      const performanceScore = Math.min(
        100,
        Math.max(
          10,
          Math.round(
            completionRatio * 35 +
            (onTimeRate / 100) * 35 +
            (utilization / 100) * 20 +
            Math.max(0, 1 - uBlocked.length * 0.15) * 10
          )
        )
      );

      // 7-Day Individual Hours Rhythm
      const daySeries = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dKey = key(d);
        const shortDay = d.toLocaleDateString(undefined, { weekday: 'short' });
        const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;
        const dayLabel = `${shortDay}, ${shortDate}`;
        const fullDay = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        const dayClocks = uClocks.filter(c => key(new Date(c.start * 1000)) === dKey);
        const dayHours = dayClocks.reduce((acc, c) => acc + worked(c, currentTime) / 3600, 0);
        const isToday = dKey === todayStr;
        daySeries.push({
          date: dKey,
          label: dayLabel,
          shortDay,
          shortDate,
          fullDay,
          hours: dayHours,
          count: dayClocks.length,
          isToday
        });
      }
      const totalWeekHours = daySeries.reduce((acc, ds) => acc + ds.hours, 0);
      const activeWeekDays = daySeries.filter(ds => ds.hours > 0).length;
      const peakWeekDay = daySeries.reduce((max, ds) => (ds.hours > (max?.hours || 0) ? ds : max), null);
      const avgDailyHours = activeWeekDays > 0 ? (totalWeekHours / activeWeekDays) : 0;
      const benchmarkHours = 8;
      const maxDayHours = Math.max(benchmarkHours, ...daySeries.map(s => s.hours));

      // Recent Shift Work Notes
      const recentShiftsWithNotes = uClocks
        .filter(c => (c.note && c.note.trim()) || c.end)
        .slice(0, 8);

      // Member activity trail
      const memberActivities = (state.activities || [])
        .filter(a => a.actorId === u.id || a.targetUserId === u.id || (Array.isArray(a.targetUserIds) && a.targetUserIds.includes(u.id)))
        .slice(0, 8);

      const uStreaks = calculateMemberStreaks(u.id, state.standups || [], state.clocks || [], todayStr, currentTime);

      // Compute ranks across all members for u
      const allMemberStreaks = (state.users || []).map(usr => ({
        user: usr,
        ...calculateMemberStreaks(usr.id, state.standups || [], state.clocks || [], todayStr, currentTime)
      }));
      const checkinRankList = [...allMemberStreaks].sort((a, b) => {
        if (b.checkinStreak !== a.checkinStreak) return b.checkinStreak - a.checkinStreak;
        if (b.bestCheckinStreak !== a.bestCheckinStreak) return b.bestCheckinStreak - a.bestCheckinStreak;
        return b.totalCheckins - a.totalCheckins;
      });
      const uCheckinRank = checkinRankList.findIndex(m => m.user.id === u.id) + 1;

      const clockRankList = [...allMemberStreaks].sort((a, b) => {
        if (b.clockStreak !== a.clockStreak) return b.clockStreak - a.clockStreak;
        if (b.bestClockStreak !== a.bestClockStreak) return b.bestClockStreak - a.bestClockStreak;
        return b.totalClockDays - a.totalClockDays;
      });
      const uClockRank = clockRankList.findIndex(m => m.user.id === u.id) + 1;

      return (
        <div className="modal modal-wide member-analytics-modal" role="dialog" style={{ maxWidth: 960 }}>
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar user={u} big />
              <div>
                <span className="eyebrow" style={{ margin: 0 }}>Individual Performance &amp; Analytics</span>
                <h2 style={{ margin: '3px 0 0' }}>{u.name}</h2>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                  {uPositions.map(pos => <span key={pos} className="tag purple">{pos}</span>)}
                  <span className="tag">{u.department}</span>
                  {isSuper ? (
                    <span className="tag super-admin-tag"><Icon name="zap" size={11} style={{ marginRight: 3 }} />Super Admin</span>
                  ) : isTargetAdm ? (
                    <span className="tag">Admin</span>
                  ) : (
                    <span className="tag">Member</span>
                  )}
                  <span className={`tag ${activeShift ? (activeShift.break_start ? 'yellow' : 'green') : ''}`}>
                    {activeShift ? (activeShift.break_start ? <><Icon name="coffee" size={12} style={{ marginRight: 4 }} />On break</> : <><Icon name="zap" size={12} style={{ marginRight: 4 }} />Clocked in</>) : <><Icon name="dot" size={10} style={{ marginRight: 4, opacity: 0.5 }} />Offline</>}
                  </span>
                  <span className="tag green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="trophy" size={11} style={{ color: '#f59e0b' }} />
                    Rank #{uCheckinRank} Check-ins ({uStreaks.checkinStreak}d streak)
                  </span>
                  <span className="tag purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="zap" size={11} />
                    Rank #{uClockRank} Shifts ({uStreaks.clockStreak}d streak)
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="small" onClick={() => setModal({ type: 'person', id: u.id, data: u })}>
                View Profile ↗
              </button>
              <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal"><Icon name="x" size={15} /></button>
            </div>
          </div>

          {/* 4-Stat KPI Grid */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <span className="kpi-label">Focused Work Time</span>
              <strong className="kpi-value">{totalWorkHours.toFixed(1)}h</strong>
              <span className="kpi-sub">
                {completedShifts.length} shifts · ~{avgShiftHours.toFixed(1)}h avg/shift
              </span>
            </div>
            <div className="analytics-kpi-card">
              <span className="kpi-label">Task Completion</span>
              <strong className="kpi-value">{uDone.length} / {uTasks.length}</strong>
              <span className="kpi-sub">
                {uTasks.length ? Math.round((uDone.length / uTasks.length) * 100) : 100}% rate · {onTimeRate}% on-time
              </span>
            </div>
            <div className="analytics-kpi-card">
              <span className="kpi-label">Work Utilization</span>
              <strong className="kpi-value">{utilization}%</strong>
              <span className="kpi-sub">
                {duration(totalBreakSec)} break time ({totalBreakHours.toFixed(1)}h)
              </span>
            </div>
            <div className="analytics-kpi-card highlight">
              <span className="kpi-label">Performance Score</span>
              <strong className="kpi-value">{performanceScore}<span style={{ fontSize: 14, fontWeight: 500 }}>/100</span></strong>
              <span className="kpi-sub">
                {uBlocked.length ? <span style={{ color: 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="flag" size={11} />{uBlocked.length} blocked</span> : <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="check" size={11} />0 blockers</span>} · {uOverdue.length ? <span style={{ color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="alert" size={11} />{uOverdue.length} overdue</span> : <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="check" size={11} />On track</span>}
              </span>
            </div>
          </div>

          {/* Habit Streaks, Consistency Records & 14-Day Visual Rhythm Diagram */}
          <section className="card" style={{ marginBottom: 18, padding: 18 }}>
            <div className="card-head" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0 }}>Habit Consistency &amp; Streak Records</h3>
                  <span className="tag green" style={{ fontSize: 10 }}>
                    <Icon name="trophy" size={11} style={{ marginRight: 3, color: '#f59e0b' }} />
                    Team Rank #{uCheckinRank}
                  </span>
                </div>
                <span className="sub">Lifetime check-in consistency, shift attendance, and 14-day rhythm</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="flame" size={12} />
                  {uCheckinRank === 1 ? '🥇 #1 Team Check-in Streak' : `#${uCheckinRank} in Check-in Streak`}
                </span>
                <span className="tag purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="zap" size={12} />
                  {uClockRank === 1 ? '⚡ #1 Attendance Consistency' : `#${uClockRank} in Clock Consistency`}
                </span>
              </div>
            </div>

            {/* 4-Bento Streak Metric Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="flame" size={13} style={{ color: 'var(--green)' }} /> Current Check-in Streak
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 4px' }}>
                  <strong style={{ fontSize: 24, fontWeight: 800 }}>{uStreaks.checkinStreak}</strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>days streak</span>
                </div>
                <span className="sub" style={{ fontSize: 10.5 }}>
                  {uStreaks.checkedToday ? (
                    <span style={{ color: 'var(--green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Icon name="check" size={11} />Checked in today
                    </span>
                  ) : (
                    <span style={{ color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Icon name="pulse" size={11} />Pending today
                    </span>
                  )}
                </span>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="trophy" size={13} style={{ color: '#f59e0b' }} /> Best Check-in Record
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 4px' }}>
                  <strong style={{ fontSize: 24, fontWeight: 800 }}>{uStreaks.bestCheckinStreak}</strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>days all-time</span>
                </div>
                <span className="sub" style={{ fontSize: 10.5 }}>
                  {uStreaks.totalCheckins} lifetime check-in days
                </span>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="zap" size={13} style={{ color: '#8b5cf6' }} /> Current Clock Streak
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 4px' }}>
                  <strong style={{ fontSize: 24, fontWeight: 800 }}>{uStreaks.clockStreak}</strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>days streak</span>
                </div>
                <span className="sub" style={{ fontSize: 10.5 }}>
                  {activeShift ? 'Currently clocked in' : 'Off shift'}
                </span>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
                <span className="sub" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="medal" size={13} style={{ color: '#3b82f6' }} /> Best Clock Record
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 4px' }}>
                  <strong style={{ fontSize: 24, fontWeight: 800 }}>{uStreaks.bestClockStreak}</strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>days all-time</span>
                </div>
                <span className="sub" style={{ fontSize: 10.5 }}>
                  {uStreaks.totalClockDays} active working days
                </span>
              </div>
            </div>

            {/* 14-Day Visual Rhythm & Habit Timeline (Diagram Pattern from Image 3) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <strong style={{ fontSize: 12 }}>14-Day Work &amp; Habit Rhythm Timeline</strong>
                <span className="sub" style={{ fontSize: 10.5 }}>Pill Fill: Work Hours · Dot: Daily Check-in</span>
              </div>
              <div className="rhythm-14d-container">
                {uStreaks.last14Days.map(ds => {
                  const maxRhythmHours = Math.max(8, ...uStreaks.last14Days.map(d => d.hours || 0));
                  const fillPct = maxRhythmHours > 0 && ds.hours > 0 ? Math.min(100, Math.round((ds.hours / maxRhythmHours) * 100)) : (ds.hasClock ? 25 : 0);
                  return (
                    <div
                      key={ds.date}
                      className={`rhythm-14d-col ${ds.isToday ? 'is-today' : ''}`}
                      title={`${ds.date} (${ds.shortDay}): ${ds.hasCheckin ? (ds.standup ? `Checked in: “${ds.standup.title}”` : 'Checked in') : 'No check-in'} · ${ds.hours.toFixed(1)}h worked`}
                    >
                      <span className="rhythm-14d-val" style={ds.hours > 0 ? undefined : { opacity: 0.35 }}>
                        {ds.hours > 0 ? `${ds.hours.toFixed(1)}h` : '—'}
                      </span>
                      <div className="rhythm-14d-track">
                        {ds.hasCheckin && (
                          <span className="rhythm-14d-flame" title="Daily check-in posted">
                            <Icon name="flame" size={12} />
                          </span>
                        )}
                        <div className="rhythm-14d-fill" style={{ height: `${Math.max(ds.hours > 0 ? 12 : 0, fillPct)}%` }} />
                      </div>
                      <span className="rhythm-14d-label">
                        <span style={{ display: 'block' }}>{ds.shortDay}</span>
                        <span style={{ opacity: 0.7, fontSize: 8.5 }}>{ds.shortDate}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 7-Day Hours Rhythm Bar Chart */}
          <section className="card rhythm-card" style={{ marginBottom: 18, padding: '20px 22px' }}>
            <div className="card-head" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="rhythm-icon-badge">
                  <Icon name="clock" size={15} />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.2px' }}>7-Day Work Rhythm</h3>
                  <span className="sub" style={{ fontSize: 11 }}>Focused shift hours logged per day</span>
                </div>
              </div>
              <div className="rhythm-summary-chips">
                <span className="rhythm-chip primary">
                  <Icon name="zap" size={11} />
                  <strong>{totalWeekHours.toFixed(1)}h</strong>
                  <small>total</small>
                </span>
                <span className="rhythm-chip">
                  <Icon name="calendar" size={11} />
                  <strong>{activeWeekDays}</strong>
                  <small>of 7 days active</small>
                </span>
                {activeWeekDays > 0 && (
                  <span className="rhythm-chip highlight">
                    <Icon name="pulse" size={11} />
                    <strong>{avgDailyHours.toFixed(1)}h</strong>
                    <small>avg / active day</small>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Canvas with Baseline & Benchmark Pacing */}
            <div className="rhythm-chart-wrapper">
              {/* Benchmark Reference Line (8h standard workday) */}
              <div
                className="rhythm-benchmark-line"
                style={{ bottom: `calc(38px + ${(8 / maxDayHours) * 115}px)` }}
                title="8h Standard Workday Target"
              >
                <span className="benchmark-label">8h Target Pace</span>
                <span className="benchmark-dash" />
              </div>

              <div className="analytics-bar-chart">
                {daySeries.map(ds => {
                  const heightPct = Math.min(100, Math.round((ds.hours / maxDayHours) * 100));
                  const hasHours = ds.hours > 0;
                  return (
                    <div
                      key={ds.date}
                      className={`analytics-bar-col ${ds.isToday ? 'is-today' : ''} ${hasHours ? 'has-hours' : 'is-zero'}`}
                    >
                      {/* Top Metric Value */}
                      <div className="bar-val-wrap">
                        {hasHours ? (
                          <span className="bar-val-active">
                            {ds.hours.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="bar-val-muted">—</span>
                        )}
                      </div>

                      {/* Pill Capsule Track */}
                      <div className="bar-track-shell">
                        <div
                          className="bar-track"
                          title={`${ds.fullDay}: ${ds.hours.toFixed(2)}h (${ds.count} shift${ds.count === 1 ? '' : 's'})`}
                        >
                          <div
                            className={`bar-fill ${hasHours ? 'active' : ''}`}
                            style={{ height: `${hasHours ? Math.max(12, heightPct) : 0}%` }}
                          >
                            {hasHours && <span className="bar-fill-glow" />}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Fixed Date Label */}
                      <div className="bar-label-group">
                        <span className={`bar-weekday ${ds.isToday ? 'today-text' : ''}`}>{ds.shortDay}</span>
                        <span className="bar-date">{ds.shortDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Insight Strip */}
            <div className="rhythm-chart-foot">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {peakWeekDay && peakWeekDay.hours > 0 ? (
                  <span className="foot-insight">
                    <Icon name="flame" size={12} style={{ color: '#f59e0b' }} />
                    Peak output: <b>{peakWeekDay.shortDay}, {peakWeekDay.shortDate} ({peakWeekDay.hours.toFixed(1)}h)</b>
                  </span>
                ) : (
                  <span className="foot-insight muted">
                    <Icon name="clock" size={12} />
                    No shifts logged this week yet
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="foot-legend"><i className="legend-dot active" /> Work Hours</span>
                <span className="foot-legend"><i className="legend-dot target" /> 8h Target</span>
                <span className="foot-legend"><i className="legend-dot today" /> Today</span>
              </div>
            </div>
          </section>

          {/* Assigned Tasks Portfolio with Assignment & Completion Dates */}
          <section className="card" style={{ marginBottom: 18, padding: 18 }}>
            <div className="card-head" style={{ marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Assigned Tasks Portfolio ({uTasks.length})</h3>
                <span className="sub">Tasks assigned to {u.name} with verified dates</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag green">{uDone.length} Done</span>
                <span className="tag">{uOpen.length} Active</span>
                {uBlocked.length > 0 && <span className="tag red">{uBlocked.length} Blocked</span>}
                {uOverdue.length > 0 && <span className="tag yellow">{uOverdue.length} Overdue</span>}
              </div>
            </div>
            <div className="analytics-tasks-list">
              {uTasks.map(t => {
                const isOverdue = t.due && t.due < todayStr && t.status !== 'Done';
                const proj = state.projects.find(p => p.id === t.project);
                return (
                  <div key={t.id} className="analytics-task-row">
                    <div className="grow">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong>{t.title}</strong>
                        {proj && <span className="sub">◈ {proj.title}</span>}
                        {t.blocked && <span className="tag red" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="flag" size={11} />Blocked</span>}
                      </div>
                      <div className="analytics-task-dates">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={11} /><b>Assigned:</b> {fmtDate(t.assigned_at || t.created)}</span>
                        {t.due && (
                          <span style={isOverdue ? { color: '#b53833', fontWeight: 600 } : undefined}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} /><b>Due:</b></span> {fmtDate(t.due)}{isOverdue ? ' (Overdue)' : ''}
                          </span>
                        )}
                        {t.status === 'Done' ? (
                          <span style={{ color: 'var(--accent, #145c40)', fontWeight: 600 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="check" size={11} /><b>Completed:</b> {fmtDate(t.completed_at || t.created)}</span>
                          </span>
                        ) : (
                          <span className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="loader" size={11} />In progress</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="sub">{t.priority || 'Medium'}</span>
                      <span className={`tag ${t.status === 'Done' ? 'green' : t.status === 'In progress' ? 'purple' : ''}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {uTasks.length === 0 && (
                <div className="empty">No tasks currently assigned to this member.</div>
              )}
            </div>
          </section>

          {/* Shift Work Notes & Timesheet Log */}
          <section className="card" style={{ marginBottom: 18, padding: 18 }}>
            <div className="card-head" style={{ marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>Shift Work Notes &amp; Timesheet Log</h3>
                <span className="sub">Recent shift accomplishment summaries written by {u.name}</span>
              </div>
              <span className="tag">{recentShiftsWithNotes.length} Logged</span>
            </div>
            <div className="analytics-notes-list">
              {recentShiftsWithNotes.map((c, idx) => {
                const shiftWork = worked(c, currentTime);
                const shiftBreak = breakDuration(c, currentTime);
                const p = state.projects.find(prj => prj.id === c.project);
                const t = state.tasks.find(tsk => tsk.id === c.task);
                const shiftDate = new Date(c.start * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={c.id || idx} className="analytics-shift-note-card">
                    <div className="shift-note-head">
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong>{shiftDate}</strong>
                        {p && <span className="tag purple">◈ {p.title}</span>}
                        {t && <span className="sub">Task: {t.title}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} /><b>{(shiftWork / 3600).toFixed(1)}h</b> work</span>
                        {shiftBreak > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="coffee" size={11} /><b>{duration(shiftBreak)}</b> break</span>}
                      </div>
                    </div>
                    <div className="shift-note-body">
                      {c.note ? (
                        <blockquote>“{c.note}”</blockquote>
                      ) : (
                        <span className="muted">No shift note provided.</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {recentShiftsWithNotes.length === 0 && (
                <div className="empty">No shift logs recorded for this member yet.</div>
              )}
            </div>
          </section>

          {/* Activity & Contribution Trail */}
          {memberActivities.length > 0 && (
            <section className="card" style={{ padding: 18 }}>
              <div className="card-head" style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Recent Activity &amp; Contributions</h3>
                <span className="tag">{memberActivities.length} Events</span>
              </div>
              <div className="analytics-activity-list">
                {memberActivities.map(a => (
                  <div key={a.id} className="list-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <div className="grow">
                      <strong>{a.summary || a.title}</strong>
                      {a.detail && <div className="sub" style={{ marginTop: 2 }}>{a.detail}</div>}
                    </div>
                    <span className="sub" style={{ fontSize: 11 }}>
                      {a.createdAt ? fmtDate(a.createdAt) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="actions" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
            <button className="primary" onClick={() => setModal(null)}>Close Analytics</button>
          </div>
        </div>
      );
    }

    // View Profile
    if (type === 'person') {
      const liveUser = state.users.find(item => item.id === data.id) || data;
      const u = { ...liveUser, ...data };
      const uPositions = getUserPositions(u);
      const canSeeDetailedStats = isAdmin || u.id === user.id;
      const uTasks = canSeeDetailedStats
        ? state.tasks.filter(t => isUserAssignedToTask(t, u.id))
        : [];
      const uOpen = uTasks.filter(t => t.status !== 'Done');
      const uOverdue = uOpen.filter(t => t.due && t.due < key(new Date())).length;
      const uOnTime = uTasks.length ? Math.max(0, Math.round(((uTasks.length - uOverdue) / uTasks.length) * 100)) : 100;
      const uClocks = canSeeDetailedStats ? state.clocks.filter(c => c.user_id === u.id) : [];
      const liveClock = state.clocks.find(c => c.user_id === u.id && !c.end);
      const totalWorkSec = uClocks.reduce((n, c) => n + worked(c, currentTime), 0);
      const totalBreakSec = uClocks.reduce((n, c) => n + breakDuration(c, currentTime), 0);

      return (
        <div className="modal" role="dialog">
          <div className="card-head">
            <h2>{u.name}</h2>
            <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal"><Icon name="x" size={15} /></button>
          </div>
          <div style={{ textAlign: 'center', margin: '18px 0' }}>
            <Avatar user={u} big />
            <h3 style={{ marginTop: 10 }}>
              {uPositions.join(' · ')}{u.department ? ` · ${u.department}` : ''}
            </h3>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', margin: '8px 0' }}>
              {uPositions.map(pos => (
                <span key={pos} className="tag purple">{pos}</span>
              ))}
              {isAdmin && (
                isTargetSuperAdmin(u) ? (
                  <span className="tag super-admin-tag"><Icon name="zap" size={11} style={{ marginRight: 3 }} />Super Admin</span>
                ) : isTargetAdmin(u) ? (
                  <span className="tag">Admin</span>
                ) : (
                  <span className="tag">Employee</span>
                )
              )}
              <span className={`tag ${liveClock ? (liveClock.break_start ? 'yellow' : 'green') : ''}`}>
                {liveClock ? (liveClock.break_start ? 'On break' : 'Clocked in') : 'Offline'}
              </span>
            </div>
            <a className="link" href={`mailto:${u.email}`}>{u.email}</a>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="small primary"
                onClick={() => setModal({ type: 'memberAnalytics', id: u.id, data: u })}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="analytics" size={13} />View Full Member Analytics <Icon name="arrow" size={11} /></span>
              </button>
            </div>
          </div>

          {isAdmin && (
            <div style={{ marginBottom: 18, padding: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <div>
                  <strong>Member Positions / Titles ({uPositions.length} assigned)</strong>
                  <div className="sub">Click to toggle multiple positions (e.g. Founder, CEO, Marketing Head, Analyst)</div>
                </div>
                <button
                  type="button"
                  className="small"
                  style={{ height: 24, padding: '0 9px', fontSize: 11 }}
                  onClick={() =>
                    promptCreatePosition(created => {
                      const next = uPositions.some(p => p.toLowerCase() === created.toLowerCase())
                        ? uPositions
                        : [...uPositions, created];
                      handleSaveMemberPositions(u, next);
                    })
                  }
                >
                  + Create new position
                </button>
              </div>
              <div className="member-pill-list">
                {[...new Set([...positions, ...uPositions])].map(pos => {
                  const selected = uPositions.some(p => p.toLowerCase() === pos.toLowerCase());
                  return (
                    <button
                      key={pos}
                      type="button"
                      className={`member-pill ${selected ? 'selected' : ''}`}
                      onClick={() => {
                        const next = selected
                          ? uPositions.filter(p => p.toLowerCase() !== pos.toLowerCase())
                          : [...uPositions, pos];
                        if (next.length === 0) {
                          showToast('At least one position is required');
                          return;
                        }
                        handleSaveMemberPositions(u, next);
                      }}
                    >
                      <span>{selected ? <Icon name="check" size={11} style={{ marginRight: 3 }} /> : <Icon name="plus" size={11} style={{ marginRight: 3 }} />}{pos}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {canSeeDetailedStats && (
            <>
              <div className="person-stats" style={{ marginBottom: 18 }}>
                <div>
                  <b>{uOpen.length}</b>
                  <span className="sub">Open tasks</span>
                </div>
                <div>
                  <b>{uOnTime}%</b>
                  <span className="sub">On-time rate</span>
                </div>
                <div>
                  <b>{(totalWorkSec / 3600).toFixed(1)}h</b>
                  <span className="sub">Total work</span>
                </div>
                <div>
                  <b>{duration(totalBreakSec)}</b>
                  <span className="sub">Total break</span>
                </div>
              </div>
              <h3>Assigned tasks</h3>
              {uTasks.map(t => (
                <div key={t.id} className="list-row">
                  <div className="grow">
                    <strong>{t.title}</strong>
                    <span className="sub">{fmtDate(t.due)}</span>
                  </div>
                  {t.blocked && <span className="tag red">Blocked</span>}
                  <span className="tag">{t.status}</span>
                </div>
              ))}
              {uTasks.length === 0 && <div className="empty">No tasks assigned</div>}
            </>
          )}
          {isAdmin && (
            <>
              <h3 style={{ marginTop: 25 }}>Manage access &amp; positions</h3>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const changes = Object.fromEntries(new FormData(e.target));
                  if (!changes.password) delete changes.password;
                  const parsedPositions = String(changes.position || '')
                    .split(/[,·]+/)
                    .map(s => s.trim())
                    .filter(Boolean);
                  const finalPositions = parsedPositions.length ? parsedPositions : uPositions;
                  changes.positions = finalPositions;
                  changes.position = finalPositions.join(', ');
                  try {
                    await handleApi('/api/users', { action: 'update', id: u.id, ...changes });
                    if (u.id === user.id) {
                      setUser(prev =>
                        prev
                          ? {
                              ...prev,
                              name: changes.name || prev.name,
                              email: changes.email || prev.email,
                              department: changes.department || prev.department,
                              position: changes.position || prev.position,
                              positions: finalPositions
                            }
                          : prev
                      );
                    }
                    setModal(null);
                    await refreshState();
                    showToast(changes.password ? 'Saved. Their existing sessions were signed out.' : 'Member profile & positions updated');
                  } catch (err) {
                    alert(err.message);
                  }
                }}
              >
                <div className="form-row">
                  <div className="field">
                    <label>Full name</label>
                    <input name="name" type="text" required defaultValue={u.name} />
                  </div>
                  <div className="field">
                    <label>Work email (used to sign in)</label>
                    <input name="email" type="email" required defaultValue={u.email} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Department</span>
                      <button
                        type="button"
                        className="small"
                        style={{ height: 22, padding: '0 8px', fontSize: 11 }}
                        onClick={() =>
                          promptCreateDepartment(created =>
                            setModal(prev => (prev ? { ...prev, data: { ...(prev.data || {}), department: created } } : prev))
                          )
                        }
                      >
                        + New
                      </button>
                    </label>
                    <select
                      key={`${departments.join('|')}__${u.department || ''}`}
                      name="department"
                      defaultValue={u.department || departments[0] || 'Engineering'}
                    >
                      {[...new Set([u.department, ...departments].filter(Boolean))].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Positions (comma-separated)</span>
                      <button
                        type="button"
                        className="small"
                        style={{ height: 22, padding: '0 8px', fontSize: 11 }}
                        onClick={() =>
                          promptCreatePosition(created => {
                            const next = uPositions.some(p => p.toLowerCase() === created.toLowerCase())
                              ? uPositions
                              : [...uPositions, created];
                            handleSaveMemberPositions(u, next);
                          })
                        }
                      >
                        + New
                      </button>
                    </label>
                    <input
                      key={uPositions.join(', ')}
                      name="position"
                      type="text"
                      defaultValue={uPositions.join(', ')}
                      placeholder="e.g. Founder, CEO, Marketing Head"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Role</label>
                  {isSuperAdmin ? (
                    <select name="role" defaultValue={isTargetSuperAdmin(u) ? 'admin' : (u.role || 'member')}>
                      <option value="member">Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                  ) : (
                    <>
                      <input type="hidden" name="role" value={u.role || 'member'} />
                      <input
                        type="text"
                        disabled
                        value={isTargetSuperAdmin(u) ? 'Super Administrator (Protected)' : isTargetAdmin(u) ? 'Administrator (Protected)' : 'Member'}
                        style={{ opacity: 0.85 }}
                      />
                      <span className="sub" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="lock" size={12} />Only the Super Administrator can change user roles.</span>
                      </span>
                    </>
                  )}
                </div>
                <div className="field">
                  <label>Reset password (leave blank to keep)</label>
                  <input name="password" type="password" minLength="12" autoComplete="new-password" />
                </div>
                <div className="actions" style={{ marginTop: 15 }}>
                  <button className="primary">Save changes</button>
                  {u.id !== user.id && !isTargetSuperAdmin(u) && (isSuperAdmin || !isTargetAdmin(u)) && (
                    <button
                      type="button"
                      className="small"
                      onClick={async () => {
                        if (!confirm(`Remove ${u.name}? They will be signed out and can no longer log in. Their time history is kept.`)) return;
                        try {
                          await handleApi('/api/users', { action: 'remove', id: u.id });
                          setModal(null);
                          await refreshState();
                          showToast(`${u.name} was removed`);
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                    >
                      Remove member
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      );
    }

    // Clock In Dialog (Enforced Daily Check-in & Kickoff)
    if (type === 'clock') {
      const todayStr = key(new Date());
      const myTodayStandup = (state.standups || []).find(s => s.owner === user?.id && isTodayStandup(s));
      const hasCheckedInToday = Boolean(myTodayStandup);
      const myUserStreaks = user ? calculateMemberStreaks(user.id, state.standups || [], state.clocks || [], todayStr, currentTime) : null;
      const myStreak = myUserStreaks?.checkinStreak || 0;

      // Case A: User has NOT checked in today -> Enforced Daily Check-in & Shift Kickoff
      if (!hasCheckedInToday) {
        return (
          <div className="modal" role="dialog" style={{ maxWidth: 520 }}>
            <div className="card-head">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="modal-title-icon checkin-kickoff-icon">
                    <Icon name="pulse" size={16} />
                  </span>
                  Daily Check-in &amp; Shift Kickoff
                </h2>
                <p className="sub" style={{ margin: '4px 0 0' }}>
                  Set today&apos;s focus to fuel your streak and start your shift timer.
                </p>
              </div>
              <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal">
                <Icon name="x" size={15} />
              </button>
            </div>

            <div className="checkin-kickoff-banner">
              <div className="kickoff-streak-chip">
                <Icon name="flame" size={13} />
                <span><b>{myStreak}</b> day streak</span>
              </div>
              <div className="kickoff-banner-text">
                Check in once a day before tracking work to share your focus and keep the entire team aligned.
              </div>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const title = (fd.get('title') || '').toString().trim();
                if (title.length < 3) {
                  showToast('Please specify your main focus for today (min 3 characters).');
                  return;
                }
                const project = (fd.get('project') || '').toString();
                const task = (fd.get('task') || '').toString();
                const mood = (fd.get('mood') || 'Focused').toString();
                const yesterday = (fd.get('yesterday') || '').toString().trim();
                const blockers = (fd.get('blockers') || '').toString().trim();

                try {
                  // 1. Post daily check-in standup record
                  await handleApi('/api/record', {
                    kind: 'standups',
                    body: {
                      title,
                      project,
                      mood,
                      yesterday,
                      blockers,
                      date: todayStr
                    }
                  });

                  // 2. Start shift clock timer
                  await handleApi('/api/clock', {
                    action: 'start',
                    project,
                    task,
                    note: title
                  });

                  setModal(null);
                  await refreshState();
                  showToast('Daily check-in posted & shift timer started. Have a productive day!');
                } catch (err) {
                  showToast(err.message || 'Failed to complete check-in and clock in.');
                }
              }}
            >
              <div className="field">
                <label>
                  Today&apos;s main focus &amp; deliverable <span className="req">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  minLength={3}
                  placeholder="What is your top priority or deliverable for today?"
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Primary project {!isAdmin && <span className="sub">(Assigned only)</span>}</label>
                  <select name="project" defaultValue={data.project || assignedProjects[0]?.id || ''} required={assignedProjects.length > 0}>
                    {assignedProjects.length === 0 && (
                      <option value="">No assigned projects yet</option>
                    )}
                    {assignedProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Current energy / mood</label>
                  <select name="mood" defaultValue="Focused">
                    {['Focused', 'Energized', 'Heads-down', 'Need a hand'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Specific task <span className="sub">(Optional)</span></label>
                <select name="task" defaultValue={data.task || ''}>
                  <option value="">No specific task</option>
                  {state.tasks.filter(t => t.status !== 'Done' && (!t.project || !data.project || t.project === data.project)).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Completed recently / Key wins <span className="sub">(Optional)</span></label>
                <textarea
                  name="yesterday"
                  rows={2}
                  placeholder="What did you ship or accomplish since your last check-in?"
                />
              </div>

              <div className="field">
                <label>Blockers or help needed <span className="sub">(Optional)</span></label>
                <textarea
                  name="blockers"
                  rows={2}
                  placeholder="Anything blocking you or waiting on review? Leave blank if none."
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>
                  <Icon name="play" /> Check in &amp; Clock in
                </button>
              </div>
              <p className="sub" style={{ textAlign: 'center', fontSize: 11, margin: '8px 0 0' }}>
                Submitting posts your daily standup and starts your live workspace work timer.
              </p>
            </form>
          </div>
        );
      }

      // Case B: User has ALREADY checked in today -> Standard Clock In with confirmation badge
      return (
        <div className="modal" role="dialog" style={{ maxWidth: 480 }}>
          <div className="card-head">
            <div>
              <h2>Start work session</h2>
              <p className="sub" style={{ margin: '4px 0 0' }}>A little focus starts here.</p>
            </div>
            <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal">
              <Icon name="x" size={15} />
            </button>
          </div>

          <div className="note" style={{ marginBottom: 14, background: 'rgba(34, 197, 94, 0.08)', borderColor: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Icon name="check" size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span><b>Checked in today:</b> &ldquo;{myTodayStandup.title}&rdquo; ({myTodayStandup.mood || 'Focused'})</span>
            </span>
            <button
              type="button"
              className="small"
              style={{ flexShrink: 0, height: 26, padding: '0 8px', fontSize: 11 }}
              onClick={() => setModal({ type: 'standups', id: myTodayStandup.id, data: myTodayStandup })}
            >
              Edit check-in
            </button>
          </div>

          <form
            onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.target);
              try {
                await handleApi('/api/clock', { action: 'start', ...Object.fromEntries(fd) });
                setModal(null);
                await refreshState();
                showToast('Clocked in. Have a good session.');
              } catch (err) {
                showToast(err.message || 'Failed to clock in');
              }
            }}
          >
            <div className="field">
              <label>Project {!isAdmin && <span className="sub">(Assigned projects only)</span>}</label>
              <select name="project" defaultValue={data.project || myTodayStandup?.project || assignedProjects[0]?.id || ''} required={assignedProjects.length > 0}>
                {assignedProjects.length === 0 && (
                  <option value="">No assigned projects yet</option>
                )}
                {assignedProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Task</label>
              <select name="task" defaultValue={data.task || ''}>
                <option value="">No specific task</option>
                {state.tasks.filter(t => t.status !== 'Done').map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Session focus / note <span className="sub">(Optional)</span></label>
              <textarea name="note" placeholder="What are you focusing on during this session?" defaultValue={data.note || ''} />
            </div>
            <button className="primary" style={{ marginTop: 15, width: '100%' }}>
              <Icon name="play" /> Clock in
            </button>
          </form>
        </div>
      );
    }

    // Mandatory Clock Out Work Summary Dialog
    if (type === 'clockOut') {
      const linkedTask = (data.task || activeClock?.task)
        ? state.tasks.find(t => t.id === (data.task || activeClock?.task))
        : null;
      return (
        <div className="modal" role="dialog">
          <div className="card-head">
            <div>
              <span className="eyebrow" style={{ margin: 0 }}>Shift Wrap-Up Required</span>
              <h2 style={{ marginTop: 4 }}>Log your work summary to clock out</h2>
            </div>
            <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal"><Icon name="x" size={15} /></button>
          </div>
          <div className="note" style={{ marginBottom: 16 }}>
            <strong>Mandatory work note:</strong> Please summarize what you accomplished during this shift so the workspace administrator can track project progress and daily deliverables accurately.
          </div>
          {activeClock && (
            <div className="timer-metrics" style={{ marginBottom: 16 }}>
              <div className="timer-metric active">
                <span>Focused work time</span>
                <b>{duration(activeClockSeconds)}</b>
              </div>
              <div className="timer-metric break">
                <span>Break time</span>
                <b>{duration(activeBreakSeconds)}</b>
              </div>
            </div>
          )}
          <form
            onSubmit={async e => {
              e.preventDefault();
              const fd = Object.fromEntries(new FormData(e.target));
              const noteText = String(fd.note || '').trim();
              if (noteText.length < 3) {
                showToast('Please enter a work summary note (at least 3 characters) before clocking out.');
                return;
              }
              try {
                if (linkedTask && fd.taskStatus && fd.taskStatus !== linkedTask.status) {
                  await handleApi('/api/record', {
                    kind: 'tasks',
                    id: linkedTask.id,
                    body: { ...linkedTask, status: fd.taskStatus }
                  });
                }
                setModal(null);
                await handleClock('stop', {
                  project: fd.project ?? activeClock?.project ?? '',
                  task: fd.task ?? activeClock?.task ?? '',
                  note: noteText
                });
              } catch (err) {
                showToast(err.message);
              }
            }}
          >
            <div className="form-row">
              <div className="field">
                <label>Project worked on</label>
                <select name="project" defaultValue={data.project ?? activeClock?.project ?? assignedProjects[0]?.id ?? ''}>
                  {assignedProjects.length === 0 && (
                    <option value="">No assigned projects</option>
                  )}
                  {assignedProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Task worked on</label>
                <select
                  name="task"
                  defaultValue={data.task ?? activeClock?.task ?? ''}
                  onChange={e => setModal(prev => (prev ? { ...prev, data: { ...prev.data, task: e.target.value } } : prev))}
                >
                  <option value="">No specific task</option>
                  {state.tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                  ))}
                </select>
              </div>
            </div>
            {linkedTask && (
              <div className="field">
                <label>Update linked task status ({linkedTask.title})</label>
                <select name="taskStatus" defaultValue={linkedTask.status || 'In progress'}>
                  {['To do', 'In progress', 'In review', 'Done'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {activeClock?.note && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', borderLeft: '3px solid var(--accent, #145c40)', fontSize: 12.5 }}>
                <span className="sub" style={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10.5, marginBottom: 2 }}>Clock-in shift focus</span>
                <span style={{ color: 'var(--ink)' }}>“{activeClock.note}”</span>
              </div>
            )}
            <div className="field">
              <label>Work summary / accomplishments (Required before clock-out) *</label>
              <textarea
                name="note"
                required
                minLength={3}
                rows={4}
                autoFocus
                defaultValue=""
                placeholder="Summarize what you completed, key deliverables, PRs/designs updated, or next steps…"
              />
            </div>
            <div className="actions" style={{ marginTop: 18, justifyContent: 'flex-end', display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setModal(null)}>Continue working</button>
              <button className="primary" type="submit">
                <Icon name="check" size={15} /> Submit summary &amp; clock out
              </button>
            </div>
          </form>
        </div>
      );
    }

    // Real-Time Employee Notifications & Activity Center Modal
    if (type === 'notifications') {
      const feed = (state.activities || []).filter(a => {
        if (!isNotificationVisibleToUser(a, user)) return false;
        if (isAdmin && activityEmployee !== 'all' && a.actorId !== activityEmployee) return false;
        if (activityFilter === 'tasks') return String(a.type || '').startsWith('task_') || a.category === 'tasks';
        if (activityFilter === 'goals') return String(a.type || '').startsWith('goal_') || a.category === 'goals';
        if (activityFilter === 'clock') return String(a.type || '').startsWith('clock_') || a.category === 'clocks';
        if (activityFilter === 'announcements') return String(a.type || '').startsWith('announcement_') || a.category === 'announcements';
        if (activityFilter === 'standups') return a.type === 'standup_posted' || a.category === 'standups';
        if (activityFilter === 'leads') return a.type === 'lead_updated' || a.category === 'leads';
        return true;
      });
      return (
        <div className="modal" role="dialog" style={{ maxWidth: 680 }}>
          <div className="card-head">
            <div>
              <span className="eyebrow" style={{ margin: 0 }}>
                {isAdmin ? 'Live Admin Notification & Audit Center' : 'My Notifications (Assigned by Admin & Personal)'}
              </span>
              <h2 style={{ marginTop: 4 }}>
                {isAdmin ? 'Employee Task, Goal, Clock-Out & Announcement Activity' : 'Your Assigned & Personal Notifications'}
              </h2>
            </div>
            <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal"><Icon name="x" size={15} /></button>
          </div>
          <div className="actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <div className="period-switch">
              {[
                ['all', 'All'],
                ['tasks', 'Task Changes'],
                ['goals', 'Goals & Sync'],
                ['clock', 'Clock-Outs & Shifts'],
                ['announcements', 'Announcements'],
                ['standups', 'Standups'],
                ['leads', 'Leads']
              ].map(([k, lbl]) => (
                <button
                  key={k}
                  type="button"
                  className={activityFilter === k ? 'active' : ''}
                  onClick={() => setActivityFilter(k)}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {isAdmin && (
              <select
                aria-label="Filter notifications by employee"
                value={activityEmployee}
                onChange={e => setActivityEmployee(e.target.value)}
                style={{ width: 'auto', minWidth: 165 }}
              >
                <option value="all">All employees</option>
                {state.users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
            {feed.slice(0, 50).map(act => {
              const actor = state.users.find(u => u.id === act.actorId) || { name: act.actorName || 'Team member' };
              const isClockOut = act.type === 'clock_out';
              const isBlocker = act.type === 'task_blocker';
              const isAnnDone = act.type === 'announcement_completed';
              return (
                <div key={act.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <Avatar user={actor} />
                  <div className="grow">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <strong>{act.summary}</strong>
                      <span className="sub" style={{ fontSize: 11 }}>
                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    {act.detail && (
                      <div
                        style={{
                          marginTop: 5,
                          padding: isClockOut || isAnnDone ? '7px 10px' : 0,
                          borderRadius: 8,
                          background: isClockOut || isAnnDone ? 'var(--bg)' : 'transparent',
                          border: isClockOut || isAnnDone ? '1px solid var(--line)' : 'none',
                          fontSize: 12.5,
                          color: 'var(--ink)'
                        }}
                      >
                        {act.detail}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <span className={`tag ${isBlocker ? 'red' : isClockOut || isAnnDone || act.type === 'task_status' ? 'green' : ''}`}>
                        {String(act.type || 'update').replace(/_/g, ' ')}
                      </span>
                      <span className="sub" style={{ fontSize: 11 }}>by {actor.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {feed.length === 0 && (
              <div className="empty">
                <strong>All caught up</strong>No matching activity events in this filter.
              </div>
            )}
          </div>
          <div className="actions" style={{ marginTop: 16, justifyContent: 'space-between' }}>
            <button
              type="button"
              className="small"
              onClick={() => {
                setModal(null);
                navigate('announcements');
              }}
            >
              View company announcements
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setModal(null);
                  navigate('analytics');
                }}
              >
                Open full performance &amp; audit analytics
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Admin: correct a time entry
    if (type === 'timeEntry') {
      const owner = state.users.find(u => u.id === data.user_id);
      return (
        <div className="modal" role="dialog">
          <div className="card-head">
            <h2>Edit time entry</h2>
            <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal"><Icon name="x" size={15} /></button>
          </div>
          <p className="sub" style={{ marginBottom: 15 }}>
            {owner?.name || 'Former member'}{!data.end ? ' · still running — saving will clock them out' : ''}
          </p>
          <form
            onSubmit={async e => {
              e.preventDefault();
              const fd = Object.fromEntries(new FormData(e.target));
              try {
                await handleApi('/api/timesheet', {
                  action: 'update',
                  id,
                  start: new Date(fd.start).getTime() / 1000,
                  end: new Date(fd.end).getTime() / 1000,
                  break_seconds: Number(fd.breakMinutes || 0) * 60,
                  project: fd.project,
                  task: fd.task || '',
                  note: fd.note
                });
                setModal(null);
                await refreshState();
                showToast('Time entry updated');
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            <div className="form-row">
              <div className="field">
                <label>Clock in (local time)</label>
                <input name="start" type="datetime-local" required defaultValue={toLocalInput(data.start)} />
              </div>
              <div className="field">
                <label>Clock out (local time)</label>
                <input name="end" type="datetime-local" required defaultValue={toLocalInput(data.end || Date.now() / 1000)} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Break (minutes)</label>
                <input name="breakMinutes" type="number" min="0" defaultValue={Math.round(breakDuration(data, currentTime) / 60)} />
              </div>
              <div className="field">
                <label>Project</label>
                <select name="project" defaultValue={data.project || state.projects[0]?.id || ''}>
                  {state.projects.length === 0 && <option value="">No projects</option>}
                  {state.projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Linked task (optional)</label>
              <select name="task" defaultValue={data.task || ''}>
                <option value="">No specific task</option>
                {state.tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Work summary note</label>
              <textarea name="note" rows={3} defaultValue={data.note || ''} />
            </div>
            <div className="actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (!confirm('Delete this time entry? This cannot be undone.')) return;
                  try {
                    await handleApi('/api/timesheet', { action: 'delete', id });
                    setModal(null);
                    await refreshState();
                    showToast('Time entry deleted');
                  } catch (err) {
                    alert(err.message);
                  }
                }}
              >
                Delete
              </button>
              <button className="primary">Save entry</button>
            </div>
          </form>
        </div>
      );
    }

    // Add Member Dialog
    if (type === 'users') {
      const selectedNewPositions = Array.isArray(data.positions) && data.positions.length
        ? data.positions
        : [positions.find(p => p !== 'CEO' && p !== 'Founder') || positions[0] || 'Software Engineer'];
      return (
        <div className="modal" role="dialog">
          <div className="card-head">
            <h2>Add team member</h2>
            <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal"><Icon name="x" size={15} /></button>
          </div>
          <form
            onSubmit={async e => {
              e.preventDefault();
              const fd = Object.fromEntries(new FormData(e.target));
              const parsedPositions = String(fd.position || '')
                .split(/[,·]+/)
                .map(s => s.trim())
                .filter(Boolean);
              const finalPositions = parsedPositions.length ? parsedPositions : selectedNewPositions;
              try {
                await handleApi('/api/users', {
                  ...fd,
                  positions: finalPositions,
                  position: finalPositions.join(', ')
                });
                setModal(null);
                await refreshState();
                showToast('Team member added successfully');
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            <div className="field">
              <label>Full name</label>
              <input name="name" type="text" required />
            </div>
            <div className="field">
              <label>Work email</label>
              <input name="email" type="email" required />
            </div>
            <div className="field">
              <label>Initial password (12+ characters)</label>
              <input name="password" type="password" required minLength="12" />
            </div>
            <div className="form-row">
              <div className="field">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Department</span>
                  <button
                    type="button"
                    className="small"
                    style={{ height: 22, padding: '0 8px', fontSize: 11 }}
                    onClick={() =>
                      promptCreateDepartment(created =>
                        setModal(prev => (prev ? { ...prev, data: { ...(prev.data || {}), department: created } } : prev))
                      )
                    }
                  >
                    + New
                  </button>
                </label>
                <select
                  key={`${departments.join('|')}__${data.department || ''}`}
                  name="department"
                  defaultValue={data.department || departments[0] || 'Engineering'}
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Role</label>
                {isSuperAdmin ? (
                  <select name="role">
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  <>
                    <input type="hidden" name="role" value="member" />
                    <input type="text" disabled value="Member (Employee)" style={{ opacity: 0.85 }} />
                    <span className="sub" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="lock" size={12} />Only the Super Administrator can create Administrator accounts.</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="field">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Positions / Titles ({selectedNewPositions.length} selected — multiple allowed)</span>
                <button
                  type="button"
                  className="small"
                  style={{ height: 22, padding: '0 8px', fontSize: 11 }}
                  onClick={() =>
                    promptCreatePosition(created =>
                      setModal(prev =>
                        prev
                          ? {
                              ...prev,
                              data: {
                                ...(prev.data || {}),
                                positions: [...new Set([...selectedNewPositions, created])]
                              }
                            }
                          : prev
                      )
                    )
                  }
                >
                  + New position
                </button>
              </label>
              <div className="member-pill-list" style={{ marginBottom: 8 }}>
                {positions.map(pos => {
                  const isSel = selectedNewPositions.some(p => p.toLowerCase() === pos.toLowerCase());
                  return (
                    <button
                      key={pos}
                      type="button"
                      className={`member-pill ${isSel ? 'selected' : ''}`}
                      onClick={() => {
                        const next = isSel
                          ? selectedNewPositions.filter(p => p.toLowerCase() !== pos.toLowerCase())
                          : [...selectedNewPositions, pos];
                        setModal(prev =>
                          prev
                            ? {
                                ...prev,
                                data: {
                                  ...(prev.data || {}),
                                  positions: next.length ? next : [pos]
                                }
                              }
                            : prev
                        );
                      }}
                    >
                      <span>{isSel ? <Icon name="check" size={11} style={{ marginRight: 3 }} /> : <Icon name="plus" size={11} style={{ marginRight: 3 }} />}{pos}</span>
                    </button>
                  );
                })}
              </div>
              <input
                key={selectedNewPositions.join(', ')}
                name="position"
                type="text"
                defaultValue={selectedNewPositions.join(', ')}
                placeholder="e.g. Founder, CEO or Marketing Head, Analyst"
              />
            </div>
            <button className="primary" style={{ marginTop: 15 }}>Create account</button>
          </form>
        </div>
      );
    }

    // Generic CRUD for projects, tasks, leads, meetings, announcements, standups, goals
    const todayStr = key(new Date());
    const myTodayStandup = type === 'standups' ? (state.standups || []).find(s => s.owner === user?.id && isTodayStandup(s)) : null;
    const effectiveData = type === 'standups' && !id && myTodayStandup ? { ...myTodayStandup, ...data } : data;
    const effectiveId = type === 'standups' && !id && myTodayStandup ? myTodayStandup.id : id;

    const editable = canEdit(type, { ...effectiveData, id: effectiveId });
    const isAdminTaskForEmployee =
      type === 'tasks' && !isAdmin && Boolean(effectiveId && effectiveData.owner && effectiveData.owner !== user.id);
    const isAdminGoalForEmployee =
      type === 'goals' && !isAdmin && Boolean(effectiveId && effectiveData.owner && effectiveData.owner !== user.id);
    const singularLabel =
      type === 'standups'
        ? 'check-in'
        : type === 'goals'
        ? 'goal'
        : type.slice(0, -1);

    const updateModalData = patch =>
      setModal(prev => (prev ? { ...prev, data: { ...prev.data, ...patch } } : prev));

    return (
      <div className="modal" role="dialog">
        <div className="card-head">
          <h2>{effectiveId ? (editable ? 'Edit' : 'View') : 'New'} {singularLabel}</h2>
          <button className="icon-btn-ghost close-btn" onClick={() => setModal(null)} aria-label="Close modal"><Icon name="x" size={15} /></button>
        </div>
        <form
          onSubmit={async e => {
            e.preventDefault();
            if (!editable) return;
            const fd = new FormData(e.target);
            const body = Object.fromEntries(fd);
            if (type === 'meetings') {
              body.attendees = fd.getAll('attendees');
              body.sendToEveryone = fd.get('sendToEveryone') === 'on';
              body.autoRoom = fd.get('autoRoom') === 'on';
              body.start = new Date(body.start).toISOString();
              body.end = new Date(body.end).toISOString();
            }
            if (type === 'tasks') {
              body.startDate = (fd.get('startDate') || effectiveData.startDate || '').toString().trim();
              body.due = (fd.get('due') || effectiveData.due || '').toString().trim();
              body.blocked = fd.get('blocked') === 'on';
              body.notifyEmail = fd.get('notifyEmail') === 'on';
              body.notifyEveryone = fd.get('notifyEveryone') === 'on';
              body.estimateHours = Number(body.estimateHours ?? effectiveData.estimateHours ?? 0);
              body.subtasks = effectiveData.subtasks || [];
              body.comments = effectiveData.comments || [];
              body.assignees = Array.isArray(effectiveData.assignees)
                ? effectiveData.assignees
                : body.assignee
                ? [body.assignee]
                : [user.id];
              body.assigned_at = effectiveData.assigned_at || (body.assignees?.length || body.assignee ? new Date().toISOString() : null);
              if (body.status === 'Done') {
                body.completed_at = effectiveData.completed_at || new Date().toISOString();
              } else {
                body.completed_at = null;
              }
              if (isAdminTaskForEmployee) {
                // Ensure scope fields are locked to original values for assigned employees
                body.title = effectiveData.title;
                body.description = effectiveData.description || '';
                body.project = effectiveData.project;
                body.assignee = effectiveData.assignee;
                body.assignees = effectiveData.assignees;
                body.priority = effectiveData.priority;
                body.startDate = effectiveData.startDate;
                body.due = effectiveData.due;
                body.estimateHours = effectiveData.estimateHours;
                body.department = effectiveData.department;
              }
            }
            if (type === 'projects') {
              body.startDate = (fd.get('startDate') || effectiveData.startDate || '').toString().trim();
              body.due = (fd.get('due') || effectiveData.due || '').toString().trim();
              body.targetHours = Number(body.targetHours || 0);
              body.budget = Number(body.budget || 0);
              body.milestones = effectiveData.milestones || [];
              body.members = Array.isArray(effectiveData.members)
                ? effectiveData.members
                : body.lead
                ? [body.lead]
                : [];
            }
            if (type === 'leads') {
              body.value = Number(body.value || 0);
              body.probability = Number(body.probability || 0);
            }
            if (type === 'announcements') {
              body.notifyEmail = fd.get('notifyEmail') === 'on';
              body.notifyEveryone = fd.get('notifyEveryone') === 'on';
            }
            if (type === 'goals') {
              const rawCur = fd.get('currentValue') ?? body.currentValue ?? effectiveData.currentValue ?? 0;
              const parsedCur = Number(rawCur || 0);
              body.currentValue = Math.min(100, Math.max(0, Number.isNaN(parsedCur) ? 0 : parsedCur));
              body.targetValue = Math.max(1, Number(body.targetValue ?? effectiveData.targetValue ?? 100));
              body.period = body.period || effectiveData.period || 'weekly';
              body.status = body.status || effectiveData.status || 'On track';
              body.subtasks = effectiveData.subtasks || [];
              body.comments = effectiveData.comments || [];
              if (!isAdmin && !isAdminGoalForEmployee) {
                body.assignee = user.id;
                body.assignees = [user.id];
              } else {
                body.assignees = Array.isArray(effectiveData.assignees)
                  ? effectiveData.assignees
                  : body.assignee && body.assignee !== 'all'
                  ? [body.assignee]
                  : [];
              }
            }
            if (type === 'standups') {
              body.date = body.date || effectiveData.date || todayStr;
            }
            const targetId = effectiveId;
            const mergedRecord = {
              ...effectiveData,
              ...body,
              id: targetId || `temp_${Date.now()}`,
              owner: effectiveData.owner || user.id,
              created: effectiveData.created || new Date().toISOString()
            };
            const prevCollection = Array.isArray(state[type]) ? state[type] : [];
            // 0ms optimistic UI update & modal close
            if (Array.isArray(state[type])) {
              setState(prev => ({
                ...prev,
                [type]: targetId
                  ? prev[type].map(item => (item.id === targetId ? mergedRecord : item))
                  : [mergedRecord, ...prev[type]]
              }));
            }
            setModal(null);
            showToast(type === 'standups' && fd.get('autoClockIn') === 'on' && !activeClock
              ? 'Daily check-in posted & shift timer started. Have a great session!'
              : 'Saved. Workspace is up to date.'
            );
            try {
              const saved = await handleApi('/api/record', { kind: type, id: targetId, body: { ...effectiveData, ...body } });
              if (!targetId && saved?.id && Array.isArray(state[type])) {
                setState(prev => ({
                  ...prev,
                  [type]: prev[type].map(item => (item.id === mergedRecord.id ? { ...mergedRecord, id: saved.id } : item))
                }));
              }
              if (type === 'standups' && fd.get('autoClockIn') === 'on' && !activeClock) {
                try {
                  await handleApi('/api/clock', {
                    action: 'start',
                    project: body.project || '',
                    note: body.title || ''
                  });
                } catch (cErr) {
                  console.error('Auto clock-in error:', cErr);
                }
              }
              refreshState();
            } catch (err) {
              if (Array.isArray(state[type])) {
                setState(prev => ({ ...prev, [type]: prevCollection }));
              }
              showToast(err.message);
            }
          }}
        >
          {!editable && (
            <div className="note" style={{ marginBottom: 15 }}>
              {['projects', 'meetings', 'announcements'].includes(type)
                ? 'Only administrators can change this.'
                : `Only ${state.users.find(u => u.id === effectiveData.owner)?.name || 'its creator'}, an assigned collaborator, or an administrator can change this.`}
            </div>
          )}
          {isAdminTaskForEmployee && (
            <div className="note" style={{ marginBottom: 15 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="lock" size={13} /><b>RBAC Least-Privilege Scope:</b></span> This task was assigned by an administrator. Scope fields (Title, Project, Priority, Due date, Estimated hours) are locked to Admin control, while you can update <b>Status</b>, <b>Deliverable URL</b>, <b>Blocker flag</b>, <b>Subtasks</b>, and <b>Comments</b>.
            </div>
          )}
          {isAdminGoalForEmployee && (
            <div className="note" style={{ marginBottom: 15 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="target" size={13} /><b>Collaborative Goal Sync:</b></span> This goal was assigned by an administrator. Scope fields (Title, Cadence, Target Value, Due date) are locked to Admin control, while you can update <b>Current Progress</b>, <b>Status</b>, <b>Key Results Checklist</b>, and <b>Team Discussion Comments</b>.
            </div>
          )}
          <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="field">
            <label>
              {type === 'leads'
                ? 'Contact name'
                : type === 'standups'
                ? 'Today’s main focus'
                : type === 'goals'
                ? 'Objective / goal title'
                : 'Title'}
            </label>
            <input name="title" type="text" required defaultValue={effectiveData.title || ''} disabled={isAdminTaskForEmployee || isAdminGoalForEmployee} />
          </div>

          {type === 'projects' && (
            <>
              <div className="field">
                <label>Description</label>
                <textarea name="description" defaultValue={data.description || ''} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Client / stakeholder</label>
                  <input name="client" type="text" placeholder="Internal or client name" defaultValue={data.client || ''} />
                </div>
                <div className="field">
                  <label>Project lead</label>
                  <select name="lead" defaultValue={data.lead || user.id}>
                    <option value="">Unassigned</option>
                    {state.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>
                    Assigned project team members ({(data.members || (data.lead ? [data.lead] : [])).length} selected)
                  </label>
                  {editable && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="small"
                        onClick={() => updateModalData({ members: state.users.map(u => u.id) })}
                      >
                        Assign all
                      </button>
                      <button
                        type="button"
                        className="small"
                        onClick={() => updateModalData({ members: data.lead ? [data.lead] : [] })}
                      >
                        Lead only
                      </button>
                    </div>
                  )}
                </div>
                <div className="member-pill-list">
                  {state.users.map(u => {
                    const currentMembers = Array.isArray(data.members)
                      ? data.members
                      : data.lead
                      ? [data.lead]
                      : [];
                    const selected = currentMembers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`member-pill ${selected ? 'selected' : ''}`}
                        onClick={() => {
                          if (!editable) return;
                          const next = selected
                            ? currentMembers.filter(idVal => idVal !== u.id)
                            : [...new Set([...currentMembers, u.id])];
                          updateModalData({ members: next });
                        }}
                      >
                        <Avatar user={u} />
                        <span>{u.name}</span>
                        <small style={{ opacity: 0.7 }}>({u.department})</small>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Status</label>
                  <select name="status" defaultValue={data.status || 'Active'}>
                    {['Planning', 'Active', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Kickoff / Start date</label>
                  <input name="startDate" type="date" defaultValue={data.startDate || ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Target deadline (Due date)</label>
                  <input name="due" type="date" defaultValue={data.due || ''} />
                </div>
                <div className="field">
                  <label>Target hours (capacity)</label>
                  <input name="targetHours" type="number" min="0" step="1" defaultValue={data.targetHours || 0} />
                </div>
              </div>
              {isAdmin && (
                <div className="field">
                  <label>Budget ({currency})</label>
                  <input name="budget" type="number" min="0" step="100" defaultValue={data.budget || 0} />
                </div>
              )}
              <div className="field">
                <label>Milestones ({(data.milestones || []).filter(m => m.done).length}/{(data.milestones || []).length} completed)</label>
                <div className="checklist-editor">
                  {(data.milestones || []).map((m, idx) => (
                    <div key={m.id || idx} className="checklist-row">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(m.done)}
                          onChange={() => {
                            const next = (data.milestones || []).map((item, i) =>
                              i === idx ? { ...item, done: !item.done } : item
                            );
                            updateModalData({ milestones: next });
                          }}
                        />
                        <span style={{ textDecoration: m.done ? 'line-through' : 'none' }}>{m.title}</span>
                      </label>
                      {editable && (
                        <button
                          type="button"
                          className="small"
                          onClick={() => {
                            const next = (data.milestones || []).filter((_, i) => i !== idx);
                            updateModalData({ milestones: next });
                          }}
                        >
                          <Icon name="x" size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Add a project milestone…"
                        value={data._newMilestone || ''}
                        onChange={e => updateModalData({ _newMilestone: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const text = (data._newMilestone || '').trim();
                            if (!text) return;
                            updateModalData({
                              milestones: [...(data.milestones || []), { id: String(Date.now()), title: text, done: false }],
                              _newMilestone: ''
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="small"
                        onClick={() => {
                          const text = (data._newMilestone || '').trim();
                          if (!text) return;
                          updateModalData({
                            milestones: [...(data.milestones || []), { id: String(Date.now()), title: text, done: false }],
                            _newMilestone: ''
                          });
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {type === 'tasks' && (
            <>
              <div className="field">
                <label>Description</label>
                <textarea name="description" defaultValue={data.description || ''} disabled={isAdminTaskForEmployee} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Project {!isAdmin && <span className="sub">(Assigned projects only)</span>}</label>
                  <select
                    name="project"
                    defaultValue={data.project || assignedProjects[0]?.id || ''}
                    disabled={isAdminTaskForEmployee}
                    required={assignedProjects.length > 0}
                  >
                    {assignedProjects.length === 0 && (
                      <option value="">No assigned projects available</option>
                    )}
                    {assignedProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Primary assignee {!isAdmin && <span className="sub">(Personal scope)</span>}</label>
                  <select name="assignee" defaultValue={data.assignee || user.id} disabled={!isAdmin}>
                    {state.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              {isAdmin && (
                <div className="field">
                  <label>Assign additional team collaborators ({(data.assignees || (data.assignee ? [data.assignee] : [user.id])).length} assigned)</label>
                  <div className="member-pill-list">
                    {state.users.map(u => {
                      const currentAssignees = Array.isArray(data.assignees)
                        ? data.assignees
                        : data.assignee
                        ? [data.assignee]
                        : [user.id];
                      const selected = currentAssignees.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          className={`member-pill ${selected ? 'selected' : ''}`}
                          onClick={() => {
                            const next = selected
                              ? currentAssignees.filter(idVal => idVal !== u.id)
                              : [...new Set([...currentAssignees, u.id])];
                            updateModalData({ assignees: next.length ? next : [user.id] });
                          }}
                        >
                          <Avatar user={u} />
                          <span>{u.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="tag" title="Kickoff / Start date">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="play" size={11} />Start: {fmtDate(data.startDate || data.assigned_at || data.created || new Date())}</span>
                </span>
                <span className="tag" title="Date task was assigned">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={11} />Assigned: {fmtDate(data.assigned_at || data.created || new Date())}</span>
                </span>
                {data.status === 'Done' ? (
                  <span className="tag green" title="Date task was completed">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="check" size={11} />Completed: {fmtDate(data.completed_at || new Date())}</span>
                  </span>
                ) : (
                  <span className="tag yellow" title="Task status">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="loader" size={11} />Status: {data.status || 'To do'}</span>
                  </span>
                )}
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Kickoff / Start date</label>
                  <input name="startDate" type="date" defaultValue={data.startDate || ''} disabled={isAdminTaskForEmployee} />
                </div>
                <div className="field">
                  <label>Task deadline (Due date)</label>
                  <input name="due" type="date" defaultValue={data.due || ''} disabled={isAdminTaskForEmployee} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Status</label>
                  <select name="status" defaultValue={data.status || 'To do'}>
                    {['To do', 'In progress', 'In review', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Priority</label>
                  <select name="priority" defaultValue={data.priority || 'Medium'} disabled={isAdminTaskForEmployee}>
                    {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Department</span>
                    {isAdmin && (
                      <button
                        type="button"
                        className="small"
                        style={{ height: 22, padding: '0 8px', fontSize: 11 }}
                        onClick={() => promptCreateDepartment(created => updateModalData({ department: created }))}
                      >
                        + New
                      </button>
                    )}
                  </label>
                  <select
                    key={`${departments.join('|')}__${data.department || ''}`}
                    name="department"
                    defaultValue={data.department || departments[0] || 'Engineering'}
                    disabled={isAdminTaskForEmployee}
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Estimated hours</label>
                  <input name="estimateHours" type="number" min="0" step="0.5" defaultValue={data.estimateHours || 0} disabled={isAdminTaskForEmployee} />
                </div>
              </div>
              <div className="field">
                <label>Deliverable / PR / Figma URL</label>
                <input name="deliverableUrl" type="url" placeholder="https://…" defaultValue={data.deliverableUrl || ''} />
              </div>

              {/* Blocker Flag */}
              <div className="field blocker-field-box">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="blocked"
                    defaultChecked={Boolean(data.blocked)}
                  />
                  <strong>Flag this task as blocked</strong>
                </label>
                <input
                  name="blockerNote"
                  type="text"
                  placeholder="If blocked, what is needed to unblock it?"
                  defaultValue={data.blockerNote || ''}
                  style={{ marginTop: 8 }}
                />
              </div>

              {/* Subtasks Checklist */}
              <div className="field">
                <label>Subtasks / checklist ({(data.subtasks || []).filter(s => s.done).length}/{(data.subtasks || []).length})</label>
                <div className="checklist-editor">
                  {(data.subtasks || []).map((st, idx) => (
                    <div key={st.id || idx} className="checklist-row">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(st.done)}
                          onChange={() => {
                            const next = (data.subtasks || []).map((item, i) =>
                              i === idx ? { ...item, done: !item.done } : item
                            );
                            updateModalData({ subtasks: next });
                          }}
                        />
                        <span style={{ textDecoration: st.done ? 'line-through' : 'none' }}>{st.title}</span>
                      </label>
                      {editable && (
                        <button
                          type="button"
                          className="small"
                          onClick={() => {
                            const next = (data.subtasks || []).filter((_, i) => i !== idx);
                            updateModalData({ subtasks: next });
                          }}
                        >
                          <Icon name="x" size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Add a checklist step…"
                        value={data._newSubtask || ''}
                        onChange={e => updateModalData({ _newSubtask: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const text = (data._newSubtask || '').trim();
                            if (!text) return;
                            updateModalData({
                              subtasks: [...(data.subtasks || []), { id: String(Date.now()), title: text, done: false }],
                              _newSubtask: ''
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="small"
                        onClick={() => {
                          const text = (data._newSubtask || '').trim();
                          if (!text) return;
                          updateModalData({
                            subtasks: [...(data.subtasks || []), { id: String(Date.now()), title: text, done: false }],
                            _newSubtask: ''
                          });
                        }}
                      >
                        + Step
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments / Activity Thread */}
              <div className="field">
                <label>Activity & comments ({(data.comments || []).length})</label>
                <div className="comment-thread">
                  {(data.comments || []).map((cm, idx) => (
                    <div key={cm.id || idx} className="comment-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <strong>{cm.authorName || 'Team member'}</strong>
                        <span className="sub">{cm.created ? new Date(cm.created).toLocaleString() : ''}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 13 }}>{cm.text}</p>
                    </div>
                  ))}
                  {editable && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Write an update or note…"
                        value={data._newComment || ''}
                        onChange={e => updateModalData({ _newComment: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const text = (data._newComment || '').trim();
                            if (!text) return;
                            updateModalData({
                              comments: [
                                ...(data.comments || []),
                                { id: String(Date.now()), authorName: user.name, text, created: new Date().toISOString() }
                              ],
                              _newComment: ''
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="small"
                        onClick={() => {
                          const text = (data._newComment || '').trim();
                          if (!text) return;
                          updateModalData({
                            comments: [
                              ...(data.comments || []),
                              { id: String(Date.now()), authorName: user.name, text, created: new Date().toISOString() }
                            ],
                            _newComment: ''
                          });
                        }}
                      >
                        Post
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" name="notifyEmail" />
                    Email assignee via Gmail
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" name="notifyEveryone" />
                    <strong>Email Everyone on the team</strong>
                  </label>
                </div>
              )}
            </>
          )}

          {type === 'leads' && (
            <>
              <div className="form-row">
                <div className="field">
                  <label>Company</label>
                  <input name="company" type="text" defaultValue={data.company || ''} />
                </div>
                <div className="field">
                  <label>Lead owner {!isAdmin && <span className="sub">(Personal scope)</span>}</label>
                  <select name="assignee" defaultValue={data.assignee || user.id} disabled={!isAdmin}>
                    {state.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Email</label>
                  <input name="email" type="email" defaultValue={data.email || ''} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input name="phone" type="text" defaultValue={data.phone || ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Estimated value</label>
                  <input name="value" type="number" defaultValue={data.value || 0} />
                </div>
                <div className="field">
                  <label>Stage</label>
                  <select name="stage" defaultValue={data.stage || 'New'}>
                    {['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Follow-up date</label>
                  <input name="followup" type="date" defaultValue={data.followup || ''} />
                </div>
                <div className="field">
                  <label>Lead source & win %</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
                    <select name="source" defaultValue={data.source || 'Inbound'}>
                      {['Inbound', 'Referral', 'Outbound', 'Website', 'LinkedIn', 'Partner', 'CSV Import'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <input name="probability" type="number" min="0" max="100" placeholder="%" defaultValue={data.probability ?? 50} />
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <textarea name="description" defaultValue={data.description || ''} />
              </div>
            </>
          )}

          {type === 'meetings' && (
            <>
              <div className="form-row">
                <div className="field">
                  <label>Starts (local time)</label>
                  <input
                    name="start"
                    type="datetime-local"
                    required
                    defaultValue={toLocalInput(data.start) || `${key(selectedDay)}T10:00`}
                  />
                </div>
                <div className="field">
                  <label>Ends (local time)</label>
                  <input
                    name="end"
                    type="datetime-local"
                    required
                    defaultValue={toLocalInput(data.end) || `${key(selectedDay)}T10:30`}
                  />
                </div>
              </div>
              <div className="field">
                <div className="link-generator-head">
                  <label style={{ margin: 0 }}>Meeting link (Google Meet / video URL)</label>
                  <div className="link-generator-bar">
                    <button
                      type="button"
                      className="link-gen-btn primary-tone"
                      disabled={Boolean(data._generatingMeet)}
                      onClick={async e => {
                        const form = e.currentTarget.form;
                        const liveTitle = form?.elements?.title?.value?.trim() || data.title || 'Syneolab Meeting';
                        const liveStart = form?.elements?.start?.value
                          ? new Date(form.elements.start.value).toISOString()
                          : data.start;
                        const liveEnd = form?.elements?.end?.value
                          ? new Date(form.elements.end.value).toISOString()
                          : data.end;
                        const liveDesc = form?.elements?.description?.value || data.description || '';
                        if (!state.integrations?.calendar) {
                          window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
                          return;
                        }
                        try {
                          updateModalData({ _generatingMeet: true });
                          const res = await handleApi('/api/record', {
                            action: 'generateMeetLink',
                            body: { title: liveTitle, start: liveStart, end: liveEnd, description: liveDesc }
                          });
                          updateModalData({
                            _generatingMeet: false,
                            link: res.meetLink,
                            calendarEventUrl: res.eventUrl || '',
                            location: 'Google Meet'
                          });
                          showToast('Google Meet link generated & synced to Calendar');
                        } catch (err) {
                          updateModalData({ _generatingMeet: false });
                          showToast(err.message);
                        }
                      }}
                    >
                      <Icon name="meetings" />
                      <span>{data._generatingMeet ? 'Generating Meet…' : 'Generate Google Meet'}</span>
                    </button>
                    <button
                      type="button"
                      className="link-gen-btn"
                      onClick={e => {
                        const form = e.currentTarget.form;
                        const rawTitle = form?.elements?.title?.value?.trim() || data.title || 'team-sync';
                        const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'sync';
                        const roomUrl = `https://meet.jit.si/Syneolab-${slug}-${Math.random().toString(36).slice(2, 7)}`;
                        updateModalData({ link: roomUrl, location: 'Jitsi Meet', calendarEventUrl: '' });
                      }}
                    >
                      <Icon name="link" />
                      <span>Instant Jitsi Room</span>
                    </button>
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-gen-btn"
                      title="Open a blank Google Meet tab"
                    >
                      <span>meet.new</span>
                      <Icon name="arrow" />
                    </a>
                  </div>
                </div>
                <input
                  key={data.link || 'empty-link'}
                  name="link"
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx (or leave blank to auto-create on save)"
                  defaultValue={data.link || ''}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 6, color: 'var(--muted)' }}>
                  <input type="checkbox" name="autoRoom" defaultChecked={data.autoRoom ?? !id} />
                  Auto-create a Google Meet room on save if left blank
                </label>
              </div>
              <div className="field">
                <label>Location</label>
                <input key={data.location || 'default-loc'} name="location" type="text" defaultValue={data.location || 'Google Meet'} />
              </div>
              <div className="field">
                <label>Agenda / details</label>
                <textarea name="description" defaultValue={data.description || ''} />
              </div>

              <div className="field" style={{ background: 'var(--bg)', padding: 12, borderRadius: 12, border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="sendToEveryone"
                      checked={Boolean(data.sendToEveryone ?? (!id && (!data.attendees || data.attendees.length === state.users.length)))}
                      onChange={e => {
                        const checked = e.target.checked;
                        updateModalData({
                          sendToEveryone: checked,
                          attendees: checked ? state.users.map(u => u.id) : [user.id]
                        });
                      }}
                    />
                    <strong>Invite & email Everyone ({state.users.length} team members)</strong>
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="small"
                      onClick={() => updateModalData({ sendToEveryone: true, attendees: state.users.map(u => u.id) })}
                    >
                      Select everyone
                    </button>
                    <button
                      type="button"
                      className="small"
                      onClick={() => updateModalData({ sendToEveryone: false, attendees: [user.id] })}
                    >
                      Only me
                    </button>
                  </div>
                </div>

                <div className="check-list" style={{ marginTop: 10 }}>
                  {state.users.map(u => {
                    const currentAttendees = data.attendees || state.users.map(x => x.id);
                    const isChecked = Boolean(data.sendToEveryone) || currentAttendees.includes(u.id);
                    return (
                      <label key={u.id} style={{ display: 'block', margin: '4px 0' }}>
                        <input
                          type="checkbox"
                          name="attendees"
                          value={u.id}
                          checked={isChecked}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...new Set([...currentAttendees, u.id])]
                              : currentAttendees.filter(x => x !== u.id);
                            updateModalData({
                              attendees: next,
                              sendToEveryone: next.length === state.users.length
                            });
                          }}
                        />{' '}
                        {u.name} <span className="sub">({u.email})</span>
                      </label>
                    );
                  })}
                </div>

                <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
                  <label style={{ fontSize: 11 }}>Additional guest emails (optional, comma-separated)</label>
                  <input
                    name="extraEmails"
                    type="text"
                    placeholder="client@example.com, partner@company.com"
                    defaultValue={data.extraEmails || ''}
                  />
                </div>
              </div>
              <p className="sub" style={{ marginTop: 8 }}>
                Saving sends the executive invitation card + native Google Calendar (<code>.ics</code>) invite to all selected recipients.
              </p>
            </>
          )}

          {type === 'announcements' && (
            <>
              <div className="field">
                <label>Type</label>
                <select name="priority" defaultValue={data.priority || 'Update'}>
                  {['Update', 'Important', 'Celebration'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Announcement</label>
                <textarea name="description" defaultValue={data.description || ''} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" name="notifyEveryone" defaultChecked={!id} />
                <strong>Send email to Everyone (All active team members via Gmail)</strong>
              </label>
            </>
          )}

          {type === 'standups' && (
            <>
              {effectiveId ? (
                <div className="note" style={{ marginBottom: 15, background: 'rgba(34, 197, 94, 0.08)', borderColor: 'var(--green)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="check" size={13} />
                    <b>Daily check-in:</b>
                  </span> Updating your check-in for today ({fmtDate(effectiveData.date || todayStr)}).
                </div>
              ) : (
                <div className="note" style={{ marginBottom: 15 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="pulse" size={13} />
                    <b>Daily check-in:</b>
                  </span> Check in once per day to share your focus, energy, and blockers with the team. You can edit your check-in anytime today.
                </div>
              )}
              <div className="form-row">
                <div className="field">
                  <label>Primary project {!isAdmin && <span className="sub">(Assigned projects only)</span>}</label>
                  <select name="project" defaultValue={effectiveData.project || assignedProjects[0]?.id || ''}>
                    {assignedProjects.length === 0 && (
                      <option value="">No assigned projects</option>
                    )}
                    {assignedProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Current energy / mode</label>
                  <select name="mood" defaultValue={effectiveData.mood || 'Focused'}>
                    {['Focused', 'Energized', 'Heads-down', 'Need a hand'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Completed recently</label>
                <textarea name="yesterday" placeholder="Key wins or progress since your last check-in…" defaultValue={effectiveData.yesterday || ''} />
              </div>
              <div className="field">
                <label>Blockers or help needed (optional)</label>
                <textarea name="blockers" placeholder="Anything slowing you down or waiting on review?" defaultValue={effectiveData.blockers || ''} />
              </div>
              {!activeClock && !effectiveId && (
                <label className="checkbox checkin-clockin-checkbox" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--line)' }}>
                  <input type="checkbox" name="autoClockIn" defaultChecked />
                  <span style={{ fontSize: 12.5 }}>
                    <b>Also start my work timer (Clock in) now</b> with this project and focus
                  </span>
                </label>
              )}
            </>
          )}

          {type === 'goals' && (
            <>
              <div className="form-row">
                <div className="field">
                  <label>Goal cadence / horizon</label>
                  <select
                    name="period"
                    value={data.period || 'weekly'}
                    disabled={isAdminGoalForEmployee}
                    onChange={e => {
                      const nextPeriod = e.target.value;
                      updateModalData({
                        period: nextPeriod,
                        due: !id ? getDefaultGoalDue(nextPeriod) : data.due
                      });
                    }}
                  >
                    <option value="daily">Daily goal (Today)</option>
                    <option value="weekly">Weekly goal (This week)</option>
                    <option value="monthly">Monthly goal (This month)</option>
                    <option value="quarterly">Quarterly OKR</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={data.status || 'On track'}
                    onChange={e => updateModalData({ status: e.target.value })}
                  >
                    {['On track', 'At risk', 'Blocked', 'Completed'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Category / department</label>
                  <select
                    name="category"
                    defaultValue={data.category || user.department || 'Company'}
                    disabled={isAdminGoalForEmployee}
                  >
                    {[...new Set(['Company', ...departments, 'Revenue & Growth', 'Client Delivery', 'Team Sync'])].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Target date</label>
                  <input
                    key={data.due || 'goal-due'}
                    name="due"
                    type="date"
                    defaultValue={data.due || getDefaultGoalDue(data.period || 'weekly')}
                    disabled={isAdminGoalForEmployee}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>
                    Primary owner / assignee {!isAdmin && <span className="sub">(Personal scope)</span>}
                  </label>
                  <select
                    name="assignee"
                    value={isAdmin ? (data.assignee || 'all') : user.id}
                    disabled={!isAdmin}
                    onChange={e => {
                      const nextAssignee = e.target.value;
                      const currentTeam = Array.isArray(data.assignees) ? data.assignees : [];
                      updateModalData({
                        assignee: nextAssignee,
                        assignees:
                          nextAssignee === 'all'
                            ? state.users.map(u => u.id)
                            : [...new Set([nextAssignee, ...currentTeam].filter(Boolean))]
                      });
                    }}
                  >
                    {isAdmin && <option value="all">Entire team (All members)</option>}
                    {(isAdmin ? state.users : state.users.filter(u => u.id === user.id)).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.position || u.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Linked project {!isAdmin && <span className="sub">(Assigned projects only)</span>}</label>
                  <select
                    name="project"
                    defaultValue={data.project || ''}
                    disabled={isAdminGoalForEmployee}
                  >
                    <option value="">Workspace / No specific project</option>
                    {assignedProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isAdmin && (
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ margin: 0 }}>
                      Assigned team collaborators ({(data.assignees || []).length || state.users.length} synced)
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="small"
                        onClick={() => updateModalData({ assignee: 'all', assignees: state.users.map(u => u.id) })}
                      >
                        Entire team
                      </button>
                      <button
                        type="button"
                        className="small"
                        onClick={() =>
                          updateModalData({
                            assignee: data.assignee && data.assignee !== 'all' ? data.assignee : user.id,
                            assignees: [data.assignee && data.assignee !== 'all' ? data.assignee : user.id]
                          })
                        }
                      >
                        Single owner
                      </button>
                    </div>
                  </div>
                  <div className="member-pill-list">
                    {state.users.map(u => {
                      const currentAssignees = Array.isArray(data.assignees)
                        ? data.assignees
                        : data.assignee && data.assignee !== 'all'
                        ? [data.assignee]
                        : state.users.map(usr => usr.id);
                      const selected = currentAssignees.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          className={`member-pill ${selected ? 'selected' : ''}`}
                          onClick={() => {
                            const next = selected
                              ? currentAssignees.filter(idVal => idVal !== u.id)
                              : [...new Set([...currentAssignees, u.id])];
                            updateModalData({
                              assignees: next.length ? next : [user.id],
                              assignee: next.length === 1 ? next[0] : data.assignee
                            });
                          }}
                        >
                          <Avatar user={u} />
                          <span>{u.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="field">
                  <label>Current progress value (0 – 100%)</label>
                  <input
                    name="currentValue"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    placeholder="0"
                    value={data.currentValue ?? 0}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') {
                        updateModalData({ currentValue: '' });
                        return;
                      }
                      const num = Number(raw);
                      if (Number.isNaN(num)) return;
                      const clamped = Math.min(100, Math.max(0, num));
                      updateModalData({ currentValue: clamped });
                    }}
                    onBlur={e => {
                      const num = Number(e.target.value || 0);
                      const clamped = Math.min(100, Math.max(0, Number.isNaN(num) ? 0 : num));
                      updateModalData({ currentValue: clamped });
                    }}
                  />
                </div>
                <div className="field">
                  <label>Target value & unit</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 8 }}>
                    <input
                      name="targetValue"
                      type="number"
                      step="any"
                      required
                      defaultValue={data.targetValue ?? 100}
                      disabled={isAdminGoalForEmployee}
                    />
                    <input
                      name="unit"
                      type="text"
                      placeholder="%, tasks, USD"
                      defaultValue={data.unit || '%'}
                      disabled={isAdminGoalForEmployee}
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label>Context & success criteria</label>
                <textarea
                  name="description"
                  placeholder="Describe what success looks like and how the team can collaborate on this goal…"
                  defaultValue={data.description || ''}
                />
              </div>

              {/* Key Results / Action Steps Checklist */}
              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ margin: 0 }}>
                    Key results / action checklist ({(data.subtasks || []).filter(s => s.done).length}/{(data.subtasks || []).length} completed)
                  </label>
                  {(data.subtasks || []).length > 0 && (
                    <button
                      type="button"
                      className="small"
                      onClick={() => {
                        const total = (data.subtasks || []).length;
                        const done = (data.subtasks || []).filter(s => s.done).length;
                        const target = Math.max(1, Number(data.targetValue || 100));
                        const syncedVal = Math.round((done / total) * target);
                        updateModalData({
                          currentValue: syncedVal,
                          status: done === total ? 'Completed' : 'On track'
                        });
                      }}
                    >
                      Sync progress from checklist
                    </button>
                  )}
                </div>
                <div className="checklist-editor">
                  {(data.subtasks || []).map((st, idx) => (
                    <div key={st.id || idx} className="checklist-row">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(st.done)}
                          onChange={() => {
                            const next = (data.subtasks || []).map((item, i) =>
                              i === idx ? { ...item, done: !item.done } : item
                            );
                            const doneCount = next.filter(item => item.done).length;
                            const patch = { subtasks: next };
                            if ((data.unit || '%') === '%' && Number(data.targetValue || 100) === 100) {
                              patch.currentValue = Math.round((doneCount / next.length) * 100);
                            }
                            updateModalData(patch);
                          }}
                        />
                        <span style={{ textDecoration: st.done ? 'line-through' : 'none' }}>{st.title}</span>
                      </label>
                      {editable && (
                        <button
                          type="button"
                          className="small"
                          onClick={() => {
                            const next = (data.subtasks || []).filter((_, i) => i !== idx);
                            updateModalData({ subtasks: next });
                          }}
                        >
                          <Icon name="x" size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Add a measurable key result or action step…"
                        value={data._newGoalStep || ''}
                        onChange={e => updateModalData({ _newGoalStep: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const text = (data._newGoalStep || '').trim();
                            if (!text) return;
                            updateModalData({
                              subtasks: [...(data.subtasks || []), { id: String(Date.now()), title: text, done: false }],
                              _newGoalStep: ''
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="small"
                        onClick={() => {
                          const text = (data._newGoalStep || '').trim();
                          if (!text) return;
                          updateModalData({
                            subtasks: [...(data.subtasks || []), { id: String(Date.now()), title: text, done: false }],
                            _newGoalStep: ''
                          });
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Sync Discussion & Progress Updates */}
              <div className="field">
                <label>Team sync discussion & updates ({(data.comments || []).length})</label>
                <div className="comments-box">
                  {(data.comments || []).map((c, idx) => (
                    <div key={c.id || idx} className="comment-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <strong>{c.authorName || 'Team member'}</strong>
                        <span className="sub">{c.at ? new Date(c.at).toLocaleString() : ''}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 13 }}>{c.text}</p>
                    </div>
                  ))}
                  {editable && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        placeholder="Share a progress update, blocker, or note with the team…"
                        value={data._newGoalComment || ''}
                        onChange={e => updateModalData({ _newGoalComment: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const text = (data._newGoalComment || '').trim();
                            if (!text) return;
                            updateModalData({
                              comments: [
                                ...(data.comments || []),
                                { id: String(Date.now()), authorId: user.id, authorName: user.name, text, at: new Date().toISOString() }
                              ],
                              _newGoalComment: ''
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="small"
                        onClick={() => {
                          const text = (data._newGoalComment || '').trim();
                          if (!text) return;
                          updateModalData({
                            comments: [
                              ...(data.comments || []),
                              { id: String(Date.now()), authorId: user.id, authorName: user.name, text, at: new Date().toISOString() }
                            ],
                            _newGoalComment: ''
                          });
                        }}
                      >
                        Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          </fieldset>

          <div className="actions" style={{ marginTop: 20 }}>
            {id && canDelete(type, data) && (
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (confirm('Delete this record? This cannot be undone.')) {
                    const prevCollection = Array.isArray(state[type]) ? state[type] : [];
                    if (Array.isArray(state[type])) {
                      setState(prev => ({
                        ...prev,
                        [type]: prev[type].filter(item => item.id !== id)
                      }));
                    }
                    setModal(null);
                    showToast('Record deleted');
                    try {
                      await handleApi('/api/delete', { id });
                      refreshState();
                    } catch (err) {
                      if (Array.isArray(state[type])) {
                        setState(prev => ({ ...prev, [type]: prevCollection }));
                      }
                      showToast(err.message);
                    }
                  }
                }}
              >
                Delete
              </button>
            )}
            {editable ? (
              <button className="primary">Save {singularLabel}</button>
            ) : (
              <button type="button" onClick={() => setModal(null)}>Close</button>
            )}
          </div>
        </form>
      </div>
    );
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'Projects' },
    { id: 'tasks', label: 'Tasks', count: state.tasks.filter(t => t.status !== 'Done').length },
    { id: 'pulse', label: 'Pulse & goals', count: state.tasks.filter(t => t.blocked && t.status !== 'Done').length },
    { id: 'calendar', label: 'Calendar' },
    { id: 'clock', label: 'Time tracking' },
    { id: 'team', label: 'Team', count: isAdmin ? (state.requests || []).length : 0 },
    { id: 'leads', label: 'Leads' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'announcements', label: 'Announcements' }
  ];

  return (
    <div className="shell">
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div
            className="brand"
            onClick={() => {
              navigate('dashboard');
              setSidebarOpen(false);
            }}
            role="button"
            tabIndex={0}
            title="Go to Dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
          >
            <SyneoLogo size={34} idPrefix="sidebar" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SyneoWordmark height={15} color="var(--ink)" />
              <span style={{ fontSize: 7.2, letterSpacing: '0.14em', color: 'var(--soft)', fontWeight: 600 }}>
                CREATIVITY MEETS INNOVATIONS
              </span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="sidebar-nav">
          <div className="eyebrow">Workspace</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav ${page === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.id} />
              {item.label}
              {item.count !== undefined && item.count > 0 && <span className="count">{item.count}</span>}
            </button>
          ))}

          <div className="eyebrow">Insights & preferences</div>
          <button
            className={`nav ${page === 'analytics' ? 'active' : ''}`}
            onClick={() => navigate('analytics')}
          >
            <Icon name="analytics" /> Analytics
          </button>
          <button
            className={`nav ${page === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('settings')}
          >
            <Icon name="settings" /> Settings
          </button>
        </div>

        <div className="side-bottom">
          <div className="workspace-card">
            <strong>Good things<br />take teamwork.</strong>
            <p>Your people. Your progress.<br />All in one place.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 10, color: 'var(--soft)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4cd97b', display: 'inline-block', flexShrink: 0 }} />
              <span>DB Beacon · 24/7 Awake (0B)</span>
            </div>
          </div>
          <button
            className="nav logout-btn"
            onClick={async () => {
              await handleApi('/api/logout', {});
              setUser(null);
              showToast('Signed out');
            }}
          >
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
          <div
            className="topbar-brand"
            onClick={() => navigate('dashboard')}
            role="button"
            tabIndex={0}
            title="Go to Dashboard"
          >
            <SyneoLogo size={26} idPrefix="topbar" />
            <SyneoWordmark height={13} color="var(--ink)" />
          </div>
          <div className="search">
            <Icon name="search" />
            <input
              id="search-input"
              placeholder="Search projects, tasks & people"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search workspace"
            />
            <span className="shortcut">⌘ K</span>
          </div>
          <div className="profile">
            {user && (() => {
              const myTodayStandup = (state.standups || []).find(s => s.owner === user.id && isTodayStandup(s));
              const hasCheckedInToday = Boolean(myTodayStandup);
              const myStreaks = calculateMemberStreaks(user.id, state.standups || [], state.clocks || [], key(new Date()), currentTime);
              const streakDays = myStreaks?.checkinStreak || 0;
              return (
                <button
                  type="button"
                  className={`top-checkin-pill ${hasCheckedInToday ? 'completed' : 'pending'}`}
                  onClick={() => {
                    if (hasCheckedInToday) {
                      setModal({ type: 'standups', id: myTodayStandup.id, data: myTodayStandup });
                    } else {
                      setModal({ type: 'clock', data: {} });
                    }
                  }}
                  title={hasCheckedInToday ? `Checked in today: "${myTodayStandup.title}" · Click to view or edit` : 'Daily check-in pending — Click to check in & start shift'}
                >
                  <span className={`top-checkin-dot ${hasCheckedInToday ? 'dot-done' : 'dot-pulse'}`} />
                  <Icon name={hasCheckedInToday ? 'check' : 'pulse'} size={12} />
                  <span className="top-checkin-text">{hasCheckedInToday ? 'Checked in' : 'Daily check-in'}</span>
                  {hasCheckedInToday && streakDays > 0 && (
                    <span className="top-checkin-streak" title={`${streakDays}-day daily check-in streak`}>
                      <Icon name="flame" size={10} /> {streakDays}d
                    </span>
                  )}
                </button>
              );
            })()}

            {activeClock && (
              <div className={`top-clock-pill ${activeClock.break_start ? 'on-break' : ''}`}>
                <button
                  type="button"
                  className="top-clock-readout"
                  onClick={() => navigate('clock')}
                  title="Open Time tracking"
                >
                  <i className="top-clock-dot" />
                  <span>
                    <b>Work {duration(activeClockSeconds)}</b>
                    <small> · Break {duration(activeBreakSeconds)}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="top-clock-action"
                  onClick={() => handleClock(activeClock.break_start ? 'resume' : 'break')}
                  title={activeClock.break_start ? 'Resume work' : 'Start break'}
                >
                  {activeClock.break_start ? 'Resume' : 'Break'}
                </button>
                <button
                  type="button"
                  className="top-clock-action stop"
                  onClick={() => handleClock('stop')}
                  title="Clock out"
                >
                  Clock out
                </button>
              </div>
            )}
            <button
              type="button"
              className="small"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <Icon name={darkMode ? 'sun' : 'moon'} />
            </button>
            <button
              type="button"
              className="small notif-bell-btn"
              onClick={() => {
                markActivitiesSeen();
                setModal({ type: 'notifications', data: {} });
              }}
              aria-label="Employee activity & notifications"
              title={
                isAdmin
                  ? `Employee activity & notifications (${unreadActivities.length} unread)`
                  : 'My activity feed'
              }
            >
              <Icon name="bell" />
              {unreadActivities.length > 0 && (
                <span className="notif-badge">
                  {unreadActivities.length > 99 ? '99+' : unreadActivities.length}
                </span>
              )}
            </button>
            <Avatar user={user} />
            <div>
              <strong>{user?.name || ''}</strong>
              <small>{isAdmin ? 'Workspace admin' : 'Team member'}</small>
            </div>
            <button
              className="top-logout-btn"
              onClick={async () => {
                await handleApi('/api/logout', {});
                setUser(null);
                showToast('Signed out');
              }}
              aria-label="Sign out"
              title="Sign out of workspace"
            >
              <Icon name="logout" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        <div className="content">
          {renderCurrentView()}
          <div className="footer-note" style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span
              onClick={() => navigate('dashboard')}
              role="button"
              tabIndex={0}
              title="Go to Dashboard"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <SyneoLogo size={18} idPrefix="footer" />
              <b>SYNEO LABS WORKSPACE</b>
            </span>
            <span>“WHERE CREATIVITY MEETS INNOVATIONS”</span>
          </div>
        </div>
      </main>

      {/* Modal Dialog Backdrop */}
      {modal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          {renderModalContent()}
        </div>
      )}

      {/* Real-Time Admin Live Employee Activity Alert Popup */}
      {liveAlert && (
        <div className="admin-live-alert" role="alert">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span className="eyebrow" style={{ margin: 0, color: 'var(--green)', display: 'inline-flex', alignItems: 'center' }}>
              <Icon name="dot" size={10} style={{ color: 'var(--green)', marginRight: 4 }} />Live Employee Update {liveAlert.extraCount > 0 ? `(+${liveAlert.extraCount} more)` : ''}
            </span>
            <button
              type="button"
              className="icon-btn-ghost close-btn"
              onClick={() => setLiveAlert(null)}
              aria-label="Close notification"
            >
              <Icon name="x" size={13} />
            </button>
          </div>
          <strong style={{ fontSize: 13.5 }}>{liveAlert.summary}</strong>
          {liveAlert.detail && (
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
              {liveAlert.detail}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="small primary"
              onClick={() => {
                setLiveAlert(null);
                markActivitiesSeen();
                setModal({ type: 'notifications', data: {} });
              }}
            >
              Inspect activity
            </button>
            <button
              type="button"
              className="small"
              onClick={() => {
                setLiveAlert(null);
                navigate('analytics');
              }}
            >
              Open analytics
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div id="toast" role="status" style={{ display: 'block' }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
