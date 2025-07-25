interface AuthLoadingProps {
  message?: string;
  className?: string;
}

export default function AuthLoading({ 
  message = "Checking authentication...", 
  className = "min-h-screen bg-white dark:bg-zinc-950" 
}: AuthLoadingProps) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">{message}</p>
      </div>
    </div>
  );
}
