// Animated SVG constellation for the hero section — agent nodes with connection lines

const AGENT_NODES = [
  { x: 100, y: 180, icon: '\uf049', delay: '0.5s' },
  { x: 300, y: 160, icon: '\ue322', delay: '1s' },
  { x: 160, y: 50, icon: '\ue8b8', delay: '0.3s' },
  { x: 280, y: 60, icon: '\ue9da', delay: '0.8s' },
  { x: 170, y: 230, icon: '\uef42', delay: '1.2s' },
  { x: 340, y: 220, icon: '\ue30a', delay: '0.6s' },
  { x: 60, y: 120, icon: '\ue161', delay: '1.5s' },
  { x: 350, y: 100, icon: '\ueb8b', delay: '0.9s' },
];

const CONNECTIONS = [
  { x1: 200, y1: 100, x2: 100, y2: 180, dur: '3s', peak: '0.4' },
  { x1: 200, y1: 100, x2: 300, y2: 160, dur: '3.5s', peak: '0.4' },
  { x1: 200, y1: 100, x2: 160, y2: 50, dur: '2.8s', peak: '0.4' },
  { x1: 200, y1: 100, x2: 280, y2: 60, dur: '4s', peak: '0.4' },
  { x1: 100, y1: 180, x2: 170, y2: 230, dur: '3.2s', peak: '0.3' },
  { x1: 300, y1: 160, x2: 340, y2: 220, dur: '3.8s', peak: '0.3' },
  { x1: 100, y1: 180, x2: 60, y2: 120, dur: '2.5s', peak: '0.3' },
  { x1: 300, y1: 160, x2: 350, y2: 100, dur: '3s', peak: '0.3' },
];

export function ConstellationDiagram() {
  return (
    <div className="flex-1 w-full max-w-xl hidden md:block">
      <div className="relative group">
        <div className="absolute -inset-4 bg-white/10 rounded-[2.5rem] blur-2xl opacity-50" />
        <div className="relative bg-white/5 p-4 rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden backdrop-blur-md">
          <div className="rounded-[2rem] w-full aspect-[4/3] bg-gradient-to-br from-white/10 to-white/5 relative overflow-hidden">
            <svg viewBox="0 0 400 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Connection lines */}
              <g stroke="rgba(255,255,255,0.15)" strokeWidth="1">
                {CONNECTIONS.map((c, i) => (
                  <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}>
                    <animate attributeName="opacity" values={`0.1;${c.peak};0.1`} dur={c.dur} repeatCount="indefinite" />
                  </line>
                ))}
              </g>

              {/* Central hub */}
              <g>
                <circle cx="200" cy="100" r="28" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                  <animate attributeName="r" values="26;30;26" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="200" y="106" textAnchor="middle" fill="white" fontSize="22" fontFamily="Material Symbols Outlined">
                  {'\ue86c'}
                </text>
              </g>

              {/* Agent nodes */}
              {AGENT_NODES.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin={n.delay} repeatCount="indefinite" />
                  </circle>
                  <circle cx={n.x} cy={n.y} r="3" fill="rgba(78,222,163,0.8)">
                    <animate attributeName="r" values="2;4;2" dur="2s" begin={n.delay} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}

              {/* Floating particles */}
              {Array.from({ length: 12 }).map((_, i) => (
                <circle key={`p${i}`} cx={50 + (i * 30)} cy={40 + (i % 3) * 80} r="1.5" fill="rgba(255,255,255,0.3)">
                  <animate
                    attributeName="cy"
                    values={`${40 + (i % 3) * 80};${30 + (i % 3) * 80};${40 + (i % 3) * 80}`}
                    dur={`${3 + i * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}

              {/* Stats badges */}
              <g transform="translate(120, 260)">
                <rect x="0" y="0" width="70" height="24" rx="12" fill="rgba(255,255,255,0.15)" />
                <text x="35" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">37K Skills</text>
              </g>
              <g transform="translate(210, 260)">
                <rect x="0" y="0" width="80" height="24" rx="12" fill="rgba(255,255,255,0.15)" />
                <text x="40" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">4.2K MCP</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
