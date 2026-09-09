/* ============ 静态演示站 · 外壳与通用交互 ============ */
/* 页面结构约定：
   <body data-page="dashboard">
     <div class="app">
       <aside class="sidebar" id="sidebar"></aside>
       <div class="main">
         <header class="topbar" id="topbar"></header>
         <div class="content" id="content">…页面主体…</div>
       </div>
     </div>
   </body> */

const NAV = [
  { label: '运营总览', href: 'dashboard.html', page: 'dashboard', ico: '◧' },
  { label: '风险洞察', ico: '◉', children: [
    { label: '请求流水', href: 'event-log.html', page: 'event-log' },
    { label: '风险事件', href: 'audit.html', page: 'audit' },
    { label: '影子验证', href: 'observe.html', page: 'observe' },
    { label: '名单管理', href: 'blacklist.html', page: 'blacklist' },
    { label: '宽表检索', href: 'wide-table.html', page: 'wide-table' },
  ]},
  { label: '策略决策', ico: '⬢', children: [
    { label: '节点管理', href: 'risk-nodes.html', page: 'risk-nodes' },
    { label: '场景管理', href: 'scenes.html', page: 'scenes' },
    { label: '策略管理', href: 'strategies.html', page: 'strategies' },
    { label: '规则管理', href: 'rules.html', page: 'rules' },
    { label: '决策编码', href: 'decisions.html', page: 'decisions' },
  ]},
  { label: '特征计算', ico: '◈', children: [
    { label: '属性定义', href: 'common-fields.html', page: 'common-fields' },
    { label: '派生属性', href: 'derive-fields.html', page: 'derive-fields' },
    { label: '指标管理', href: 'feature-fields.html', page: 'feature-fields' },
    { label: '派生特征', href: 'custom-fields.html', page: 'custom-fields' },
    { label: '计算任务', href: 'flink-groups.html', page: 'flink-groups' },
  ]},
  { label: '权限与协同', ico: '⚙', children: [
    { label: '用户管理', href: 'users.html', page: 'users' },
    { label: '角色管理', href: 'roles.html', page: 'roles' },
    { label: '权限组', href: 'perm-groups.html', page: 'perm-groups' },
    { label: '授权管理', href: 'perms.html', page: 'perms' },
    { label: '集群管理', href: 'clusters.html', page: 'clusters' },
    { label: '数据同步', href: 'cdc.html', page: 'cdc' },
  ]},
  { label: '监控与运维', ico: '◆', children: [
    { label: '运维中心', href: 'sys-ops.html', page: 'sys-ops' },
    { label: '审计日志', href: 'op-logs.html', page: 'op-logs' },
    { label: '报警中心', href: 'alerts.html', page: 'alerts' },
  ]},
];

function navFind(page) {
  for (const g of NAV) {
    if (g.page === page) return { group: null, item: g, crumb: [g.label] };
    if (g.children) {
      const c = g.children.find(x => x.page === page);
      if (c) return { group: g, item: c, crumb: [g.label, c.label] };
    }
  }
  return { group: null, item: null, crumb: [] };
}

function renderShell() {
  const page = document.body.dataset.page || '';
  const ctx = navFind(page);
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');

  if (sidebar) {
    let html = '<div class="sidebar-logo"><span class="logo-dot"></span>风控系统</div><nav class="side-nav">';
    for (const g of NAV) {
      if (!g.children) {
        html += `<a href="${g.href}" class="${page === g.page ? 'active' : ''}"><span class="ico">${g.ico}</span>${g.label}</a>`;
      } else {
        const open = page && g.children.some(c => c.page === page);
        html += `<div class="sub">
          <div class="sub-title${open ? ' open' : ''}" onclick="this.classList.toggle('open')">
            <span class="ico">${g.ico}</span>${g.label}<span class="caret">▼</span>
          </div>`;
        html += g.children.map(c =>
          `<a href="${c.href}" class="${page === c.page ? 'active' : ''}">${c.label}</a>`).join('');
        html += '</div>';
      }
    }
    html += '</nav>';
    sidebar.innerHTML = html;
  }
  if (topbar) {
    const crumbs = ctx.crumb.length ? ctx.crumb.join(' / ') : '风控系统';
    topbar.innerHTML = `<div class="crumb">${crumbs}</div>
      <div class="user"><div class="avatar">管</div><span style="color:#263a35">管理员</span></div>`;
  }
  const title = ctx.crumb.length ? ctx.crumb[ctx.crumb.length - 1] : '';
  const pageTitle = document.getElementById('page-title');
  if (pageTitle && title) pageTitle.textContent = title;
}

/* ============ 通用交互 ============ */
function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }
function bindModals(root) {
  (root || document).querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.open));
  });
  document.querySelectorAll('.modal-mask').forEach(mask => {
    mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('open'); });
  });
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
}

function fmtVal(v) {
  if (v === null || v === undefined || v === '') return '<span class="muted">-</span>';
  return String(v);
}
function fmtTime(v) { return typeof v === 'number' ? new Date(v).toLocaleString('zh-CN', { hour12: false }) : v; }
function nodeName(id) {
  const n = DEMO.nodes.find(x => String(x.id) === String(id));
  return n ? n.nodeName : '-';
}
function metricLabel(name) { return DEMO.metricNames[name] || name; }

document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  bindModals();
});
