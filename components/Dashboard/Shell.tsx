type DashboardUser = {
  firstName: string;
  lastName: string;
  role: string;
};

type DashboardShellProps = {
  user: DashboardUser;
  children?: React.ReactNode; // optional prop for inner content
};

export default function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="dashboard-wrapper min-h-screen flex flex-col">
      {/* Header */}
      <header 
      style={{backgroundColor:"var(--background) ",
      color: "var(--foreground-2)",
      borderBottom: "2px solid var(--accent-background)" }}
      className="shadow p-4 flex justify-between items-center border-b-2 style={{var(--foreground-2) }}">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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
      yababababba
      </footer>
    </div>
  );
}
