'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import styles from '@/components/Header/styles/searchBar.module.css';
import { addTrailingSlash } from '@/lib/url';

interface SearchSuggestion {
  id: string | number;
  name: string;
  slug: string;
  category?: string;
  image?: string;
  price?: string | number | null;
  alt?: string;
}

interface SearchBarProps {
  query: string;
  setQuery: (val: string) => void;
  onSearch: (e: FormEvent<HTMLFormElement>) => void;
  onSelectSuggestion?: () => void;
}

const MIN_QUERY_LENGTH = 1;
const DEBOUNCE_MS = 280;

function formatPrice(price: SearchSuggestion['price']) {
  if (price === null || price === undefined || price === '') return 'Liên hệ';

  const numericPrice = Number(price);

  if (!Number.isNaN(numericPrice) && numericPrice > 0) {
    return `${new Intl.NumberFormat('vi-VN').format(numericPrice)} đ`;
  }

  return String(price);
}

function withSmallImageParams(src?: string) {
  if (!src) return '/default-product.webp';
  if (!src.startsWith('http')) return src;

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}width=120&quality=70`;
}

export default function SearchBar({
  query,
  setQuery,
  onSearch,
  onSelectSuggestion,
}: SearchBarProps) {
  const wrapperRef = useRef<HTMLFormElement | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHasFocus(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!hasFocus || trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setError('');
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error('Không tải được gợi ý tìm kiếm.');
        }

        const data = (await response.json()) as { items?: SearchSuggestion[] };

        setSuggestions(data.items ?? []);
        setIsOpen(true);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setSuggestions([]);
          setError('Không tải được gợi ý sản phẩm.');
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, hasFocus]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setIsOpen(false);
    setHasFocus(false);
    onSearch(event);
  };

  const handleSuggestionClick = () => {
    setIsOpen(false);
    setHasFocus(false);
    onSelectSuggestion?.();
  };

  const shouldShowDropdown = isOpen && query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <form ref={wrapperRef} className={styles.searchWrapper} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tìm giường sắt, bàn văn phòng, ghế..."
        className={styles.searchInput}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          setHasFocus(true);
          if (query.trim()) setIsOpen(true);
        }}
        aria-label="Tìm kiếm sản phẩm nội thất"
        autoComplete="off"
      />

      <button type="submit" className={styles.searchBtn} aria-label="Nút tìm kiếm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>

      {shouldShowDropdown && (
        <div
          className={styles.suggestionDropdown}
          role="listbox"
          aria-label="Gợi ý sản phẩm"
        >
          {isLoading && <div className={styles.suggestionState}>Đang tìm...</div>}

          {!isLoading && error && <div className={styles.suggestionState}>{error}</div>}

          {!isLoading && !error && suggestions.length === 0 && (
            <div className={styles.suggestionState}>Không tìm thấy sản phẩm phù hợp</div>
          )}

          {!isLoading && !error && suggestions.length > 0 && (
            <ul className={styles.suggestionList}>
              {suggestions.map((item) => (
                <li key={item.id} className={styles.suggestionRow}>
                  <Link
                    href={addTrailingSlash(`/san-pham/${item.slug}`)}
                    className={styles.suggestionItem}
                    role="option"
                    aria-selected="false"
                    onClick={handleSuggestionClick}
                  >
                    <img
                      src={withSmallImageParams(item.image)}
                      alt={item.alt || item.name}
                      className={styles.suggestionImage}
                      loading="lazy"
                    />

                    <span className={styles.suggestionContent}>
                      <span className={styles.suggestionName}>{item.name}</span>

                      <span className={styles.suggestionMeta}>
                        {item.category ? <span>{item.category}</span> : null}
                        <strong>{formatPrice(item.price)}</strong>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
