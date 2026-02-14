
import React from 'react';
import { Package } from './types';

export const PACKAGES: Package[] = [
  { id: '100', name: 'أبو 100', basePrice: 100, wholesalePrice: 90 },
  { id: '250', name: 'أبو 250', basePrice: 250, wholesalePrice: 230 },
  { id: '500', name: 'أبو 500', basePrice: 500, wholesalePrice: 450 },
  { id: '1000', name: 'أبو 1000', basePrice: 1000, wholesalePrice: 900 },
];

export const PAYMENT_METHODS = [
  { id: 'jeeb', name: 'جيب (Jeeb)' },
  { id: 'haseb', name: 'حاسب (Haseb)' },
  { id: 'jawaly', name: 'جوالي (Jawaly)' },
  { id: 'floosak', name: 'فلوسك (Floosak)' },
  { id: 'bank', name: 'حوالة بنكية' },
];

export const WALLET_DISCOUNT = 0.05; // 5%
