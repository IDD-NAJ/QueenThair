import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutGrid,
  Plus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Upload,
  Loader2,
  GripVertical
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getCategories } from '../../services/categoryService';
import LoadingState from '../../components/dashboard/LoadingState';
import useStore from '../../store/useStore';
import { slugFromShopHref } from '../../utils/categoryShowcase';

function newItem(sortOrder) {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hcs-${Date.now()}-${sortOrder}`,
    sort_order: sortOrder,
    active: true,
    title: '',
    description: '',
    href: '/shop',
    slug: '',
    image_url: '',
    video_url: ''
  };
}

export default function AdminHomepageShowcase() {
  const showToast = useStore((s) => s.showToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sectionActive, setSectionActive] = useState(true);
  const [title, setTitle] = useState('Shop by Category');
  const [subtitle, setSubtitle] = useState('Find your perfect style');
  const [items, setItems] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const fileInputRef = useRef(null);
  const [uploadPick, setUploadPick] = useState(null);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [saved, cats] = await Promise.all([
          adminService.getHomepageCategorySection(),
          getCategories({ activeOnly: true }).catch(() => [])
        ]);
        setCatalogCategories(cats || []);
        if (saved && typeof saved === 'object') {
          setSectionActive(saved.section_active !== false);
          setTitle(saved.title || 'Shop by Category');
          setSubtitle(saved.subtitle || 'Find your perfect style');
          const list = Array.isArray(saved.items) ? [...saved.items] : [];
          list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          setItems(list);
        } else {
          setSectionActive(true);
          setTitle('Shop by Category');
          setSubtitle('Find your perfect style');
          setItems([]);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [items]
  );

  const persistOrder = (list) =>
    list.map((it, i) => ({
      ...it,
      sort_order: i,
      slug: (typeof it.slug === 'string' && it.slug.trim()) || slugFromShopHref(it.href || ''),
    }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        section_active: sectionActive,
        title: title.trim(),
        subtitle: subtitle.trim(),
        items: persistOrder(sortedItems)
      };
      await adminService.saveHomepageCategorySection(payload);
      await adminService.logActivity(null, 'update', 'homepage_category_section', null, {
        itemCount: payload.items.length
      });
      setItems(payload.items);
      showToast('Homepage category section saved. It appears on the storefront after refresh.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const nextOrder = sortedItems.length ? Math.max(...sortedItems.map((i) => i.sort_order ?? 0)) + 1 : 0;
    setItems((prev) => [...prev, newItem(nextOrder)]);
  };

  const addFromCategory = (cat) => {
    const nextOrder = sortedItems.length ? Math.max(...sortedItems.map((i) => i.sort_order ?? 0)) + 1 : 0;
    setItems((prev) => [
      ...prev,
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hcs-${Date.now()}`,
        sort_order: nextOrder,
        active: true,
        title: cat.name,
        description: cat.description || '',
        href: `/shop/${cat.slug}`,
        slug: cat.slug || '',
        image_url: cat.image_url || '',
        video_url: ''
      }
    ]);
  };

  const removeItem = (id) => {
    const it = items.find((x) => x.id === id);
    if (it?.image_url) adminService.deleteHomepageShowcaseMediaIfOwned(it.image_url);
    if (it?.video_url) adminService.deleteHomepageShowcaseMediaIfOwned(it.video_url);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const openMediaPicker = (itemId, kind) => {
    setUploadPick({ itemId, kind });
    requestAnimationFrame(() => fileInputRef.current?.click());
  };

  const handleMediaFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const target = uploadPick;
    setUploadPick(null);
    if (!file || !target) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
    const videoExts = new Set(['mp4', 'webm', 'mov']);
    const type = (file.type || '').trim();
    const looksImage = type.startsWith('image/') || imageExts.has(ext);
    const looksVideo = type.startsWith('video/') || videoExts.has(ext);
    if (target.kind === 'image' && !looksImage) {
      setError('Please choose an image file (JPEG, PNG, WebP, or GIF).');
      return;
    }
    if (target.kind === 'video' && !looksVideo) {
      setError('Please choose a video file (MP4, WebM, or MOV).');
      return;
    }

    const key = `${target.itemId}:${target.kind}`;
    setUploadingKey(key);
    setError(null);
    const prevUrl =
      items.find((x) => x.id === target.itemId)?.[target.kind === 'image' ? 'image_url' : 'video_url'] || '';
    try {
      const url = await adminService.uploadHomepageShowcaseMedia(file);
      updateItem(target.itemId, target.kind === 'image' ? { image_url: url } : { video_url: url });
      if (prevUrl && prevUrl !== url) adminService.deleteHomepageShowcaseMediaIfOwned(prevUrl);
    } catch (err) {
      setError(
        err.message ||
          'Upload failed. Apply Supabase migration 033_homepage_showcase_storage.sql and sign in as an admin.'
      );
    } finally {
      setUploadingKey(null);
    }
  };

  const moveItem = (id, dir) => {
    const list = persistOrder([...sortedItems]);
    const idx = list.findIndex((x) => x.id === id);
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    setItems(persistOrder(list));
  };

  const reorderByDrop = (fromId, toId) => {
    if (!fromId || fromId === toId) return;
    const list = [...sortedItems];
    const fromIdx = list.findIndex((x) => x.id === fromId);
    const toIdx = list.findIndex((x) => x.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...list];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    setItems(persistOrder(next));
  };

  if (loading) return <LoadingState message="Loading homepage showcase…" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-indigo-600" />
            Homepage — Shop by Category
          </h1>
          <p className="mt-1 text-gray-600">
            Controls the category grid on the home page (copy, media, order, visibility). Empty image + link{' '}
            <code className="text-xs">/shop/category-slug</code> uses that category&apos;s catalog image on the storefront.
            With no active custom cards, the home page shows the first eight categories. Apply Supabase migrations{' '}
            <code className="text-xs">032</code> (public read) and <code className="text-xs">035</code> (seed row + policy)
            if the storefront never picks up saves. Use <strong>Upload</strong> for Storage (
            <code className="text-xs">033</code>). Drag the grip to reorder; replacing a card removes old Storage files when
            applicable.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save to database'}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={
          uploadPick?.kind === 'video'
            ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'
            : 'image/jpeg,image/png,image/webp,image/gif'
        }
        onChange={handleMediaFile}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSectionActive(!sectionActive)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                sectionActive
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              {sectionActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Section {sectionActive ? 'visible' : 'hidden'} on homepage
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Section title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          Add card
        </button>
        {catalogCategories.length > 0 && (
          <details className="relative">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100">
              Add from catalog…
            </summary>
            <div className="absolute z-20 mt-1 max-h-64 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {catalogCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => addFromCategory(cat)}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {cat.name}
                  <span className="block text-xs text-gray-400">/shop/{cat.slug}</span>
                </button>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="space-y-4">
        {sortedItems.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            No custom cards yet — the homepage will use your live categories (first 8). Add cards here to override with
            custom titles, images, and videos.
          </p>
        )}

        {sortedItems.map((it, index) => (
          <div
            key={it.id}
            onDragOver={(e) => {
              if (!draggingId || draggingId === it.id) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOverId(it.id);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget)) return;
              setDragOverId((cur) => (cur === it.id ? null : cur));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromId = e.dataTransfer.getData('text/plain');
              setDragOverId(null);
              setDraggingId(null);
              reorderByDrop(fromId, it.id);
            }}
            className={`rounded-lg border p-4 sm:p-5 transition-shadow ${
              it.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-80'
            } ${dragOverId === it.id && draggingId && draggingId !== it.id ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', it.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingId(it.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  className={`cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 active:cursor-grabbing ${
                    draggingId === it.id ? 'opacity-50' : ''
                  }`}
                  title="Drag to reorder"
                  role="button"
                  tabIndex={0}
                  aria-label="Drag to reorder card"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      moveItem(it.id, 'up');
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      moveItem(it.id, 'down');
                    }
                  }}
                >
                  <GripVertical className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={() => updateItem(it.id, { active: !it.active })}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  title={it.active ? 'Deactivate card' : 'Activate card'}
                >
                  {it.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <span className="text-xs font-medium text-gray-400">#{index + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(it.id, 'up')}
                  disabled={index === 0}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(it.id, 'down')}
                  disabled={index === sortedItems.length - 1}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="rounded p-1 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Card title</label>
                  <input
                    type="text"
                    value={it.title}
                    onChange={(e) => updateItem(it.id, { title: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. Lace Front Wigs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  <textarea
                    value={it.description || ''}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                    rows={2}
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Short line under the title"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
                    <LinkIcon className="h-3 w-3" /> Link path
                  </label>
                  <input
                    type="text"
                    value={it.href || ''}
                    onChange={(e) => updateItem(it.id, { href: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-xs"
                    placeholder="/shop/lace-front-wigs"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
                    <ImageIcon className="h-3 w-3" /> Image URL
                  </label>
                  <input
                    type="url"
                    value={it.image_url || ''}
                    onChange={(e) => updateItem(it.id, { image_url: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="https://… or /images/categories/…"
                  />
                  <button
                    type="button"
                    disabled={!!uploadingKey}
                    onClick={() => openMediaPicker(it.id, 'image')}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingKey === `${it.id}:image` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload image
                  </button>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
                    <Video className="h-3 w-3" /> Video URL (optional)
                  </label>
                  <input
                    type="url"
                    value={it.video_url || ''}
                    onChange={(e) => updateItem(it.id, { video_url: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="https://…mp4 — shows instead of image when set"
                  />
                  <button
                    type="button"
                    disabled={!!uploadingKey}
                    onClick={() => openMediaPicker(it.id, 'video')}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingKey === `${it.id}:video` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload video
                  </button>
                </div>
                {(it.image_url || it.video_url) && (
                  <div className="relative aspect-[4/5] max-h-48 overflow-hidden rounded-md border border-gray-100 bg-gray-900">
                    {it.video_url ? (
                      <video
                        src={it.video_url}
                        poster={it.image_url || undefined}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-6">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
