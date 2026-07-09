"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import SearchBar from './SearchBar';
import Navigation from './Navigation';
import ActionButtons from './ActionButtons';
import styles from './styles/index.module.css';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let lastSticky = window.scrollY > 80;
    setIsSticky(lastSticky);

    const handleScroll = () => {
      const nextSticky = window.scrollY > 80;

      if (nextSticky !== lastSticky) {
        lastSticky = nextSticky;
        setIsSticky(nextSticky);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      setIsMenuOpen(false);
      setIsSearchOpen(false);
    }
  };

  const handleSuggestionSelect = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  };

  return (
    <header className={`${styles.header} ${isSticky ? styles.sticky : ''}`}>
      <div className={styles.announceBar}>
        <div className={styles.announceInner}>
          <span>NỘI THẤT HÙNG NGỌC - TỔNG KHO NỘI THẤT GIÁ XƯỞNG HÀ NỘI</span>
        </div>
      </div>

      <div className={styles.topBar}>
        <button
          className={styles.hamburger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
          type="button"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>

        <div className={styles.logoWrapper}>
          <Logo />
        </div>

        <div className={styles.desktopInfo}>
          <a href="tel:0347227377" className={styles.infoItem}>
            <span className={styles.infoIcon}>☎</span>
            <span>
              <strong>HOTLINE</strong>0347 227 377
            </span>
          </a>
          <a href="mailto:noithathungngoc@gmail.com" className={styles.infoItem}>
            <span className={styles.infoIcon}>✉</span>
            <span>
              <strong>EMAIL</strong>noithathungngoc@gmail.com
            </span>
          </a>
          <a
            href="https://www.google.com/maps/search/213+Nguy%E1%BB%85n+V%C4%83n+Gi%C3%A1p,+Nam+T%E1%BB%AB+Li%C3%AAm,+H%C3%A0+N%E1%BB%99i"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.infoItem}
          >
            <span className={styles.infoIcon}>⌖</span>
            <span>
              <strong>SHOWROOM</strong>213 Nguyễn Văn Giáp, Hà Nội
            </span>
          </a>
        </div>

        <div className={styles.desktopSearch}>
          <SearchBar
            query={searchQuery}
            setQuery={setSearchQuery}
            onSearch={handleSearch}
            onSelectSuggestion={handleSuggestionSelect}
          />
        </div>

        <div className={styles.contactInfo}>
          <button
            className={styles.mobileSearchBtn}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Tìm kiếm"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              width="24"
              height="24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>

          <ActionButtons />
        </div>
      </div>

      <div className={`${styles.mobileSearchDropdown} ${isSearchOpen ? styles.searchActive : ''}`}>
        <SearchBar
          query={searchQuery}
          setQuery={setSearchQuery}
          onSearch={handleSearch}
          onSelectSuggestion={handleSuggestionSelect}
        />
      </div>

      <Navigation isOpen={isMenuOpen} setIsOpen={setIsMenuOpen}>
        <div className={styles.mobileMenuSearch}>
          <SearchBar
            query={searchQuery}
            setQuery={setSearchQuery}
            onSearch={handleSearch}
            onSelectSuggestion={handleSuggestionSelect}
          />
        </div>
      </Navigation>
    </header>
  );
}
