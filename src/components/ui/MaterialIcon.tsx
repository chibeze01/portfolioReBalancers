// src/components/ui/MaterialIcon.tsx
import React from "react";

interface MaterialIconProps {
  icon: string;
  className?: string;
}

const MaterialIcon: React.FC<MaterialIconProps> = ({
  icon,
  className = "",
}) => {
  return <i className={`material-icons ${className}`}>{icon}</i>;
};

export default MaterialIcon;
