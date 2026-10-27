"use client";

import { useState } from "react";
import { AdCard } from "@/components/ad-card";
import { AdModal } from "@/components/ad-modal";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const GROUP_ORDER = ["Reach", "Engagement", "Traffic", "Page Visit", "Page Like", "Other"];
const TOP_CONTENT_SIZE = 3;

// The most cost-efficient Engagement-objective ads by cost-per-engagement.
// Scoped to "Engagement" campaigns specifically, since cost-per-engagement
// isn't a meaningful ranking signal for Reach/Traffic/Page Visit/Page Like
// ads (their spend optimizes for a different outcome entirely).
function getTopContent(creatives) {
  return [...creatives]
    .filter((c) => c.campaignType === "Engagement" && c.metrics.costPerEngagement != null)
    .sort((a, b) => a.metrics.costPerEngagement - b.metrics.costPerEngagement)
    .slice(0, TOP_CONTENT_SIZE);
}

function groupByCampaignType(creatives) {
  const groups = new Map();
  for (const creative of creatives) {
    const key = creative.campaignType || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(creative);
  }
  return GROUP_ORDER.filter((key) => groups.has(key)).map((key) => {
    const items = groups.get(key);
    const totalSpend = items.reduce((sum, c) => sum + (c.metrics.spend || 0), 0);
    const totalResults = items.reduce((sum, c) => sum + (c.metrics.results || 0), 0);
    const resultsLabel = items[0]?.metrics.resultsLabel || "Results";
    return { key, items, totalSpend, totalResults, resultsLabel };
  });
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-violet-400" /> : null}
    </button>
  );
}

export function AdCreativesGrid({ creatives }) {
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const selected = creatives.find((c) => c.id === selectedId) || null;

  if (creatives.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
        No ad creatives delivered for this selection.
      </div>
    );
  }

  const groups = groupByCampaignType(creatives);
  const isAll = activeTab === "All";
  const isTopContent = activeTab === "Top Content";
  const visibleGroups = isAll ? groups : groups.filter((g) => g.key === activeTab);
  const totalSpend = creatives.reduce((sum, c) => sum + (c.metrics.spend || 0), 0);

  const topContent = getTopContent(creatives);
  const topContentSpend = topContent.reduce((sum, c) => sum + (c.metrics.spend || 0), 0);
  const topContentEngagement = topContent.reduce((sum, c) => sum + (c.metrics.engagements || 0), 0);

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800">
          <TabButton active={isAll} onClick={() => setActiveTab("All")}>
            All <span className="text-zinc-500">({creatives.length})</span>
          </TabButton>
          {topContent.length > 0 ? (
            <TabButton active={isTopContent} onClick={() => setActiveTab("Top Content")}>
              Top Content
            </TabButton>
          ) : null}
          {groups.map(({ key, items }) => (
            <TabButton key={key} active={activeTab === key} onClick={() => setActiveTab(key)}>
              {key} <span className="text-zinc-500">({items.length})</span>
            </TabButton>
          ))}
        </div>

        {isAll ? (
          <p className="text-xs text-zinc-500">Total spend {formatCurrency(totalSpend)}</p>
        ) : null}

        {isTopContent ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-sm font-medium text-zinc-300">
                Top Content <span className="text-zinc-500">({topContent.length})</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Spend {formatCurrency(topContentSpend)} · Total Engagement {formatNumber(topContentEngagement)}
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              The {topContent.length} best-performing ads, ranked by lowest cost per engagement.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topContent.map((creative) => (
                <AdCard
                  key={creative.id}
                  creative={creative}
                  onClick={() => setSelectedId(creative.id)}
                  highlightCostPerEngagement
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {visibleGroups.map(({ key, items, totalSpend: groupSpend, totalResults, resultsLabel }) => (
              <div key={key} className="flex flex-col gap-4">
                {isAll ? (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-sm font-medium text-zinc-300">
                      {key} <span className="text-zinc-500">({items.length})</span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Spend {formatCurrency(groupSpend)} · {resultsLabel} {formatNumber(totalResults)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Spend {formatCurrency(groupSpend)} · {resultsLabel} {formatNumber(totalResults)}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((creative) => (
                    <AdCard key={creative.id} creative={creative} onClick={() => setSelectedId(creative.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AdModal
        creative={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
}


