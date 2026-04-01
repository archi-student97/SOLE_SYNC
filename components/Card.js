import styles from "./Card.module.css";

export default function Card({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  trend,
  children,
  className = "",
}) {
  return (
    <div className={`${styles.card} ${styles[variant]} ${className}`}>
      <div className={styles.cardHeader}>
        {title && <div className={styles.title}>{title}</div>}
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>
      {value !== undefined && <div className={styles.value}>{value}</div>}
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {trend && (
        <div className={`${styles.trend} ${trend > 0 ? styles.trendUp : styles.trendDown}`}>
          {trend > 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}%
        </div>
      )}
      {children}
    </div>
  );
}
