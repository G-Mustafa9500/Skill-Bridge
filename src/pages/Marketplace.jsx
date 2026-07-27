import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import Navbar from '../components/Navbar';
import SkillCard from '../components/SkillCard';
import Spinner from '../components/Spinner';
import { browseSkills } from '../services/skillService';
import { getAllCategories } from '../services/categoryService';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function Marketplace() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [skills, setSkills] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  const loadSkills = useCallback(async (reset = true) => {
    reset ? setLoading(true) : setLoadingMore(true);
    const { items, nextCursor, error: err } = await browseSkills({
      categoryId: categoryId || undefined,
      level: level || undefined,
      cursor: reset ? undefined : cursor,
    });
    if (err) setError(err);
    setSkills((prev) => (reset ? items : [...prev, ...items]));
    setCursor(nextCursor);
    setLoading(false);
    setLoadingMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, level]);

  useEffect(() => {
    loadSkills(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, level]);

  const filtered = search
    ? skills.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.description.toLowerCase().includes(search.toLowerCase()) ||
          (s.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : skills;

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mb-1 text-[28px]">Skill Marketplace</h1>
            <p className="text-sm text-muted">Find a mentor, or offer your own skills to the community.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/marketplace/new')}>
            <Plus size={16} /> Create Listing
          </button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="pl-10"
            placeholder="Search by title, description, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2.5">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="!w-auto min-w-[160px]">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="!w-auto min-w-[140px]">
            <option value="">All Levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
          {(categoryId || level || search) && (
            <button
              className="btn-secondary text-xs"
              onClick={() => {
                setCategoryId('');
                setLevel('');
                setSearch('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {error && <div className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-3xl">
              🔍
            </div>
            <h3 className="text-lg">No listings found</h3>
            <p className="mt-1.5 text-sm text-muted">Try adjusting your filters, or be the first to post one.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((s) => (
                <SkillCard key={s.id} skill={s} onClick={() => navigate(`/marketplace/${s.id}`)} />
              ))}
            </div>
            {cursor && !search && (
              <div className="mt-6 flex justify-center">
                <button className="btn-secondary" onClick={() => loadSkills(false)} disabled={loadingMore}>
                  {loadingMore ? <Spinner size={16} /> : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
