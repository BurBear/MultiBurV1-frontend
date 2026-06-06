import logoUrl from '../../assets/brand/multibur-logo.png';

export default function BrandLogo({ className = '', alt = 'MultiBur' }) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src={logoUrl}
      alt={alt}
    />
  );
}
