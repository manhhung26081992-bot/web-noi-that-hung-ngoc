"use client";
import styles from '@/components/Header/styles/searchBar.module.css';
interface SearchBarProps {
  query: string;
  setQuery: (val: string) => void;
  onSearch: (e: React.FormEvent) => void;
}
export default function SearchBar({ query, setQuery, onSearch }: SearchBarProps) {
  return (
    <form className={styles.searchWrapper} onSubmit={onSearch}>
      <input 
        type="text" 
        placeholder="Tìm bàn văn phòng, ghế, sofa..." 
        className={styles.searchInput}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Tìm kiếm sản phẩm nội thất"
      />
      <button type="submit" className={styles.searchBtn} aria-label="Nút tìm kiếm">
        <svg 
  xmlns="http://www.w3.org/2000/svg" 
  fill="none" 
  viewBox="0 0 24 24" 
  strokeWidth="1.5" /* Nét mỏng sang trọng */
  stroke="currentColor" 
  width="24" 
  height="24"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
        {/* <svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="20" 
  height="20" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round"
>
  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
</svg> */}
      
      </button>
    </form>
  );
}