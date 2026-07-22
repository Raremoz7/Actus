import { PageHeader } from '../components/ui/PageHeader';
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
        <PageHeader title={title} />
        <div className="p-6">
          <p className="text-sm text-text-3">{description ?? 'Em construção.'}</p>
        </div>
      </div>
    </>
  );
}
