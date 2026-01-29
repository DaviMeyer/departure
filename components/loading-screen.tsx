"use client"

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 sm:gap-8">
        {/* Modern animated loader */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
          
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          
          {/* Inner pulse */}
          <div className="absolute inset-3 rounded-full bg-primary/20 animate-pulse"></div>
        </div>
        
        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-foreground text-lg sm:text-xl font-medium">
            Lade Abfahrten...
          </p>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
