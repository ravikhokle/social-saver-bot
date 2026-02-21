"use client";

import { useState } from "react";
import { testSaveUrl } from "@/lib/api";
import {
  PlusCircle,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Instagram,
  Twitter,
  Globe,
  Sparkles,
} from "lucide-react";

export default function AddLinkPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await testSaveUrl(url.trim());
      setResult({
        success: true,
        message: data.message || "Saved successfully!",
      });
      setUrl("");
    } catch (err) {
      setResult({
        success: false,
        message: "Failed to save. Please check the URL and try again.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <PlusCircle className="w-5 h-5 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-widest">
            Add Link
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Save a <span className="gradient-text">Link</span>
        </h1>
        <p className="text-sm text-muted">
          Paste any Instagram, Twitter, or article link and we&apos;ll analyze & save it for you.
        </p>
      </div>

      {/* Form card */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Link URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing & Saving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Save & Analyze Link
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div
            className={`mt-5 flex items-start gap-3 p-4 rounded-xl ${
              result.success
                ? "bg-success/10 border border-success/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                result.success ? "text-success" : "text-red-400"
              }`}
            >
              {result.message}
            </p>
          </div>
        )}
      </div>

      {/* Supported platforms */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-muted mb-4">
          Supported Platforms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: Instagram,
              name: "Instagram",
              desc: "Reels, Posts, Stories",
              color: "text-pink-400",
              bg: "bg-pink-500/10",
            },
            {
              icon: Twitter,
              name: "Twitter / X",
              desc: "Tweets, Threads",
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              icon: Globe,
              name: "Articles / Blogs",
              desc: "Any web page",
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
          ].map((p) => (
            <div
              key={p.name}
              className="glass rounded-xl p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-lg ${p.bg} flex items-center justify-center`}
              >
                <p.icon className={`w-5 h-5 ${p.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp info */}
      <div className="mt-8 glass rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Or use WhatsApp!
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Send any link to your Social Saver WhatsApp bot number and it will
              automatically be analyzed and saved here. No need to open this page
              — just forward links directly from Instagram or Twitter!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
