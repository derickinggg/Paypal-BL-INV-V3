// Configuration file for the PayPal Integration application

// Environment configuration
export const isDevelopment = import.meta.env.DEV;

// API Configuration
export const apiBaseUrl = isDevelopment 
  ? 'http://localhost:4000' 
  : 'https://your-production-api.com';

// Application settings
export const appName = 'PayPal Integration Toolkit';
export const appVersion = '1.0.0';

// Default values
export const defaultCurrency = 'USD';
export const defaultEnvironment = 'sandbox';
export const defaultLookbackDays = 30;

// PayPal documentation links
export const paypalDocs = {
  sandbox: 'https://developer.paypal.com/docs/api/overview/#get-credentials',
  live: 'https://developer.paypal.com/docs/checkout/',
  webhooks: 'https://developer.paypal.com/docs/api/webhooks/',
};
