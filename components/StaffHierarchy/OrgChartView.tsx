import React from 'react';

const OrgChartStyle = `
.org-tree ul {
  padding-top: 20px;
  position: relative;
  display: flex;
  justify-content: center;
  margin: 0;
  padding-left: 0;
}

.org-tree li {
  text-align: center;
  list-style-type: none;
  position: relative;
  padding: 20px 10px 0 10px;
}

/* Connectors */
.org-tree li::before, .org-tree li::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  border-top: 2px solid #94a3b8;
  width: 50%;
  height: 20px;
}

.org-tree li::after {
  right: auto;
  left: 50%;
  border-left: 2px solid #94a3b8;
}

/* Handle edge cases for single children and ends */
.org-tree li:only-child::after, .org-tree li:only-child::before {
  display: none;
}

.org-tree li:only-child {
  padding-top: 0;
}

.org-tree li:first-child::before, .org-tree li:last-child::after {
  border: 0 none;
}

.org-tree li:last-child::before {
  border-right: 2px solid #94a3b8;
  border-radius: 0 8px 0 0;
}

.org-tree li:first-child::after {
  border-radius: 8px 0 0 0;
}

/* Downward line from parent */
.org-tree ul ul::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  border-left: 2px solid #94a3b8;
  width: 0;
  height: 20px;
  transform: translateX(-1px); /* align perfectly */
}
`;

const NodeCard = ({ title, subtitle, role, type }: any) => {
  let bgColor = 'bg-white';
  let textColor = 'text-gray-900';
  let badgeColor = 'bg-gray-100 text-gray-600';
  
  if (type === 'superadmin') {
    bgColor = 'bg-indigo-900';
    textColor = 'text-white';
    badgeColor = 'bg-indigo-500/30 text-indigo-200';
  } else if (type === 'firm') {
    bgColor = 'bg-gray-800';
    textColor = 'text-white';
    badgeColor = 'bg-gray-700 text-gray-300';
  } else if (type === 'admin') {
    bgColor = 'bg-orange-50';
    textColor = 'text-orange-900';
    badgeColor = 'bg-orange-200 text-orange-800';
  } else if (type === 'manager') {
    bgColor = 'bg-purple-50';
    textColor = 'text-purple-900';
    badgeColor = 'bg-purple-200 text-purple-800';
  } else if (type === 'team') {
    bgColor = 'bg-blue-50';
    textColor = 'text-blue-900';
    badgeColor = 'bg-blue-200 text-blue-800';
  } else if (type === 'member') {
    bgColor = 'bg-white';
    textColor = 'text-gray-700';
    badgeColor = 'bg-emerald-100 text-emerald-700';
  }

  return (
    <div className={`inline-block min-w-[160px] p-4 rounded-2xl shadow-sm border ${type === 'superadmin' || type === 'firm' ? 'border-transparent' : 'border-gray-200'} ${bgColor} transition-transform hover:-translate-y-1 hover:shadow-md cursor-default relative z-10`}>
      <h4 className={`font-bold text-sm ${textColor} mb-1`}>{title}</h4>
      {subtitle && <p className={`text-[10px] opacity-80 ${textColor} mb-2`}>{subtitle}</p>}
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
        {role}
      </span>
    </div>
  );
};

export default function OrgChartView({ firmList, staffList, teamList }: any) {

  // Root level: Super Admins
  const superAdmins = staffList.filter((s: any) => s.roleType === 'Super Admin');
  const orphanFirms = firmList.filter((f: any) => !f.superAdminId);

  // Helper to render Members
  const renderMembers = (teamId: string) => {
    const members = staffList.filter((s: any) => s.teamId === teamId && s.roleType === 'Member');
    if (members.length === 0) return null;
    return (
      <ul>
        {members.map((m: any) => (
          <li key={m._id}>
            <NodeCard title={m.fullName} subtitle={m.email} role="Member" type="member" />
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render Teams
  const renderTeams = (managerId: string) => {
    const teams = teamList.filter((t: any) => t.managerId === managerId);
    const orphanMembers = staffList.filter((s: any) => s.managerId === managerId && !s.teamId && s.roleType === 'Member');
    
    if (teams.length === 0 && orphanMembers.length === 0) return null;
    
    return (
      <ul>
        {teams.map((t: any) => (
          <li key={t._id}>
            <NodeCard title={t.teamName} role="Team" type="team" />
            {renderMembers(t._id)}
          </li>
        ))}
        {orphanMembers.map((m: any) => (
          <li key={m._id}>
            <NodeCard title={m.fullName} subtitle={m.email} role="Member" type="member" />
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render Managers
  const renderManagers = (adminId: string, firmId: string, isFirmLevel: boolean = false) => {
    let managers = [];
    if (isFirmLevel) {
      managers = staffList.filter((s: any) => s.roleType === 'Manager' && s.firmId === firmId && !s.parentId);
    } else {
      managers = staffList.filter((s: any) => s.roleType === 'Manager' && s.parentId === adminId);
    }

    if (managers.length === 0) return null;

    return (
      <ul>
        {managers.map((m: any) => (
          <li key={m._id}>
            <NodeCard title={m.fullName} subtitle={m.department} role="Manager" type="manager" />
            {renderTeams(m._id)}
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render Admins
  const renderAdmins = (firmId: string) => {
    const admins = staffList.filter((s: any) => s.roleType === 'Admin' && s.firmId === firmId);
    const orphanManagers = staffList.filter((s: any) => s.roleType === 'Manager' && s.firmId === firmId && !s.parentId);

    if (admins.length === 0 && orphanManagers.length === 0) return null;

    return (
      <ul>
        {admins.map((a: any) => (
          <li key={a._id}>
            <NodeCard title={a.fullName} role="Admin" type="admin" />
            {renderManagers(a._id, firmId, false)}
          </li>
        ))}
        {orphanManagers.map((m: any) => (
          <li key={m._id}>
            <NodeCard title={m.fullName} subtitle={m.department} role="Manager" type="manager" />
            {renderTeams(m._id)}
          </li>
        ))}
      </ul>
    );
  };

  // Helper to render Firms
  const renderFirms = (superAdminId: string | null) => {
    const firms = firmList.filter((f: any) => (superAdminId ? f.superAdminId === superAdminId : !f.superAdminId));
    if (firms.length === 0) return null;

    return (
      <ul>
        {firms.map((f: any) => (
          <li key={f._id}>
            <NodeCard title={f.name} subtitle={f.code} role="Firm" type="firm" />
            {renderAdmins(f._id)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full overflow-x-auto p-8 bg-gray-50/50 rounded-3xl border border-gray-100 shadow-inner">
      <style>{OrgChartStyle}</style>
      
      <div className="org-tree min-w-max mx-auto py-8">
        <ul>
          {/* Render Super Admins as roots */}
          {superAdmins.map((sa: any) => (
            <li key={sa._id}>
              <NodeCard title={sa.fullName} subtitle={sa.email} role="Super Admin" type="superadmin" />
              {renderFirms(sa._id)}
            </li>
          ))}

          {/* Render Orphan Firms as pseudo-roots if they have no super admin */}
          {orphanFirms.length > 0 && (
            <li>
              <div className="inline-block p-3 rounded-xl border border-dashed border-gray-300 text-gray-400 text-xs font-bold uppercase tracking-wider bg-transparent">
                Independent Firms
              </div>
              {renderFirms(null)}
            </li>
          )}
        </ul>
      </div>
      
      {superAdmins.length === 0 && orphanFirms.length === 0 && (
        <div className="text-center text-gray-400 py-12">No hierarchy data available to build chart.</div>
      )}
    </div>
  );
}
