// Provider system — re-export public API

export { getProvider, listProviders, listProvidersByType, listProvidersByOS, listProvidersByIM, getAvailableProviders, getProviderStats } from './registry.js';
export { BaseProvider, CloudProvider, DesktopProvider, SaaSProvider, MobileProvider } from './base.js';
