import { SketchAppShell } from 'blackchalk';
import type { ReactNode } from 'react';
export default function Shell({ section, children }: { section?: string; children: ReactNode }) {
  return <div className="site-shell"><SketchAppShell
    topBar={<header className="topbar"><a className="wordmark" href="/">OddEssay.com</a><span>A personal notebook</span></header>}
    sidebar={<nav className="sidebar" aria-label="Main navigation"><p className="eyebrow">The notebook</p>{['Projects', 'Restaurants', 'Essays'].map((label, index) => <a key={label} href={`/${label.toLowerCase()}`} aria-current={section === label.toLowerCase() ? 'page' : undefined}><span className="nav-number">0{index + 1}</span>{label}<span aria-hidden="true">↗</span></a>)}<p className="sidebar-note">A few things made,<br/>found, and written down.</p></nav>}
  ><div id="content" tabIndex={-1} className="page-content">{children}<footer>Paul Bennett-Freeman <span aria-hidden="true">·</span> OddEssay.com</footer></div></SketchAppShell></div>;
}
