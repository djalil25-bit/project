import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = {
  EN: 'en',
  FR: 'fr',
  AR: 'ar',
};

const translations = {
  en: {
    // Navigation
    nav_dashboard: 'Dashboard',
    nav_analytics: 'Analytics',
    nav_catalog: 'Catalog',
    nav_categories: 'Categories',
    nav_complaint_center: 'Complaint Center',
    nav_statistics: 'Statistics',
    nav_my_farms: 'My Farms',
    nav_orders: 'Orders',
    nav_my_listings: 'My Listings',
    nav_harvests: 'Harvests',
    nav_complaints: 'Complaints',
    nav_marketplace: 'Marketplace',
    nav_my_wishlist: 'My Wishlist',
    nav_my_cart: 'My Cart',
    nav_my_orders: 'My Orders',
    nav_invoices: 'Invoices',
    nav_marketboard: 'Marketboard',
    nav_my_fleet: 'My Fleet',
    nav_zones: 'Service Zones',
    nav_my_profile: 'My Profile',
    nav_logout: 'Logout',
    // Topbar
    topbar_notifications: 'Notifications',
    topbar_no_notifications: 'No active notifications',
    topbar_notif_sub: "We'll let you know when something happens!",
    topbar_mark_all_read: 'Mark all as read',
    topbar_close: 'Close',
    topbar_theme_light: 'Light',
    topbar_theme_dark: 'Dark',
    // Roles
    role_admin: 'Admin',
    role_farmer: 'Farmer',
    role_buyer: 'Buyer',
    role_transporter: 'Transporter',
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    view_all: 'View All',
    main_menu: 'Main Menu',
    account_settings: 'Account Settings',
  },
  fr: {
    nav_dashboard: 'Tableau de bord',
    nav_analytics: 'Analytique',
    nav_catalog: 'Catalogue',
    nav_categories: 'Catégories',
    nav_complaint_center: 'Centre de réclamations',
    nav_statistics: 'Statistiques',
    nav_my_farms: 'Mes Fermes',
    nav_orders: 'Commandes',
    nav_my_listings: 'Mes Annonces',
    nav_harvests: 'Récoltes',
    nav_complaints: 'Réclamations',
    nav_marketplace: 'Marché',
    nav_my_wishlist: 'Ma Liste de souhaits',
    nav_my_cart: 'Mon Panier',
    nav_my_orders: 'Mes Commandes',
    nav_invoices: 'Factures',
    nav_marketboard: 'Tableau de missions',
    nav_my_fleet: 'Ma Flotte',
    nav_zones: 'Zones de service',
    nav_my_profile: 'Mon Profil',
    nav_logout: 'Déconnexion',
    topbar_notifications: 'Notifications',
    topbar_no_notifications: 'Aucune notification active',
    topbar_notif_sub: 'Nous vous tiendrons informé !',
    topbar_mark_all_read: 'Tout marquer comme lu',
    topbar_close: 'Fermer',
    topbar_theme_light: 'Clair',
    topbar_theme_dark: 'Sombre',
    role_admin: 'Admin',
    role_farmer: 'Agriculteur',
    role_buyer: 'Acheteur',
    role_transporter: 'Transporteur',
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    edit: 'Modifier',
    delete: 'Supprimer',
    view: 'Voir',
    close: 'Fermer',
    search: 'Rechercher',
    filter: 'Filtrer',
    all: 'Tous',
    view_all: 'Voir tout',
    main_menu: 'Menu Principal',
    account_settings: 'Paramètres du compte',
  },
  ar: {
    nav_dashboard: 'لوحة التحكم',
    nav_analytics: 'التحليلات',
    nav_catalog: 'الكتالوج',
    nav_categories: 'الفئات',
    nav_complaint_center: 'مركز الشكاوى',
    nav_statistics: 'الإحصائيات',
    nav_my_farms: 'مزارعي',
    nav_orders: 'الطлбات',
    nav_my_listings: 'إعلاناتي',
    nav_harvests: 'المحاصيل',
    nav_complaints: 'الشكاوى',
    nav_marketplace: 'السوق',
    nav_my_wishlist: 'قائمة الرغبات',
    nav_my_cart: 'سلة التسوق',
    nav_my_orders: 'طلباتي',
    nav_invoices: 'الفواتير',
    nav_marketboard: 'لوحة المهام',
    nav_my_fleet: 'أسطولي',
    nav_zones: 'مناطق الخدمة',
    nav_my_profile: 'ملفي الشخصي',
    nav_logout: 'تسجيل الخروج',
    topbar_notifications: 'الإشعارات',
    topbar_no_notifications: 'لا توجد إشعارات نشطة',
    topbar_notif_sub: 'سنعلمك عند حدوث شيء!',
    topbar_mark_all_read: 'تحديد الكل كمقروء',
    topbar_close: 'إغلاق',
    topbar_theme_light: 'فاتح',
    topbar_theme_dark: 'داكن',
    role_admin: 'مسؤول',
    role_farmer: 'مزارع',
    role_buyer: 'مشتري',
    role_transporter: 'ناقل',
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    edit: 'تعديل',
    delete: 'حذف',
    view: 'عرض',
    close: 'إغلاق',
    search: 'بحث',
    filter: 'تصفية',
    all: 'الكل',
    view_all: 'عرض الكل',
    main_menu: 'القائمة الرئيسية',
    account_settings: 'إعدادات الحساب',
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('agrigov_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('agrigov_lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
};
