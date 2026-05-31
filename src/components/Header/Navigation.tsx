"use client";
import { useEffect, useState, ReactNode } from 'react'; // Thêm ReactNode để nhận children
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// import styles from '@/styles/Header.module.css';
import { MENU_ITEMS, MenuItem } from './menuData'; 
import styles from './styles/navigation.module.css'

// Cập nhật Type: Thêm children?: ReactNode
interface NavigationProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  children?: ReactNode; 
}

export default function Navigation({ isOpen, setIsOpen, children }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);

  useEffect(() => {
    MENU_ITEMS.forEach((item) => {
      router.prefetch(item.link);
    });
  }, [router]);

  const prefetchMenuGroup = (item: MenuItem) => {
    router.prefetch(item.link);
    item.submenu?.forEach((sub) => {
      router.prefetch(sub.link);
    });
  };

  const handleToggleSubmenu = (e: React.MouseEvent, index: number, hasSub: boolean) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024 && hasSub) {
    // if (window.innerWidth <= 1024 && hasSub) {

      e.preventDefault();
      e.stopPropagation(); 
      setActiveSubmenu(activeSubmenu === index ? null : index);
    }
  };

  return (
    <>
      {/* Lớp phủ đen khi mở menu mobile. */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      <nav className={`${styles.nav} ${isOpen ? styles.navActive : ''}`}>
        
        {/* Hiển thị ô tìm kiếm trong menu mobile. */}
        {isOpen && children}
        {/* {children} */}

        <ul className={styles.menuList}>
          {MENU_ITEMS.map((item, index) => {
            const hasSub = !!(item.submenu && item.submenu.length > 0);
            const isSubOpen = activeSubmenu === index;

            return (
              <li
                key={index}
                className={`${styles.menuWrapper} ${hasSub ? styles.hasDropdown : ''}`}
                onMouseEnter={() => prefetchMenuGroup(item)}
                onFocus={() => prefetchMenuGroup(item)}
              >
                <div className={styles.itemContainer}>
                  <Link 
                    href={item.link} 
                    className={`${styles.menuItem} ${pathname === item.link ? styles.active : ''}`}
                    onClick={(e) => {
                      if (hasSub) {
                        handleToggleSubmenu(e, index, hasSub);
                      } else {
                        setIsOpen(false);
                      }
                    }}
                  >
                    {item.name}
                    {hasSub && (
                      <span className={`${styles.arrowIcon} ${isSubOpen ? styles.arrowRotate : ''}`}>
                        
                      </span>
                    )}
                  </Link>
                </div>

                {hasSub && (
                  <ul className={`${styles.dropdownMenu} ${isSubOpen ? styles.showMobileSub : ''}`}>
                    {item.submenu!.map((sub, sIdx) => (
                      <li key={sIdx}>
                        <Link 
                          href={sub.link} 
                          onClick={() => {
                            setIsOpen(false);
                            setActiveSubmenu(null);
                          }}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
