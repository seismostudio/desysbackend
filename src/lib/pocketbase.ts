import PocketBase from 'pocketbase';

const url = import.meta.env.VITE_POCKETBASE_URL || import.meta.env.VITE_API_URL || 'https://desysapi.daharengineer.com';
export const pb = new PocketBase(url);

