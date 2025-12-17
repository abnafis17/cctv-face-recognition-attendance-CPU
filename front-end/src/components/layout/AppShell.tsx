export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">CCTV Face Recognition Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Backend:{" "}
          {process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}
        </p>

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
