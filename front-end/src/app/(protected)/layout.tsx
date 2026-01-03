import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/layout/AuthGuard"; // or your ProtectedLayout guard

export default function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* Full viewport height, prevent whole-page scrolling */}
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar: fixed, full height */}
        <Sidebar />

        {/* Only main content scrolls */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
