export interface GiftCard {
  title: string;
  image: string;
  price: number;
  rating: number;
}

const featuredCards: GiftCard[] = [
  {
    title: 'PlayStation Store Gift Card',
    image: '/assets/icons/playstation.svg',
    price: 50,
    rating: 4.8,
  },
  {
    title: 'Netflix Gift Card',
    image: '/assets/icons/netflix.svg',
    price: 25,
    rating: 4.6,
  },
  {
    title: 'Steam Wallet Code',
    image: '/assets/icons/steam.svg',
    price: 20,
    rating: 4.9,
  },
];

export default featuredCards;
