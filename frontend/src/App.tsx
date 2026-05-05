// Adjust path if you move FarmScene.tsx later
import FarmScene from './features/farm/sensors/FarmScene'

function App() {
  return (
    <div className="relative w-screen h-screen">
      {/* 1. The 3D Layer (Background) */}
      <div className="absolute inset-0 z-0">
        <FarmScene />
      </div>

      {/* 2. The UI Layer (Foreground) */}
      <div className="relative z-10 w-full h-full pointer-events-none p-6">
        <header className="flex justify-between items-start pointer-events-auto">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            AuraFarm <span className="text-green-400">OS</span>
          </h1>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm">
            System Online
          </div>
        </header>

        {/* This is where the UI panels will go later */}
      </div>
    </div>
  )
}

export default App