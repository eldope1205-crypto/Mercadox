import React from 'react';
import { 
  Tv, Smartphone, Laptop, Gamepad2, Cpu, Shirt, 
  Footprints, Home, Armchair, Activity, Bike, Car, 
  Camera, Music, BookOpen, Sparkles, Baby, Package 
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name?.toLowerCase()) {
    case 'tv':
    case 'electronica':
      return <Tv className={className} />;
    case 'smartphone':
    case 'moviles':
      return <Smartphone className={className} />;
    case 'laptop':
    case 'informatica':
      return <Laptop className={className} />;
    case 'gamepad2':
    case 'videojuegos':
      return <Gamepad2 className={className} />;
    case 'cpu':
    case 'consolas':
      return <Cpu className={className} />;
    case 'shirt':
    case 'ropa':
      return <Shirt className={className} />;
    case 'footprints':
    case 'calzado':
      return <Footprints className={className} />;
    case 'home':
    case 'hogar':
      return <Home className={className} />;
    case 'armchair':
    case 'muebles':
      return <Armchair className={className} />;
    case 'activity':
    case 'deportes':
      return <Activity className={className} />;
    case 'bike':
    case 'bicicletas':
      return <Bike className={className} />;
    case 'car':
    case 'motor':
      return <Car className={className} />;
    case 'camera':
    case 'fotografia':
      return <Camera className={className} />;
    case 'music':
    case 'musica':
      return <Music className={className} />;
    case 'bookopen':
    case 'libros':
      return <BookOpen className={className} />;
    case 'sparkles':
    case 'coleccionismo':
      return <Sparkles className={className} />;
    case 'baby':
    case 'bebes-y-ninos':
      return <Baby className={className} />;
    default:
      return <Package className={className} />;
  }
};
