export type MenuItem = {
  title: string;
  href: string;
  icon?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
  iconWatermark?: string;
};

export const MENU_CONFIG: MenuGroup[] = [
  {
    label: 'Khám phá',
    items: [
      {
        title: 'Trang chủ',
        href: '/',
        icon: 'home',
      },
      {
        title: 'Giới thiệu',
        href: '/gioi-thieu',
        icon: 'info',
      }
    ]
  },
  {
    label: 'Học tập',
    iconWatermark: 'container',
    items: [
      {
        title: 'Bài giảng',
        href: '/bai-giang',
        icon: 'book-open',
        requiresAuth: true,
      },
      {
        title: 'Ôn luyện',
        href: '/on-luyen',
        icon: 'graduation-cap',
        requiresAuth: true,
      },
      {
        title: 'Flashcards',
        href: '/flashcards',
        icon: 'credit-card',
        requiresAuth: true,
      },
      {
        title: 'Thi thử',
        href: '/thi-thu',
        icon: 'check-square',
        requiresAuth: true,
      },
      {
        title: 'Tra cứu pháp luật',
        href: '/tai-lieu/tra-cuu',
        icon: 'scale',
        requiresAuth: true,
      },
      {
        title: 'Lịch sử học tập',
        href: '/tai-khoan/lich-su',
        icon: 'history',
        requiresAuth: true,
      }
    ]
  },
  {
    label: 'Tài khoản',
    iconWatermark: 'heart',
    items: [
      {
        title: 'Hồ sơ cá nhân',
        href: '/profile',
        icon: 'user',
        requiresAuth: true,
      },
      {
        title: 'Ủng hộ',
        href: '/ung-ho',
        icon: 'heart',
        requiresAuth: true,
      }
    ]
  },
  {
    label: 'Quản trị',
    iconWatermark: 'database',
    items: [
      {
        title: 'Chuyên đề',
        href: '/tai-lieu/chuyen-de',
        icon: 'file-text',
        requiresAdmin: true,
      },
      {
        title: 'Giới thiệu',
        href: '/admin/gioi-thieu',
        icon: 'info',
        requiresAdmin: true,
      },
      {
        title: 'Quản lý ngân hàng đề',
        href: '/admin/ngan-hang-de',
        icon: 'database',
        requiresAdmin: true,
      },
      {
        title: 'Quản lý flashcard',
        href: '/admin/flashcard',
        icon: 'credit-card',
        requiresAdmin: true,
      },
      {
        title: 'Quản lý tài liệu pháp luật',
        href: '/admin/tai-lieu',
        icon: 'scale',
        requiresAdmin: true,
      },
      {
        title: 'Duyệt giao dịch',
        href: '/admin/duyet-giao-dich',
        icon: 'check-square',
        requiresAdmin: true,
      },
      {
        title: 'Báo cáo',
        href: '/admin/bao-cao',
        icon: 'bar-chart-2',
        requiresAdmin: true,
      }
    ]
  }
];
