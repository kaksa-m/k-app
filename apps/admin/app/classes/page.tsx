'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText, Field, GhostButton, PrimaryButton, Select, TextInput } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { AcademicYear, SchoolClass, Teacher } from '../../lib/types';

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[] | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showClassForm, setShowClassForm] = useState(false);
  const [className, setClassName] = useState('');
  const [classOrder, setClassOrder] = useState('');
  const [classFormError, setClassFormError] = useState<string | null>(null);
  const [creatingClass, setCreatingClass] = useState(false);

  // Which class's "add section" form is open, if any.
  const [sectionFormFor, setSectionFormFor] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [sectionYear, setSectionYear] = useState('');
  const [sectionTeacher, setSectionTeacher] = useState('');
  const [sectionFormError, setSectionFormError] = useState<string | null>(null);
  const [creatingSection, setCreatingSection] = useState(false);

  function load() {
    api
      .get<SchoolClass[]>('/classes')
      .then(setClasses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load classes.'));
  }

  useEffect(() => {
    load();
    api.get<AcademicYear[]>('/academic-years').then(setAcademicYears).catch(() => {});
    api.get<Teacher[]>('/teachers').then(setTeachers).catch(() => {});
  }, []);

  async function handleCreateClass(e: FormEvent) {
    e.preventDefault();
    setClassFormError(null);
    setCreatingClass(true);
    try {
      await api.post('/classes', { name: className, order: Number(classOrder) });
      setClassName('');
      setClassOrder('');
      setShowClassForm(false);
      load();
    } catch (err) {
      setClassFormError(err instanceof ApiError ? err.message : 'Failed to create class.');
    } finally {
      setCreatingClass(false);
    }
  }

  function openSectionForm(classId: string) {
    setSectionFormFor(classId);
    setSectionName('');
    setSectionYear(academicYears.find((y) => y.isCurrent)?.id ?? academicYears[0]?.id ?? '');
    setSectionTeacher('');
    setSectionFormError(null);
  }

  async function handleCreateSection(e: FormEvent, classId: string) {
    e.preventDefault();
    setSectionFormError(null);
    setCreatingSection(true);
    try {
      await api.post('/sections', {
        classId,
        academicYearId: sectionYear,
        name: sectionName,
        classTeacherId: sectionTeacher || undefined,
      });
      setSectionFormFor(null);
      load();
    } catch (err) {
      setSectionFormError(err instanceof ApiError ? err.message : 'Failed to create section.');
    } finally {
      setCreatingSection(false);
    }
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Academics</div>
          <h1 className="font-display text-4xl uppercase text-ink">Classes &amp; sections</h1>
        </div>
        <PrimaryButton onClick={() => setShowClassForm((v) => !v)}>
          {showClassForm ? 'Cancel' : '+ New class'}
        </PrimaryButton>
      </div>

      {showClassForm && (
        <Card className="mb-8">
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Class name">
                <TextInput
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Class 9"
                />
              </Field>
              <Field label="Sort order">
                <TextInput
                  required
                  type="number"
                  value={classOrder}
                  onChange={(e) => setClassOrder(e.target.value)}
                  placeholder="9"
                />
              </Field>
            </div>
            <ErrorText>{classFormError}</ErrorText>
            <div className="flex gap-3">
              <PrimaryButton type="submit" disabled={creatingClass}>
                {creatingClass ? 'Creating…' : 'Create class'}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setShowClassForm(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-margin text-sm mb-6">{error}</p>}
      {!classes && !error && <p className="text-ink-soft text-sm">Loading classes…</p>}
      {classes && classes.length === 0 && !showClassForm && (
        <p className="text-ink-soft text-sm">No classes yet — add the first one above.</p>
      )}

      {academicYears.length === 0 && classes && classes.length > 0 && (
        <p className="text-xs text-margin font-mono mb-4">
          No academic year exists yet — create one via the API (POST /academic-years) before adding sections.
        </p>
      )}

      {classes && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl uppercase text-ink">{c.name}</h2>
                <button
                  onClick={() => (sectionFormFor === c.id ? setSectionFormFor(null) : openSectionForm(c.id))}
                  className="text-xs font-mono text-margin hover:text-marigold-deep"
                  disabled={academicYears.length === 0}
                >
                  {sectionFormFor === c.id ? 'Cancel' : '+ Section'}
                </button>
              </div>

              {c.sections && c.sections.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-1">
                  {c.sections.map((s) => (
                    <span
                      key={s.id}
                      className="font-mono text-xs px-2.5 py-1 rounded-sm bg-paper border border-paper-line text-ink-soft"
                    >
                      Section {s.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-soft font-mono mb-1">No sections yet</p>
              )}

              {sectionFormFor === c.id && (
                <form onSubmit={(e) => handleCreateSection(e, c.id)} className="mt-4 pt-4 border-t border-paper-line space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Section name">
                      <TextInput
                        required
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="A"
                      />
                    </Field>
                    <Field label="Academic year">
                      <Select required value={sectionYear} onChange={(e) => setSectionYear(e.target.value)}>
                        <option value="" disabled>
                          Select…
                        </option>
                        {academicYears.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field label="Class teacher (optional)">
                    <Select value={sectionTeacher} onChange={(e) => setSectionTeacher(e.target.value)}>
                      <option value="">None yet</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <ErrorText>{sectionFormError}</ErrorText>
                  <PrimaryButton type="submit" disabled={creatingSection} className="w-full">
                    {creatingSection ? 'Creating…' : 'Create section'}
                  </PrimaryButton>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
