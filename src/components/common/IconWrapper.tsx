import React from "react";
import type { LucideIcon } from "lucide-react";
import type{ IconType } from "react-icons";

type AnyIcon = IconType | LucideIcon;

interface IconWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: AnyIcon;
  size?: number; // sets both width & height
  style?: React.CSSProperties;
}

const IconWrapper: React.FC<IconWrapperProps> = ({
  icon: Icon,
  size = 40,
  style = {},
  ...props
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      {...props}
    >
      <Icon style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default IconWrapper;