import { Sidebar, type SidebarSection } from '../layouts/Sidebar';

type Props = {
  title: string;
  sections?: SidebarSection[];
  description?: string;
};

export function Placeholder({ title, sections, description }: Props) {
  return (
    <>
      {sections && <Sidebar sections={sections} />}
      <div className="flex-1">
        <div className="flex h-[52px] items-center border-b border-outline-v px-6">
          <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
            {title}
          </h1>
        </div>
        <div className="p-6">
          <p className="text-sm text-text-3">{description ?? 'Em construção.'}</p>
        </div>
      </div>
    </>
  );
}
