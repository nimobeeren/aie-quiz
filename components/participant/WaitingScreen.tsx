export default function WaitingScreen() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      <p className="text-lg text-gray-400">Waiting for the quiz to start...</p>
    </div>
  );
}
