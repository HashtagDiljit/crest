import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecipesContent } from "./_components/RecipesContent";

export default function RecipesPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/nutrition"
          className="w-8 h-8 rounded-r3 border border-border bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-24 md:text-32 font-semibold text-text-primary tracking-tight">
            Recipes
          </h1>
          <p className="text-13 text-text-secondary mt-0.5">
            30 high-protein recipes — South Asian, meal-prep, quick, and more.
          </p>
        </div>
      </div>
      <RecipesContent />
    </div>
  );
}
