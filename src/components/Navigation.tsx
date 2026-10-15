import React from 'react';
import { 
  Tv, 
  Compass, 
  ListVideo, 
  User, 
  PlusCircle, 
  Radio, 
  Activity, 
  Film,
  ShieldCheck,
  LogIn,
  LogOut,
  Infinity as InfinityIcon
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export type ActiveTab = 'dashboard' | 'watch-room' | 'discover' | 'playlists' | 'profile';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onCreateRoomClick: () => void;
  onSimulatorClick: () => void;
  onFirewallClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onCreateRoomClick,
  onSimulatorClick,
  onFirewallClick
}) => {
  const { room, user, connectionStatus, p95Latency, firebaseUser, loginWithGoogle, logout } = useRoom();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: Tv },
    { 
      id: 'watch-room' as ActiveTab, 
      label: room ? `Room: ${room.id}` : 'Watch Room', 
      icon: Radio,
      badge: room ? `${room.participants.filter(p => p.online).length} online` : undefined
    },
    { id: 'discover' as ActiveTab, label: 'Discover Movies', icon: Compass },
    { id: 'playlists' as ActiveTab, label: 'Playlists', icon: ListVideo },
    { id: 'profile' as ActiveTab, label: 'Profile & Settings', icon: User }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[#E1EBE2] bg-white p-5 shrink-0 min-h-screen">
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-[#DDF3E4] border border-[#A8D5BA] flex items-center justify-center text-[#4C956C] shadow-sm">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#20382B] block leading-tight">
                GreenRoom
              </span>
              <span className="text-xs text-[#6B7C70] font-medium block">
                Watch Together
              </span>
            </div>
          </div>

          {/* Quick Create Room Action */}
          <button
            onClick={onCreateRoomClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Watch Party</span>
          </button>

          {/* Google Auth Status Banner */}
          {firebaseUser ? (
            <div className="p-2.5 rounded-xl bg-[#DDF3E4]/50 border border-[#A8D5BA] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={firebaseUser.photoURL || user.avatar}
                  alt={firebaseUser.displayName || 'Google'}
                  className="w-6 h-6 rounded-full border border-[#4C956C] object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-[#20382B] truncate text-[11px]">
                    {firebaseUser.displayName?.split(' ')[0] || 'Google User'}
                  </p>
                  <p className="text-[10px] text-[#4C956C] font-medium">Cloud Synced</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1 text-[#6B7C70] hover:text-rose-600 rounded transition-colors"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E1EBE2] hover:border-[#A8D5BA] hover:bg-[#F8FAF6] text-xs font-semibold text-[#20382B] transition-colors shadow-2xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#4C956C]" />
              <span>Sign in with Google</span>
            </button>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#DDF3E4] text-[#20382B] font-semibold'
                      : 'text-[#6B7C70] hover:text-[#20382B] hover:bg-[#F8FAF6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#4C956C]' : 'text-[#6B7C70]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[11px] font-mono font-medium text-[#4C956C] bg-white px-2 py-0.5 rounded-full border border-[#A8D5BA]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area: Firewall Shield, Simulator, and User Profile */}
        <div className="flex flex-col gap-2.5 pt-4 border-t border-[#E1EBE2]">
          {/* Firewall Shield Button */}
          <button
            onClick={onFirewallClick}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#DDF3E4]/40 hover:bg-[#DDF3E4] border border-[#A8D5BA] text-xs font-semibold text-[#20382B] transition-colors cursor-pointer"
            title="Inspect Layer-7 Firewall Telemetry & Active Protection"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4C956C]" />
              <span>Firewall Security</span>
            </div>
            <span className="text-[10px] text-[#4C956C] font-mono bg-white px-1.5 py-0.5 rounded border border-[#A8D5BA]">
              Active
            </span>
          </button>

          {/* Multi-Client Benchmark & Simulator button */}
          <button
            onClick={onSimulatorClick}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8FAF6] hover:bg-[#DDF3E4] border border-[#E1EBE2] text-xs font-medium text-[#20382B] transition-colors cursor-pointer"
            title="Launch 10-Peer Sync and Latency Tester"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#4C956C]" />
              <span>Peer Sync Tester</span>
            </div>
            <span className="font-mono text-[11px] text-[#6B7C70]">
              {p95Latency > 0 ? `${p95Latency}ms` : '18ms'}
            </span>
          </button>

          {/* Current User Card */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAF6] cursor-pointer transition-colors"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full bg-[#DDF3E4] border border-[#A8D5BA] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#20382B] truncate">{user.name}</p>
                <span 
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-[#4C956C]' : 'bg-amber-400'
                  }`}
                  title={`Socket: ${connectionStatus}`}
                />
              </div>
              <p className="text-xs text-[#6B7C70] truncate">
                {room ? `In Room: ${room.id}` : 'Browsing lobbies'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E1EBE2] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#DDF3E4] border border-[#A8D5BA] flex items-center justify-center text-[#4C956C]">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold text-[#20382B] leading-none block">GreenRoom</span>
            <span className="text-[10px] text-[#6B7C70]">Watch Together</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCreateRoomClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4C956C] text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E1EBE2] px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs transition-colors ${
                isActive ? 'text-[#4C956C] font-semibold' : 'text-[#6B7C70]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
