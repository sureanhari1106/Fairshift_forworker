import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FairShiftStore } from '../services/store';
import { SkillItem } from '../types';
import {
  Award,
  CheckCircle,
  FileBadge,
  Calendar,
  Building,
  Plus,
  ShieldCheck,
  User,
  X,
  Send,
} from 'lucide-react';

export const SkillPassportView: React.FC = () => {
  const { t, currentWorker } = useApp();

  const [skills, setSkills] = useState<SkillItem[]>(() =>
    FairShiftStore.getSkills(currentWorker.id)
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newCategory, setNewCategory] = useState('Safety & Compliance');
  const [newIssuingBody, setNewIssuingBody] = useState('');
  const [newIssueDate, setNewIssueDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill: SkillItem = {
      id: `sk-${Date.now()}`,
      workerId: currentWorker.id,
      skillName: newSkillName.trim(),
      category: newCategory,
      issuingBody: newIssuingBody.trim() || 'Self-Reported Experience',
      issueDate: newIssueDate,
      isVerified: false,
    };

    await FairShiftStore.addSkillToFirestore(newSkill);
    setSkills(FairShiftStore.getSkills(currentWorker.id));
    setShowAddModal(false);
    setNewSkillName('');
    setNewIssuingBody('');
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-8 max-w-4xl mx-auto px-3 sm:px-4 pt-3">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
              {t.skillPassportTitle}
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Worker-owned portable trade credentials, safety licenses, and verified accreditations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          style={{ minHeight: '40px' }}
        >
          <Plus className="w-4 h-4" />
          <span>{t.addSkillBtn}</span>
        </button>
      </div>

      {/* Worker Card */}
      <div className="bg-teal-950 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3 border border-teal-900">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-800 flex items-center justify-center font-bold text-lg text-teal-200 border border-teal-700">
            {currentWorker.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">{currentWorker.name}</h3>
            <span className="text-xs text-teal-300 block">
              Passport ID: {currentWorker.workerId} &bull; {currentWorker.trade}
            </span>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="text-[10px] text-teal-400 block uppercase font-mono">Verified Skills</span>
          <span className="font-extrabold text-base text-teal-100">
            {skills.filter((s) => s.isVerified).length} of {skills.length}
          </span>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {skill.category}
                </span>
                {skill.isVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>{t.verifiedBadge}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold flex items-center gap-1">
                    <User className="w-3 h-3 text-stone-500" />
                    <span>{t.selfReportedBadge}</span>
                  </span>
                )}
              </div>

              <h4 className="font-bold text-sm text-stone-900">{skill.skillName}</h4>
              <p className="text-xs text-stone-600 mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <span>{skill.issuingBody}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>Issued: {skill.issueDate}</span>
              </span>
              {skill.credentialId && (
                <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded">
                  {skill.credentialId}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-teal-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Add Trade Skill or Certificate</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-teal-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Skill / Certification Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Scaffolding Level 2 or CNC Lathe Setup"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                >
                  <option value="Work at Height">Work at Height</option>
                  <option value="Heavy Machinery">Heavy Machinery</option>
                  <option value="Safety & Compliance">Safety &amp; Compliance</option>
                  <option value="Structural Concrete">Structural Concrete</option>
                  <option value="Welding & Fabrication">Welding &amp; Fabrication</option>
                  <option value="Electrical & Power">Electrical &amp; Power</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Issuing Organization / Training Institute
                </label>
                <input
                  type="text"
                  value={newIssuingBody}
                  onChange={(e) => setNewIssuingBody(e.target.value)}
                  placeholder="e.g. National Skill Development Corp or Self-Reported"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={newIssueDate}
                  onChange={(e) => setNewIssueDate(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-200 text-stone-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold"
                >
                  Save to Passport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
