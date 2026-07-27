import { Clock, MapPin, Star } from 'lucide-react';

export default function SkillCard({ skill, onClick }) {
  const priceLabel = skill.isFree ? 'Free' : `$${skill.price}`;
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)]"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold leading-tight">{skill.title}</h3>
        <span className="shrink-0 rounded-full border border-accent2/30 bg-accent2/15 px-2.5 py-0.5 text-xs font-semibold text-accent2">
          {priceLabel}
        </span>
      </div>
      <p className="mb-3 line-clamp-2 text-[13px] text-muted">{skill.description}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(skill.tags || []).slice(0, 3).map((t) => (
          <span key={t} className="rounded-full border border-accent/25 bg-accent/15 px-2.5 py-0.5 text-xs text-accent">
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {skill.durationMinutes}min
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} /> {skill.mode === 'online' ? 'Online' : 'Offline'}
        </span>
        {skill.totalReviews > 0 && (
          <span className="flex items-center gap-1">
            <Star size={12} className="fill-warning text-warning" /> {skill.averageRating?.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
