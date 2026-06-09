'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Plus, Edit, Trash, ChevronRight, ChevronDown, User, Users, Shield, Settings2, Building, Crown } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import FirmModal from './FirmModal';
import SuperAdminModal from './SuperAdminModal';
import AdminModal from './AdminModal';
import ManagerModal from './ManagerModal';
import TeamModal from './TeamModal';
import MemberModal from './MemberModal';

type Firm = {
  _id: string;
  name: string;
  code: string;
  status: string;
  superAdminId: string | null;
};

type Staff = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  roleType: string;
  parentId: string | null;
  managerId: string | null;
  teamId: string | null;
  firmId: string | null;
  department: string;
  status: string;
  permissions: any;
};

type Team = {
  _id: string;
  teamName: string;
  managerId: string | null;
  teamLeadId: string | null;
  firmId: string | null;
  status: string;
};

export default function StaffHierarchyView() {
  const { staff } = useAuth();
  const [firmList, setFirmList] = useState<Firm[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modals state
  const [modalType, setModalType] = useState<'superadmin' | 'firm' | 'admin' | 'manager' | 'team' | 'member' | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [parentData, setParentData] = useState<{firmId?: string, managerId?: string, teamId?: string, parentId?: string}>({});

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [firmRes, staffRes, teamRes] = await Promise.all([
        apiFetch('/firms').catch(() => ({ data: [] })),
        apiFetch('/staff/hierarchy'),
        apiFetch('/teams?limit=1000')
      ]);
      setFirmList(firmRes.data || []);
      setStaffList(staffRes.data || []);
      setTeamList(teamRes.data || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch hierarchy data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const currentState = prev[id] !== false; // defaults to true
      return { ...prev, [id]: !currentState };
    });
  };

  const openModal = (type: 'superadmin' | 'firm' | 'admin' | 'manager' | 'team' | 'member', mode: 'create' | 'edit', entity: any = null, parentOpts: any = {}) => {
    setModalType(type);
    setModalMode(mode);
    setSelectedEntity(entity);
    setParentData(parentOpts);
  };

  const closeModal = (refresh: boolean = false) => {
    setModalType(null);
    setSelectedEntity(null);
    if (refresh) fetchData();
  };
  
  // Renders a single Member
  const renderMember = (member: Staff, level: number, teamLeadId?: string | null) => {
    const isTeamLead = member._id === teamLeadId;
    return (
      <div key={member._id} className={`flex items-center justify-between py-2 border-b border-gray-50 hover:bg-gray-50/50 transition-colors`} style={{ paddingLeft: `${level * 24}px` }}>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isTeamLead ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
            {member.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
              {member.fullName}
              {isTeamLead && <span className="px-1.5 py-0.5 text-[10px] rounded-md font-bold bg-blue-100 text-blue-700">Team Leader</span>}
              {!isTeamLead && <span className="px-1.5 py-0.5 text-[10px] rounded-md font-bold bg-gray-100 text-gray-600">Member</span>}
              <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold ${member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{member.status}</span>
            </p>
            <p className="text-xs text-gray-500">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pr-4">
          <button onClick={() => openModal('member', 'edit', member)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Member">
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Renders a Team and its Members
  const renderTeam = (team: Team, level: number) => {
    const isExpanded = expandedNodes[team._id] !== false; // Default expanded
    const teamMembers = staffList.filter(s => s.teamId === team._id && s.roleType === 'Member');

    return (
      <div key={team._id} className="w-full">
        <div className={`flex items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50/50 transition-colors`} style={{ paddingLeft: `${level * 24}px` }}>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleNode(team._id)} className="p-1 text-gray-400 hover:text-gray-900">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <Users className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-gray-900">{team.teamName}</p>
              <p className="text-[10px] text-gray-500">{teamMembers.length} Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-4">
            <button onClick={() => openModal('member', 'create', null, { teamId: team._id, managerId: team.managerId, firmId: team.firmId })} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
              <Plus className="w-3 h-3" /> Member
            </button>
            <button onClick={() => openModal('team', 'edit', team)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Team">
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="w-full">
            {teamMembers.length === 0 ? (
              <div className="py-2 text-xs text-gray-400 italic" style={{ paddingLeft: `${(level + 1) * 24 + 28}px` }}>No members in this team</div>
            ) : (
              teamMembers.map(m => renderMember(m, level + 1, team.teamLeadId))
            )}
          </div>
        )}
      </div>
    );
  };

  // Renders a Manager and their Teams
  const renderManager = (manager: Staff, level: number) => {
    const isExpanded = expandedNodes[manager._id] !== false;
    const managerTeams = teamList.filter(t => t.managerId === manager._id);
    const orphanMembers = staffList.filter(s => s.managerId === manager._id && !s.teamId && s.roleType === 'Member');

    return (
      <div key={manager._id} className="w-full">
        <div className={`flex items-center justify-between py-3 border-b border-gray-200 bg-gray-50/30 hover:bg-gray-50/80 transition-colors`} style={{ paddingLeft: `${level * 24}px` }}>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleNode(manager._id)} className="p-1 text-gray-400 hover:text-gray-900">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <Shield className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                {manager.fullName} 
                <span className="px-1.5 py-0.5 text-[10px] rounded-md font-bold bg-purple-100 text-purple-700">Manager</span>
                {manager.department && <span className="text-xs font-normal text-gray-500">({manager.department})</span>}
              </p>
              <p className="text-[10px] text-gray-500">{managerTeams.length} Teams</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-4">
            <button onClick={() => openModal('team', 'create', null, { managerId: manager._id, firmId: manager.firmId })} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
              <Plus className="w-3 h-3" /> Team
            </button>
            <button onClick={() => openModal('manager', 'edit', manager)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Manager">
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="w-full">
            {managerTeams.map(t => renderTeam(t, level + 1))}
            {orphanMembers.map(m => renderMember(m, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Renders an Admin and their Managers
  const renderAdmin = (admin: Staff, level: number) => {
    const isExpanded = expandedNodes[admin._id] !== false;
    const adminManagers = staffList.filter(s => s.roleType === 'Manager' && s.parentId === admin._id);

    return (
      <div key={admin._id} className="w-full border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between p-4 bg-gray-50" style={{ paddingLeft: `${level * 24}px` }}>
          <div className="flex items-center gap-3">
            <button onClick={() => toggleNode(admin._id)} className="p-1 text-gray-400 hover:text-gray-900">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
              {admin.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                {admin.fullName}
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Admin</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-4">
            <button onClick={() => openModal('manager', 'create', null, { firmId: admin.firmId, parentId: admin._id })} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
              <Plus className="w-3 h-3" /> Manager
            </button>
            <button onClick={() => openModal('admin', 'edit', admin)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Admin">
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="w-full border-t border-gray-100">
            {adminManagers.map(m => renderManager(m, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Renders a Firm and its Admins/Managers
  const renderFirm = (firm: Firm, level: number = 0) => {
    const isExpanded = expandedNodes[firm._id] !== false;
    const firmAdmins = staffList.filter(s => s.roleType === 'Admin' && s.firmId === firm._id);
    const orphanManagers = staffList.filter(s => s.roleType === 'Manager' && s.firmId === firm._id && !s.parentId);

    return (
      <div key={firm._id} className="w-full mb-4 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm" style={{ marginLeft: `${level * 24}px`, width: `calc(100% - ${level * 24}px)` }}>
        <div className="flex items-center justify-between p-4 bg-gray-800 text-white cursor-pointer" onClick={() => toggleNode(firm._id)}>
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-base font-bold">{firm.name} <span className="text-xs text-gray-400 font-normal ml-2">{firm.code ? `(${firm.code})` : ''}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => openModal('manager', 'create', null, { firmId: firm._id })} className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide border border-white/20">
              <Plus className="w-3 h-3" /> Manager
            </button>
            <button onClick={() => openModal('admin', 'create', null, { firmId: firm._id })} className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide border border-white/20 ml-2">
              <Plus className="w-3 h-3" /> Admin
            </button>
            <button onClick={() => openModal('firm', 'edit', firm)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Edit Firm">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => toggleNode(firm._id)} className="p-1 hover:bg-white/10 rounded-lg ml-1 transition-colors">
              {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="w-full">
            {firmAdmins.length === 0 && orphanManagers.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No Admins or Managers configured for this firm yet.</div>
            ) : (
              <>
                {firmAdmins.map(admin => renderAdmin(admin, 1))}
                {orphanManagers.map(manager => renderManager(manager, 1))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renders a Super Admin and their Firms
  const renderSuperAdmin = (superAdmin: Staff) => {
    const isExpanded = expandedNodes[superAdmin._id] !== false;
    const saFirms = firmList.filter(f => f.superAdminId === superAdmin._id);

    return (
      <div key={superAdmin._id} className="w-full mb-6 bg-white rounded-2xl border-2 border-indigo-100 overflow-hidden shadow-md">
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white cursor-pointer" onClick={() => toggleNode(superAdmin._id)}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-lg font-bold flex items-center gap-2">
                {superAdmin.fullName}
                <span className="text-[10px] bg-indigo-500/50 text-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-wider font-bold">Super Admin</span>
              </p>
              <p className="text-xs text-indigo-200 mt-0.5">{saFirms.length} Firms managed</p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => openModal('firm', 'create', null, { superAdminId: superAdmin._id })} className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wide border border-white/20">
              <Plus className="w-3.5 h-3.5" /> Firm
            </button>
            <button onClick={() => openModal('superadmin', 'edit', superAdmin)} className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Edit Super Admin">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => toggleNode(superAdmin._id)} className="p-1 hover:bg-white/10 rounded-lg ml-1 transition-colors">
              {isExpanded ? <ChevronDown className="w-6 h-6 text-indigo-300" /> : <ChevronRight className="w-6 h-6 text-indigo-300" />}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="w-full p-4 bg-indigo-50/30">
            {saFirms.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-100 shadow-sm">No Firms configured under this Super Admin yet.</div>
            ) : (
              saFirms.map(firm => renderFirm(firm, 0))
            )}
          </div>
        )}
      </div>
    );
  };

  // Find staff without a firm or with firmId that doesn't exist anymore
  const firmIds = new Set(firmList.map(f => f._id));
  const unassignedStaff = staffList.filter(s => s.roleType !== 'Super Admin' && (!s.firmId || !firmIds.has(s.firmId)));
  
  const superAdmins = staffList.filter(s => s.roleType === 'Super Admin');
  const orphanFirms = firmList.filter(f => !f.superAdminId);

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold mb-4 ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Organization Structure</h3>
            <p className="text-xs text-gray-500">Manage your entire staff hierarchy globally</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openModal('firm', 'create')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Firm
          </button>
          <button
            onClick={() => openModal('superadmin', 'create')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Super Admin
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm bg-white rounded-2xl border border-gray-100">Loading hierarchy...</div>
        ) : (
          <>
            {superAdmins.length === 0 && firmList.length === 0 && (
              <div className="p-12 text-center text-gray-500 text-sm bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3">
                <Crown className="w-12 h-12 text-gray-300" />
                <p>No organization data found. Start by creating a Super Admin or a Firm.</p>
              </div>
            )}
            
            {superAdmins.map(renderSuperAdmin)}

            {orphanFirms.length > 0 && (
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-full h-px bg-gray-200 flex-grow"></span>
                  Independent Firms
                  <span className="w-full h-px bg-gray-200 flex-grow"></span>
                </h4>
                {orphanFirms.map(f => renderFirm(f, 0))}
              </div>
            )}
          </>
        )}

        {unassignedStaff.length > 0 && !loading && (
          <div className="w-full mt-8 bg-gray-50 rounded-2xl border border-gray-200 border-dashed overflow-hidden shadow-sm">
             <div className="p-4 bg-gray-100 border-b border-gray-200">
               <h4 className="font-bold text-gray-700 text-sm">Unassigned Staff ({unassignedStaff.length})</h4>
               <p className="text-[10px] text-gray-500">These staff members are not linked to any Firm.</p>
             </div>
             <div className="p-2">
               {unassignedStaff.map(member => (
                 <div key={member._id} className="flex justify-between items-center p-3 border-b border-gray-200/50 hover:bg-gray-100 transition-colors">
                   <div>
                     <p className="text-sm font-bold text-gray-800">{member.fullName} <span className="px-1.5 py-0.5 text-[10px] rounded-md font-bold bg-gray-200 text-gray-600 ml-2">{member.roleType}</span></p>
                     <p className="text-xs text-gray-500">{member.email}</p>
                   </div>
                   <button onClick={() => openModal(member.roleType.toLowerCase() as any, 'edit', member)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                     <Edit className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {modalType === 'superadmin' && (
        <SuperAdminModal mode={modalMode} entity={selectedEntity} onClose={() => closeModal()} onSaved={() => closeModal(true)} showToast={showToast} />
      )}
      {modalType === 'firm' && (
        <FirmModal mode={modalMode} entity={selectedEntity} superAdmins={superAdmins} onClose={() => closeModal()} onSaved={() => closeModal(true)} showToast={showToast} />
      )}
      {modalType === 'admin' && (
        <AdminModal mode={modalMode} entity={selectedEntity} parentOpts={parentData} onClose={() => closeModal()} onSaved={() => closeModal(true)} showToast={showToast} />
      )}
      {modalType === 'manager' && (
        <ManagerModal mode={modalMode} entity={selectedEntity} parentOpts={parentData} admins={staffList.filter(s => s.roleType === 'Admin' && s.firmId === parentData.firmId)} onClose={() => closeModal()} onSaved={() => closeModal(true)} showToast={showToast} />
      )}
      {modalType === 'team' && (
        <TeamModal mode={modalMode} entity={selectedEntity} parentOpts={parentData} managers={staffList.filter(s => s.roleType === 'Manager' && s.firmId === parentData.firmId)} staffList={staffList} onClose={() => closeModal()} onSaved={() => closeModal(true)} showToast={showToast} />
      )}
      {modalType === 'member' && (
        <MemberModal mode={modalMode} entity={selectedEntity} parentOpts={parentData} teams={teamList.filter(t => t.firmId === parentData.firmId)} managers={staffList.filter(s => s.roleType === 'Manager' && s.firmId === parentData.firmId)} onClose={() => closeModal()} onSaved={() => closeModal(true)} showToast={showToast} />
      )}

    </div>
  );
}
