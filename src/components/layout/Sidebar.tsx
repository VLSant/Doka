/**
 * Desktop sidebar: Doka logo, profile-adapted menu (derived from
 * `menu-config.ts`), active-state highlighting, hidden/disabled semantics,
 * and keyboard-accessible navigation.
 *
 * Per `route-navigation-contract.md` "Menu Contract": `disabled` items are
 * rendered (not removed from the DOM) with a clear "Ainda nao disponivel"
 * label and no link, and remain keyboard/screen-reader understandable
 * (`aria-disabled`, no `tabIndex`/no `href`, label still readable).
 * `hidden` items (profile not allowed) are excluded entirely by
 * `buildMenuForProfile`, before this component ever renders them.
 */
import { NavLink } from "react-router-dom";
import { Button } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";
import { prefetchRouteChunk } from "../../app/route-prefetch";
import type { RouteId } from "../../app/routes";
import { buildMenuForProfile } from "../../modules/navigation/menu-config";
import type { PerfilUsuario } from "../../modules/access/types";
import "./Sidebar.css";

export interface SidebarProps {
  perfil: PerfilUsuario;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ perfil, collapsed = false, onToggle }: SidebarProps) {
  const items = buildMenuForProfile(perfil);

  return (
    <aside
      className={`doka-sidebar${collapsed ? " doka-sidebar--collapsed" : ""}`}
      aria-label="Navegação principal"
    >
      <div className="doka-sidebar__brand">
        <img
          className="doka-sidebar__logo"
          src={
            collapsed
              ? "/design-system/logos/doka-icon-orange.png"
              : "/design-system/logos/doka-logo-full.png"
          }
          alt="Doka"
        />
      </div>
      <nav className="doka-sidebar__nav">
        <ul className="doka-sidebar__list">
          {items.map((item) => (
            <li key={item.id} className="doka-sidebar__item">
              {item.disabled ? (
                <span
                  className="doka-sidebar__link doka-sidebar__link--disabled"
                  aria-disabled="true"
                  title={item.unavailableLabel}
                >
                  <Icon name={item.icon as IconName} size={20} />
                  <span className="doka-sidebar__label">{item.label}</span>
                  <span className="doka-sidebar__unavailable">{item.unavailableLabel}</span>
                </span>
              ) : (
                <NavLink
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  onMouseEnter={() => prefetchRouteChunk(item.id as RouteId)}
                  onFocus={() => prefetchRouteChunk(item.id as RouteId)}
                  className={({ isActive }) =>
                    ["doka-sidebar__link", isActive ? "doka-sidebar__link--active" : ""]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <Icon name={item.icon as IconName} size={20} />
                  <span className="doka-sidebar__label">{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <Button
        className="doka-sidebar__toggle"
        variant="ghost"
        size="sm"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        onClick={onToggle}
      >
        <Icon name="panel-left" size={18} />
        <span>{collapsed ? "" : "Recolher"}</span>
      </Button>
    </aside>
  );
}
