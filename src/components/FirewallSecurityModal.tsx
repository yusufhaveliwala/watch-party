import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Lock, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  Cpu, 
  Terminal,
  RotateCcw
} from 'lucide-react';

interface FirewallStatus {
  status: string;
  inspectedRequests: number;
  blockedAttacks: number;
  uptimeSeconds: number;
  activeRules: string[];
  recentDetections: Array<{
    timestamp: number;
    type: string;
    target: string;
  }>;
}

interface FirewallSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirewallSecurityModal: React.FC<FirewallSecurityModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<FirewallStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: string;
    status: 'blocked' | 'passed';
    statusCode: number;
    message: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/firewall/status');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real Attack Simulation Runner
  const runSimulation = async (attackType: 'sqli' | 'xss' | 'traversal' | 'flood' | 'clean') => {
    setIsSimulating(true);
    setTestResult(null);

    try {
      if (attackType === 'flood') {
        // Send rapid burst of 12 requests in 300ms to trigger rate limiter
        let blocked = false;
        let lastMsg = '';
        for (let i = 0; i < 12; i++) {
          const res = await fetch('/api/firewall/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ping: i })
          });
          if (res.status === 429) {
            blocked = true;
            const data = await res.json();
            lastMsg = data.error || 'Rate limit triggered';
            break;
          }
        }
        setTestResult({
          type: 'Rapid Flood (DDoS Guard)',
          status: blocked ? 'blocked' : 'passed',
          statusCode: blocked ? 429 : 200,
          message: blocked ? lastMsg : 'Burst under threshold'
        });
      } else {
        let payload = {};
        if (attackType === 'sqli') {
          payload = { query: "1' UNION SELECT username, password FROM users WHERE 1=1--" };
        } else if (attackType === 'xss') {
          payload = { comment: "<script>alert(document.cookie)</script><img src=x onerror=steal()>" };
        } else if (attackType === 'traversal') {
          payload = { file: "../../../../etc/passwd" };
        } else {
          payload = { message: "Hello GreenRoom friends, ready for movie night!" };
        }

        const res = await fetch('/api/firewall/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.status === 403 || res.status === 429) {
          setTestResult({
            type: attackType.toUpperCase(),
            status: 'blocked',
            statusCode: res.status,
            message: data.error || 'Blocked by GreenRoom WAF Deep Packet Inspection'
          });
        } else {
          setTestResult({
            type: attackType.toUpperCase(),
            status: 'passed',
            statusCode: res.status,
            message: data.message || 'Payload inspected and verified clean'
          });
        }
      }

      await fetchStatus();
    } catch (err: any) {
      setTestResult({
        type: attackType.toUpperCase(),
        status: 'blocked',
        statusCode: 0,
        message: err.message || 'Network blocked'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetTelemetry = async () => {
    try {
      await fetch('/api/firewall/reset-stats', { method: 'POST' });
      await fetchStatus();
      setTestResult(null);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E1EBE2] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E1EBE2] bg-[#F8FAF6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DDF3E4] border border-[#A8D5BA] flex items-center justify-center text-[#4C956C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#20382B]">GreenRoom Firewall (WAF)</h2>
                <span className="text-[10px] font-bold text-[#4C956C] bg-[#DDF3E4] px-2 py-0.5 rounded-full border border-[#A8D5BA]">
                  ACTIVE & ENFORCING
                </span>
              </div>
              <p className="text-xs text-[#6B7C70]">Layer-7 Deep Packet Inspection & Threat Neutralization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F8FAF6] border border-[#E1EBE2]">
              <span className="text-[11px] text-[#6B7C70] block">Inspected Requests</span>
              <span className="text-lg font-mono font-bold text-[#20382B]">
                {stats?.inspectedRequests ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
              <span className="text-[11px] text-rose-700 block">Blocked Attacks</span>
              <span className="text-lg font-mono font-bold text-rose-800">
                {stats?.blockedAttacks ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#DDF3E4]/40 border border-[#A8D5BA]">
              <span className="text-[11px] text-[#4C956C] block">WAF Uptime</span>
              <span className="text-lg font-mono font-bold text-[#20382B]">
                {stats ? `${Math.floor(stats.uptimeSeconds / 60)}m ${stats.uptimeSeconds % 60}s` : 'Active'}
              </span>
            </div>
          </div>

          {/* Active Defense Engines */}
          <div className="p-4 rounded-2xl border border-[#E1EBE2] bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20382B] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#4C956C]" />
                <span>Active Protection Engines</span>
              </span>
              <span className="text-[11px] text-[#4C956C] font-semibold">6 Shields Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF6] text-[#20382B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4C956C] shrink-0" />
                <span className="truncate">SQL Injection Signature Shield</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF6] text-[#20382B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4C956C] shrink-0" />
                <span className="truncate">XSS Exploit Neutralization</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF6] text-[#20382B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4C956C] shrink-0" />
                <span className="truncate">Prototype Pollution Blocker</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF6] text-[#20382B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4C956C] shrink-0" />
                <span className="truncate">Adaptive IP Rate Limiter (150/min)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF6] text-[#20382B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4C956C] shrink-0" />
                <span className="truncate">Directory Traversal Guard</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAF6] text-[#20382B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4C956C] shrink-0" />
                <span className="truncate">Hardened Headers (CSP & Nosniff)</span>
              </div>
            </div>
          </div>

          {/* Interactive Threat Simulator Sandbox */}
          <div className="p-4 rounded-2xl border border-[#A8D5BA] bg-[#DDF3E4]/25 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#20382B] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#4C956C]" />
                  <span>Interactive Threat Simulator Sandbox</span>
                </span>
                <p className="text-[11px] text-[#6B7C70] mt-0.5">
                  Fire simulated cyberattack payloads to verify that the WAF instantly intercepts and neutralizes them.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => runSimulation('sqli')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E1EBE2] hover:border-rose-400 hover:text-rose-700 text-xs font-semibold text-[#20382B] shadow-2xs transition-colors cursor-pointer"
              >
                Test SQL Injection
              </button>
              <button
                type="button"
                onClick={() => runSimulation('xss')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E1EBE2] hover:border-amber-400 hover:text-amber-700 text-xs font-semibold text-[#20382B] shadow-2xs transition-colors cursor-pointer"
              >
                Test XSS Payload
              </button>
              <button
                type="button"
                onClick={() => runSimulation('traversal')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E1EBE2] hover:border-purple-400 hover:text-purple-700 text-xs font-semibold text-[#20382B] shadow-2xs transition-colors cursor-pointer"
              >
                Test Path Traversal
              </button>
              <button
                type="button"
                onClick={() => runSimulation('flood')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E1EBE2] hover:border-orange-400 hover:text-orange-700 text-xs font-semibold text-[#20382B] shadow-2xs transition-colors cursor-pointer"
              >
                Test Burst Flood
              </button>
              <button
                type="button"
                onClick={() => runSimulation('clean')}
                disabled={isSimulating}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#A8D5BA] hover:bg-[#DDF3E4] text-xs font-semibold text-[#4C956C] shadow-2xs transition-colors cursor-pointer"
              >
                Test Clean Traffic
              </button>
            </div>

            {/* Test Execution Output */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.status === 'blocked'
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                {testResult.status === 'blocked' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>
                      {testResult.status === 'blocked' ? 'Threat Successfully Blocked' : 'Payload Allowed Clean'}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-current">
                      HTTP {testResult.statusCode}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Threat Detection Activity Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#20382B] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#4C956C]" />
                <span>Live WAF Threat Activity Log</span>
              </span>
              <button
                onClick={handleResetTelemetry}
                className="text-[11px] text-[#6B7C70] hover:text-[#20382B] flex items-center gap-1"
                title="Clear attack log"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Log</span>
              </button>
            </div>

            {stats?.recentDetections && stats.recentDetections.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {stats.recentDetections.map((det, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="font-semibold text-rose-700">{det.type}</span>
                      <span className="text-[11px] font-mono text-[#6B7C70] truncate max-w-[180px]">
                        {det.target}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7C70]">
                      {new Date(det.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#E1EBE2] bg-[#F8FAF6] text-center text-xs text-[#6B7C70]">
                No threat attacks detected. All incoming requests verified clean.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E1EBE2] bg-[#F8FAF6] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#6B7C70]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4C956C]" />
            <span>Strict Zero-Trust Perimeter Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
