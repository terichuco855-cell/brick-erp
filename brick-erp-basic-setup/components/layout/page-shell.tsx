import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  subtitle,
  children,
  className,
}: PageShellProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <div className={cn('flex-1 p-6', className)}>{children}</div>
    </>
  );
}
