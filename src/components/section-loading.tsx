import s from './section-loading.module.css';

export function SectionLoading({ name, factory = false }: { name: string; factory?: boolean }) {
  return (
    <div className={`${s.loading} ${factory ? s.factory : ''}`} role="status">
      正在载入{name}…
    </div>
  );
}
