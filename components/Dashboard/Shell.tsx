type DashboardUser = {
  firstName: string;
  lastName: string;
  role: string;
};

type DashboardShellProps = {
  user: DashboardUser;
  progress: number; 
  children?: React.ReactNode; // optional prop for inner content
};

export default function DashboardShell({ user, progress, children }: DashboardShellProps) {
  return (
    <div className="dashboard-wrapper min-h-screen flex flex-col">
      {/* Header */}
      
      <header 
      style={{
        backgroundColor:"var(--background) ",
        color: "var(--foreground-2)",
        borderBottom: "2px solid var(--accent-background)" 
      }}
      className="shadow p-4 flex justify-between items-center border-b-2 style={{var(--foreground-2) }}">
        
        {/*top row*/}
        <h1 className="text-3xl font-bold">Dashboard</h1>
         <div className="flex justify-between items-center"></div>
    {/* Left: Navigation tabs */}
    <nav className="flex gap-6 text-xl font-bold">
      <button className="border-b-2 border-[var(--accent-background)]">
        Overview
      </button>
      <button className="opacity-70 hover:opacity-100"> 
        Classes
      </button>
      <button className="opacity-70 hover:opacity-100">
        Extracurriculars
      </button>
      <button className="opacity-70 hover:opacity-100">
        Schools
      </button>
      <button className="opacity-70 hover:opacity-100">
        Jobs
      </button>
      <button className="opacity-70 hover:opacity-100">
        Calander
      </button>
      <button className="opacity-70 hover:opacity-100">
        Goals
      </button>
    </nav>
      <p className="text x1 font-bold">Welcome Back, {user.firstName}</p>
      
      </header>

      {/* Main content */}
      <main className=
      "flex-1 p-6 bg-white dark:bg-gray-100">
        {children} {/* <-- panels from the page will render here */}
      </main>

      {/* Footer */}
      <footer 
      style={{backgroundColor:"var(--background) ",
      color: "black",
      borderTop: "2px solid var(--accent-background)" }}
      className="bg-white dark:bg-gray-100 p-4 text-center text-sm">
       {/* Progress bar */}
  <div className="w-full">
    <div className="relative h-4 rounded-full bg-gray-200 overflow-hidden">
      {/* Filled portion */}
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${progress}%`,
          backgroundColor: "var(--accent-background)",
        }}
      />

      {/* Notches every 10% */}
      {[...Array(11)].map((_, i) => (
        <div
          key={i}
          className="absolute top-0 h-full w-[2px] bg-white/70"
          style={{ left: `${i * 10}%` }}
        />
      ))}
    </div>

    <p className="text-sm mt-1 font-bold">
      Overall Progress: {progress}%
    </p>
  </div>
      </footer>
    </div>
  );
}
