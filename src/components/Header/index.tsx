"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import SearchBar from './SearchBar';
import Navigation from './Navigation';
import ActionButtons from './ActionButtons'; 
import styles from './styles/index.module.css';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className={`${styles.header} ${isSticky ? styles.sticky : ''}`}>
      <div className={styles.topBar}>
          {/* Nút Hamburger cuối cùng bên phải */}
          <button 
            className={styles.hamburger} 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            aria-label="Menu"
          >
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
            <span className={styles.bar}></span>
          </button> 
        {/* 1. Logo đưa lên đầu để nằm bên TRÁI trên Mobile */}
        <div className={styles.logoWrapper}>
          <Logo />
        </div>

        {/* 2. Ô TÌM KIẾM DESKTOP (Sẽ tự ẩn trên mobile bằng CSS của bạn) */}
        <div className={styles.desktopSearch}>
          <SearchBar query={searchQuery} setQuery={setSearchQuery} onSearch={handleSearch} />
        </div>

        {/* 3. Cụm chức năng đưa sang PHẢI (Tìm kiếm, Giỏ hàng, Menu) */}
        <div className={styles.contactInfo}>
          {/* Nút Tìm kiếm Mobile */}
          <button 
            className={styles.mobileSearchBtn} 
            onClick={() => setIsSearchOpen(!isSearchOpen)} 
            aria-label="Tìm kiếm"
          >
           <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth="1.5" 
    stroke="currentColor" 
    width="24" 
    height="24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
          </button>
          
          {/* Giỏ hàng (ActionButtons) */}
          <ActionButtons />

        
        </div>
      </div>

      {/* Ô tìm kiếm thả xuống khi bấm icon Search Mobile */}
      <div className={`${styles.mobileSearchDropdown} ${isSearchOpen ? styles.searchActive : ''}`}>
          <SearchBar query={searchQuery} setQuery={setSearchQuery} onSearch={handleSearch} />
      </div>

      {/* Menu điều hướng */}
      <Navigation isOpen={isMenuOpen} setIsOpen={setIsMenuOpen}>
          <div className={styles.mobileMenuSearch}>
              <SearchBar query={searchQuery} setQuery={setSearchQuery} onSearch={handleSearch} />
          </div>
      </Navigation>
      
    </header>
  );
}