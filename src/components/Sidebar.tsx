/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import {
  BookMarked,
  Cat,
  Clover,
  Film,
  Home,
  Radio,
  Search,
  Star,
  Tv,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useSite } from './SiteProvider';

interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
});

export const useSidebar = () => useContext(SidebarContext);

const Logo = () => {
  const { siteName } = useSite();
  return (
    <span className='text-2xl font-black text-[#ff3e6c] font-[Impact] tracking-wider whitespace-nowrap'>
      {siteName}
    </span>
  );
};

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  activePath?: string;
}

const Sidebar = ({ activePath = '/' }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(activePath);

  useEffect(() => {
    if (activePath) {
      setActive(activePath);
    } else {
      const getCurrentFullPath = () => {
        const queryString = searchParams.toString();
        return queryString ? `${pathname}?${queryString}` : pathname;
      };
      setActive(getCurrentFullPath());
    }
  }, [activePath, pathname, searchParams]);

  const handleSearchClick = () => {
    router.push('/search');
  };

  const contextValue = { isCollapsed: true };

  const [menuItems, setMenuItems] = useState([
    { icon: Film, label: '電影', href: '/douban?type=movie' },
    { icon: Tv, label: '劇集', href: '/douban?type=tv' },
    { icon: Cat, label: '動漫', href: '/douban?type=anime' },
    { icon: Clover, label: '綜藝', href: '/douban?type=show' },
  ]);

  useEffect(() => {
    const rc = (window as any).RUNTIME_CONFIG;
    if (rc?.ENABLE_WEB_LIVE) {
      setMenuItems((p) => p.some((i) => i.href === '/live') ? p : [...p, { icon: Radio, label: '直播', href: '/live' }]);
    }
    if (rc?.CUSTOM_CATEGORIES?.length > 0) {
      setMenuItems((p) => p.some((i) => i.href === '/douban?type=custom') ? p : [...p, { icon: Star, label: '自定義', href: '/douban?type=custom' }]);
    }
  }, []);

  const NavLink = ({
    href,
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    href: string;
    icon: any;
    label: string;
    isActive: boolean;
    onClick?: (e: any) => void;
  }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center transition-all duration-300 rounded-xl ${
        isActive
          ? 'bg-gradient-to-r from-[#ff3e6c]/20 to-transparent border-[#ff3e6c] text-white'
          : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
      } flex-col group-hover/sidewrap:flex-row group-hover/sidewrap:px-4 px-2 py-2 group-hover/sidewrap:py-3 group-hover/sidewrap:border-l-4 border-l-2 group-hover/sidewrap:justify-start justify-center gap-1 group-hover/sidewrap:gap-4`}
    >
      <div className='w-6 h-6 flex items-center justify-center flex-shrink-0'>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
      </div>
      <span className='text-[10px] text-gray-400 text-center transition-all duration-200 whitespace-nowrap group-hover/sidewrap:text-base group-hover/sidewrap:text-white group-hover/sidewrap:text-left group-hover/sidewrap:ml-3'>
        {label}
      </span>
    </Link>
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className='group/sidewrap hidden md:flex'>
        <aside className='fixed top-0 left-0 h-screen z-50 flex flex-col items-center py-8 glass-panel border-r border-white/5 dark:border-white/5 transition-all duration-300 w-24 group-hover/sidewrap:w-64 bg-white/90 dark:bg-transparent'>
          <div className='flex items-center justify-center group-hover/sidewrap:justify-start gap-3 mb-12 px-4 w-full'>
            <span className='flex-shrink-0 text-xl'>📺</span>
            <span className='hidden group-hover/sidewrap:inline transition-opacity duration-200 whitespace-nowrap'>
              <Logo />
            </span>
          </div>

          <nav className='flex-1 w-full px-3 space-y-2 flex flex-col items-center group-hover/sidewrap:items-stretch'>
            <NavLink href='/' icon={Home} label='首頁' isActive={active === '/'} onClick={() => setActive('/')} />
            <NavLink
              href='/search'
              icon={Search}
              label='搜索'
              isActive={active === '/search'}
              onClick={(e) => { e.preventDefault(); handleSearchClick(); setActive('/search'); }}
            />
            <NavLink
              href='/?tab=favorites'
              icon={BookMarked}
              label='收藏夾'
              isActive={active === '/?tab=favorites'}
              onClick={() => setActive('/?tab=favorites')}
            />

            <div className='border-t border-white/10 my-4' />

            {menuItems.map((item) => {
              const typeMatch = item.href.match(/type=([^&]+)/)?.[1];
              const decodedActive = decodeURIComponent(active);
              const decodedItemHref = decodeURIComponent(item.href);
              const isActive =
                decodedActive === decodedItemHref ||
                (decodedActive.startsWith('/douban') &&
                  decodedActive.includes(`type=${typeMatch}`));
              return (
                <NavLink
                  key={item.label}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  onClick={() => setActive(item.href)}
                />
              );
            })}
          </nav>

          <span className='opacity-0 group-hover/sidewrap:opacity-100 transition-opacity duration-200 text-[10px] text-zinc-600 mt-auto'>
            v1.1.0
          </span>
        </aside>
        <div className='w-24 group-hover/sidewrap:w-64 transition-all duration-300' />
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
