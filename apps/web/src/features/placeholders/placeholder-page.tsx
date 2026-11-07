export function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-4xl">{title}</h1>
      <p className="text-muted-foreground">{note}</p>
    </div>
  );
}
