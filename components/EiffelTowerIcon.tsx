export const EiffelTower = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 160"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Base */}
    <line x1="10" y1="150" x2="90" y2="150" />
    
    {/* Left base leg */}
    <line x1="20" y1="150" x2="35" y2="100" />
    
    {/* Right base leg */}
    <line x1="80" y1="150" x2="65" y2="100" />
    
    {/* First crossbar */}
    <line x1="35" y1="100" x2="65" y2="100" />
    
    {/* Left middle leg */}
    <line x1="40" y1="100" x2="45" y2="60" />
    
    {/* Right middle leg */}
    <line x1="60" y1="100" x2="55" y2="60" />
    
    {/* Second crossbar */}
    <line x1="45" y1="60" x2="55" y2="60" />
    
    {/* Left final leg */}
    <line x1="47" y1="60" x2="48" y2="25" />
    
    {/* Right final leg */}
    <line x1="53" y1="60" x2="52" y2="25" />
    
    {/* Top point */}
    <line x1="50" y1="25" x2="50" y2="10" />
    
    {/* Diagonal braces for character */}
    <line x1="35" y1="100" x2="45" y2="60" />
    <line x1="65" y1="100" x2="55" y2="60" />
    <line x1="20" y1="150" x2="40" y2="100" />
    <line x1="80" y1="150" x2="60" y2="100" />
  </svg>
);
