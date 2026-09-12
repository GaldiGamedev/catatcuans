import React from 'react';
import {
  Wallet,
  Building2,
  Smartphone,
  PiggyBank,
  CreditCard,
  Utensils,
  Bus,
  ShoppingBag,
  Receipt,
  GraduationCap,
  Gamepad2,
  Coins,
  Briefcase,
  Laptop,
  Gift,
  TrendingUp,
  HeartPulse,
  Coffee,
  Car,
  Fuel,
  Home,
  Tag,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Wallet,
  Building2,
  Smartphone,
  PiggyBank,
  CreditCard,
  Utensils,
  Bus,
  ShoppingBag,
  Receipt,
  GraduationCap,
  Gamepad2,
  Coins,
  Briefcase,
  Laptop,
  Gift,
  TrendingUp,
  HeartPulse,
  Coffee,
  Car,
  Fuel,
  Home,
  Tag,
};

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent {...props} />;
};
