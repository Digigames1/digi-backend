export interface Category {
  title: string;
  icon: string;
  link: string;
}

const categories: Category[] = [
  { title: 'Gaming', icon: '/assets/icons/gaming.svg', link: '/gaming' },
  { title: 'Streaming', icon: '/assets/icons/streaming.svg', link: '/streaming' },
  { title: 'Shopping', icon: '/assets/icons/shopping.svg', link: '/shopping' },
  { title: 'Music', icon: '/assets/icons/music.svg', link: '/music' },
  { title: 'Food & Drink', icon: '/assets/icons/fooddrink.svg', link: '/fooddrink' },
  { title: 'Travel', icon: '/assets/icons/travel.svg', link: '/travel' },
];

export default categories;
