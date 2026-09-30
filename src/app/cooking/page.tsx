export const metadata = {
  title: "Cooking — Jimmy Nguyen",
  description: "Upcoming cooking project.",
};

export default function CookingPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-app mb-2">
          Upcoming Cooking Project
        </h1>
        <p className="text-muted text-lg">
          Expiring pantry items? What can you do with them...
        </p>
      </header>
    </div>
  );
}
