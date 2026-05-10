export default function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
      <b>Error:</b> {message}
    </div>
  );
}
