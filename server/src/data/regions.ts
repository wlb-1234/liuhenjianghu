import regionsData from './regions.json';
export const provinces = (regionsData as any).provinces || [];
export const cities = (regionsData as any).cities || {};
export const districts = (regionsData as any).districts || {};
export const streets = (regionsData as any).streets || {};
