import { Search } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { MarketingEngine } from "@/modules/commerce/marketing/marketing-engine";

export function KeywordsCard() {
    const keywords = MarketingEngine.getKeywords();

    return (
        <div className="p-6 rounded-[2rem] bg-bg-secondary border border-border" id="seo-keywords-card">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Search className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Mots-clés performants</h3>
            </div>

            <div className="space-y-4">
                {keywords.map((kw, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{kw.term}</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest">{kw.clicks} clics</p>
                        </div>
                        <div className={cn(
                            "text-sm font-black px-3 py-1 rounded-lg border",
                            (kw.avgPosition || 11) <= 3 ? 'text-[#00D9A6] bg-[#00D9A6]/5 border-[#00D9A6]/20' :
                                (kw.avgPosition || 11) <= 10 ? 'text-action-primary bg-action-primary/5 border-action-primary/20' :
                                    'text-status-danger bg-status-danger/5 border-rose-500/20'
                        )}>
                            #{(kw.avgPosition || 11).toFixed(1)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
