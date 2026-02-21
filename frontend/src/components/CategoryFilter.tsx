"use client";

interface CategoryFilterProps {
  categories: { name: string; count: number }[];
  selected: string;
  onSelect: (cat: string) => void;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect("All")}
        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
          selected === "All"
            ? "bg-primary text-white shadow-lg shadow-primary/25"
            : "glass text-muted hover:text-foreground hover:border-primary/30"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
            selected === cat.name
              ? "bg-primary text-white shadow-lg shadow-primary/25"
              : "glass text-muted hover:text-foreground hover:border-primary/30"
          }`}
        >
          {cat.name}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              selected === cat.name
                ? "bg-white/20"
                : "bg-white/5"
            }`}
          >
            {cat.count}
          </span>
        </button>
      ))}
    </div>
  );
}
