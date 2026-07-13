export default function OfflinePage() {
  return (
    <div className="px-6 pt-10 pb-24 text-center">
      <h1 className="text-xl font-semibold text-text-primary">You are offline</h1>
      <p className="text-sm text-text-secondary mt-2">
        Your habits are still available. Changes will sync when you reconnect.
      </p>
    </div>
  );
}
