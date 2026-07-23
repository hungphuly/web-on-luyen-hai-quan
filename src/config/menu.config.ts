export type MenuItem = {
  title: string;
  href: string;
  icon?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
};

export const MENU_CONFIG: MenuItem[] = [
  {
    title: 'Trang chủ',
    href: '/',
  },
  {
    title: 'Giới thiệu',
    href: '/gioi-thieu',
  },
  {
    title: 'Ủng hộ',
    href: '/ung-ho',
  },
  {
    title: 'Dashboard',
    href: '/dashboard',
    requiresAuth: true,
  },
  {
    title: 'Hồ sơ cá nhân',
    href: '/profile',
    requiresAuth: true,
  },
  {
    title: 'Lịch sử học tập',
    href: '/tai-khoan/lich-su',
    requiresAuth: true,
  },
  {
    title: 'Flashcards',
    href: '/on-luyen/flashcards',
    requiresAuth: true,
  },
  {
    title: 'Bài giảng video',
    href: '/bai-giang/video',
    requiresAuth: true,
  },
  {
    title: 'Lý thuyết',
    href: '/bai-giang/ly-thuyet',
    requiresAuth: true,
  },
  {
    title: 'Tra cứu pháp luật',
    href: '/tai-lieu/tra-cuu',
    requiresAuth: true,
  },
  {
    title: 'Chuyên đề',
    href: '/tai-lieu/chuyen-de',
    requiresAuth: true,
  },
  {
    title: 'Quản lý ngân hàng đề',
    href: '/admin/ngan-hang-de',
    requiresAdmin: true,
  },
  {
    title: 'Duyệt giao dịch',
    href: '/admin/duyet-giao-dich',
    requiresAdmin: true,
  },
  {
    title: 'Báo cáo',
    href: '/admin/bao-cao',
    requiresAdmin: true,
  },
];
