import { NavLink } from 'react-router-dom';

export type SidebarItem = {
  name: string;
  count?: number;
  to?: string;
  active?: boolean;
  onClick?: () => void;
};

export type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

const itemBase =
  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors';
const itemIdle = 'text-text-2 hover:bg-surface-2 hover:text-text-1';
const itemActive = 'bg-neon/10 text-neon';

function ItemContent({ item }: { item: SidebarItem }) {
  return (
    <>
      <span>{item.name}</span>
      {item.count !== undefined && (
        <span className="font-mono text-xs text-text-3">{item.count}</span>
      )}
    </>
  );
}

export function Sidebar({ sections }: { sections: SidebarSection[] }) {
  return (
    <aside className="w-[196px] shrink-0 border-r border-outline-v bg-bg-lowest px-3 py-5">
      {sections.map((section) => (
        <div key={section.label} className="mb-6">
          <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-widest text-text-3">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.name}>
                {item.to ? (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `${itemBase} ${item.active ?? isActive ? itemActive : itemIdle}`
                    }
                  >
                    <ItemContent item={item} />
                  </NavLink>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className={`${itemBase} ${item.active ? itemActive : itemIdle}`}
                  >
                    <ItemContent item={item} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
