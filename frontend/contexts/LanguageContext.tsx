import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'cn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.loginButton': 'Sign In',
    'auth.registerButton': 'Create Account',
    'auth.switchToRegister': "Don't have an account? Register",
    'auth.switchToLogin': 'Already have an account? Login',
    'auth.logout': 'Logout',
    
    // Dashboard
    'dashboard.title': 'PayPal Balance Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.subtitle': 'Advanced PayPal Integration Dashboard • Real-time Analytics',
    'dashboard.activeCredentials': 'Active API Credentials',
    'dashboard.selectCredentials': 'Select API credentials',
    'dashboard.noCredentials': 'No credentials configured',
    'dashboard.validating': 'Validating...',
    'dashboard.validate': 'Validate',
    'dashboard.apiValidationSuccess': '✅ API Validation Successful',
    'dashboard.apiValidationFailed': '❌ API Validation Failed',
    'dashboard.apiInfo': 'API Information',
    'dashboard.accountType': 'Account Type',
    'dashboard.clientId': 'Client ID',
    'dashboard.lastValidated': 'Last Validated',
    'dashboard.capabilities': 'Capabilities',
    'dashboard.advancedCheckout': 'Advanced Checkout',
    'dashboard.cardPayments': 'Card Payments',
    'dashboard.supported': 'Supported',
    'dashboard.notSupported': 'Not Supported',
    'dashboard.errorDetails': 'Error Details',
    
    // Tabs
    'tabs.checkout': 'Advanced Checkout',
    'tabs.balance': 'Balance Insights',
    'tabs.credentials': 'Credentials',
    'tabs.history': 'Transaction History',
    
    // Checkout
    'checkout.title': 'Card Checkout',
    'checkout.description': 'Connect with your client credentials, load the SDK, and capture a card authorization in seconds.',
    'checkout.amount': 'AMOUNT',
    'checkout.validateApi': 'Validate API',
    'checkout.cardholderName': 'Cardholder Name (optional)',
    'checkout.cardNumber': 'Card number',
    'checkout.expiryDate': 'MM / YY',
    'checkout.cvv': 'CVV',
    'checkout.collectPayment': 'Collect Payment',
    'checkout.awaitingValidation': 'Awaiting validation...',
    
    // Balance
    'balance.title': 'PayPal Balance',
    'balance.current': 'Current Balance',
    'balance.loading': 'Loading balance...',
    'balance.error': 'Failed to load balance',
    'balance.refresh': 'Refresh',
    'balance.insights': 'Balance Insights',
    'balance.description': 'Monitor your PayPal account balances and transaction analytics in real-time',
    'balance.currentBalanceTitle': 'Current Balance',
    'balance.currentBalanceDesc': 'Displays the primary balance returned by PayPal API.',
    'balance.notLoaded': 'Not loaded',
    'balance.recentTransactions': 'Recent Transactions',
    'balance.recentTransactionsDesc': 'Filter transactions by date range to view specific periods.',
    'balance.today': 'Today',
    'balance.last3days': 'Last 3 days',
    'balance.last5days': 'Last 5 days',
    'balance.last7days': 'Last 7 days',
    'balance.last15days': 'Last 15 days',
    'balance.last30days': 'Last 30 days',
    'balance.customRange': 'Custom Range',
    'balance.update': 'Update',
    'balance.startDate': 'Start Date',
    'balance.endDate': 'End Date',
    'balance.searchRange': 'Search Range',
    'balance.maxRange': 'Maximum range: 31 days (PayPal API limitation)',
    'balance.mostRecent': 'Most recent transactions',
    'balance.loadingTransactions': 'Loading transactions...',
    'balance.noTransactions': 'No transactions found',
    'balance.noTransactionsDesc': 'Try adjusting your date range or validate your API credentials',
    'balance.getCurrentBalance': 'Get Current Balance',
    'balance.refreshTransactions': 'Refresh Transactions',
    'balance.todaysTransactions': "Today's Transactions",
    'balance.status': 'Status',
    'balance.code': 'Code',
    'balance.fee': 'Fee',
    
    // Credentials
    'credentials.title': 'PayPal Credentials',
    'credentials.managerTitle': 'API Credentials Manager',
    'credentials.managerDesc': 'Securely manage your PayPal API credentials with enterprise-grade encryption',
    'credentials.clientId': 'Client ID',
    'credentials.clientSecret': 'Client Secret',
    'credentials.environment': 'Environment',
    'credentials.sandbox': 'Sandbox',
    'credentials.live': 'Live',
    'credentials.save': 'Save Credentials',
    'credentials.saved': 'Credentials saved successfully',
    'credentials.error': 'Failed to save credentials',
    'credentials.remarks': 'Remarks',
    'credentials.remarksPlaceholder': 'Optional notes about these credentials...',
    
    // Transactions
    'transactions.title': 'Transaction History',
    'transactions.historyTitle': 'Transaction History',
    'transactions.historyDesc': 'Complete audit trail of all your PayPal transactions and activities',
    'transactions.loading': 'Loading transactions...',
    'transactions.error': 'Failed to load transactions',
    'transactions.empty': 'No transactions found',
    'transactions.date': 'Date',
    'transactions.amount': 'Amount',
    'transactions.type': 'Type',
    'transactions.status': 'Status',
    
    // Payment
    'payment.title': 'Advanced Checkout',
    'payment.amount': 'Amount',
    'payment.currency': 'Currency',
    'payment.description': 'Description',
    'payment.create': 'Create Payment',
    'payment.success': 'Payment created successfully',
    'payment.error': 'Failed to create payment',
    
    // Profile
    'profile.title': 'User Profile',
    'profile.loading': 'Loading profile...',
    'profile.error': 'Failed to load profile',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.language': 'Language',
  },
  cn: {
    // Auth
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.loginButton': '登录',
    'auth.registerButton': '创建账户',
    'auth.switchToRegister': '没有账户？注册',
    'auth.switchToLogin': '已有账户？登录',
    'auth.logout': '退出登录',
    
    // Dashboard
    'dashboard.title': 'PayPal 余额仪表板',
    'dashboard.welcome': '欢迎回来',
    'dashboard.subtitle': '高级 PayPal 集成仪表板 • 实时分析',
    'dashboard.activeCredentials': '活跃 API 凭据',
    'dashboard.selectCredentials': '选择 API 凭据',
    'dashboard.noCredentials': '未配置凭据',
    'dashboard.validating': '验证中...',
    'dashboard.validate': '验证',
    'dashboard.apiValidationSuccess': '✅ API 验证成功',
    'dashboard.apiValidationFailed': '❌ API 验证失败',
    'dashboard.apiInfo': 'API 信息',
    'dashboard.accountType': '账户类型',
    'dashboard.clientId': '客户端 ID',
    'dashboard.lastValidated': '最后验证时间',
    'dashboard.capabilities': '功能',
    'dashboard.advancedCheckout': '高级结账',
    'dashboard.cardPayments': '卡支付',
    'dashboard.supported': '支持',
    'dashboard.notSupported': '不支持',
    'dashboard.errorDetails': '错误详情',
    
    // Tabs
    'tabs.checkout': '高级结账',
    'tabs.balance': '余额洞察',
    'tabs.credentials': '凭据',
    'tabs.history': '交易历史',
    
    // Checkout
    'checkout.title': '卡结账',
    'checkout.description': '连接您的客户端凭据，加载 SDK，并在几秒钟内获取卡授权。',
    'checkout.amount': '金额',
    'checkout.validateApi': '验证 API',
    'checkout.cardholderName': '持卡人姓名（可选）',
    'checkout.cardNumber': '卡号',
    'checkout.expiryDate': 'MM / YY',
    'checkout.cvv': '安全码',
    'checkout.collectPayment': '收取付款',
    'checkout.awaitingValidation': '等待验证中...',
    
    // Balance
    'balance.title': 'PayPal 余额',
    'balance.current': '当前余额',
    'balance.loading': '加载余额中...',
    'balance.error': '加载余额失败',
    'balance.refresh': '刷新',
    'balance.insights': '余额洞察',
    'balance.description': '实时监控您的 PayPal 账户余额和交易分析',
    'balance.currentBalanceTitle': '当前余额',
    'balance.currentBalanceDesc': '显示 PayPal API 返回的主要余额。',
    'balance.notLoaded': '未加载',
    'balance.recentTransactions': '最近交易',
    'balance.recentTransactionsDesc': '按日期范围筛选交易以查看特定时期。',
    'balance.today': '今天',
    'balance.last3days': '最近3天',
    'balance.last5days': '最近5天',
    'balance.last7days': '最近7天',
    'balance.last15days': '最近15天',
    'balance.last30days': '最近30天',
    'balance.customRange': '自定义范围',
    'balance.update': '更新',
    'balance.startDate': '开始日期',
    'balance.endDate': '结束日期',
    'balance.searchRange': '搜索范围',
    'balance.maxRange': '最大范围：31天（PayPal API 限制）',
    'balance.mostRecent': '最近的交易',
    'balance.loadingTransactions': '加载交易中...',
    'balance.noTransactions': '未找到交易',
    'balance.noTransactionsDesc': '尝试调整日期范围或验证您的 API 凭据',
    'balance.getCurrentBalance': '获取当前余额',
    'balance.refreshTransactions': '刷新交易',
    'balance.todaysTransactions': '今日交易',
    'balance.status': '状态',
    'balance.code': '代码',
    'balance.fee': '费用',
    
    // Credentials
    'credentials.title': 'PayPal 凭据',
    'credentials.managerTitle': 'API 凭据管理器',
    'credentials.managerDesc': '使用企业级加密安全管理您的 PayPal API 凭据',
    'credentials.clientId': '客户端 ID',
    'credentials.clientSecret': '客户端密钥',
    'credentials.environment': '环境',
    'credentials.sandbox': '沙盒',
    'credentials.live': '生产',
    'credentials.save': '保存凭据',
    'credentials.saved': '凭据保存成功',
    'credentials.error': '保存凭据失败',
    'credentials.remarks': '备注',
    'credentials.remarksPlaceholder': '关于这些凭据的可选注释...',
    
    // Transactions
    'transactions.title': '交易历史',
    'transactions.historyTitle': '交易历史',
    'transactions.historyDesc': '您所有 PayPal 交易和活动的完整审计记录',
    'transactions.loading': '加载交易中...',
    'transactions.error': '加载交易失败',
    'transactions.empty': '未找到交易',
    'transactions.date': '日期',
    'transactions.amount': '金额',
    'transactions.type': '类型',
    'transactions.status': '状态',
    
    // Payment
    'payment.title': '高级结账',
    'payment.amount': '金额',
    'payment.currency': '货币',
    'payment.description': '描述',
    'payment.create': '创建支付',
    'payment.success': '支付创建成功',
    'payment.error': '创建支付失败',
    
    // Profile
    'profile.title': '用户资料',
    'profile.loading': '加载资料中...',
    'profile.error': '加载资料失败',
    
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.language': '语言',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'cn')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};